import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

const BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';

export function useMqtt(userUID = 'demo_user_001') {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [deviceStates, setDeviceStates] = useState({});
  const [lastSeen, setLastSeen] = useState({});
  const clientRef = useRef(null);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL, {
      clientId: `iot_dashboard_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000,
    });

    client.on('connect', () => {
      setIsConnected(true);
      // Subscribe to all topics under user's UID
      client.subscribe(`${userUID}/#`, { qos: 0 });
      addLog('system', `Connected to MQTT broker`);
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();
      const shortTopic = topic.replace(`${userUID}/`, '');
      
      addLog('incoming', `${shortTopic}: ${message}`);

      // Update device state
      setDeviceStates(prev => ({ ...prev, [shortTopic]: message }));
      
      // Update last seen
      setLastSeen(prev => ({ ...prev, [shortTopic]: Date.now() }));
    });

    client.on('error', (err) => {
      addLog('error', `Connection error: ${err.message}`);
    });

    client.on('close', () => {
      setIsConnected(false);
      addLog('system', 'Disconnected from broker');
    });

    clientRef.current = client;

    return () => {
      client.end();
    };
  }, [userUID]);

  const addLog = (type, text) => {
    const entry = {
      id: Date.now() + Math.random(),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev.slice(-99), entry]);
  };

  const publish = useCallback((topic, payload) => {
    if (clientRef.current && clientRef.current.connected) {
      const fullTopic = `${userUID}/${topic}`;
      clientRef.current.publish(fullTopic, String(payload), { qos: 0 });
      addLog('outgoing', `${topic}: ${payload}`);
    }
  }, [userUID]);

  return { isConnected, messages, deviceStates, lastSeen, publish, userUID };
}
