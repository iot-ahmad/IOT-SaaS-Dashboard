import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

// Dedicated IOT365 Cloud Cluster (WSS port 8884)
const BROKER_URL = import.meta.env.VITE_MQTT_BROKER_URL || 'wss://fb1525bbd13f4f1ca5f0a7599eed435f.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_USERNAME = import.meta.env.VITE_MQTT_USERNAME || '';
const MQTT_PASSWORD = import.meta.env.VITE_MQTT_PASSWORD || '';

export function useMqtt(userUID = 'ahmad2004') {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [deviceStates, setDeviceStates] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const clientRef = useRef(null);

  const addLog = useCallback((type, text) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev.slice(-99), entry]);
  }, []);

  useEffect(() => {
    const connectOptions = {
      clientId: `iot_dashboard_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    };

    if (MQTT_USERNAME) connectOptions.username = MQTT_USERNAME;
    if (MQTT_PASSWORD) connectOptions.password = MQTT_PASSWORD;

    const client = mqtt.connect(BROKER_URL, connectOptions);

    client.on('connect', () => {
      setIsConnected(true);
      // Subscribe to user-specific topics AND global absolute topics if needed
      client.subscribe(`${userUID}/#`, { qos: 0 });
      addLog('system', `Connected to IOT365 Cloud Broker (WSS)`);
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();
      
      // If topic starts with UID, strip it for the UI state
      const shortTopic = topic.startsWith(`${userUID}/`) 
        ? topic.replace(`${userUID}/`, '') 
        : topic;
      
      addLog('incoming', `${shortTopic}: ${message}`);

      // Update device state
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
      client.end();
    };
  }, [userUID, addLog]);

  const publish = useCallback((topic, payload) => {
    const str = String(payload);
    if (clientRef.current?.connected) {
      // If topic starts with '/', use it as is. Otherwise, prefix with UID.
      const fullTopic = topic.startsWith('/') ? topic.slice(1) : `${userUID}/${topic}`;
      clientRef.current.publish(fullTopic, str, { qos: 0 });
      addLog('outgoing', `${topic}: ${str}`);
      
      // Update UI state immediately (optimistic update)
      setDeviceStates(prev => ({ ...prev, [topic]: str }));
      setLastSeen(prev => ({ ...prev, [topic]: Date.now() }));
    } else {
      addLog('outgoing', `[offline] ${topic}: ${str}`);
    }
  }, [userUID, addLog]);

  return { isConnected, messages, deviceStates, lastSeen, publish, userUID };
}
