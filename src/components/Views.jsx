import { useState } from 'react';
import { 
  SoilMoistureCard, 
  IrrigationValveCard, 
  WaterTankCard, 
  GreenhouseTempCard, 
  AutomationsCard 
} from './Cards';
import {
  Zap, Users, Thermometer, Briefcase, Plus, X, Gamepad2, Cpu,
  Wifi, WifiOff, Activity, Columns, ChevronRight, Layers
} from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--card-foreground)' }}
    className={`border p-6 backdrop-blur-md hover:opacity-90 transition-all duration-300 group ${className}`}>
    {children}
  </div>
);

export const FarmView = ({ deviceStates, publish }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <SoilMoistureCard deviceStates={deviceStates} publish={publish} />
      <IrrigationValveCard deviceStates={deviceStates} publish={publish} />
      <WaterTankCard deviceStates={deviceStates} />
      <GreenhouseTempCard deviceStates={deviceStates} />
    </div>
    <div className="grid grid-cols-1 gap-6">
      <AutomationsCard publish={publish} />
    </div>
  </div>
);

const OnboardingWizard = () => {
  const steps = [
    {
      number: '1',
      title: 'Create Workspace',
      subTitle: 'Step 1',
      desc: 'Click "Add Project" to create a dedicated workspace for your project (e.g., Smart Car or Greenhouse).',
      icon: Plus,
      tokenColor: 'var(--accent)'
    },
    {
      number: '2',
      title: 'Add Control Widget',
      subTitle: 'Step 2',
      desc: 'Open your workspace and click "Add Widget" to add switches, gauges, charts, or a D-Pad controller.',
      icon: Gamepad2,
      tokenColor: 'var(--secondary)'
    },
    {
      number: '3',
      title: 'Connect ESP32',
      subTitle: 'Step 3',
      desc: 'Use the assigned MQTT topic key for each widget to link your ESP32 sensors or actuators directly.',
      icon: Cpu,
      tokenColor: 'var(--destructive)'
    },
    {
      number: '4',
      title: 'Copy Arduino Sketch',
      subTitle: 'Step 4',
      desc: 'Visit the "Developer Guide" or "Simulator" to copy ready-to-run C++ firmware and start streaming in seconds.',
      icon: Zap,
      tokenColor: 'var(--primary)'
    }
  ];

  return (
    <div className="hw-panel bg-card border border-border rounded-xl p-6 sm:p-7 relative overflow-hidden">
      <div className="max-w-3xl mx-auto text-center mb-7">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-[10px] font-bold text-muted-foreground tracking-[0.12em] uppercase">
          Quick Start Pipeline
        </span>
        <h3 className="text-lg sm:text-xl font-bold text-foreground mt-2.5">
          Welcome to IOT365 Smart Workbench
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Follow these four simple steps to connect your ESP32 board and start streaming telemetry in minutes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
        {/* Connection line between steps (desktop only) */}
        <div className="hidden lg:block absolute top-[26px] left-[12%] right-[12%] h-px bg-border z-0" />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <div key={idx} className="flex flex-col items-center text-center group z-10 relative">
              <div className="w-13 h-13 flex items-center justify-center bg-card">
                <StepIcon size={24} className="text-primary" />
              </div>
              
              <span className="mt-2 text-xs font-bold text-primary font-mono tabular-nums">
                0{step.number}
              </span>

              <h4 className="text-sm font-bold text-foreground mt-2 mb-0.5">
                {step.title}
              </h4>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                {step.subTitle}
              </span>
              
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[220px] lg:max-w-none">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HomeView = ({
  workspaces,
  onAddWorkspace,
  setActiveWorkspace,
  isConnected = false,
  mqttMode = 'demo',
  deviceStates = {},
  automations = [],
  onOpenTool,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEsp32, setNewEsp32] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddWorkspace(newName.trim(), newEsp32.trim());
      setNewName('');
      setNewEsp32('');
      setShowAddModal(false);
    }
  };

  const customWorkspaces = workspaces?.filter(ws => ws.isCustom) || [];
  const activeTopicsCount = Object.keys(deviceStates || {}).length;
  const activeRulesCount = (automations || []).filter(a => a.active).length;

  return (
    <div className="relative w-full space-y-6">
      {/* ── Operations KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="hw-panel bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspaces</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{customWorkspaces.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Universal Controller ready</p>
          </div>
          <Layers size={22} className="text-primary shrink-0" />
        </div>

        <div
          onClick={() => onOpenTool?.('connection')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenTool?.('connection'); } }}
          title="Open Connect Device settings"
          className="hw-panel bg-card border border-border hover:border-primary/40 transition-colors cursor-pointer rounded-xl p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MQTT Cloud Broker</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-lg font-bold ${isConnected ? 'text-primary' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {mqttMode === 'private' ? 'EMQX TLS 8883 · ACL' : 'Shared Demo Broker'}
            </p>
          </div>
          {isConnected ? <Wifi size={22} className="text-primary shrink-0" /> : <WifiOff size={22} className="text-red-400 shrink-0" />}
        </div>

        <div className="hw-panel bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live Telemetry Topics</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{activeTopicsCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active streaming channels</p>
          </div>
          <Activity size={22} className="text-primary shrink-0" />
        </div>

        <div className="hw-panel bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Rules</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{activeRulesCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automation triggers enabled</p>
          </div>
          <Zap size={22} className="text-primary shrink-0" />
        </div>
      </div>

      {/* ── Quick Launch Hardware Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setActiveWorkspace('controller')}
          className="hw-panel bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Gamepad2 size={22} className="text-primary shrink-0" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">Universal Controller</h4>
              <p className="text-xs text-muted-foreground truncate">Launch tactile sensors, switches & robotics</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onOpenTool?.('simulator')}
          className="hw-panel bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Columns size={22} className="text-primary shrink-0" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">Wokwi Simulator</h4>
              <p className="text-xs text-muted-foreground truncate">Split-screen virtual ESP32 testbench</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onOpenTool?.('devices')}
          className="hw-panel bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Cpu size={22} className="text-primary shrink-0" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">Connected Devices</h4>
              <p className="text-xs text-muted-foreground truncate">Inspect GPIO hardware & telemetry charts</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>

      {/* ── Your Projects Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Your Projects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Custom IoT control workspaces synchronized to your cloud account</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            <span>Add Project</span>
          </button>
        </div>

        {customWorkspaces.length === 0 ? (
          <OnboardingWizard />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customWorkspaces.map(ws => (
              <button
                key={ws.id}
                type="button"
                onClick={() => setActiveWorkspace(ws.id)}
                className="hw-panel relative overflow-hidden bg-card border border-border hover:border-primary/40 rounded-xl p-5 text-left transition-all duration-150 group cursor-pointer"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Gamepad2 size={22} className="text-primary shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted border border-border text-muted-foreground">
                      {ws.esp32Prefix ? `Target: ${ws.esp32Prefix}` : 'Global UID'}
                    </span>
                    <ChevronRight size={15} className="text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">{ws.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to open hardware workbench & live controls</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="hw-panel bg-card border border-border rounded-2xl p-6 w-full max-w-sm relative z-10 text-foreground shadow-xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Project</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Project Name</label>
                <input
                  autoFocus
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Smart Car, Weather Station..."
                  className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">ESP32 Target UID (Optional)</label>
                <input
                  value={newEsp32}
                  onChange={e => setNewEsp32(e.target.value)}
                  placeholder="e.g. ESP_A1B2C3"
                  className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                />
                <p className="text-[10px] text-muted-foreground mt-1">If provided, widgets in this project will automatically target this specific ESP32.</p>
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer text-sm shadow-sm">
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const OfficeView = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Users size={20} className="text-primary" />
              <h3 className="text-foreground/80 font-medium">Occupancy</h3>
            </div>
            <span className="text-2xl font-bold text-foreground"><span className="text-primary font-mono">14</span> People</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Meeting Room A: Occupied</p>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Thermometer size={20} className="text-primary" />
              <h3 className="text-foreground/80 font-medium">Air Quality</h3>
            </div>
            <span className="text-2xl font-bold text-foreground">Excellent</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">CO2: <span className="text-primary font-mono font-bold">420 ppm</span></p>
      </Card>

      <Card className="md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <Briefcase className="text-primary" size={20} />
          <h3 className="text-foreground/80 font-medium">Desk Bookings</h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold ${i < 5 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/60'}`}>
              D{i}
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
