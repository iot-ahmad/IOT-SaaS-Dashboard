import React, { useState, useRef, useEffect } from 'react';
import { 
  Columns, LayoutGrid, Cpu, ExternalLink, RefreshCw, 
  Terminal, Gamepad2, Settings, HelpCircle, Code, Copy, Check, 
  Maximize2, Minimize2, Rows, PanelRightClose, PanelLeftClose, Play, Shield, ChevronUp, ChevronDown, X
} from 'lucide-react';
import { Button } from '@/components/ui/neon-button';
import UniversalController from './UniversalController';
import { DevicesView, LiveTerminal } from './ToolViews';
import NewDevicesView from './DevicesView';

/**
 * Normalizes Wokwi project URL or ID into a clean embeddable iframe URL.
 * Supports format:
 * - https://wokwi.com/projects/468717878078638081
 * - 468717878078638081
 * - https://wokwi.com/projects/468717878078638081?embed=1
 */
function getWokwiEmbedUrl(rawUrl) {
  if (!rawUrl) return 'https://wokwi.com/projects/468717878078638081?embed=1';
  let trimmed = rawUrl.trim();
  
  // Extract project ID if only digits are passed
  if (/^\d+$/.test(trimmed)) {
    return `https://wokwi.com/projects/${trimmed}?embed=1`;
  }
  
  // Clean query string if already has embed
  if (trimmed.includes('embed=1')) {
    return trimmed;
  }
  
  // Append embed parameter
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
  initialWokwiUrl = 'https://wokwi.com/projects/468717878078638081' 
}) {
  const containerRef = useRef(null);
  const [wokwiUrlInput, setWokwiUrlInput] = useState(initialWokwiUrl);
  const [activeWokwiUrl, setActiveWokwiUrl] = useState(initialWokwiUrl);
  const [iframeKey, setIframeKey] = useState(0);
  
  // View mode: 'split' | 'circuit' | 'dashboard'
  const [viewMode, setViewMode] = useState('split');
  
  // Split orientation: 'vertical' (side-by-side) | 'horizontal' (top-bottom)
  const [orientation, setOrientation] = useState('vertical');
  
  // Right panel view: 'controller' | 'devices' | 'terminal' | 'guide'
  const [activePanel, setActivePanel] = useState('controller');

  // Full Screen & UI compact states
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showUidBanner, setShowUidBanner] = useState(false);
  const [showPlayHint, setShowPlayHint] = useState(true);

  // Copy code snippet state
  const [copied, setCopied] = useState(false);
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

  const handleApplyUrl = (e) => {
    e?.preventDefault();
    if (wokwiUrlInput.trim()) {
      setActiveWokwiUrl(wokwiUrlInput.trim());
      setIframeKey(k => k + 1);
    }
  };

  const handleResetDefault = () => {
    const defaultUrl = 'https://wokwi.com/projects/468717878078638081';
    setWokwiUrlInput(defaultUrl);
    setActiveWokwiUrl(defaultUrl);
    setIframeKey(k => k + 1);
  };

  const handleReloadIframe = () => {
    setIframeKey(k => k + 1);
  };

  const sampleArduinoCode = `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.emqx.io";

WiFiClient espClient;
PubSubClient client(espClient);

// Your unique Topic Prefix:
const char* topic_prefix = "${userUID || 'guest_user'}";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");

  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    client.connect("WokwiESP32Client");
  }
  client.loop();
  
  // Example: Send temperature telemetry every 5 sec
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 5000) {
    lastMsg = millis();
    String topic = String(topic_prefix) + "/farm/greenhouse_temp";
    client.publish(topic.cString(), "28.5");
  }
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      
      {/* ── Compact Control Header Toolbar ── */}
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-2 sm:p-2.5 flex flex-col gap-2 shrink-0 shadow-md">
        
        {/* Main Toolbar Line */}
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

            {activeWokwiUrl !== 'https://wokwi.com/projects/468717878078638081' && (
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-muted-foreground hover:text-primary underline px-1 shrink-0"
                title="إعادة للمشروع الافتراضي"
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
                  title="الأجهزة"
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
                  title="كود Wokwi MQTT"
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
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 shadow-sm'
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
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' 
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

        {/* UID Notice Banner — Collapsible to save space */}
        {userUID && showUidBanner && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-lg px-3 py-1.5 text-xs w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="font-bold text-blue-300">UID الحساب:</span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="flex-1 bg-blue-900/40 border border-blue-500/30 text-blue-200 font-mono text-[11px] px-2 py-0.5 rounded truncate select-all">
                {userUID}
              </code>
              <button
                onClick={copyUid}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] shrink-0 transition-all ${
                  copiedUid
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-blue-500/20 border border-blue-500/40 text-blue-200 hover:bg-blue-500/30'
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
          <div className={`relative flex flex-col bg-card/90 backdrop-blur-md border border-border rounded-xl overflow-hidden shadow-xl ${
            viewMode === 'circuit' 
              ? 'w-full h-full' 
              : (orientation === 'vertical' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-1/2')
          }`}>
            {/* Header info badge inside pane */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40 text-xs shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>محاكي الدوائر Wokwi</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {activeWokwiUrl.includes('468717878078638081') ? '🎮 مشروع تجريبي — Demo' : 'Custom Project'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeWokwiUrl.includes('http') ? activeWokwiUrl : `https://wokwi.com/projects/${activeWokwiUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary/80 hover:text-primary underline hidden sm:inline"
                >
                  فتح في Wokwi ↗
                </a>
              </div>
            </div>

            {/* ⚡ Play Hint Banner (Dismissible) */}
            {showPlayHint && (
              <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/25 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 shrink-0 animate-pulse">
                    <Play size={11} className="text-amber-400 fill-amber-400 ml-0.5" />
                  </span>
                  <p className="text-amber-300 font-bold text-xs truncate">
                    ▶ اضغط "Play" الأخضر داخل المحاكي لبدء البث المباشر
                  </p>
                </div>
                <button 
                  onClick={() => setShowPlayHint(false)}
                  className="text-amber-400/60 hover:text-amber-300 p-0.5 shrink-0"
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
          <div className={`relative flex flex-col bg-card/80 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-xl ${
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
                  {activePanel === 'guide' && 'دليل ربط كود Wokwi بـ MQTT'}
                </span>
              </div>

              {/* Selector inside pane header for quick access */}
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
                  الكود
                </button>
              </div>
            </div>

            {/* Pane Content */}
            <div className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-4">
              {activePanel === 'controller' && (
                <UniversalController
                  deviceStates={deviceStates}
                  publish={publish}
                  storageScopeId={`${userUID}_wokwi_split`}
                  userUID={userUID}
                  customTitle="لوحة التحكم المجزأة"
                />
              )}

              {/* Show hint banner at the top of controller panel if no data */}
              {activePanel === 'controller' && Object.keys(deviceStates || {}).length === 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-3 -mt-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 shrink-0 animate-pulse">
                    <Play size={14} className="text-amber-400 fill-amber-400 ml-0.5" />
                  </span>
                  <div>
                    <p className="text-amber-300 font-bold text-xs">في انتظار بيانات المحاكي...</p>
                    <p className="text-amber-400/70 text-[10px] mt-0.5">اضغط ▶ Play داخل المحاكي على اليسار — ستظهر القراءات الحية هنا فور التشغيل</p>
                  </div>
                </div>
              )}

              {activePanel === 'devices' && (
                <div className="space-y-3">
                  {/* Notice if no deviceStates received yet */}
                  {Object.keys(deviceStates || {}).length === 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 shrink-0 animate-pulse">
                        <Play size={14} className="text-amber-400 fill-amber-400 ml-0.5" />
                      </span>
                      <div>
                        <p className="text-amber-300 font-bold text-xs">في انتظار تشغيل المحاكي...</p>
                        <p className="text-amber-400/70 text-[10px] mt-0.5">اضغط على الزر الأخضر ▶ داخل محاكي Wokwi على اليسار لترى البيانات هنا</p>
                      </div>
                    </div>
                  )}
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
                    ⚡ تعرض هذه الشاشة جميع الإشارات المتبادلة بين لوحة التحكم ومحاكي  في الوقت الفعلي عبر بروتوكول MQTT.
                  </div>
                  <div className="flex-1 min-h-[300px]">
                    <LiveTerminal messages={messages} isConnected={true} />
                  </div>
                </div>
              )}

              {activePanel === 'guide' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-primary">
                    <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                      <Shield size={16} />
                      كيفية ربط محاكي Wokwi باللوحة والتيرمنال مباشرة؟
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      محاكي Wokwi يوفر اتصال واي فاي افتراضي <code>Wokwi-GUEST</code>. بإمكانك إضافة مكتبة PubSubClient داخل كود Arduino في Wokwi للبث والاستقبال المباشر مع هذا الداشبورد!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">كود C++ / ESP32 جاهز للنسخ إلى Wokwi:</span>
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow"
                      >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'تم النسخ!' : 'نسخ الكود'}
                      </button>
                    </div>

                    <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-border max-h-[320px]">
                      {sampleArduinoCode}
                    </pre>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
