import crypto from 'node:crypto';

/**
 * Serverless EMQX Cloud Auto-Provisioning Endpoint (Vercel /api/mqtt-provision)
 * - Verifies caller's Firebase ID Token server-side via Google Identity Toolkit.
 * - Creates or rotates an isolated EMQX built-in database user where user_id = Firebase UID.
 * - Enforces no-store caching and zero credential logging.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const idToken = match ? match[1].trim() : '';

  if (!idToken) {
    return res.status(401).json({ error: 'Missing Authorization Bearer token' });
  }

  const firebaseApiKey = (process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
  if (!firebaseApiKey) {
    return res.status(503).json({
      error: 'Firebase API key not configured on server',
      code: 'FIREBASE_NOT_CONFIGURED',
    });
  }

  let uid = '';
  try {
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired Firebase token' });
    }

    const verifyData = await verifyRes.json();
    uid = verifyData?.users?.[0]?.localId || '';
    if (!/^[a-zA-Z0-9_-]{6,128}$/.test(uid)) {
      return res.status(401).json({ error: 'Invalid Firebase UID' });
    }
  } catch (err) {
    console.warn('Firebase token verification error:', err?.message || 'unknown');
    return res.status(502).json({ error: 'Failed to verify Firebase token' });
  }

  const emqxApiUrl = (process.env.EMQX_API_URL || '').trim().replace(/\/+$/, '');
  const emqxBrokerHost = (process.env.EMQX_BROKER_HOST || '').trim();
  const emqxAppId = (process.env.EMQX_APP_ID || '').trim();
  const emqxAppSecret = (process.env.EMQX_APP_SECRET || '').trim();

  if (!emqxApiUrl || !emqxBrokerHost || !emqxAppId || !emqxAppSecret) {
    return res.status(503).json({
      error: 'EMQX auto-provisioning not configured',
      code: 'EMQX_NOT_CONFIGURED',
    });
  }

  const password = crypto.randomBytes(24).toString('base64url');
  const emqxAuth = 'Basic ' + Buffer.from(`${emqxAppId}:${emqxAppSecret}`).toString('base64');
  const usersEndpoint = `${emqxApiUrl}/authentication/password_based%3Abuilt_in_database/users`;

  try {
    let emqxRes = await fetch(usersEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: emqxAuth,
      },
      body: JSON.stringify({
        user_id: uid,
        password,
        is_superuser: false,
      }),
    });

    if (!emqxRes.ok) {
      const errBody = await emqxRes.text();
      const alreadyExists =
        emqxRes.status === 409 ||
        (emqxRes.status === 400 && /already[_\s-]?exists/i.test(errBody));

      if (alreadyExists) {
        emqxRes = await fetch(`${usersEndpoint}/${encodeURIComponent(uid)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: emqxAuth,
          },
          body: JSON.stringify({
            password,
            is_superuser: false,
          }),
        });
      } else {
        console.warn(`EMQX user creation failed with HTTP ${emqxRes.status}`);
        return res.status(502).json({
          error: 'EMQX provisioning failed',
          status: emqxRes.status,
        });
      }
    }

    if (!emqxRes.ok) {
      console.warn(`EMQX user password rotation failed with HTTP ${emqxRes.status}`);
      return res.status(502).json({
        error: 'EMQX provisioning failed',
        status: emqxRes.status,
      });
    }

    return res.status(200).json({
      provider: 'emqx',
      brokerHost: emqxBrokerHost,
      brokerUrl: `wss://${emqxBrokerHost}:8084/mqtt`,
      tlsPort: 8883,
      wsPort: 8084,
      username: uid,
      password,
    });
  } catch (err) {
    console.warn('EMQX provisioning request error:', err?.message || 'unknown');
    return res.status(502).json({ error: 'EMQX provisioning request error' });
  }
}
