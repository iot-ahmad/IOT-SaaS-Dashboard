import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AuthPage from './components/AuthPage';
import { FloatingPaths } from './components/ui/background-paths';
import { HomeView } from './components/Views';
import UniversalController from './components/UniversalController';
import { DevicesView, AutomationsToolView, AlertsView, SettingsView, LiveTerminal } from './components/ToolViews';
import NewDevicesView from './components/DevicesView';
import DeveloperGuide from './components/DeveloperGuide';
import { useMqtt } from './hooks/useMqtt';
import { useAuth } from './hooks/useAuth';
import { Loader2, Sun, Moon } from 'lucide-react';
import { WORKSPACES } from './data/mockData';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

import { persistPortalMode } from './config/portals';

import ProjectFeed from './components/ProjectFeed';
import ProjectPublisher from './components/ProjectPublisher';
import ProjectDetail from './components/ProjectDetail';
import UserProfile from './components/UserProfile';

// Standalone Hub Layout — works for both logged-in users and guests
function HubLayout({ children, user, logout }) {
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30 overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-45 dark:opacity-25">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {/* ─── Top Navbar ─── */}
      <header className="relative z-10 flex items-center justify-between py-3 px-6 md:px-12 border-b border-border bg-card/60 bg-background/60 backdrop-blur-md sticky top-0">

        {/* Logo + nav links */}
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/hub')} className="flex items-center gap-2.5 cursor-pointer">
            <img src="/robot_logo.svg" alt="IOT365" className="w-8 h-8 object-contain drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]" />
            <span className="text-sm font-extrabold tracking-tight">
              <span className="text-foreground">IOT</span>
              <span className="text-primary">365</span>
              <span className="text-muted-foreground text-[10px] ml-1 font-semibold">🇯🇴 الأردن</span>
            </span>
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => navigate('/hub')}
              className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/15 transition-all cursor-pointer"
            >
              استعرض المشاريع
            </button>
            {user && (
              <button
                onClick={() => navigate('/hub/new')}
                className="text-xs font-semibold text-muted-foreground hover:text-primary dark:hover:text-primary px-3 py-1.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
              >
                + نشر مشروع
              </button>
            )}
          </nav>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground dark:text-white/60 hover:text-primary transition-colors cursor-pointer"
            title="تبديل المظهر"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user ? (
            // ── Logged-in user actions ──
            <div className="flex items-center gap-2">
              {/* Back to dashboard */}
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-xl border border-border hover:border-primary/40 bg-card/50 dark:bg-card/5 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                لوحة التحكم
              </button>

              {/* User avatar + dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 cursor-pointer">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover border-2 border-primary/30 hover:border-primary/60 transition-all" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary text-xs font-bold uppercase">
                      {(user.displayName || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>
                {/* Dropdown */}
                <div className="absolute top-full right-0 mt-2 w-44 bg-card dark:bg-[#0b0c10] border border-border rounded-2xl shadow-xl shadow-black/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50">
                  <div className="px-3 py-2.5 border-b border-border">
                    <p className="text-[11px] font-bold text-foreground truncate">{user.displayName || 'مستخدم'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-right text-xs text-muted-foreground dark:text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 transition-colors cursor-pointer"
                  >
                    لوحة التحكم
                  </button>
                  <button
                    onClick={() => navigate('/hub/new')}
                    className="w-full text-right text-xs text-muted-foreground dark:text-slate-300 hover:text-primary hover:bg-primary/5 px-3 py-2 transition-colors cursor-pointer"
                  >
                    نشر مشروع جديد
                  </button>
                  <div className="border-t border-border">
                    <button
                      onClick={logout}
                      className="w-full text-right text-xs text-red-400 hover:text-red-500 hover:bg-red-500/5 px-3 py-2 transition-colors cursor-pointer"
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // ── Guest actions ──
            <button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary/90 text-black text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      {/* ─── Page Content ─── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-5 overflow-y-auto">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border py-4 px-6 md:px-12 bg-card/40 bg-background/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            IOT365 🇯🇴 · مجتمع مطوري الأجهزة الذكية في الأردن
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/hub')} className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer">المشاريع</button>
            {user ? (
              <button onClick={() => navigate('/hub/new')} className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer">نشر مشروع</button>
            ) : (
              <button onClick={() => navigate('/login')} className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer">انضم للمجتمع الأردني 🇯🇴</button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const {
    user,
    loading: authLoading,
    error: authError,
    loginWithGoogle,
    logout,
    setError,
  } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }
    persistPortalMode('student');
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth page path */}
        <Route path="/login" element={
          !user ? (
            <AuthPage
              loginWithGoogle={loginWithGoogle}
              error={authError}
              setError={setError}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />

        {/* ── Hub routes — standalone page for ALL users (logged-in or guest) ── */}
        <Route path="/hub" element={
          <HubLayout user={user} logout={logout}>
            <ProjectFeed user={user} />
          </HubLayout>
        } />

        <Route path="/hub/new" element={
          user ? (
            <HubLayout user={user} logout={logout}>
              <ProjectPublisher user={user} />
            </HubLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        <Route path="/hub/project/:projectId" element={
          <HubLayout user={user} logout={logout}>
            <ProjectDetail currentUser={user} />
          </HubLayout>
        } />

        {/* Authenticated routes (Dashboard) — must come before /:username wildcard */}
        <Route path="/" element={
          user ? (
            <Dashboard user={user} logout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Vanity profile pages — must come after all specific routes */}
        <Route path="/:username" element={
          <HubLayout user={user} logout={logout}>
            <UserProfile currentUser={user} />
          </HubLayout>
        } />

        {/* Catch-all: authenticated tools or redirect to login */}
        <Route path="/*" element={
          user ? (
            <Dashboard user={user} logout={logout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

function Dashboard({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeWorkspace, setActiveWorkspace] = useState('home');
  const [activeTool, setActiveTool] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dynamic Workspaces State (dual-persistence: Firestore + localStorage)
  const [customWorkspaces, setCustomWorkspaces] = useState(WORKSPACES);
  const wsLocalKey = `iot_workspaces_${user.uid}`;

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'settings', 'workspaces');
        const snap = await getDoc(docRef);
        
        // Read local backup
        const savedLocal = localStorage.getItem(wsLocalKey);
        let localData = null;
        if (savedLocal) {
          try { localData = JSON.parse(savedLocal); } catch {}
        }

        if (snap.exists()) {
          const cloudData = snap.data();
          const cloudList = cloudData.list || WORKSPACES;
          const cloudTime = cloudData.updatedAt || 0;

          const localList = localData?.list || WORKSPACES;
          const localTime = localData?.updatedAt || 0;

          if (localTime > cloudTime) {
            // Local data is newer, use it and sync to Firestore
            setCustomWorkspaces(localList);
            try {
              await setDoc(docRef, { list: localList, updatedAt: localTime });
            } catch {}
          } else {
            // Cloud data is newer or equal, use it and sync to local
            setCustomWorkspaces(cloudList);
            try {
              localStorage.setItem(wsLocalKey, JSON.stringify({ list: cloudList, updatedAt: cloudTime }));
            } catch {}
          }
        } else {
          // No Firestore data — use local if available
          if (localData) {
            setCustomWorkspaces(localData.list);
            try {
              await setDoc(docRef, { list: localData.list, updatedAt: localData.updatedAt || Date.now() });
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load workspaces from Firestore, using localStorage fallback", err);
        try {
          const saved = localStorage.getItem(wsLocalKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            setCustomWorkspaces(parsed.list || parsed);
          }
        } catch {}
      }
    };
    fetchWorkspaces();
  }, [user.uid]);

  const saveWorkspaces = async (list) => {
    const now = Date.now();
    setCustomWorkspaces(list);
    // Always save to localStorage immediately
    try {
      localStorage.setItem(wsLocalKey, JSON.stringify({ list, updatedAt: now }));
    } catch {}
    // Save to Firestore
    try {
      const docRef = doc(db, 'users', user.uid, 'settings', 'workspaces');
      await setDoc(docRef, { list, updatedAt: now });
    } catch (err) {
      console.error("Failed to save workspaces to Firestore (localStorage backup is intact)", err);
    }
  };

  const handleAddWorkspace = async (name, esp32Prefix) => {
    const newWs = {
      id: `custom_${Date.now()}`,
      name,
      icon: 'Gamepad2',
      isCustom: true,
      esp32Prefix: esp32Prefix || ''
    };
    const updated = [...customWorkspaces, newWs];
    saveWorkspaces(updated);
    setActiveWorkspace(newWs.id);
  };

  const handleRenameWorkspace = (id, newName) => {
    const updated = customWorkspaces.map(ws => ws.id === id ? { ...ws, name: newName } : ws);
    saveWorkspaces(updated);
  };

  const handleDeleteWorkspace = (id) => {
    const updated = customWorkspaces.filter(ws => ws.id !== id);
    saveWorkspaces(updated);
    if (activeWorkspace === id) setActiveWorkspace('home');
  };

  // Dynamically inject the Jordan Community workspace under the Home workspace
  const displayWorkspaces = (() => {
    const homeItem = customWorkspaces.find(ws => ws.id === 'home') || { id: 'home', name: 'Home', icon: 'Home' };
    const hubItem = { id: 'hub', name: '🇯🇴 مجتمع الأردن', icon: 'Globe' };
    const others = customWorkspaces.filter(ws => ws.id !== 'home' && ws.id !== 'hub');
    return [homeItem, hubItem, ...others];
  })();

  // Use Firebase UID as the MQTT topic prefix - unique per user
  const { isConnected, messages, deviceStates, lastSeen, publish, userUID } = useMqtt(user.uid);

  // ─── Real-time Automation Engine ──────────────────────────────────────────────
  const [automations, setAutomations] = useState([]);
  const lastExecutedRef = useRef({}); // To prevent spamming publish commands

  // Subscribe to user's automation rules
  useEffect(() => {
    if (!user?.uid) return;
    const docRef = doc(db, 'users', user.uid, 'settings', 'automations');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAutomations(docSnap.data().list || []);
      } else {
        const defaults = [
          { id: 1, name: 'Drought Prevention', rule: 'If Soil Moisture < 20% → Irrigation ON', trigger: 'farm/soil_moisture', action: 'farm/irrigation:1', active: true, operator: '<', value: 20, lastRan: 'Never', usage: '—' },
          { id: 2, name: 'Heat Protection', rule: 'If Temp > 35°C → Open Vents', trigger: 'farm/greenhouse_temp', action: 'farm/vents:1', active: true, operator: '>', value: 35, lastRan: 'Never', usage: '—' },
        ];
        setAutomations(defaults);
      }
    }, (err) => {
      console.error("Failed to listen to automations", err);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Evaluate automation rules whenever incoming deviceStates update
  useEffect(() => {
    if (!automations || automations.length === 0) return;

    automations.forEach(async (rule) => {
      if (!rule.active) return;

      const currentValRaw = deviceStates[rule.trigger];
      if (currentValRaw === undefined) return;

      const currentVal = Number(currentValRaw);
      if (isNaN(currentVal)) return;

      const threshold = Number(rule.value);
      const op = rule.operator;

      let conditionMet = false;
      if (op === '>') conditionMet = currentVal > threshold;
      else if (op === '<') conditionMet = currentVal < threshold;
      else if (op === '=') conditionMet = currentVal === threshold;

      if (conditionMet) {
        // 10-second throttle per rule to prevent spamming commands
        const ruleKey = `${rule.id}`;
        const now = Date.now();
        const lastExecution = lastExecutedRef.current[ruleKey] || 0;

        if (now - lastExecution > 10000) {
          lastExecutedRef.current[ruleKey] = now;

          // Parse action topic and payload (e.g. "topic:payload")
          let actionTopic = rule.action;
          let payload = 'ON';
          if (rule.action.includes(':')) {
            const parts = rule.action.split(':');
            actionTopic = parts[0];
            payload = parts[1];
          }

          console.log(`⚡ Automation triggered: ${rule.name}. Publishing "${payload}" to "${actionTopic}"`);
          publish(actionTopic, payload);

          // Update lastRan in Firestore
          try {
            const docRef = doc(db, 'users', user.uid, 'settings', 'automations');
            const updatedList = automations.map(a => a.id === rule.id ? { ...a, lastRan: new Date().toLocaleTimeString() } : a);
            await setDoc(docRef, { list: updatedList }, { merge: true });
          } catch (e) {
            console.error("Failed to update lastRan for automation", e);
          }
        }
      }
    });
  }, [deviceStates, automations, publish, user?.uid]);

  const handleSetWorkspace = (workspaceId) => {
    setActiveWorkspace(workspaceId);
    setActiveTool(null);
    setIsMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleSetTool = (toolId) => {
    setActiveTool(toolId);
    setActiveWorkspace(null);
    setIsMobileMenuOpen(false);
    if (window.location.pathname !== '/') {
      navigate('/');
    }
  };

  const renderContent = () => {
    if (activeTool) {
      switch (activeTool) {
        case 'devices': return <NewDevicesView userUID={userUID} lastSeen={lastSeen} deviceStates={deviceStates} />;
        case 'automations': return <AutomationsToolView publish={publish} userUID={userUID} />;
        case 'alerts': return <AlertsView userUID={userUID} />;
        case 'settings': return <SettingsView userUID={userUID} user={user} logout={logout} />;
        case 'developer': return <DeveloperGuide userUID={user.uid} />;
        default: return <DevicesView userUID={userUID} lastSeen={lastSeen} />;
      }
    }

    const currentWorkspace = customWorkspaces.find(ws => ws.id === activeWorkspace);

    if (currentWorkspace && currentWorkspace.id === 'home') {
      return (
        <HomeView 
          workspaces={customWorkspaces} 
          onAddWorkspace={handleAddWorkspace} 
          setActiveWorkspace={handleSetWorkspace} 
        />
      );
    }
    if (currentWorkspace && currentWorkspace.id === 'controller') {
      return (
        <UniversalController 
          key="controller"
          deviceStates={deviceStates} 
          publish={publish} 
          storageScopeId={user.uid} 
          userUID={user.uid} 
        />
      );
    }
    
    // For custom added dashboards
    if (currentWorkspace && currentWorkspace.isCustom) {
      return (
        <UniversalController 
          key={currentWorkspace.id}
          deviceStates={deviceStates} 
          publish={publish} 
          storageScopeId={`${user.uid}_${currentWorkspace.id}`} 
          customTitle={currentWorkspace.name}
          esp32Prefix={currentWorkspace.esp32Prefix}
          userUID={user.uid}
        />
      );
    }

    return (
      <HomeView 
        workspaces={customWorkspaces} 
        onAddWorkspace={handleAddWorkspace} 
        setActiveWorkspace={setActiveWorkspace} 
      />
    );
  };

  const sidebarW = isSidebarCollapsed ? 'w-16' : 'w-64';
  const mainPl = isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64';

  return (
     <div className="relative h-screen bg-background text-foreground flex selection:bg-primary/30 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-45 dark:opacity-25">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 bg-background/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarW} transform transition-all duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          workspaces={displayWorkspaces}
          activeWorkspace={activeWorkspace} 
          setActiveWorkspace={handleSetWorkspace}
          activeTool={activeTool}
          setActiveTool={handleSetTool}
          user={user}
          logout={logout}
          onAddWorkspace={handleAddWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}

        />
      </div>

      <main className={`relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ${mainPl}`}>
        <Header 
          activeWorkspace={activeWorkspace}
          activeTool={activeTool}
          isConnected={isConnected}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          customWorkspaces={displayWorkspaces}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(v => !v)}

        />
        
        <div className={`flex-1 ${activeTool === 'developer' ? 'flex flex-col px-6 md:px-8 pb-6 pt-4 min-h-0' : 'p-6 md:p-8 pb-40 overflow-y-auto'}`}>
          <div className={activeTool !== 'developer' ? 'max-w-7xl mx-auto space-y-6' : ''}>
            <Routes>
              <Route path="/" element={renderContent()} />
            </Routes>
          </div>
        </div>

        <LiveTerminal messages={messages} isConnected={isConnected} />
      </main>
    </div>
  );
}

export default App;
