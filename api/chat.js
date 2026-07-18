export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing or invalid messages parameter' });
  }

  // 1. Try Groq API
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.startsWith('your_')) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ content: data.choices[0].message.content });
      }
      console.warn(`Groq API returned HTTP ${response.status}`);
    } catch (err) {
      console.warn('Groq API call failed:', err);
    }
  }

  // 2. Fallback to NVIDIA API
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && !nvidiaKey.startsWith('your_')) {
    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: 'nvidia/llama-3.1-nemotron-51b-instruct',
          messages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ content: data.choices[0].message.content });
      }
      console.warn(`NVIDIA API returned HTTP ${response.status}`);
    } catch (err) {
      console.warn('NVIDIA API call failed:', err);
    }
  }

  // 3. If both failed or are not configured
  return res.status(502).json({ error: 'Both Groq and NVIDIA APIs failed or are not configured.' });
}
