import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Moon, Menu, Wifi, WifiOff } from 'lucide-react';
import { WORKSPACES, TOOLS } from '../data/mockData';

export default function Header({ activeWorkspace, activeTool, isConnected, toggleMobileMenu }) {
  const [time, setTime] = useState(new Date());
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial theme
    const isDarkTheme = document.documentElement.classList.contains('dark') || 
                        localStorage.theme === 'dark' || 
                        (!('theme' in localStorage) && true); // default true for dark mode
    setIsDark(isDarkTheme);
    if (isDarkTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

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
    <header className="flex items-center justify-between py-4 px-6 md:px-8 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white">
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
          <p className="text-slate-600 dark:text-white/50 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-primary transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* MQTT Status */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden xl:inline">{isConnected ? 'MQTT Connected' : 'Disconnected'}</span>
        </div>

        {/* Weather */}
        <div className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl">
          <CloudRain size={18} className="text-blue-400" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900 dark:text-white">24°C</span>
            <span className="text-xs text-slate-600 dark:text-white/50">Humidity 45%</span>
          </div>
        </div>
        
        {/* Clock */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-2 rounded-xl">
          <Sun size={18} className="text-yellow-400" />
          <div className="flex flex-col">
             <span className="text-sm font-medium text-slate-900 dark:text-white">
               {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
             <span className="text-xs text-slate-600 dark:text-white/50">
               {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
             </span>
          </div>
        </div>
      </div>
    </header>
  );
}
