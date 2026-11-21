import React, { useState, useEffect } from 'react';
import {
  Server,
  Shield,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const inputCls =
  'w-full bg-input border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors';

/**
 * Dedicated beginner-friendly page for connecting ESP32/Arduino hardware
 * and managing Cloud Server / Private MQTT Broker & ACL credentials.
 */
export default function MqttConnectionView({
  userUID,
  isConnected,
  mqttMode = 'demo',
  mqttConfig,
}) {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [mqttUseCustom, setMqttUseCustom] = useState(false);
  const [mqttBrokerUrl, setMqttBrokerUrl] = useState('');
  const [mqttTlsPort, setMqttTlsPort] = useState('8883');
  const [mqttUsername, setMqttUsername] = useState('');
  const [mqttPassword, setMqttPassword] = useState('');
  const [mqttEnableGuest, setMqttEnableGuest] = useState(false);
  const [mqttProvisionedBy, setMqttProvisionedBy] = useState(null);
  const [mqttProvisioning, setMqttProvisioning] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showMqttPass, setShowMqttPass] = useState(false);
  const [mqttSaving, setMqttSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!userUID) {
      setLoading(false);
      return;
    }

    const loadMqttSettings = async () => {
      try {
        setLoading(true);
        const mqttSnap = await getDoc(doc(db, 'users', userUID, 'settings', 'mqtt'));
        if (mqttSnap.exists()) {
          const m = mqttSnap.data();
          setMqttUseCustom(Boolean(m.useCustomBroker));
          setMqttBrokerUrl(m.brokerUrl || '');
          setMqttTlsPort(String(m.tlsPort || 8883));
          setMqttUsername(m.username || '');
          setMqttPassword(m.password || '');
          setMqttEnableGuest(Boolean(m.enableGuestTopic));
          setMqttProvisionedBy(m.provisionedBy || null);
        }
      } catch {
        // Non-critical if user hasn't configured private broker yet
      } finally {
        setLoading(false);
      }
    };

    loadMqttSettings();
  }, [userUID]);

  const handleSaveMqttSettings = async (e) => {
    e?.preventDefault();
    if (!userUID) return;

    const trimmedUrl = mqttBrokerUrl.trim();
    if (mqttUseCustom) {
      if (!trimmedUrl || !trimmedUrl.startsWith('wss://')) {
        return showToast('Private broker URL must start with wss:// to ensure encryption.', 'error');
      }
    }

    setMqttSaving(true);
    try {
      const nextProvisionedBy = mqttUseCustom ? (mqttProvisionedBy || 'manual') : null;
      await setDoc(
        doc(db, 'users', userUID, 'settings', 'mqtt'),
        {
          useCustomBroker: mqttUseCustom,
          provisionedBy: nextProvisionedBy,
          brokerUrl: trimmedUrl,
          tlsPort: Number(mqttTlsPort) || 8883,
          username: mqttUsername.trim(),
          password: mqttPassword,
          enableGuestTopic: mqttEnableGuest,
          autoProvisionDisabled: !mqttUseCustom,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMqttProvisionedBy(nextProvisionedBy);
      showToast(
        mqttUseCustom
          ? 'Private MQTT broker settings saved and activated!'
          : 'Connection settings saved.'
      );
    } catch (err) {
      showToast(err?.message || 'Failed to save MQTT settings.', 'error');
    }
    setMqttSaving(false);
  };

  const handleResetMqttToDemo = async () => {
    if (!userUID) return;
    setMqttSaving(true);
    try {
      setMqttUseCustom(false);
      setMqttEnableGuest(false);
      setMqttProvisionedBy(null);
      await setDoc(
        doc(db, 'users', userUID, 'settings', 'mqtt'),
        {
          useCustomBroker: false,
          provisionedBy: null,
          enableGuestTopic: false,
          autoProvisionDisabled: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      showToast('Switched back to shared demo mode (for simulation only).');
    } catch (err) {
      showToast(err?.message || 'Failed to reset settings.', 'error');
    }
    setMqttSaving(false);
  };

  const handleAutoProvisionMqtt = async () => {
    if (!userUID) return;
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return showToast('Please sign in first.', 'error');

    setMqttProvisioning(true);
    try {
      const res = await fetch('/api/mqtt-provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rotate: mqttProvisionedBy === 'emqx_auto' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 503 || res.status === 404) {
          showToast(
            'Auto-provisioning requires configuring EMQX_API_URL, EMQX_BROKER_HOST, EMQX_APP_ID, and EMQX_APP_SECRET in Vercel.',
            'error'
          );
        } else {
          showToast(data?.error || 'Failed to auto-provision MQTT account.', 'error');
        }
        setMqttProvisioning(false);
        return;
      }

      await setDoc(
        doc(db, 'users', userUID, 'settings', 'mqtt'),
        {
          useCustomBroker: true,
          provisionedBy: 'emqx_auto',
          provider: data.provider || 'emqx',
          brokerUrl: data.brokerUrl,
          tlsPort: data.tlsPort || 8883,
          username: data.username,
          password: data.password,
          enableGuestTopic: false,
          autoProvisionDisabled: false,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMqttUseCustom(true);
      setMqttBrokerUrl(data.brokerUrl);
      setMqttTlsPort(String(data.tlsPort || 8883));
      setMqttUsername(data.username);
      setMqttPassword(data.password);
      setMqttEnableGuest(false);
      setMqttProvisionedBy('emqx_auto');
      showToast(
        mqttProvisionedBy === 'emqx_auto'
          ? 'Isolated EMQX account password rotated successfully!'
          : 'Isolated EMQX account provisioned and activated!'
      );
    } catch (err) {
      showToast(err?.message || 'Could not reach auto-provisioning server.', 'error');
    }
    setMqttProvisioning(false);
  };

  const copyField = (field, val) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const topicPrefix = userUID ? `${userUID}/#` : 'guest_iot365/#';

  return (
    <div className="space-y-6 text-left" dir="ltr">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-red-500/95 text-white'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}

      {/* ── Quick Connection Summary Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="hw-panel bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connection Status
            </p>
            <p className={`text-lg font-bold mt-1 ${isConnected ? 'text-primary' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Offline'}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
              {mqttMode === 'private' ? 'Private Isolated Server' : 'Shared Demo Server'} ·{' '}
              {mqttConfig?.host || 'Default Broker'}
            </p>
          </div>
          {isConnected ? (
            <Wifi size={22} className="text-primary shrink-0" />
          ) : (
            <WifiOff size={22} className="text-red-400 shrink-0" />
          )}
        </div>

        <div className="hw-panel bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your Device Topic Prefix
            </p>
            <p className="text-sm font-bold font-mono text-primary truncate mt-1.5" title={topicPrefix}>
              {topicPrefix}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Start all ESP32 topics with this prefix
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyField('prefix', topicPrefix)}
            aria-label="Copy topic prefix"
            className="p-2 text-primary hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
            title="Copy Topic Prefix"
          >
            {copiedField === 'prefix' ? (
              <Check size={18} className="text-primary" />
            ) : (
              <Copy size={18} className="text-primary" />
            )}
          </button>
        </div>

        <div className="hw-panel bg-card border border-border rounded-2xl p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              ESP32 TLS Port
            </p>
            <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">
              {mqttTlsPort || '8883'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Encrypted MQTT over TLS 1.2+
            </p>
          </div>
          <KeyRound size={22} className="text-primary shrink-0" />
        </div>
      </div>

      {/* ── Cloud Server & MQTT Broker Credentials Card ── */}
      <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Server size={18} className="text-primary" />
            Cloud Server &amp; MQTT Broker Credentials
          </h3>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              mqttUseCustom
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            {mqttUseCustom
              ? mqttProvisionedBy === 'emqx_auto'
                ? 'Auto-Isolated EMQX Account (100% ACL)'
                : 'Isolated Private Broker (Production Ready)'
              : 'Shared Demo Mode (Simulation Only)'}
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground py-6">Loading connection settings...</p>
        ) : (
          <>
            {/* 1-Click EMQX Auto-Provision / Rotate */}
            <div className="mb-4 p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Shield size={14} className="text-primary" />
                  One-Click Private Server (EMQX Serverless)
                </p>
                <p className="text-muted-foreground">
                  Creates a private username and password isolated strictly to your topic prefix (
                  <code className="px-1 rounded bg-muted text-primary">{userUID}/#</code>) so no other device can read or control your hardware.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoProvisionMqtt}
                disabled={mqttProvisioning || mqttSaving}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {mqttProvisioning
                  ? 'Provisioning...'
                  : mqttProvisionedBy === 'emqx_auto'
                  ? 'Rotate EMQX Account Password'
                  : 'Auto-Provision Isolated MQTT Account'}
              </button>
            </div>

            {!mqttUseCustom && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <p className="font-bold">
                    Security Warning: Do not connect sensitive physical hardware in shared demo mode
                  </p>
                  <p className="text-amber-200/80 mt-0.5">
                    The default shared broker is intended for Wokwi simulations and educational testing only. For physical door locks, pumps, and relays, click Auto-Provision above or enter your own private broker credentials below.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveMqttSettings} className="space-y-4">
              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted border border-border cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Use My Own Private MQTT Broker / Credentials
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Settings are stored privately in your account and applied immediately.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={mqttUseCustom}
                  onChange={(e) => setMqttUseCustom(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
              </label>

              {mqttUseCustom && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-xs text-muted-foreground block mb-1 font-semibold">
                        WSS Broker URL (Browser) *
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        className={`${inputCls} font-mono`}
                        value={mqttBrokerUrl}
                        onChange={(e) => setMqttBrokerUrl(e.target.value)}
                        placeholder="wss://your-deployment.ala.eu-central-1.emqxsl.com:8084/mqtt"
                        required={mqttUseCustom}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-semibold">
                        TLS Port (ESP32)
                      </label>
                      <input
                        type="number"
                        dir="ltr"
                        className={`${inputCls} font-mono tabular-nums`}
                        value={mqttTlsPort}
                        onChange={(e) => setMqttTlsPort(e.target.value)}
                        placeholder="8883"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-semibold">
                        MQTT Username
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          dir="ltr"
                          className={`${inputCls} font-mono`}
                          value={mqttUsername}
                          onChange={(e) => setMqttUsername(e.target.value)}
                          placeholder="esp32_user"
                        />
                        <button
                          type="button"
                          onClick={() => copyField('user', mqttUsername)}
                          aria-label="Copy username"
                          className="p-2.5 text-primary hover:opacity-80 shrink-0 cursor-pointer"
                        >
                          {copiedField === 'user' ? (
                            <Check size={15} className="text-primary" />
                          ) : (
                            <Copy size={15} className="text-primary" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1 font-semibold">
                        MQTT Password
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type={showMqttPass ? 'text' : 'password'}
                            dir="ltr"
                            className={`${inputCls} font-mono pr-10`}
                            value={mqttPassword}
                            onChange={(e) => setMqttPassword(e.target.value)}
                            placeholder="••••••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowMqttPass((v) => !v)}
                            aria-label={showMqttPass ? 'Hide password' : 'Show password'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 cursor-pointer"
                          >
                            {showMqttPass ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyField('pass', mqttPassword)}
                          aria-label="Copy password"
                          className="p-2.5 text-primary hover:opacity-80 shrink-0 cursor-pointer"
                        >
                          {copiedField === 'pass' ? (
                            <Check size={15} className="text-primary" />
                          ) : (
                            <Copy size={15} className="text-primary" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={mqttEnableGuest}
                  onChange={(e) => setMqttEnableGuest(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-foreground block">
                    Enable guest_iot365/# topic for UID-less simulation
                  </span>
                  <span className="text-muted-foreground">
                    Reduces isolation and allows reading/publishing on the public guest namespace — recommended to keep disabled.
                  </span>
                </div>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={mqttSaving}
                  className="bg-primary text-primary-foreground text-xs font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                >
                  {mqttSaving ? 'Saving...' : 'Save & Apply Connection Settings'}
                </button>
                {mqttUseCustom && (
                  <button
                    type="button"
                    onClick={handleResetMqttToDemo}
                    disabled={mqttSaving}
                    className="flex items-center gap-1.5 bg-muted hover:bg-secondary text-foreground text-xs font-semibold py-2 px-3 rounded-xl border border-border transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw size={13} className="text-primary" />
                    Switch Back to Demo Mode
                  </button>
                )}
              </div>
            </form>

            {/* ACL Setup Guide */}
            <div className="mt-4 p-3.5 rounded-xl bg-background border border-border text-xs space-y-1.5">
              <p className="font-bold text-foreground">
                ACL Topic Isolation Guide (HiveMQ Cloud / EMQX):
              </p>
              <p className="text-muted-foreground">
                Block wildcard subscriptions (<code className="px-1 rounded bg-muted">#</code>) and restrict your account permissions to this topic filter only:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]" dir="ltr">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <span className="text-muted-foreground block text-[10px]">Topic Filter (Allow):</span>
                  <span className="text-primary font-bold break-all">{topicPrefix}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <span className="text-muted-foreground block text-[10px]">Permission:</span>
                  <span className="text-primary font-bold">Publish &amp; Subscribe (Allow)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
