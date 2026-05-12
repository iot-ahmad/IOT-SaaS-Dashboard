import React from 'react';
import { Cpu, Zap, Bell, Settings, Search, Filter, MoreVertical, Plus, CheckCircle2, AlertTriangle, Info, User, Globe, Lock, BellRing } from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 ${className}`}>
    {children}
  </div>
);

export const DevicesView = () => {
  const devices = [
    { id: 1, name: 'Main Irrigation Valve', status: 'Online', battery: '95%', type: 'Actuator', lastSeen: 'Just now' },
    { id: 2, name: 'Soil Sensor #01', status: 'Online', battery: '82%', type: 'Sensor', lastSeen: '2m ago' },
    { id: 3, name: 'Greenhouse Temp', status: 'Online', battery: 'N/A', type: 'Sensor', lastSeen: '5m ago' },
    { id: 4, name: 'Water Pump A', status: 'Offline', battery: '0%', type: 'Motor', lastSeen: '1h ago' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Connected Devices</h2>
        <button className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Plus size={20} /> Add Device
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 focus:outline-none focus:border-primary/50 text-sm" placeholder="Search devices..." />
        </div>
        <button className="bg-white/5 border border-white/10 p-2 px-4 rounded-xl text-white/50 flex items-center gap-2 text-sm hover:bg-white/10">
          <Filter size={18} /> Filter
        </button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/40 text-xs uppercase font-bold border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Device Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Battery</th>
              <th className="px-6 py-4">Last Seen</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {devices.map(device => (
              <tr key={device.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                    <Cpu size={16} />
                  </div>
                  <span className="font-medium">{device.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${device.status === 'Online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'Online' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">{device.type}</td>
                <td className="px-6 py-4 text-sm text-white/50">{device.battery}</td>
                <td className="px-6 py-4 text-sm text-white/50">{device.lastSeen}</td>
                <td className="px-6 py-4 text-right text-white/30">
                  <button className="hover:text-white transition-colors"><MoreVertical size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export const AutomationsToolView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">Workflow Automations</h2>
      <button className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors">
        <Zap size={20} /> New Automation
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary"><Zap size={24} /></div>
            <div>
              <h3 className="font-bold">Drought Prevention</h3>
              <p className="text-xs text-white/50 italic">If Moisture < 20% -> Irrigation ON</p>
            </div>
          </div>
          <div className="w-10 h-6 bg-primary rounded-full p-1"><div className="w-4 h-4 bg-white rounded-full translate-x-4"></div></div>
        </div>
        <div className="flex justify-between text-xs text-white/30 border-t border-white/5 pt-4">
          <span>Last ran: 2h ago</span>
          <span>Used 240L today</span>
        </div>
      </Card>
      {/* More automation cards can be added here */}
    </div>
  </div>
);

export const AlertsView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-xl font-bold">System Alerts</h2>
    <div className="space-y-3">
      {[
        { type: 'critical', msg: 'Water Pump A failure detected!', time: '1h ago', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
        { type: 'warning', msg: 'Soil Sensor #02 battery low (15%)', time: '4h ago', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { type: 'success', msg: 'Irrigation schedule completed successfully', time: 'Today, 06:00', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { type: 'info', msg: 'System update available (v2.4.0)', time: 'Yesterday', icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' },
      ].map((alert, i) => (
        <div key={i} className={`p-4 rounded-xl border border-white/5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors`}>
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${alert.bg} ${alert.color}`}>
              <alert.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-medium">{alert.msg}</p>
              <p className="text-xs text-white/30">{alert.time}</p>
            </div>
          </div>
          <button className="text-xs text-white/30 hover:text-white">Dismiss</button>
        </div>
      ))}
    </div>
  </div>
);

export const SettingsView = () => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-xl font-bold">System Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        {['General', 'Notifications', 'Security', 'Connected Accounts', 'Billing'].map(item => (
          <button key={item} className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${item === 'General' ? 'bg-primary/20 text-primary font-bold' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="md:col-span-2 space-y-6">
        <Card>
          <h3 className="font-bold mb-6 flex items-center gap-2"><User size={20} className="text-primary" /> Profile Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/30 block mb-1">Full Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm" defaultValue="Admin User" />
              </div>
              <div>
                <label className="text-xs text-white/30 block mb-1">Email Address</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm" defaultValue="admin@iot-mazraa.com" />
              </div>
            </div>
          </div>
        </Card>
        
        <Card>
          <h3 className="font-bold mb-6 flex items-center gap-2"><Globe size={20} className="text-blue-400" /> Localization</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-white/30 block mb-1">Language</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none">
                <option>English</option>
                <option>Arabic</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/30 block mb-1">Timezone</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 focus:outline-none">
                <option>(GMT+03:00) Amman</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);
