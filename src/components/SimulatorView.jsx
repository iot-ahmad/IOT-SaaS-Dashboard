import React, { useState, useRef, useEffect } from 'react';
import { 
  CircuitBoard, X, CheckCircle2, Code, Cpu, Layers, Copy, Check, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { SIMULATOR_PROJECTS } from '../data/simulatorProjects';
import TopBar from './simulator/TopBar';
import MoreMenu from './simulator/MoreMenu';
import SimulatorPanel from './simulator/SimulatorPanel';
import DashboardPanel from './simulator/DashboardPanel';

/**
 * Normalizes Wokwi project URL or ID into a clean embeddable iframe URL.
 */
function getWokwiEmbedUrl(rawUrl) {
  if (!rawUrl) return 'https://wokwi.com';
  let trimmed = rawUrl.trim();
  
  if (/^\d+$/.test(trimmed)) {
    return `https://wokwi.com/projects/${trimmed}?embed=1`;
  }
  if (trimmed.includes('embed=1')) {
    return trimmed;
  }
  if (trimmed.includes('?')) {
    return `${trimmed}&embed=1`;
  }
  return `${trimmed}?embed=1`;
}

export default function SimulatorView({ 
  deviceStates = {}, 
  publish, 
  messages = [], 
  userUID = '', 
  lastSeen = {}, 
  isMqttConnected,
  isConnected,
  mqttMode = 'demo',
  mqttConfig = {}
}) {
  const containerRef = useRef(null);
  const moreMenuButtonRef = useRef(null);

  // MQTT Connection State
  const mqttOnline = isMqttConnected ?? isConnected ?? true;

  // Selected Project State
  const [selectedProjectId, setSelectedProjectId] = useState('empty');
  const isCustomProject = selectedProjectId === 'empty';
  const activeProject = SIMULATOR_PROJECTS.find(p => p.id === selectedProjectId) || SIMULATOR_PROJECTS[0];

  const blankWokwiUrl = 'https://wokwi.com/projects/new/esp32';
  const [wokwiUrlInput, setWokwiUrlInput] = useState(blankWokwiUrl);
  const [activeWokwiUrl, setActiveWokwiUrl] = useState(blankWokwiUrl);
  const [iframeKey, setIframeKey] = useState(0);

  // View mode: 'circuit' (sim) | 'split' | 'dashboard' (dash) - Default is 'split'
  const [viewMode, setViewMode] = useState('split');
  const [orientation, setOrientation] = useState('vertical');

  // Active panel inside Dashboard card
  const [activePanel, setActivePanel] = useState('controller');

  // UI States
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showPlayHint, setShowPlayHint] = useState(() => {
    return localStorage.getItem('iot365_sim_hint_dismissed') !== 'true';
  });

  // Modal State
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [modalTab, setModalTab] = useState('code');
  const [useAccountUid, setUseAccountUid] = useState(true);
  const [includePrivateCreds, setIncludePrivateCreds] = useState(false);

  // Copy confirmations
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDiagram, setCopiedDiagram] = useState(false);
  const [copiedLibraries, setCopiedLibraries] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullScreen = async () => {
    if (!isFullScreen) {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.warn('Native fullscreen request failed:', err);
      }
      setIsFullScreen(true);
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn('Native exit fullscreen failed:', err);
      }
      setIsFullScreen(false);
    }
  };

  const copyUid = () => {
    if (userUID) {
      navigator.clipboard.writeText(userUID);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const dismissPlayHint = () => {
    setShowPlayHint(false);
    localStorage.setItem('iot365_sim_hint_dismissed', 'true');
  };

  const handleSelectProjectId = (projectId) => {
    setSelectedProjectId(projectId);
    if (projectId === 'empty') {
      setWokwiUrlInput(blankWokwiUrl);
      setActiveWokwiUrl(blankWokwiUrl);
      setIframeKey(k => k + 1);
    } else {
      const proj = SIMULATOR_PROJECTS.find(p => p.id === projectId);
      if (proj?.wokwiUrl) {
        setWokwiUrlInput(proj.wokwiUrl);
        setActiveWokwiUrl(proj.wokwiUrl);
        setIframeKey(k => k + 1);
      }
    }
  };

  const handleApplyUrl = (e) => {
    e?.preventDefault();
    if (wokwiUrlInput.trim()) {
      setActiveWokwiUrl(wokwiUrlInput.trim());
      setIframeKey(k => k + 1);
      setShowMoreMenu(false);
    }
  };

  const handleResetDefault = () => {
    const defaultUrl = isCustomProject ? blankWokwiUrl : (activeProject.wokwiUrl || blankWokwiUrl);
    setWokwiUrlInput(defaultUrl);
    setActiveWokwiUrl(defaultUrl);
    setIframeKey(k => k + 1);
  };

  const currentUidParam = useAccountUid ? (userUID || '') : '';
  const currentCode = activeProject.sketchCode(currentUidParam, {
    host: mqttConfig?.host,
    tlsPort: mqttConfig?.tlsPort,
    username: mqttConfig?.username,
    password: mqttConfig?.password,
    includeCredentials: mqttMode === 'private' && includePrivateCreds,
  });

  const copyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyDiagram = () => {
    navigator.clipboard.writeText(activeProject.diagramJson);
    setCopiedDiagram(true);
    setTimeout(() => setCopiedDiagram(false), 2000);
  };

  const copyLibraries = () => {
    navigator.clipboard.writeText(activeProject.libraries);
    setCopiedLibraries(true);
    setTimeout(() => setCopiedLibraries(false), 2000);
  };

  const embedUrl = getWokwiEmbedUrl(activeWokwiUrl);
  const defaultUrl = isCustomProject ? blankWokwiUrl : (activeProject.wokwiUrl || blankWokwiUrl);
  const isDefaultUrl = activeWokwiUrl === defaultUrl;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col w-full overflow-hidden transition-all duration-150 relative ${
        isFullScreen 
          ? 'fixed inset-0 z-[9999] bg-zinc-950 p-3 h-screen w-screen' 
          : 'h-full min-h-0 gap-3'
      }`}
    >
      {/* ── A) Single Consolidated Top Bar ── */}
      <div className="relative">
        <TopBar
          selectedProjectId={selectedProjectId}
          onSelectProjectId={handleSelectProjectId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          mqttOnline={mqttOnline}
          isFullScreen={isFullScreen}
          onToggleFullScreen={toggleFullScreen}
          onToggleMoreMenu={() => setShowMoreMenu(v => !v)}
          showMoreMenu={showMoreMenu}
          moreMenuButtonRef={moreMenuButtonRef}
        />

        {/* ── B) "⋯" Popover ── */}
        <MoreMenu
          isOpen={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
          wokwiUrlInput={wokwiUrlInput}
          setWokwiUrlInput={setWokwiUrlInput}
          onApplyUrl={handleApplyUrl}
          onResetDefault={handleResetDefault}
          isDefaultUrl={isDefaultUrl}
          activeWokwiUrl={activeWokwiUrl}
          userUID={userUID}
          copiedUid={copiedUid}
          onCopyUid={copyUid}
          onReloadIframe={() => setIframeKey(k => k + 1)}
          isCustomProject={isCustomProject}
          onOpenModal={() => setShowProjectsModal(true)}
          buttonRef={moreMenuButtonRef}
        />
      </div>

      {/* ── C & D) Workspace Panels ── */}
      <main className={`flex-1 min-h-0 w-full flex ${
        viewMode === 'split' 
          ? (orientation === 'vertical' ? 'flex-col lg:flex-row' : 'flex-col') 
          : 'flex-col'
      } gap-3 relative overflow-hidden`}>
        
        {/* Simulator Card */}
        <SimulatorPanel
          viewMode={viewMode}
          orientation={orientation}
          isCustomProject={isCustomProject}
          activeProject={activeProject}
          embedUrl={embedUrl}
          iframeKey={iframeKey}
          copiedCode={copiedCode}
          onCopyCode={copyCode}
          showPlayHint={showPlayHint}
          onDismissPlayHint={dismissPlayHint}
        />

        {/* Dashboard Card */}
        <DashboardPanel
          viewMode={viewMode}
          orientation={orientation}
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          isCustomProject={isCustomProject}
          activeProject={activeProject}
          selectedProjectId={selectedProjectId}
          deviceStates={deviceStates}
          publish={publish}
          messages={messages}
          userUID={userUID}
          lastSeen={lastSeen}
          mqttOnline={mqttOnline}
          mqttMode={mqttMode}
          mqttConfig={mqttConfig}
          includePrivateCreds={includePrivateCreds}
          onToggleIncludeCreds={() => setIncludePrivateCreds(v => !v)}
          onOpenModal={() => setShowProjectsModal(true)}
          copiedCode={copiedCode}
          onCopyCode={copyCode}
          currentCode={currentCode}
          onSelectProjectId={handleSelectProjectId}
        />
      </main>

      {/* ── Ready Projects & Wiring Modal ── */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowProjectsModal(false)} 
          />
          <div className="relative bg-zinc-900 border border-white/15 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-foreground">
            
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-zinc-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
                  <CircuitBoard size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    Simulator Project Library — Code &amp; Circuit Wiring
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Ready-to-use firmware sketches and wiring diagrams to copy directly into Wokwi
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowProjectsModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 bg-zinc-800/20 overflow-x-auto shrink-0">
              {SIMULATOR_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleSelectProjectId(proj.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border cursor-pointer ${
                    selectedProjectId === proj.id
                      ? 'bg-zinc-800 border-white/20 text-foreground shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-foreground'
                  }`}
                >
                  <span>{proj.title.split('(')[0].trim()}</span>
                  {selectedProjectId === proj.id && <CheckCircle2 size={12} className="text-emerald-400" />}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between px-5 py-2 border-b border-white/10 bg-zinc-900 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalTab('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modalTab === 'code' ? 'bg-zinc-800 border border-white/10 text-foreground' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  <Code size={14} />
                  <span>sketch.ino Code</span>
                </button>
                <button
                  onClick={() => setModalTab('wiring')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modalTab === 'wiring' ? 'bg-zinc-800 border border-white/10 text-foreground' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  <Cpu size={14} />
                  <span>Wiring Diagram</span>
                </button>
                <button
                  onClick={() => setModalTab('libraries')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    modalTab === 'libraries' ? 'bg-zinc-800 border border-white/10 text-foreground' : 'text-zinc-400 hover:text-foreground'
                  }`}
                >
                  <Layers size={14} />
                  <span>Libraries (libraries.txt)</span>
                </button>
              </div>

              {modalTab === 'code' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">UID in code:</span>
                  <button
                    onClick={() => setUseAccountUid(v => !v)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold border border-white/10 bg-zinc-800 text-foreground cursor-pointer"
                  >
                    {useAccountUid ? `✓ My Account (${userUID?.slice(0, 6)}...)` : 'Blank Template ("")'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs scrollbar-thin">
              {modalTab === 'code' && (
                <div className="space-y-3">
                  {/* TLS & Credentials Security Banner */}
                  <div className={`rounded-xl p-3 border text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    mqttMode === 'private'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      {mqttMode === 'private' ? <ShieldCheck size={15} className="shrink-0 mt-0.5" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                      <span>
                        {mqttMode === 'private'
                          ? `TLS certificate verification (${mqttConfig?.caName || 'Root CA'}) + NTP sync + unique Client ID enabled with ${mqttConfig?.provisionedBy === 'emqx_auto' ? 'auto-isolated EMQX account' : 'your private broker'}. Click "Include My MQTT Credentials" to copy ready-to-run code.`
                          : `TLS certificate verification (${mqttConfig?.caName || 'Root CA'}) + unique Client ID enabled. Credentials are masked with placeholders for security — enable a private broker or auto-provisioning in Profile & Settings → Security.`}
                      </span>
                    </div>
                    {mqttMode === 'private' && (
                      <button
                        type="button"
                        onClick={() => setIncludePrivateCreds(v => !v)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900/70 hover:bg-zinc-900 border border-white/10 text-foreground font-semibold shrink-0 cursor-pointer"
                      >
                        {includePrivateCreds ? 'Mask Password (Placeholders)' : 'Include My MQTT Credentials'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Complete ESP32 C++ Code:</span>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold shadow cursor-pointer"
                    >
                      {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-white/10 max-h-[440px] leading-relaxed scrollbar-thin select-all">
                    {currentCode}
                  </pre>
                </div>
              )}

              {modalTab === 'wiring' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-zinc-800/40 border border-white/10 rounded-xl p-3">
                    <p className="text-zinc-300 text-xs">Copy <code>diagram.json</code> and paste it into Wokwi to wire all components automatically:</p>
                    <button
                      onClick={copyDiagram}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground border border-white/10 font-bold shadow cursor-pointer shrink-0"
                    >
                      {copiedDiagram ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedDiagram ? 'Copied!' : 'Copy diagram.json'}</span>
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-800 text-zinc-400 font-semibold border-b border-white/10">
                        <tr>
                          <th className="p-2.5">Component</th>
                          <th className="p-2.5">Pin</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">MQTT Topic</th>
                          <th className="p-2.5">Function</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {activeProject.pinouts.map((po, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/30">
                            <td className="p-2.5 font-sans font-medium text-foreground">{po.component}</td>
                            <td className="p-2.5 text-foreground font-bold">{po.pin}</td>
                            <td className="p-2.5 font-sans text-zinc-400">{po.type}</td>
                            <td className="p-2.5 text-zinc-400">{po.topic}</td>
                            <td className="p-2.5 font-sans text-zinc-400">{po.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {modalTab === 'libraries' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-sm">Required Libraries (libraries.txt):</h4>
                    <button
                      onClick={copyLibraries}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground border border-white/10 font-bold shadow cursor-pointer"
                    >
                      {copiedLibraries ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedLibraries ? 'Copied!' : 'Copy Libraries'}</span>
                    </button>
                  </div>
                  <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-white/10">
                    {activeProject.libraries}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-zinc-800/40 shrink-0">
              <span className="text-xs text-zinc-400 font-mono">
                Project: <strong className="text-foreground">{activeProject.title.split('(')[0].trim()}</strong>
              </span>
              <button 
                onClick={() => setShowProjectsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs font-bold text-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
