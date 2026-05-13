import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Menu, Wifi, WifiOff } from 'lucide-react';
import { WORKSPACES, TOOLS } from '../data/mockData';

export default function Header({ activeWorkspace, activeTool, isConnected, toggleMobileMenu }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let title = 'Dashboard';
  let subtitle = 'Manage your connected devices and automations';

  if (activeTool) {
    const tool = TOOLS.find(t => t.id === activeTool);
    title = tool ? tool.name : 'Tools';
    subtitle = `Manage your ${title.toLowerCase()}`;
  } else if (activeWorkspace) {
    const ws = WORKSPACES.find(w => w.id === activeWorkspace);
    title = ws ? ws.name : 'Dashboard';
    if (activeWorkspace === 'controller') subtitle = 'Add sensors, actuators, and RC car controls to your dashboard';
  }

  return (
    <header className="flex items-center justify-between py-4 px-6 md:px-8 border-b border-white/5 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-white/70 hover:text-white">
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* MQTT Status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{isConnected ? 'MQTT Connected' : 'Disconnected'}</span>
        </div>

        {/* Weather */}
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <CloudRain size={18} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">24°C</span>
            <span className="text-xs text-white/50">Humidity 45%</span>
          </div>
        </div>
        
        {/* Clock */}
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <Sun size={18} className="text-yellow-400" />
          <div className="flex flex-col">
             <span className="text-sm font-medium text-white">
               {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             <span className="text-xs text-white/50">
               {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
             </span>
          </div>
        </div>
      </div>
    </header>
  );
}
