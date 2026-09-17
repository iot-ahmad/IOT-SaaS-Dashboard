import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, LayoutGrid, Cpu, ExternalLink, RefreshCw, 
  Terminal, Gamepad2, Settings, HelpCircle, Code, Copy, Check, 
  Maximize2, Minimize2, Rows, PanelRightClose, PanelLeftClose, Play, Shield, ChevronUp, ChevronDown, X,
  Sparkles, Download, Layers, BookOpen, CheckCheck, FileCode, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/neon-button';
import UniversalController from './UniversalController';
import { DevicesView, LiveTerminal } from './ToolViews';
import NewDevicesView from './DevicesView';
import { SIMULATOR_PROJECTS } from '../data/simulatorProjects';

/**
 * Normalizes Wokwi project URL or ID into a clean embeddable iframe URL.
 */
function getWokwiEmbedUrl(rawUrl) {
  if (!rawUrl) return 'https://wokwi.com';
  let trimmed = rawUrl.trim();
  
  if (/^\d+$/.test(trimmed)) {
    return `https://wokwi.com${trimmed}?embed=1`;
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
  deviceStates, 
  publish, 
  messages, 
  userUID, 
  lastSeen, 
  initialWokwiUrl = 'https://wokwi.com' 
}) {
  const containerRef = useRef(null);
  
  // Selected Project State: 'empty' by default (blank canvas) or one of SIMULATOR_PROJECTS
  const [selectedProjectId, setSelectedProjectId] = useState('empty');
  const isCustomProject = selectedProjectId === 'empty';
  const activeProject = SIMULATOR_PROJECTS.find(p => p.id === selectedProjectId) || SIMULATOR_PROJECTS[0];

  const blankWokwiUrl = 'https://wokwi.com/projects/new/esp32';
  const [wokwiUrlInput, setWokwiUrlInput] = useState(blankWokwiUrl);
  const [activeWokwiUrl, setActiveWokwiUrl] = useState(blankWokwiUrl);
  const [iframeKey, setIframeKey] = useState(0);
  
  // View mode: 'split' | 'circuit' | 'dashboard'
  const [viewMode, setViewMode] = useState('split');
  
  // Split orientation: 'vertical' (side-by-side) | 'horizontal' (top-bottom)
  const [orientation, setOrientation] = useState('vertical');
  
  // Right panel view: 'controller' | 'devices' | 'terminal' | 'guide' | 'projects'
  const [activePanel, setActivePanel] = useState('controller');

  // Full Screen & UI compact states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUidBanner, setShowUidBanner] = useState(false);
  const [showPlayHint, setShowPlayHint] = useState(true);

  // Ready Projects Modal State
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [modalTab, setModalTab] = useState('code'); // 'code' | 'wiring' | 'libraries' | 'guide'
  
  // UID injection toggle: default false (empty UID as requested by user)
  const [useAccountUid, setUseAccountUid] = useState(false);

  // Copy feedback states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDiagram, setCopiedDiagram] = useState(false);
  const [copiedLibraries, setCopiedLibraries] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
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
        console.warn('Native fullscreen request failed, using CSS full screen:', err);
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

  const handleSelectProject = (project) => {
    if (!project) return;
    handleSelectProjectId(project.id);
  };

  const handleApplyUrl = (e) => {
    e?.preventDefault();
    if (wokwiUrlInput.trim()) {
      setActiveWokwiUrl(wokwiUrlInput.trim());
      setIframeKey(k => k + 1);
    }
  };

  const handleResetDefault = () => {
    const defaultUrl = isCustomProject ? blankWokwiUrl : (activeProject.wokwiUrl || blankWokwiUrl);
    setWokwiUrlInput(defaultUrl);
    setActiveWokwiUrl(defaultUrl);
    setIframeKey(k => k + 1);
  };

  const handleReloadIframe = () => {
    setIframeKey(k => k + 1);
  };

  // Get current active code (with empty UID or user UID)
  const currentUidParam = useAccountUid ? (userUID || '') : '';
  const currentCode = activeProject.sketchCode(currentUidParam);

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

  const downloadFile = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const embedUrl = getWokwiEmbedUrl(activeWokwiUrl);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col w-full overflow-hidden transition-all duration-300 ${
        isFullScreen 
          ? 'fixed inset-0 z-[9999] bg-slate-950 p-2 h-screen w-screen' 
          : 'h-full min-h-0 gap-2'
      }`}
    >
      
      {/* ── Control Header Toolbar ── */}
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-2 sm:p-2.5 flex flex-col gap-2 shrink-0 shadow-md">
        
        {/* Row 1: Presets Quick Dropdown Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
              <Layers size={14} />
              <span>مشروع المحاكاة:</span>
            </div>

            {/* Dropdown Menu */}
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProjectId(e.target.value)}
              className="bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer shadow-sm min-w-[220px]"
            >
              <option value="empty">✨ مشروع جديد فارغ (Custom / Blank)</option>
              <optgroup label="── مشاريع محاكاة جاهزة للتعلم والاختبار ──">
                {SIMULATOR_PROJECTS.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.title}
                  </option>
                ))}
              </optgroup>
            </select>

            {!isCustomProject && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {activeProject.badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCustomProject && (
              <button
                onClick={() => setShowProjectsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-opacity shrink-0"
              >
                <Sparkles size={13} />
                <span>الكود ومخطط التوصيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Main Toolbar Line */}
        <div className="flex flex-wrap items-center justify-between gap-2">

          {/* URL Form & Actions */}
          <form onSubmit={handleApplyUrl} className="flex flex-1 items-center gap-1.5 min-w-[260px]">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
              <Cpu size={14} />
              <span className="hidden sm:inline">رابط المحاكي:</span>
            </div>

            <input 
              type="text"
              value={wokwiUrlInput}
              onChange={(e) => setWokwiUrlInput(e.target.value)}
              placeholder="أدخل رابط Wokwi أو Project ID..."
              className="flex-1 bg-muted/70 border border-border focus:border-primary/50 text-xs rounded-lg px-2.5 py-1 outline-none font-mono text-foreground truncate min-w-[110px]"
            />

            <Button type="submit" size="sm" className="shrink-0 text-xs px-2.5 py-1 h-auto font-semibold">
              تحديث
            </Button>

            {activeWokwiUrl !== (isCustomProject ? blankWokwiUrl : (activeProject?.wokwiUrl || blankWokwiUrl)) && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-muted-foreground hover:text-primary underline px-1 shrink-0"
                title="إعادة لرابط المشروع الأصلي"
              >
                الافتراضي
              </button>
            )}

            <a 
              href={activeWokwiUrl.includes('http') ? activeWokwiUrl : `https://wokwi.com/projects/${activeWokwiUrl}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="فتح في Wokwi بتبويب جديد"
            >
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={handleReloadIframe}
              className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="إعادة تحميل المحاكي"
            >
              <RefreshCw size={13} />
            </button>
          </form>

          {/* Controls & Full Screen Button */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">

            {/* View Mode Switcher */}
            <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'split' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="تجزئة الشاشة"
              >
                <Columns size={13} />
                <span className="hidden md:inline">تجزئة</span>
              </button>

              <button
                onClick={() => setViewMode('circuit')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'circuit' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="المحاكي فقط"
              >
                <Cpu size={13} />
                <span className="hidden sm:inline">المحاكي</span>
              </button>

              <button
                onClick={() => setViewMode('dashboard')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'dashboard' 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="اللوحة فقط"
              >
                <Gamepad2 size={13} />
                <span className="hidden sm:inline">اللوحة</span>
              </button>
            </div>

            {/* Orientation switch if split */}
            {viewMode === 'split' && (
              <button
                onClick={() => setOrientation(o => o === 'vertical' ? 'horizontal' : 'vertical')}
                className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-colors"
                title={orientation === 'vertical' ? 'تبديل للتقسيم الأفقي' : 'تبديل للتقسيم العمودي'}
              >
                {orientation === 'vertical' ? <Rows size={14} /> : <Columns size={14} />}
              </button>
            )}

            {/* Right Panel Switcher */}
            {viewMode !== 'circuit' && (
              <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border">
                <button
                  onClick={() => setActivePanel('controller')}
                  className={`p-1 rounded-md transition-all ${
                    activePanel === 'controller' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="لوحة التحكم"
                >
                  <Gamepad2 size={14} />
                </button>
                <button
                  onClick={() => setActivePanel('devices')}
                  className={`p-1 rounded-md transition-all ${
                    activePanel === 'devices' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="الأجهزة والحساسات"
                >
                  <Cpu size={14} />
                </button>
                <button
                  onClick={() => setActivePanel('terminal')}
                  className={`p-1 rounded-md transition-all ${
                    activePanel === 'terminal' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="سجل الإشارات (Terminal)"
                >
                  <Terminal size={14} />
                </button>
                <button
                  onClick={() => setActivePanel('guide')}
                  className={`p-1 rounded-md transition-all ${
                    activePanel === 'guide' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="كود Wokwi والتوصيل"
                >
                  <Code size={14} />
                </button>
              </div>
            )}

            {/* Full Screen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all shrink-0 border ${
                isFullScreen
                  ? 'bg-muted border-border text-foreground/70 hover:bg-muted/80 shadow-sm'
                  : 'bg-primary text-primary-foreground border-primary hover:opacity-90 shadow-md'
              }`}
              title={isFullScreen ? 'الخروج من ملء الشاشة' : 'توسيع الشاشة بالكامل (Full Screen)'}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullScreen ? 'خروج' : 'ملء الشاشة ⛶'}</span>
            </button>

            {/* UID Info Toggle */}
            {userUID && (
              <button
                type="button"
                onClick={() => setShowUidBanner(v => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  showUidBanner 
                    ? 'bg-primary/15 border-primary/30 text-primary' 
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
                title="إظهار/إخفاء UID الحساب"
              >
                <span>UID</span>
                {showUidBanner ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}

          </div>
        </div>

        {/* UID Notice Banner */}
        {userUID && showUidBanner && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5 text-xs w-full animate-fadeIn">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="font-bold text-primary">UID الحساب:</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="flex-1 bg-muted border border-border text-foreground font-mono text-[11px] px-2 py-0.5 rounded truncate select-all">
                {userUID}
              </code>
              <button
                onClick={copyUid}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] shrink-0 transition-all ${
                  copiedUid
                    ? 'bg-white/10 border border-white/20 text-white/70'
                    : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {copiedUid ? <Check size={11} /> : <Copy size={11} />}
                {copiedUid ? 'تم النسخ' : 'نسخ'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Main Split View Container ── */}
      <div className={`flex-1 min-h-0 w-full flex ${
        viewMode === 'split' 
          ? (orientation === 'vertical' ? 'flex-col lg:flex-row' : 'flex-col') 
          : 'flex-col'
      } gap-2 relative overflow-hidden`}>
        
        {/* Pane 1: Wokwi Circuit Simulator */}
        {(viewMode === 'split' || viewMode === 'circuit') && (
          <div className={`relative flex flex-col bg-card text-card-foreground backdrop-blur-md border border-border rounded-xl overflow-hidden shadow-xl ${
            viewMode === 'circuit' 
              ? 'w-full h-full' 
              : (orientation === 'vertical' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-1/2')
          }`}>
            {/* Header info badge inside pane */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40 text-xs shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold truncate">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                <span className="truncate">محاكي Wokwi: {activeProject.title.split('(')[0]}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {activeProject.badge}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowProjectsModal(true)}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  عرض الكود والتوصيل
                </button>
                <a
                  href={activeWokwiUrl.includes('http') ? activeWokwiUrl : `https://wokwi.com/projects/${activeWokwiUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-muted-foreground hover:text-foreground underline hidden sm:inline"
                >
                  فتح في Wokwi ↗
                </a>
              </div>
            </div>

            {/*  Play Hint Banner */}
            {showPlayHint && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/60 border-b border-border shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 border border-primary/30 shrink-0 animate-pulse">
                    <Play size={11} className="text-primary fill-primary ml-0.5" />
                  </span>
                  <p className="text-foreground/70 font-bold text-xs truncate">
                    اضغط "Play" الأخضر داخل المحاكي لتشغيل الحساسات وبث القراءات فورياً
                  </p>
                </div>
                <button 
                  onClick={() => setShowPlayHint(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                  title="إغلاق التنبيه"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {/* Embed iframe */}
            <div className="flex-1 w-full h-full bg-black/90 relative">
              <iframe
                key={iframeKey}
                src={embedUrl}
                title="Wokwi ESP32 Simulator"
                className="w-full h-full border-0"
                allow="autoplay; camera; microphone; geolocation; clipboard-read; clipboard-write"
              />
            </div>
          </div>
        )}

        {/* Pane 2: IoT Dashboard / Devices / Terminal Pane */}
        {(viewMode === 'split' || viewMode === 'dashboard') && (
          <div className={`relative flex flex-col bg-card text-card-foreground backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-xl ${
            viewMode === 'dashboard' 
              ? 'w-full h-full' 
              : (orientation === 'vertical' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-1/2')
          }`}>
            
            {/* Pane Sub-header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 text-xs shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                {activePanel === 'controller' && <Gamepad2 size={14} className="text-primary" />}
                {activePanel === 'devices' && <Cpu size={14} className="text-primary" />}
                {activePanel === 'terminal' && <Terminal size={14} className="text-primary" />}
                {activePanel === 'guide' && <Code size={14} className="text-primary" />}
                <span>
                  {activePanel === 'controller' && 'لوحة التحكم التفاعلية'}
                  {activePanel === 'devices' && 'الأجهزة المتصلة والحساسات'}
                  {activePanel === 'terminal' && 'سجل الرسائل والإشارات الحية'}
                  {activePanel === 'guide' && 'كود المحاكي ومخطط التوصيل'}
                </span>
              </div>

              {/* Selector inside pane header */}
              <div className="flex items-center gap-1 text-[11px]">
                <button 
                  onClick={() => setActivePanel('controller')}
                  className={`px-2 py-0.5 rounded transition-all ${activePanel === 'controller' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  اللوحة
                </button>
                <button 
                  onClick={() => setActivePanel('devices')}
                  className={`px-2.5 py-0.5 rounded transition-all ${activePanel === 'devices' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  الأجهزة
                </button>
                <button 
                  onClick={() => setActivePanel('terminal')}
                  className={`px-2 py-0.5 rounded transition-all ${activePanel === 'terminal' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  التيرمنال
                </button>
                <button 
                  onClick={() => setActivePanel('guide')}
                  className={`px-2 py-0.5 rounded transition-all ${activePanel === 'guide' ? 'bg-primary/20 text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  الكود والتوصيل
                </button>
              </div>
            </div>

            {/* Live Telemetry Sensor Bar */}
            {Object.keys(deviceStates || {}).length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 border-b border-primary/15 text-[11px] overflow-x-auto scrollbar-none shrink-0 font-mono">
                <span className="flex items-center gap-1.5 text-primary font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  بث الحساسات الحي:
                </span>
                {Object.entries(deviceStates).map(([top, val]) => (
                  <span key={top} className="px-2 py-0.5 rounded-md bg-background/80 border border-border text-foreground/70 shrink-0 shadow-sm">
                    <span className="text-muted-foreground">{top.split('/').pop()}: </span>
                    <span className="font-bold">{val}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Pane Content */}
            <div className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-4">
              {activePanel === 'controller' && (
                <UniversalController
                  key={`ctrl_${selectedProjectId}`}
                  deviceStates={deviceStates}
                  publish={publish}
                  storageScopeId={`${userUID || 'guest'}_wokwi_${selectedProjectId}`}
                  userUID={userUID}
                  initialWidgets={isCustomProject ? [] : activeProject.widgets}
                  customTitle={isCustomProject ? 'لوحة تحكم فارغة (ابدأ بإضافة أدواتك)' : `لوحة مشروع: ${activeProject.title.split('(')[0]}`}
                />
              )}

              {/* Show hint banner at the top of controller panel if no data */}
              {activePanel === 'controller' && Object.keys(deviceStates || {}).length === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border mb-3 -mt-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/25 shrink-0 animate-pulse">
                    <Play size={14} className="text-primary fill-primary ml-0.5" />
                  </span>
                  <div>
                    <p className="text-foreground/70 font-bold text-xs">في انتظار تشغيل المحاكي وبث الحساسات...</p>
                    <p className="text-muted-foreground text-[10px] mt-0.5">اضغط ▶ Play الأخضر داخل المحاكي على اليسار — ستظهر القراءات الحية في هذه اللوحة فوراً</p>
                  </div>
                </div>
              )}

              {activePanel === 'devices' && (
                <div className="space-y-4">
                  {/* Active Project Preset Devices Live Monitor */}
                  {!isCustomProject && (
                    <div className="bg-card/60 backdrop-blur-md border border-border rounded-xl p-3 sm:p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border/60 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Cpu className="text-primary" size={16} />
                          <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
                            أجهزة وحساسات مشروع: {activeProject.title.split('(')[0]}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {activeProject.presetDevices?.length || 0} أجهزة
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          قراءات حية واختبار مباشر عبر MQTT
                        </span>
                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {(activeProject.presetDevices || []).map(dev => {
                        const liveVal = deviceStates?.[dev.topic];
                        const hasVal = liveVal !== undefined && liveVal !== null && liveVal !== '';
                        const isActuator = dev.type === 'Actuator';
                        
                        return (
                          <div 
                            key={dev.id} 
                            className={`p-2.5 rounded-xl border transition-all ${
                              hasVal 
                                ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                : 'bg-muted/40 border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${hasVal ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                                  <h5 className="font-bold text-xs text-foreground truncate" title={dev.name}>{dev.name}</h5>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono">
                                  <span className="bg-background/80 px-1.5 py-0.5 rounded border border-border/50">{dev.pin}</span>
                                  <span className="truncate" title={dev.topic}>{dev.topic}</span>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-white/[0.06] text-white/50 border border-white/[0.08]">
                                {dev.type}
                              </span>
                            </div>

                            {/* Value display */}
                            <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-muted-foreground">القيمة الحالية:</span>
                              {hasVal ? (
                                <span className="font-mono font-bold text-sm text-primary">
                                  {liveVal} {dev.unit && dev.unit !== 'State' ? dev.unit : ''}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/60 italic">في انتظار البيانات...</span>
                              )}
                            </div>

                            {/* Quick Action Button for Actuators */}
                            {isActuator && (
                              <div className="mt-2 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => publish(dev.topic, 'ON')}
                                  className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all active:scale-95"
                                >
                                  تشغيل ON
                                </button>
                                <button
                                  type="button"
                                  onClick={() => publish(dev.topic, 'OFF')}
                                  className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground border border-border transition-all active:scale-95"
                                >
                                  إطفاء OFF
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                  {/* User's custom saved devices view */}
                  <NewDevicesView
                    userUID={userUID}
                    lastSeen={lastSeen}
                    deviceStates={deviceStates}
                  />
                </div>
              )}

              {activePanel === 'terminal' && (
                <div className="h-full flex flex-col gap-2">
                  <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground">
                    ⚡ تعرض هذه الشاشة جميع الإشارات المتبادلة بين لوحة التحكم ومحاكي Wokwi في الوقت الفعلي عبر بروتوكول MQTT.
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <LiveTerminal messages={messages} isConnected={true} />
                  </div>
                </div>
              )}

              {activePanel === 'guide' && (
                <div className="space-y-4 text-xs">
                  
                  {isCustomProject ? (
                    <div className="bg-muted/40 border border-border rounded-xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
                        <Code size={24} />
                      </div>
                      <h4 className="font-bold text-foreground text-sm">مساحة عمل محاكاة فارغة / مخصصة</h4>
                      <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
                        أنت الآن تعمل على محاكي فارغ. يمكنك برمجة دائرتك الخاصة وتوصيل حساساتك المخصصة، أو اختيار أي من المشاريع الجاهزة من القائمة المنسدلة بالأعلى لتوليد الكود ومخطط التوصيل فوراً.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectProjectId('all-in-one')}
                          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm transition-all"
                        >
                          تجربة المحطة الشاملة الجاهزة 🌟
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Project Info Header */}
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            {activeProject.badge}
                          </span>
                          <button
                            onClick={() => setShowProjectsModal(true)}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <Sparkles size={13} />
                            فتح النافذة التفصيلية الكاملة
                          </button>
                        </div>
                        <h4 className="font-extrabold text-sm text-foreground mt-1">
                          {activeProject.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {activeProject.description}
                        </p>
                      </div>

                  {/* UID Toggle Bar */}
                  <div className="bg-muted/50 border border-border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">تضمين الـ UID في الكود:</span>
                      <span className="text-[10px] text-muted-foreground">
                        {useAccountUid ? `(مضمن: ${userUID})` : '(فارغ "" للاستبدال لاحقاً)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUseAccountUid(false)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          !useAccountUid ? 'bg-primary text-primary-foreground font-bold shadow' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        قالب فارغ ("")
                      </button>
                      <button
                        onClick={() => setUseAccountUid(true)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          useAccountUid ? 'bg-primary text-primary-foreground font-bold shadow' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        تعبئة UID حسابي تلقائياً
                      </button>
                    </div>
                  </div>

                  {/* Code Actions & Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">كود C++ / Arduino جاهز للنسخ:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyCode}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow"
                        >
                          {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                          {copiedCode ? 'تم نسخ الكود!' : 'نسخ الكود'}
                        </button>
                        <button
                          onClick={copyDiagram}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted border border-border hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors"
                        >
                          {copiedDiagram ? <Check size={13} /> : <Copy size={13} />}
                          {copiedDiagram ? 'تم نسخ diagram.json!' : 'نسخ diagram.json'}
                        </button>
                      </div>
                    </div>

                    <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-border max-h-[350px] scrollbar-thin">
                      {currentCode}
                    </pre>
                  </div>

                  {/* Pinout Table */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-foreground">جدول توصيل الحساسات والمشغلات (Pinout Mapping):</h5>
                    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="p-2">القطعة الإلكترونية</th>
                            <th className="p-2">المنفذ (Pin)</th>
                            <th className="p-2">موضوع الـ MQTT</th>
                            <th className="p-2">الوصف</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-[11px]">
                          {activeProject.pinouts.map((po, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-2 font-sans font-medium text-foreground">{po.component}</td>
                              <td className="p-2 text-primary font-bold">{po.pin}</td>
                              <td className="p-2 text-primary/80">{po.topic}</td>
                              <td className="p-2 font-sans text-muted-foreground">{po.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ── Ready Projects & Wiring Modal ── */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowProjectsModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fadeIn text-white">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40 shrink-0 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    مكتبة مشاريع المحاكي — الكود والتوصيل الإلكتروني
                  </h3>
                  <p className="text-[11px] text-white/70">
                    مشاريع جاهزة ومكتملة من الأكواد والتوصيلات لنسخها فوراً إلى Wokwi
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowProjectsModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Project Switcher in Modal */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/20 overflow-x-auto shrink-0">
              {SIMULATOR_PROJECTS.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => handleSelectProject(proj)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border ${
                    selectedProjectId === proj.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/70 hover:bg-muted border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{proj.title.split('(')[0]}</span>
                  {selectedProjectId === proj.id && <CheckCircle2 size={12} />}
                </button>
              ))}
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center justify-between px-5 py-2 border-b border-border bg-card text-xs shrink-0 text-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalTab('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    modalTab === 'code' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <FileCode size={14} />
                  <span>كود sketch.ino</span>
                </button>
                <button
                  onClick={() => setModalTab('wiring')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    modalTab === 'wiring' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Cpu size={14} />
                  <span>مخطط التوصيل (diagram.json & Pinouts)</span>
                </button>
                <button
                  onClick={() => setModalTab('libraries')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    modalTab === 'libraries' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Layers size={14} />
                  <span>المكتبات (libraries.txt)</span>
                </button>
                <button
                  onClick={() => setModalTab('guide')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    modalTab === 'guide' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>دليل التشغيل 🚀</span>
                </button>
              </div>

              {/* UID Toggle inside modal */}
              {modalTab === 'code' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground hidden sm:inline">الـ UID بالكود:</span>
                  <button
                    onClick={() => setUseAccountUid(v => !v)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      useAccountUid
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {useAccountUid ? `✓ حسابي (${userUID?.slice(0, 6)}...)` : 'قالب فارغ ("")'}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs scrollbar-thin text-white">
              
              {/* TAB 1: Code */}
              {modalTab === 'code' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">كود C++ كامل للـ ESP32:</span>
                      <span className="text-muted-foreground text-[11px]">
                        {useAccountUid ? '• تم دمج الـ UID الحالي في الكود' : '• خانة الـ USER_UID فارغة جاهزة للصق أي معرّف'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 shadow"
                      >
                        {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                        {copiedCode ? 'تم النسخ!' : 'نسخ الكود'}
                      </button>
                      <button
                        onClick={() => downloadFile('sketch.ino', currentCode)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 text-foreground font-semibold"
                      >
                        <Download size={13} />
                        <span>تحميل sketch.ino</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-border max-h-[440px] leading-relaxed scrollbar-thin select-all">
                    {currentCode}
                  </pre>
                </div>
              )}

              {/* TAB 2: Wiring & Diagram JSON */}
              {modalTab === 'wiring' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">مخطط التوصيل الكامل (Wokwi Diagram JSON)</h4>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        انسخ هذا الكود والصقه في تبويب <code>diagram.json</code> داخل Wokwi لتظهر جميع القطع والأسلاك موصولة بدقة تلقائياً!
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={copyDiagram}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground font-bold shadow"
                      >
                        {copiedDiagram ? <Check size={13} /> : <Copy size={13} />}
                        {copiedDiagram ? 'تم نسخ diagram.json!' : 'نسخ diagram.json'}
                      </button>
                      <button
                        onClick={() => downloadFile('diagram.json', activeProject.diagramJson)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 text-foreground font-semibold"
                      >
                        <Download size={13} />
                        <span>تحميل</span>
                      </button>
                    </div>
                  </div>

                  {/* Pinout Table */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-foreground">جدول التوصيلات والأرجل (Pinout Mapping):</h5>
                    <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted text-muted-foreground font-semibold border-b border-border">
                          <tr>
                            <th className="p-2.5">القطعة</th>
                            <th className="p-2.5">المنفذ (GPIO)</th>
                            <th className="p-2.5">النوع</th>
                            <th className="p-2.5">موضوع الـ MQTT</th>
                            <th className="p-2.5">الوظيفة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-[11px]">
                          {activeProject.pinouts.map((po, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                              <td className="p-2.5 font-sans font-medium text-foreground">{po.component}</td>
                              <td className="p-2.5 text-primary font-bold">{po.pin}</td>
                              <td className="p-2.5 font-sans text-muted-foreground">{po.type}</td>
                              <td className="p-2.5 text-primary/80">{po.topic}</td>
                              <td className="p-2.5 font-sans text-muted-foreground">{po.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Diagram JSON View */}
                  <div className="space-y-1.5">
                    <span className="font-bold text-foreground">محتوى diagram.json:</span>
                    <pre className="bg-slate-950 text-slate-200 p-3 rounded-xl font-mono text-[10px] overflow-x-auto border border-border max-h-[160px] scrollbar-thin">
                      {activeProject.diagramJson}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 3: Libraries */}
              {modalTab === 'libraries' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">المكتبات المطلوبة داخل Wokwi</h4>
                      <p className="text-muted-foreground text-[11px] mt-0.5">
                        انسخ هذه القائمة والصقها في تبويب <code>libraries.txt</code> بمحاكي Wokwi:
                      </p>
                    </div>
                    <button
                      onClick={copyLibraries}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 shadow"
                    >
                      {copiedLibraries ? <Check size={13} /> : <Copy size={13} />}
                      {copiedLibraries ? 'تم النسخ!' : 'نسخ المكتبات'}
                    </button>
                  </div>

                  <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-border">
                    {activeProject.libraries}
                  </pre>
                </div>
              )}

              {/* TAB 4: Quick Guide */}
              {modalTab === 'guide' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">1</span>
                      <h5 className="font-bold text-foreground">لصق مخطط التوصيل</h5>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        في Wokwi افتح تبويب <code>diagram.json</code> والصق محتوى التوصيل — ستظهر كافة القطع والأسلاك موصولة فوراً!
                      </p>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">2</span>
                      <h5 className="font-bold text-foreground">لصق الكود والـ UID</h5>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        الصق كود <code>sketch.ino</code> وضع الـ UID الخاص بك في المتغير <code>USER_UID</code> أو اتركه فارغاً إذا كنت ترغب في اختباره كـ guest.
                      </p>
                    </div>

                    <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs">3</span>
                      <h5 className="font-bold text-foreground">بدء التشغيل ▶</h5>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        اضغط على الزر الأخضر ▶ داخل Wokwi، وستبدأ قراءات الحساسات بالظهور في لوحة التحكم والتيرمنال فورياً.
                      </p>
                    </div>
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-xs space-y-1">
                    <h5 className="font-bold text-primary flex items-center gap-1.5">
                      <Shield size={14} />
                      معلومات الاتصال بسيرفر الـ MQTT:
                    </h5>
                    <p className="text-foreground/80 leading-relaxed font-mono">
                      Broker: broker.hivemq.com | TCP Port: 1883 | WSS Port: 8884/mqtt
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      نفس السيرفر المستخدم بالموقع لضمان التوافق اللحظي بين المحاكي والداشبورد.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/40 shrink-0">
              <div className="text-[11px] text-muted-foreground font-mono">
                المشروع المحدد: <span className="font-bold text-foreground">{activeProject.title.split('(')[0]}</span>
              </div>
              <Button onClick={() => setShowProjectsModal(false)} size="sm">
                إغلاق النافذة
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
