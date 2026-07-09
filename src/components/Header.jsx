import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, Wifi, WifiOff, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { TOOLS } from '../data/mockData';
import { useLocation } from 'react-router-dom';

export default function Header({ activeWorkspace, activeTool, isConnected, toggleMobileMenu, customWorkspaces, isSidebarCollapsed, onToggleSidebar }) {
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains('dark') || 
                        localStorage.theme === 'dark' || 
                        (!('theme' in localStorage) && true);
    setIsDark(isDarkTheme);
    if (isDarkTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
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

  const pathname = location.pathname;

  if (pathname === '/hub') {
    title = 'Global IoT Hub';
    subtitle = 'Browse community projects and open source hardware documentation';
  } else if (pathname === '/hub/new') {
    title = 'Publish Project';
    subtitle = 'Publish documentation, codes, and schematics to the global community';
  } else if (pathname.startsWith('/hub/project/')) {
    title = 'Project Details';
    subtitle = 'View hardware documentation, circuit schematics, and source codes';
  } else if (pathname !== '/' && pathname !== '/login') {
    title = 'Developer Profile';
    subtitle = 'Developer vanity portfolio and published IoT projects';
  } else if (activeTool) {
    const tool = TOOLS.find(t => t.id === activeTool);
    title = tool ? tool.name : 'Tools';
    subtitle = `Manage your ${title.toLowerCase()}`;
  } else if (activeWorkspace) {
    // Resolve custom workspace names from the passed list
    const ws = customWorkspaces?.find(w => w.id === activeWorkspace);
    title = ws ? ws.name : 'Dashboard';
    if (activeWorkspace === 'controller') subtitle = 'Add sensors, actuators, and RC car controls to your dashboard';
    else if (ws?.isCustom) subtitle = 'Drag, resize, and control sensors, actuators, or an RC car. Layout saved to your account automatically.';
  }

  return (
    <header className="flex items-center justify-between py-4 px-6 md:px-8 border-b border-border bg-card/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileMenu}
          style={{ color: 'var(--foreground)' }}
          className="md:hidden hover:text-primary transition-colors w-12 h-12 flex items-center justify-center rounded-xl hover:bg-card/25"
          title="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          style={{ color: 'var(--muted-foreground)', background: 'transparent' }}
          className="hidden md:flex items-center justify-center hover:text-primary transition-colors p-1 hover:bg-[var(--muted)]"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
          <p className="text-xs md:text-sm mt-0.5 text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">


        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          className="w-12 h-12 flex items-center justify-center hover:text-primary transition-colors rounded-xl"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* MQTT Status */}
        <div style={isConnected
          ? { background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#22c55e' }
          : { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#ef4444' }
        } className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium">
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden xl:inline">{isConnected ? 'MQTT Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
}
