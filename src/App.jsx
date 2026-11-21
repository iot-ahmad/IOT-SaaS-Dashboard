import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { HomeView } from './components/Views';
import { AutomationsToolView, AlertsView, LiveTerminal } from './components/ToolViews';
import { useMqtt } from './hooks/useMqtt';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { WORKSPACES } from './data/mockData';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

import { persistPortalMode } from './config/portals';

import { BrandLogo, FAVICON_DATA_URI } from './components/ui/BrandLogo';
import { MessagingProvider } from './context/MessagingContext';

const AuthPage = lazy(() => import('./components/AuthPage'));
const UniversalController = lazy(() => import('./components/UniversalController'));
const NewDevicesView = lazy(() => import('./components/DevicesView'));
const DeveloperGuide = lazy(() => import('./components/DeveloperGuide'));
const SimulatorView = lazy(() => import('./components/SimulatorView'));
const MqttConnectionView = lazy(() => import('./components/MqttConnectionView'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const CommunityLayout = lazy(() => import('./components/community/CommunityLayout'));
const CommunityFeed = lazy(() => import('./components/community/CommunityFeed'));
const ExploreProjects = lazy(() => import('./components/community/ExploreProjects'));
const DiscussionsView = lazy(() => import('./components/community/DiscussionsView'));
const SavedProjects = lazy(() => import('./components/community/SavedProjects'));
const NotificationsView = lazy(() => import('./components/community/NotificationsView'));
const ProjectPublisher = lazy(() => import('./components/ProjectPublisher'));
const ProjectDetail = lazy(() => import('./components/ProjectDetail'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const MessagingModal = lazy(() => import('./components/messaging/MessagingModal'));

const RouteLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <Loader2 className="text-primary animate-spin" size={28} />
  </div>
);

if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark');
  try { localStorage.setItem('theme', 'dark'); } catch {}
  const faviconLink = document.querySelector("link[rel~='icon']");
  if (faviconLink) faviconLink.href = FAVICON_DATA_URI;
}

/**
 * Root application component.
 * Handles auth state loading, portal persistence, and top-level route definitions.
 */
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
    <MessagingProvider user={user}>
      <BrowserRouter>
        <Suspense fallback={<RouteLoader />}>
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

            {/* ── Community Hub Routes (Figma Spec) ── */}
            <Route path="/hub" element={
              <CommunityLayout user={user} logout={logout}>
                <CommunityFeed user={user} />
              </CommunityLayout>
            } />

            <Route path="/hub/explore" element={
              <CommunityLayout user={user} logout={logout}>
                <ExploreProjects user={user} />
              </CommunityLayout>
            } />

            <Route path="/hub/new" element={
              user ? (
                <CommunityLayout user={user} logout={logout}>
                  <ProjectPublisher user={user} />
                </CommunityLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            <Route path="/hub/project/:projectId" element={
              <CommunityLayout user={user} logout={logout}>
                <ProjectDetail currentUser={user} />
              </CommunityLayout>
            } />

            <Route path="/hub/discussions" element={
              <CommunityLayout user={user} logout={logout}>
                <DiscussionsView user={user} />
              </CommunityLayout>
            } />

            <Route path="/hub/saved" element={
              <CommunityLayout user={user} logout={logout}>
                <SavedProjects user={user} />
              </CommunityLayout>
            } />

            <Route path="/hub/notifications" element={
              <CommunityLayout user={user} logout={logout}>
                <NotificationsView user={user} />
              </CommunityLayout>
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
              <CommunityLayout user={user} logout={logout}>
                <UserProfile currentUser={user} />
              </CommunityLayout>
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
        </Suspense>
        {user && (
          <Suspense fallback={null}>
            <MessagingModal user={user} />
          </Suspense>
        )}
      </BrowserRouter>
    </MessagingProvider>
  );
}

/**
 * Main authenticated dashboard shell.
 * Owns workspace state (Firestore + localStorage dual-persistence),
 * the real-time automation engine, and MQTT connection via useMqtt.
 *
 * @param {{ user: object, logout: function }} props
 */
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

  // Check query params or localStorage fallback for opening a specific tool
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toolParam = params.get('tool');
    if (toolParam) {
      setActiveTool(toolParam);
      setActiveWorkspace(null);
      // Clean query params so refresh doesn't force tab reset
      navigate(location.pathname, { replace: true });
    } else {
      const fb = localStorage.getItem('active_tool_fallback');
      if (fb) {
        setActiveTool(fb);
        setActiveWorkspace(null);
        localStorage.removeItem('active_tool_fallback');
      }
    }
  }, [location, navigate]);

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
    const others = customWorkspaces.filter(ws => ws.id !== 'home' && ws.id !== 'hub');
    return [homeItem, ...others];
  })();

  // Use Firebase UID as the MQTT topic prefix - unique per user
  const { isConnected, messages, deviceStates, lastSeen, publish, userUID, mqttMode, mqttConfig } = useMqtt(user.uid);

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

          console.log(`[Automation] Automation triggered: ${rule.name}. Publishing "${payload}" to "${actionTopic}"`);
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

  // ─── Real-Time MQTT Alert Evaluation Engine ───────────────────────────────────
  const [alertRules, setAlertRules] = useState([]);
  const alertHistoryRef = useRef([]);
  const lastAlertFiredRef = useRef({});
  const lastDirectAlertSeenRef = useRef(0);

  useEffect(() => {
    if (!user?.uid) return;
    const rulesRef = doc(db, 'users', user.uid, 'settings', 'alert_rules');
    const historyRef = doc(db, 'users', user.uid, 'settings', 'alert_history');

    const unsubRules = onSnapshot(
      rulesRef,
      (snap) => setAlertRules(snap.exists() ? (snap.data().list || []) : []),
      (err) => console.error('Failed to listen to alert rules:', err),
    );
    const unsubHistory = onSnapshot(
      historyRef,
      (snap) => {
        alertHistoryRef.current = snap.exists() ? (snap.data().list || []) : [];
      },
      (err) => console.error('Failed to listen to alert history:', err),
    );

    return () => {
      unsubRules();
      unsubHistory();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const appendAlert = (entry) => {
      const nextList = [entry, ...alertHistoryRef.current].slice(0, 50);
      alertHistoryRef.current = nextList;
      setDoc(doc(db, 'users', user.uid, 'settings', 'alert_history'), { list: nextList }).catch((err) => {
        console.error('Failed to record triggered alert:', err);
      });
    };

    const formatTimestamp = () =>
      new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    // A) Evaluate user-configured alert threshold rules against incoming telemetry
    alertRules.forEach((rule) => {
      if (!rule?.active) return;

      const cleanTopic = String(rule.topic || '')
        .replace(new RegExp(`^${userUID}/`), '')
        .replace(/^\/+/, '');
      if (!cleanTopic) return;

      const rawVal = deviceStates[cleanTopic];
      if (rawVal === undefined || rawVal === '') return;

      let op = rule.operator;
      let targetRaw = rule.value;
      if ((!op || targetRaw === undefined) && rule.condition) {
        const match = String(rule.condition).match(/([<>!=]+)\s*(.+)$/);
        if (match) {
          op = match[1].trim();
          targetRaw = match[2].trim();
        }
      }
      if (!op || targetRaw === undefined || targetRaw === '') return;

      const numVal = Number(rawVal);
      const numTarget = Number(targetRaw);
      const bothNumeric = Number.isFinite(numVal) && Number.isFinite(numTarget) && String(rawVal).trim() !== '' && String(targetRaw).trim() !== '';

      let triggered = false;
      if (bothNumeric) {
        if (op === '>') triggered = numVal > numTarget;
        else if (op === '<') triggered = numVal < numTarget;
        else if (op === '=' || op === '==') triggered = numVal === numTarget;
        else if (op === '!=') triggered = numVal !== numTarget;
      } else {
        const left = String(rawVal).trim().toLowerCase();
        const right = String(targetRaw).trim().toLowerCase();
        if (op === '=' || op === '==') triggered = left === right;
        else if (op === '!=') triggered = left !== right;
      }

      if (triggered) {
        const now = Date.now();
        const lastFired = lastAlertFiredRef.current[rule.id] || 0;
        if (now - lastFired > 30000) {
          lastAlertFiredRef.current[rule.id] = now;
          appendAlert({
            id: now + Math.random(),
            type: rule.severity || 'warning',
            msg: `${rule.name}: ${rule.metric || cleanTopic} is ${rawVal} (${rule.condition})`,
            topic: cleanTopic,
            time: formatTimestamp(),
          });
        }
      }
    });

    // B) Listen for direct hardware alerts published to {userUID}/alerts
    const directMsg = deviceStates['alerts'];
    const directTs = lastSeen['alerts'] || 0;
    if (directMsg && String(directMsg).trim() !== '' && directTs > lastDirectAlertSeenRef.current) {
      lastDirectAlertSeenRef.current = directTs;
      const text = String(directMsg).trim();
      let type = 'info';
      if (/^(critical|error|fault)/i.test(text)) type = 'critical';
      else if (/^warn/i.test(text)) type = 'warning';
      else if (/^(ok|success|resolved)/i.test(text)) type = 'success';

      appendAlert({
        id: Date.now() + Math.random(),
        type,
        msg: text,
        topic: 'alerts',
        time: formatTimestamp(),
      });
    }
  }, [deviceStates, lastSeen, alertRules, user?.uid, userUID]);

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
        case 'simulator':   return <SimulatorView deviceStates={deviceStates} publish={publish} messages={messages} userUID={userUID} lastSeen={lastSeen} isConnected={isConnected} mqttMode={mqttMode} mqttConfig={mqttConfig} />;
        case 'devices':     return <NewDevicesView userUID={userUID} lastSeen={lastSeen} deviceStates={deviceStates} />;
        case 'connection':  return <MqttConnectionView userUID={userUID} isConnected={isConnected} mqttMode={mqttMode} mqttConfig={mqttConfig} />;
        case 'automations': return <AutomationsToolView publish={publish} userUID={userUID} />;
        case 'alerts':      return <AlertsView userUID={userUID} />;
        case 'profile':     return <ProfilePage user={user} userUID={userUID} logout={logout} onOpenConnection={() => handleSetTool('connection')} />;
        case 'settings':    return <ProfilePage user={user} userUID={userUID} logout={logout} onOpenConnection={() => handleSetTool('connection')} />; // legacy alias
        case 'developer':   return <DeveloperGuide userUID={user.uid} mqttMode={mqttMode} mqttConfig={mqttConfig} onOpenTool={handleSetTool} />;
        default: return <NewDevicesView userUID={userUID} lastSeen={lastSeen} deviceStates={deviceStates} />;
      }
    }

    const currentWorkspace = customWorkspaces.find(ws => ws.id === activeWorkspace);

    if (currentWorkspace && currentWorkspace.id === 'home') {
      return (
        <HomeView 
          workspaces={customWorkspaces} 
          onAddWorkspace={handleAddWorkspace} 
          setActiveWorkspace={handleSetWorkspace} 
          isConnected={isConnected}
          mqttMode={mqttMode}
          deviceStates={deviceStates}
          automations={automations}
          onOpenTool={handleSetTool}
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
        isConnected={isConnected}
        mqttMode={mqttMode}
        deviceStates={deviceStates}
        automations={automations}
        onOpenTool={handleSetTool}
      />
    );
  };

  const sidebarW = isSidebarCollapsed ? 'w-16' : 'w-64';
  const mainPl = isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64';

  return (
     <div className="relative h-screen bg-background text-foreground flex selection:bg-primary/30 overflow-hidden">


      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-20 md:hidden"
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
          mqttMode={mqttMode}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          customWorkspaces={displayWorkspaces}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(v => !v)}
          onOpenTool={handleSetTool}
        />
        
        <div className={`flex-1 ${activeTool === 'developer' || activeTool === 'simulator' ? 'flex flex-col px-2 md:px-3 pb-2 pt-2 min-h-0 h-full overflow-hidden' : 'p-6 md:p-8 pb-40 overflow-y-auto'}`}>
          <div className={activeTool !== 'developer' && activeTool !== 'simulator' ? 'max-w-7xl mx-auto space-y-6' : 'h-full flex flex-col'}>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={renderContent()} />
              </Routes>
            </Suspense>
          </div>
        </div>

        {activeTool !== 'simulator' && (
          <LiveTerminal messages={messages} isConnected={isConnected} isSidebarCollapsed={isSidebarCollapsed} />
        )}
      </main>
    </div>
  );
}

export default App;
