import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Menu } from 'lucide-react';
import { WORKSPACES } from '../data/mockData';

export default function Header({ activeWorkspace, toggleMobileMenu }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const workspaceName = WORKSPACES.find(w => w.id === activeWorkspace)?.name || 'Dashboard';

  return (
    <header className="flex items-center justify-between py-6 px-6 md:px-8 border-b border-white/5 bg-[#0F1115]/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-white/70 hover:text-white">
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{workspaceName}</h1>
          <p className="text-white/50 text-sm mt-1">Manage your connected devices and automations</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <CloudRain size={20} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">24°C</span>
            <span className="text-xs text-white/50">Humidity 45%</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
          <Sun size={20} className="text-yellow-400" />
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
