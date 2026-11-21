import React from 'react';
import { Gamepad2, Cpu, Terminal, Code, CircuitBoard, FileCode, Copy, Check, Plus, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  mqttMode = 'demo',
  mqttConfig = {},
  includePrivateCreds = false,
  onToggleIncludeCreds,
  onOpenModal,
  copiedCode,
  onCopyCode,
  currentCode,
  onSelectProjectId
}) {
  if (viewMode !== 'split' && viewMode !== 'dashboard') return null;

  return (
    <section
      className={`relative flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-md transition-all duration-150 ${
        viewMode === 'dashboard'
          ? 'w-full h-full'
          : orientation === 'vertical'
            ? 'w-full lg:w-1/2 h-1/2 lg:h-full'
            : 'w-full h-1/2'
      }`}
    >
      {/* Single Unified Tab Row with Underline Navigation */}
      <div className="flex items-center justify-between px-3 border-b border-border bg-card text-xs shrink-0">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none" aria-label="Dashboard tabs">
          <button
            type="button"
            onClick={() => onSelectPanel('controller')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'controller' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dashboard
            {activePanel === 'controller' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('devices')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'devices' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Devices
            {activePanel === 'devices' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('terminal')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'terminal' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Terminal
            {activePanel === 'terminal' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectPanel('guide')}
            className={`py-2.5 px-2 font-bold text-xs transition-colors relative cursor-pointer ${
              activePanel === 'guide' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Code &amp; Wiring
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-secondary border border-border text-foreground text-xs font-semibold cursor-pointer transition-all"
              title="Full Code & Wiring Diagram"
            >
              <CircuitBoard size={13} className="text-primary" />
              <span className="hidden sm:inline">Wiring Diagram</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Sensor Telemetry Strip */}
      {Object.keys(deviceStates || {}).length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border text-[11px] overflow-x-auto scrollbar-none shrink-0 font-mono">
          <span className="flex items-center gap-1.5 text-foreground font-bold shrink-0">
            Live Sensor Stream:
          </span>
          {Object.entries(deviceStates).map(([top, val]) => (
            <span key={top} className="px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground shrink-0">
              <span className="text-muted-foreground">{top.split('/').pop()}: </span>
              <span className="font-bold text-primary">{val}</span>
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
            customTitle={isCustomProject ? 'Blank Control Panel' : `Project Dashboard: ${activeProject.title.split('(')[0].trim()}`}
          />
        )}

        {activePanel === 'devices' && (
          <div className="space-y-4">
            {!isCustomProject && (
              <div className="bg-muted/30 border border-border rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-border flex-wrap">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-primary" size={16} />
                    <h4 className="text-xs sm:text-sm font-extrabold text-foreground">
                      Project Sensors &amp; Actuators: {activeProject.title.split('(')[0].trim()}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                      <span className="text-primary font-bold">{activeProject.presetDevices?.length || 0}</span> devices
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {(activeProject.presetDevices || []).map((dev) => {
                    const liveVal = deviceStates?.[dev.topic];
                    const hasVal = liveVal !== undefined && liveVal !== null && liveVal !== '';
                    const isActuator = dev.type === 'Actuator';

                    return (
                      <div key={dev.id} className="p-2.5 rounded-xl border border-border bg-muted/40">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-foreground truncate">{dev.name}</h5>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono">
                              <span className="bg-background px-1.5 py-0.5 rounded border border-border text-primary">{dev.pin}</span>
                              <span className="truncate">{dev.topic}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {dev.type}
                          </span>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-border flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground">Value:</span>
                          {hasVal ? (
                            <span className="font-mono font-bold text-sm text-primary">
                              {liveVal} {dev.unit && dev.unit !== 'State' ? dev.unit : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Waiting for data...</span>
                          )}
                        </div>

                        {isActuator && (
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => publish(dev.topic, 'ON')}
                              className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-all cursor-pointer"
                            >
                              Turn ON
                            </button>
                            <button
                              type="button"
                              onClick={() => publish(dev.topic, 'OFF')}
                              className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer"
                            >
                              Turn OFF
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
            <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground flex items-center gap-2">
              <Terminal size={14} className="text-primary shrink-0" />
              <span>This terminal displays all real-time MQTT messages exchanged between the dashboard and the Wokwi simulator.</span>
            </div>
            <div className="flex-1 min-h-[300px]">
              <LiveTerminal messages={messages} isConnected={mqttOnline} />
            </div>
          </div>
        )}

        {activePanel === 'guide' && (
          <div className="space-y-4 text-xs">
            {isCustomProject ? (
              <div className="bg-muted/30 border border-border rounded-xl p-6 text-center space-y-3">
                <Code size={28} className="text-primary mx-auto" />
                <h4 className="font-bold text-foreground text-sm">Blank / Custom Simulation Workspace</h4>
                <p className="text-muted-foreground text-xs max-w-md mx-auto leading-relaxed">
                  You are currently working on a blank simulator. Select any ready-made project from the dropdown above to generate firmware code and wiring diagrams instantly.
                </p>
                <button
                  type="button"
                  onClick={() => onSelectProjectId('all-in-one')}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all cursor-pointer"
                >
                  Try Ready All-In-One Station
                </button>
              </div>
            ) : (
              <>
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                      {activeProject.badge}
                    </span>
                    <button
                      onClick={onOpenModal}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileCode size={13} className="text-primary" />
                      Open Detailed View
                    </button>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground mt-1">
                    {activeProject.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {activeProject.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {/* TLS & Credentials Security Banner */}
                  <div className={`rounded-xl p-3 border text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    mqttMode === 'private'
                      ? 'bg-primary/10 border-primary/25 text-primary'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      {mqttMode === 'private' ? <ShieldCheck size={15} className="shrink-0 mt-0.5 text-primary" /> : <AlertTriangle size={15} className="shrink-0 mt-0.5" />}
                      <span>
                        {mqttMode === 'private'
                          ? `Encrypted connection with ${mqttConfig?.caName || 'Root CA'} certificate + NTP sync + unique Client ID via ${mqttConfig?.provisionedBy === 'emqx_auto' ? 'auto-isolated EMQX account' : 'your private broker'}.`
                          : `Code uses verified TLS (${mqttConfig?.caName || 'Root CA'}) + unique Client ID, with credentials masked for protection. Enable your isolated account in Profile & Settings → Security.`}
                      </span>
                    </div>
                    {mqttMode === 'private' && onToggleIncludeCreds && (
                      <button
                        type="button"
                        onClick={onToggleIncludeCreds}
                        className="px-2.5 py-1 rounded-lg bg-background hover:bg-muted border border-border text-foreground font-semibold shrink-0 cursor-pointer"
                      >
                        {includePrivateCreds ? 'Mask Password (Placeholders)' : 'Include My MQTT Credentials'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Ready-to-Copy C++ / Arduino Code:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onCopyCode}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted hover:bg-secondary border border-border text-foreground font-semibold text-xs cursor-pointer"
                      >
                        {copiedCode ? <Check size={13} className="text-primary" /> : <Copy size={13} className="text-primary" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="bg-background text-foreground p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-border max-h-[300px] scrollbar-thin">
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
