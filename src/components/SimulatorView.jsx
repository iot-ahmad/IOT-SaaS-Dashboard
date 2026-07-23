import React, { useState } from 'react';
import { 
  Columns, LayoutGrid, Cpu, ExternalLink, RefreshCw, 
  Terminal, Gamepad2, Settings, HelpCircle, Code, Copy, Check, 
  Maximize2, Minimize2, Rows, PanelRightClose, PanelLeftClose, Play, Shield
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
  const [wokwiUrlInput, setWokwiUrlInput] = useState(initialWokwiUrl);
  const [activeWokwiUrl, setActiveWokwiUrl] = useState(initialWokwiUrl);
  const [iframeKey, setIframeKey] = useState(0);
  
  // View mode: 'split' | 'circuit' | 'dashboard'
  const [viewMode, setViewMode] = useState('split');
  
  // Split orientation: 'vertical' (side-by-side) | 'horizontal' (top-bottom)
  const [orientation, setOrientation] = useState('vertical');
  
  // Right panel view: 'controller' | 'devices' | 'terminal' | 'guide'
  const [activePanel, setActivePanel] = useState('controller');

  // Copy code snippet state
  const [copied, setCopied] = useState(false);

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
    <div className="flex flex-col h-full min-h-0 w-full gap-3 overflow-hidden">
      
      {/* ── Control Header Toolbar ── */}
      <div className="bg-card/70 backdrop-blur-md border border-border rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 shadow-lg">
        
        {/* Left: Preset & URL input */}
        <form onSubmit={handleApplyUrl} className="flex flex-1 items-center gap-2 min-w-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold shrink-0">
            <Cpu size={16} />
            <span className="hidden sm:inline">مشروع المحاكي:</span>
          </div>

          <input 
            type="text"
            value={wokwiUrlInput}
            onChange={(e) => setWokwiUrlInput(e.target.value)}
            placeholder="أدخل رابط Wokwi أو Project ID..."
            className="flex-1 bg-muted/60 border border-border focus:border-primary/50 text-xs sm:text-sm rounded-xl px-3 py-1.5 outline-none font-mono text-foreground truncate min-w-[150px]"
          />

          <Button type="submit" size="sm" className="shrink-0 text-xs px-3 py-1.5 h-auto">
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
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-colors shrink-0"
            title="فتح في Wokwi بتبويب جديد"
          >
            <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={handleReloadIframe}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-colors shrink-0"
            title="إعادة تحميل المحاكي"
          >
            <RefreshCw size={14} />
          </button>
        </form>

        {/* Right: Layout Toggle Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'split' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="تجزئة الشاشة"
            >
              <Columns size={14} />
              <span>تجزئة الشاشة</span>
            </button>

            <button
              onClick={() => setViewMode('circuit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'circuit' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="المحاكي فقط"
            >
              <Cpu size={14} />
              <span className="hidden sm:inline">المحاكي</span>
            </button>

            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'dashboard' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="اللوحة فقط"
            >
              <Gamepad2 size={14} />
              <span className="hidden sm:inline">اللوحة</span>
            </button>
          </div>

          {/* Orientation switch if split */}
          {viewMode === 'split' && (
            <button
              onClick={() => setOrientation(o => o === 'vertical' ? 'horizontal' : 'vertical')}
              className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-colors"
              title={orientation === 'vertical' ? 'تبديل للتقسيم الأفقي' : 'تبديل للتقسيم العمودي'}
            >
              {orientation === 'vertical' ? <Rows size={15} /> : <Columns size={15} />}
            </button>
          )}

          {/* Right Panel View Switcher (when split or dashboard view) */}
          {viewMode !== 'circuit' && (
            <div className="flex items-center bg-muted/80 p-1 rounded-xl border border-border">
              <button
                onClick={() => setActivePanel('controller')}
                className={`p-1.5 rounded-lg transition-all ${
                  activePanel === 'controller' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="لوحة التحكم"
              >
                <Gamepad2 size={15} />
              </button>
              <button
                onClick={() => setActivePanel('devices')}
                className={`p-1.5 rounded-lg transition-all ${
                  activePanel === 'devices' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="الأجهزة"
              >
                <Cpu size={15} />
              </button>
              <button
                onClick={() => setActivePanel('terminal')}
                className={`p-1.5 rounded-lg transition-all ${
                  activePanel === 'terminal' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="سجل الإشارات (Terminal)"
              >
                <Terminal size={15} />
              </button>
              <button
                onClick={() => setActivePanel('guide')}
                className={`p-1.5 rounded-lg transition-all ${
                  activePanel === 'guide' ? 'bg-background text-primary shadow' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="كود Wokwi MQTT"
              >
                <Code size={15} />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Main Split View Container ── */}
      <div className={`flex-1 min-h-0 w-full flex ${
        viewMode === 'split' 
          ? (orientation === 'vertical' ? 'flex-col lg:flex-row' : 'flex-col') 
          : 'flex-col'
      } gap-3 relative overflow-hidden`}>
        
        {/* Pane 1: Wokwi Circuit Simulator */}
        {(viewMode === 'split' || viewMode === 'circuit') && (
          <div className={`relative flex flex-col bg-card/80 backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-xl ${
            viewMode === 'circuit' 
              ? 'w-full h-full' 
              : (orientation === 'vertical' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-1/2')
          }`}>
            {/* Header info badge inside pane */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 text-xs shrink-0">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>محاكي الدوائر Wokwi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {activeWokwiUrl.includes('468717878078638081') ? 'ESP32 Default Project' : 'Custom Project'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground hidden sm:inline">اضغط Play داخل المحاكي لتشغيل الدائرة</span>
              </div>
            </div>

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

              {activePanel === 'devices' && (
                <NewDevicesView 
                  userUID={userUID} 
                  lastSeen={lastSeen} 
                  deviceStates={deviceStates} 
                />
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
