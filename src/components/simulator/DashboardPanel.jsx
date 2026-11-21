import React from 'react';
import { Gamepad2, Cpu, Terminal, Code, Sparkles, Copy, Check, Plus, RotateCcw } from 'lucide-react';
import UniversalController from '../UniversalController';
import { LiveTerminal } from '../ToolViews';
import NewDevicesView from '../DevicesView';

export default function DashboardPanel({
  viewMode,
  orientation,
  activePanel,
  onSelectPanel,
  isCustomProject,
  activeProject,
  selectedProjectId,
  deviceStates,
  publish,
  messages,
  userUID,
  lastSeen,
  mqttOnline,
  onOpenModal,
  copiedCode,
  onCopyCode,
  currentCode,
  onSelectProjectId
}) {
  if (viewMode !== 'split' && viewMode !== 'dashboard') return null;

  return (
    <section
      className={`relative flex flex-col bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-md transition-all duration-150 ${
        viewMode === 'dashboard'
          ? 'w-full h-full'
          : orientation === 'vertical'
            ? 'w-full lg:w-1/2 h-1/2 lg:h-full'
            : 'w-full h-1/2'
      }`}
    >
      {/* Single Unified Tab Row with Underline Navigation */}
      <div className="flex items-center justify-between px-3 border-b border-white/10 bg-zinc-900/90 text-xs shrink-0">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none" aria-label="تبويبات الداشبورد">
          <button
            type="button"
            onClick={() => onSelectPanel('controller')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'controller' ? 'text-primary' : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            اللوحة
            {activePanel === 'controller' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('devices')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'devices' ? 'text-primary' : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            الأجهزة
            {activePanel === 'devices' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('terminal')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'terminal' ? 'text-primary' : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            التيرمنال
            {activePanel === 'terminal' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('guide')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'guide' ? 'text-primary' : 'text-zinc-400 hover:text-foreground'
            }`}
          >
            الكود والتوصيل
            {activePanel === 'guide' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>
        </nav>

        {/* End of row: Actions */}
        <div className="flex items-center gap-1.5 py-1.5 shrink-0">
          {!isCustomProject && (
            <button
              type="button"
              onClick={onOpenModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-white/10 text-zinc-200 text-xs font-semibold cursor-pointer transition-all"
              title="الكود ومخطط التوصيل الكامل"
            >
              <Sparkles size={12} className="text-amber-400" />
              <span className="hidden sm:inline">مخطط التوصيل</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Sensor Telemetry Strip */}
      {Object.keys(deviceStates || {}).length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/40 border-b border-white/5 text-[11px] overflow-x-auto scrollbar-none shrink-0 font-mono">
          <span className="flex items-center gap-1.5 text-zinc-200 font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            بث الحساسات الحي:
          </span>
          {Object.entries(deviceStates).map(([top, val]) => (
            <span key={top} className="px-2 py-0.5 rounded-md bg-zinc-800 border border-white/10 text-zinc-300 shrink-0">
              <span className="text-zinc-400">{top.split('/').pop()}: </span>
              <span className="font-bold text-zinc-100">{val}</span>
            </span>
          ))}
        </div>
      )}

      {/* Panel Body */}
      <div className="flex-1 w-full h-full overflow-y-auto p-3 sm:p-4 scrollbar-thin">
        {activePanel === 'controller' && (
          <UniversalController
            key={`ctrl_${selectedProjectId}`}
            deviceStates={deviceStates}
            publish={publish}
            storageScopeId={`${userUID || 'guest'}_wokwi_${selectedProjectId}`}
            userUID={userUID}
            initialWidgets={isCustomProject ? [] : activeProject.widgets}
            customTitle={isCustomProject ? 'لوحة تحكم فارغة' : `لوحة مشروع: ${activeProject.title.split('(')[0]}`}
          />
        )}

        {activePanel === 'devices' && (
          <div className="space-y-4">
            {!isCustomProject && (
              <div className="bg-zinc-800/50 border border-white/10 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-primary" size={16} />
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
                      أجهزة وحساسات مشروع: {activeProject.title.split('(')[0]}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/10">
                      {activeProject.presetDevices?.length || 0} أجهزة
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(activeProject.presetDevices || []).map((dev) => {
                    const liveVal = deviceStates?.[dev.topic];
                    const hasVal = liveVal !== undefined && liveVal !== null && liveVal !== '';
                    const isActuator = dev.type === 'Actuator';

                    return (
                      <div key={dev.id} className="p-2.5 rounded-xl border border-white/10 bg-zinc-800/40">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  hasVal ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                                }`}
                              />
                              <h5 className="font-bold text-xs text-foreground truncate">{dev.name}</h5>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400 font-mono">
                              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-white/10">{dev.pin}</span>
                              <span className="truncate">{dev.topic}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/10">
                            {dev.type}
                          </span>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-zinc-400">القيمة:</span>
                          {hasVal ? (
                            <span className="font-mono font-bold text-sm text-foreground">
                              {liveVal} {dev.unit && dev.unit !== 'State' ? dev.unit : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">في انتظار البيانات...</span>
                          )}
                        </div>

                        {isActuator && (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => publish(dev.topic, 'ON')}
                              className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-zinc-700 hover:bg-zinc-600 text-foreground border border-white/10 transition-all cursor-pointer"
                            >
                              تشغيل ON
                            </button>
                            <button
                              type="button"
                              onClick={() => publish(dev.topic, 'OFF')}
                              className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-foreground border border-white/10 transition-all cursor-pointer"
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

            <NewDevicesView
              userUID={userUID}
              lastSeen={lastSeen}
              deviceStates={deviceStates}
            />
          </div>
        )}

        {activePanel === 'terminal' && (
          <div className="h-full flex flex-col gap-2">
            <div className="p-3 bg-zinc-800/40 border border-white/10 rounded-xl text-xs text-zinc-400">
              ⚡ تعرض هذه الشاشة جميع الإشارات المتبادلة بين لوحة التحكم ومحاكي Wokwi في الوقت الفعلي عبر بروتوكول MQTT.
            </div>
            <div className="flex-1 min-h-[300px]">
              <LiveTerminal messages={messages} isConnected={mqttOnline} />
            </div>
          </div>
        )}

        {activePanel === 'guide' && (
          <div className="space-y-4 text-xs">
            {isCustomProject ? (
              <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 mx-auto">
                  <Code size={24} />
                </div>
                <h4 className="font-bold text-foreground text-sm">مساحة عمل محاكاة فارغة / مخصصة</h4>
                <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                  أنت الآن تعمل على محاكي فارغ. يمكنك اختيار أي من المشاريع الجاهزة من القائمة بالأعلى لتوليد الكود ومخطط التوصيل فوراً.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectProjectId('all-in-one')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all cursor-pointer"
                >
                  تجربة المحطة الشاملة الجاهزة 🌟
                </button>
              </div>
            ) : (
              <>
                <div className="bg-zinc-800/40 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-foreground border border-white/10">
                      {activeProject.badge}
                    </span>
                    <button
                      onClick={onOpenModal}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      فتح النافذة التفصيلية
                    </button>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground mt-1">
                    {activeProject.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {activeProject.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">كود C++ / Arduino جاهز للنسخ:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onCopyCode}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-foreground font-semibold text-xs cursor-pointer"
                      >
                        {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-zinc-950 text-zinc-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-white/10 max-h-[300px] scrollbar-thin">
                    {currentCode}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
