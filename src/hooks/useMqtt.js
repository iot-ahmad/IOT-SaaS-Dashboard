import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { parseBrokerHost, getRootCaForHost } from '../config/mqttSecurity';

// Demo fallback broker read strictly from environment variables (never hardcoded secrets)
const ENV_BROKER_URL = (import.meta.env.VITE_MQTT_BROKER_URL || '').trim();
const ENV_MQTT_USERNAME = (import.meta.env.VITE_MQTT_USERNAME || '').trim();
const ENV_MQTT_PASSWORD = (import.meta.env.VITE_MQTT_PASSWORD || '').trim();

export function useMqtt(userUID) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [deviceStates, setDeviceStates] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const [userMqttSettings, setUserMqttSettings] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const clientRef = useRef(null);
  const provisionAttemptedRef = useRef(null);

  const addLog = useCallback((type, text) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev.slice(-99), entry]);
  }, []);

  // Load per-user Private / Auto-Provisioned MQTT settings from Firestore
  useEffect(() => {
    if (!userUID) {
      setUserMqttSettings(null);
      setSettingsLoaded(false);
      provisionAttemptedRef.current = null;
      return;
    }

    setSettingsLoaded(false);
    const settingsRef = doc(db, 'users', userUID, 'settings', 'mqtt');
    const unsubscribe = onSnapshot(
      settingsRef,
      (snap) => {
        setUserMqttSettings(snap.exists() ? snap.data() : null);
        setSettingsLoaded(true);
      },
      (err) => {
        console.warn('Could not load private MQTT settings, falling back:', err?.message || err);
        setUserMqttSettings(null);
        setSettingsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [userUID]);

  // Provision or rotate isolated per-user EMQX credentials via serverless API
  const provisionMqttAccount = useCallback(async ({ rotate = false } = {}) => {
    if (!userUID) return { ok: false, error: 'Not authenticated' };
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return { ok: false, error: 'Not authenticated' };

    setIsProvisioning(true);
    try {
      const res = await fetch('/api/mqtt-provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rotate }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const unavailable = res.status === 503 || res.status === 404;
        return {
          ok: false,
          unavailable,
          error: data?.error || `Provisioning failed (HTTP ${res.status})`,
        };
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

      addLog('system', 'Provisioned isolated EMQX MQTT credentials automatically.');
      return { ok: true, data };
    } catch (err) {
      return {
        ok: false,
        unavailable: true,
        error: err?.message || 'Auto-provisioning request failed',
      };
    } finally {
      setIsProvisioning(false);
    }
  }, [userUID, addLog]);

  // Automatically provision isolated EMQX account once per session if user has no custom broker yet
  useEffect(() => {
    if (!userUID || !settingsLoaded) return;
    const hasActivePrivate = Boolean(
      userMqttSettings?.useCustomBroker &&
      userMqttSettings?.brokerUrl?.trim() &&
      userMqttSettings?.password
    );
    if (hasActivePrivate || userMqttSettings?.autoProvisionDisabled === true) return;
    if (provisionAttemptedRef.current === userUID) return;

    provisionAttemptedRef.current = userUID;
    provisionMqttAccount({ rotate: false });
  }, [userUID, settingsLoaded, userMqttSettings, provisionMqttAccount]);

  const isPrivate = Boolean(userMqttSettings?.useCustomBroker && userMqttSettings?.brokerUrl?.trim());
  const brokerUrl = isPrivate ? userMqttSettings.brokerUrl.trim() : ENV_BROKER_URL;
  const username = isPrivate ? (userMqttSettings.username || '') : ENV_MQTT_USERNAME;
  const password = isPrivate ? (userMqttSettings.password || '') : ENV_MQTT_PASSWORD;
  const allowGuestTopic = Boolean(userMqttSettings?.enableGuestTopic);
  const mqttMode = !brokerUrl ? 'unconfigured' : (isPrivate ? 'private' : 'demo');

  useEffect(() => {
    if (!userUID || !settingsLoaded) return;

    if (!brokerUrl) {
      setIsConnected(false);
      addLog('error', 'MQTT broker not configured. Set private broker in Security settings or .env');
      return;
    }

    const randId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);

    const connectOptions = {
      clientId: `iot365_web_${String(userUID).slice(0, 6)}_${randId}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    };

    if (username) connectOptions.username = username;
    if (password) connectOptions.password = password;

    const client = mqtt.connect(brokerUrl, connectOptions);

    client.on('connect', () => {
      setIsConnected(true);
      // Subscribe strictly to the authenticated user's isolated namespace
      client.subscribe(`${userUID}/#`, { qos: 0 });
      // Only subscribe to guest_iot365/# when explicitly opted in by the user
      if (allowGuestTopic && userUID !== 'guest_iot365') {
        client.subscribe('guest_iot365/#', { qos: 0 });
      }
      addLog(
        'system',
        isPrivate
          ? 'Connected to Isolated Private MQTT Broker (WSS)'
          : 'Connected to IOT365 Demo Broker (WSS)'
      );
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();

      let shortTopic = topic;
      if (topic.startsWith(`${userUID}/`)) {
        shortTopic = topic.slice(userUID.length + 1);
      } else if (allowGuestTopic && topic.startsWith('guest_iot365/')) {
        shortTopic = topic.slice('guest_iot365/'.length);
      }

      addLog('incoming', `${shortTopic}: ${message}`);
      setDeviceStates(prev => ({ ...prev, [shortTopic]: message }));
      setLastSeen(prev => ({ ...prev, [shortTopic]: Date.now() }));
    });

    client.on('error', (err) => {
      addLog('error', `MQTT Error: ${err.message}`);
    });

    client.on('close', () => {
      setIsConnected(false);
      addLog('system', 'Disconnected from broker');
    });

    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.end();
    };
  }, [userUID, settingsLoaded, brokerUrl, username, password, allowGuestTopic, isPrivate, addLog]);

  const publish = useCallback((topic, payload) => {
    const str = String(payload);
    // Strip leading slashes so no widget or input can escape `${userUID}/` namespace
    const cleanTopic = String(topic || '').replace(/^\/+/, '');
    if (!cleanTopic || !userUID) return;

    if (clientRef.current?.connected) {
      const fullTopic = `${userUID}/${cleanTopic}`;
      clientRef.current.publish(fullTopic, str, { qos: 0 });

      if (allowGuestTopic && userUID !== 'guest_iot365') {
        clientRef.current.publish(`guest_iot365/${cleanTopic}`, str, { qos: 0 });
      }

      addLog('outgoing', `${cleanTopic}: ${str}`);
      setDeviceStates(prev => ({ ...prev, [cleanTopic]: str }));
      setLastSeen(prev => ({ ...prev, [cleanTopic]: Date.now() }));
    } else {
      addLog('outgoing', `[offline] ${cleanTopic}: ${str}`);
    }
  }, [userUID, allowGuestTopic, addLog]);

  const resolvedHost = parseBrokerHost(brokerUrl);

  // Never expose ENV_MQTT_USERNAME or ENV_MQTT_PASSWORD in mqttConfig
  const mqttConfig = {
    mode: mqttMode,
    host: resolvedHost,
    tlsPort: Number(userMqttSettings?.tlsPort) || 8883,
    username: isPrivate ? (userMqttSettings.username || '') : '',
    password: isPrivate ? (userMqttSettings.password || '') : '',
    useCustomBroker: isPrivate,
    enableGuestTopic: allowGuestTopic,
    provisionedBy: userMqttSettings?.provisionedBy || null,
    provider: userMqttSettings?.provider || null,
    caName: getRootCaForHost(resolvedHost).name,
  };

  return {
    isConnected,
    messages,
    deviceStates,
    lastSeen,
    publish,
    userUID,
    mqttMode,
    mqttConfig,
    isProvisioning,
    provisionMqttAccount,
  };
}
