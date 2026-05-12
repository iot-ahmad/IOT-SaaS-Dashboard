import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Zap, Search, Filter, MoreVertical, Plus, CheckCircle2, AlertTriangle, Info, User, Globe, Copy, Check, Terminal, CircuitBoard } from 'lucide-react';
import { DEVICES, PIN_MAP } from '../data/mockData';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 ${className}`}>
    {children}
  </div>
);

// Copy Topic Button Component
const CopyTopicButton = ({ topic, userUID }) => {
  const [copied, setCopied] = useState(false);
  const fullTopic = `${userUID}/${topic}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      title={`Copy: ${fullTopic}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'}`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : fullTopic}
    </button>
  );
};

// Last Seen indicator
const LastSeenBadge = ({ lastSeenTimestamp }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const diffSec = Math.floor((now - lastSeenTimestamp) / 1000);
  const isOffline = diffSec > 30;

  let label;
  if (diffSec < 5) label = 'Just now';
  else if (diffSec < 60) label = `${diffSec}s ago`;
  else if (diffSec < 3600) label = `${Math.floor(diffSec / 60)}m ago`;
  else label = `${Math.floor(diffSec / 3600)}h ago`;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOffline ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
      {isOffline ? 'Offline' : label}
    </span>
  );
};

// ==================== DEVICES VIEW ====================
export const DevicesView = ({ userUID, lastSeen }) => {
  const mergedDevices = DEVICES.map(d => ({
    ...d,
    lastSeen: lastSeen[d.topic] || d.lastSeen,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Connected Devices</h2>
        <button className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm placeholder:text-white/30" placeholder="Search devices..." />
        </div>
        <button className="bg-white/5 border border-white/10 px-4 rounded-xl text-white/50 flex items-center gap-2 text-sm hover:bg-white/10 transition-colors">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Device Table */}
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-white/5 text-white/40 text-xs uppercase font-bold border-b border-white/10">
            <tr>
              <th className="px-5 py-3">Device</th>
              <th className="px-5 py-3">MQTT Topic</th>
              <th className="px-5 py-3">Pin</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Seen</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mergedDevices.map(device => (
              <tr key={device.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 flex-shrink-0">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{device.name}</span>
                      <span className="block text-xs text-white/30">{device.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <CopyTopicButton topic={device.topic} userUID={userUID} />
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded">{device.pin}</span>
                </td>
                <td className="px-5 py-3">
                  <LastSeenBadge lastSeenTimestamp={device.lastSeen} />
                </td>
                <td className="px-5 py-3 text-xs text-white/40">
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-white/30 hover:text-white transition-colors"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pin Mapping */}
      <Card>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <CircuitBoard size={20} className="text-primary" /> ESP32 Pin Mapping
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PIN_MAP.map(p => (
            <div key={p.pin} className="bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
              <span className={`text-xs font-bold font-mono ${p.color}`}>{p.pin}</span>
              <p className="text-[11px] text-white/50 mt-1">{p.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ==================== AUTOMATIONS VIEW ====================
export const AutomationsToolView = ({ publish, userUID }) => {
  const [autos, setAutos] = useState([
    { id: 1, name: 'Drought Prevention', rule: 'If Soil Moisture < 20% → Irrigation ON', trigger: 'farm/soil_moisture', action: 'farm/irrigation', active: true, lastRan: '2h ago', usage: '240L' },
    { id: 2, name: 'Heat Protection', rule: 'If Temp > 35°C → Open Vents', trigger: 'farm/greenhouse_temp', action: 'farm/vents', active: true, lastRan: '45m ago', usage: '—' },
    { id: 3, name: 'Rain Guard', rule: 'If Rain Detected → Disable Irrigation', trigger: 'farm/rain_sensor', action: 'farm/irrigation', active: false, lastRan: 'Never', usage: '—' },
  ]);

  const toggleAuto = (id) => {
    setAutos(autos.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Workflow Automations</h2>
        <button className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
          <Zap size={18} /> New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {autos.map(auto => (
          <Card key={auto.id}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${auto.active ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/30'}`}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{auto.name}</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">{auto.rule}</p>
                </div>
              </div>
              <button 
                onClick={() => toggleAuto(auto.id)}
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${auto.active ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${auto.active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-white/30">Trigger:</span>
                <CopyTopicButton topic={auto.trigger} userUID={userUID} />
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-white/30">Action:</span>
                <CopyTopicButton topic={auto.action} userUID={userUID} />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-white/30 border-t border-white/5 pt-3">
              <span>Last ran: {auto.lastRan}</span>
              <span>Used: {auto.usage}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ==================== ALERTS VIEW ====================
export const AlertsView = () => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold">System Alerts</h2>
    <div className="space-y-3">
      {[
        { type: 'critical', msg: 'Water Pump A failure detected!', time: '1h ago', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
        { type: 'warning', msg: 'Soil Sensor #02 battery low (15%)', time: '4h ago', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { type: 'success', msg: 'Irrigation schedule completed successfully', time: 'Today, 06:00', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { type: 'info', msg: 'System update available (v2.4.0)', time: 'Yesterday', icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      ].map((alert, i) => (
        <div key={i} className="p-4 rounded-xl border border-white/5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${alert.bg} ${alert.color}`}>
              <alert.icon size={18} />
            </div>
            <div>
              <p className="text-sm font-medium">{alert.msg}</p>
              <p className="text-xs text-white/30">{alert.time}</p>
            </div>
          </div>
          <button className="text-xs text-white/30 hover:text-white transition-colors">Dismiss</button>
        </div>
      ))}
    </div>
  </div>
);

// ==================== SETTINGS VIEW ====================
export const SettingsView = ({ userUID, user, logout }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold">System Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        {['General', 'Notifications', 'Security', 'Connected Accounts', 'Billing'].map(item => (
          <button key={item} className={`w-full text-left px-4 py-3 rounded-xl transition-colors text-sm ${item === 'General' ? 'bg-primary/20 text-primary font-bold' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="md:col-span-2 space-y-6">
        {/* UID Card */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Cpu size={18} className="text-primary" /> Your Device UID</h3>
          <p className="text-xs text-white/40 mb-3">Use this UID as a prefix for all your MQTT topics in your Arduino code.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-sm font-mono text-primary">{userUID}</code>
            <button 
              onClick={() => navigator.clipboard.writeText(userUID)}
              className="bg-primary/10 text-primary px-3 py-2.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Copy size={16} />
            </button>
          </div>
        </Card>

        {/* Profile */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18} className="text-primary" /> Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/30 block mb-1">Full Name</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50" defaultValue={user?.displayName || ''} />
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Email</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50 text-white/50" defaultValue={user?.email || ''} readOnly />
            </div>
          </div>
        </Card>

        {/* Localization */}
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Localization</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-white/30 block mb-1">Language</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-primary/50">
                <option>English</option>
                <option>Arabic</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Timezone</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-primary/50">
                <option>(GMT+03:00) Amman</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Logout */}
        <button 
          onClick={logout}
          className="w-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500/20 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  </div>
);

// ==================== LIVE TERMINAL ====================
export const LiveTerminal = ({ messages, isConnected }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const colorMap = {
    incoming: 'text-emerald-400',
    outgoing: 'text-blue-400',
    system: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-[#0a0b0d]/95 backdrop-blur-md border-t border-white/10">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-bold text-white/60">Live Terminal</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
        </div>
        <span className="text-[10px] text-white/30">{messages.length} messages</span>
      </div>
      <div ref={scrollRef} className="h-28 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5">
        {messages.length === 0 && (
          <p className="text-white/20 italic">Waiting for MQTT messages from ESP32...</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2">
            <span className="text-white/20 flex-shrink-0">{msg.timestamp}</span>
            <span className={`${colorMap[msg.type] || 'text-white/50'}`}>
              {msg.type === 'incoming' ? '◀' : msg.type === 'outgoing' ? '▶' : '●'}
            </span>
            <span className="text-white/70">{msg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
