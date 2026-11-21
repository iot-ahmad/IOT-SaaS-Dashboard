import React, { useState, useEffect } from 'react';
import { Sun, Moon, Menu, Wifi, WifiOff, PanelLeftClose, PanelLeftOpen, Globe, MessageSquare } from 'lucide-react';
import { TOOLS } from '../data/mockData';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMessaging } from '../context/MessagingContext';

export default function Header({
  activeWorkspace,
  activeTool,
  isConnected,
  mqttMode = 'demo',
  toggleMobileMenu,
  customWorkspaces,
  isSidebarCollapsed,
  onToggleSidebar,
  isDark: propIsDark,
  onToggleTheme
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount = 0, setIsMessagingOpen = () => { } } = useMessaging();
  const [localIsDark, setLocalIsDark] = useState(true);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  useEffect(() => {
    const isDarkTheme = localStorage.theme ? localStorage.theme === 'dark' : true;
    if (propIsDark === undefined) {
      setLocalIsDark(isDarkTheme);
    }
    if (isDarkTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [propIsDark]);

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const newTheme = !localIsDark;
      setLocalIsDark(newTheme);
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      }
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
    if (activeTool === 'simulator') {
      title = 'Quick Simulator & Dashboard';
      subtitle = 'Split screen workspace combining interactive circuit simulator, live dashboard, and devices';
    } else {
      const tool = TOOLS.find(t => t.id === activeTool);
      title = tool ? tool.name : 'Tools';
      subtitle = `Manage your ${title.toLowerCase()}`;
    }
  } else if (activeWorkspace) {
    // Resolve custom workspace names from the passed list
    const ws = customWorkspaces?.find(w => w.id === activeWorkspace);
    title = ws ? ws.name : 'Dashboard';
    if (activeWorkspace === 'controller') subtitle = 'Add sensors, actuators, and RC car controls to your dashboard';
    else if (ws?.isCustom) subtitle = 'Drag, resize, and control sensors, actuators, or an RC car. Layout saved to your account automatically.';
  }

  const isSimulator = activeTool === 'simulator';

  return (
    <header className={`flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 transition-all ${isSimulator ? 'py-2 px-4 md:px-6' : 'py-3.5 px-6 md:px-8'
      }`}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-primary hover:opacity-80 p-1.5 rounded-lg transition-opacity cursor-pointer"
          title="Open menu"
        >
          <Menu size={20} className="text-primary" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex items-center justify-center text-primary hover:opacity-80 transition-opacity p-1.5 rounded-lg cursor-pointer"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={18} className="text-primary" /> : <PanelLeftClose size={18} className="text-primary" />}
        </button>

        <div>
          <h1 className={`${isSimulator ? 'text-base md:text-lg' : 'text-lg md:text-xl'} font-bold text-foreground tracking-tight leading-tight`}>
            {title}
          </h1>
          {!isSimulator && (
            <p className="text-xs mt-0.5 text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Direct Messages Button */}
        <button
          onClick={() => setIsMessagingOpen(true)}
          className="relative h-9 flex items-center gap-2 px-3 rounded-lg bg-muted/60 hover:bg-muted border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Direct Messages"
        >
          <MessageSquare size={15} className="text-primary" />
          <span className="hidden sm:inline">Messages</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center shadow-md tabular-nums">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Projects Community Button */}
        <button
          onClick={() => navigate('/hub')}
          className="h-9 flex items-center gap-2 px-3 rounded-lg bg-muted/60 hover:bg-muted border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Project Hub"
        >
          <Globe size={15} className="text-primary" />
          <span className="hidden sm:inline">Project Hub</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-transparent border-0 hover:bg-muted/40 text-primary transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
        </button>

        {/* MQTT Broker Status Pill */}
        <div
          title={isConnected
            ? (mqttMode === 'private' ? 'Connected to private isolated EMQX MQTT broker (TLS 8883)' : 'Connected to shared demo broker (for education & simulation only)')
            : 'Disconnected from MQTT broker'}
          className={`hidden lg:flex h-9 items-center gap-2 px-3 rounded-lg border text-xs font-medium ${
            isConnected
              ? 'bg-primary/10 border-primary/25 text-primary'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}
        >
          {isConnected ? <Wifi size={14} className="text-primary" /> : <WifiOff size={14} className="text-red-400" />}
          <span className="hidden xl:inline font-mono text-[11px] font-semibold">
            {isConnected ? (mqttMode === 'private' ? 'EMQX Isolated' : 'Demo Broker') : 'Broker Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
