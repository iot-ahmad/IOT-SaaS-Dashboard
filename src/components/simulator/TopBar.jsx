import React from 'react';
import { Cpu, Maximize2, Minimize2, MoreHorizontal, Wifi, WifiOff } from 'lucide-react';
import { SIMULATOR_PROJECTS } from '../../data/simulatorProjects';

export default function TopBar({
  selectedProjectId,
  onSelectProjectId,
  viewMode,
  onViewModeChange,
  mqttOnline,
  isFullScreen,
  onToggleFullScreen,
  onToggleMoreMenu,
  showMoreMenu,
  moreMenuButtonRef
}) {
  return (
    <header className="bg-card border border-border rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm">
      {/* Start: Title + Project select */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu size={16} className="text-primary" />
          <h1 className="font-extrabold text-xs sm:text-sm text-foreground m-0">
            Quick Simulator &amp; Dashboard
          </h1>
        </div>

        <div className="h-4 w-px bg-border hidden sm:block shrink-0" />

        {/* Project select */}
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProjectId(e.target.value)}
          className="bg-input border border-border text-foreground text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/40 cursor-pointer shadow-sm max-w-[200px] sm:max-w-xs truncate"
          title="Select simulation project"
        >
          <option value="empty">New Blank Project (Custom)</option>
          <optgroup label="── Ready Simulator Projects ──">
            {SIMULATOR_PROJECTS.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Center: Segmented view mode control (sim | split | dash) */}
      <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('circuit')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'circuit'
              ? 'bg-card border border-border text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Simulator view only"
        >
          Simulator
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'split'
              ? 'bg-card border border-border text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Split screen view"
        >
          Split
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('dashboard')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'dashboard'
              ? 'bg-card border border-border text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Dashboard view only"
        >
          Dashboard
        </button>
      </div>

      {/* End: MQTT status chip + Fullscreen + "⋯" More */}
      <div className="flex items-center gap-1.5 shrink-0 ms-auto">
        {/* MQTT Status Chip */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium shrink-0 ${
            mqttOnline
              ? 'bg-primary/10 border-primary/25 text-primary'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}
          title={mqttOnline ? 'Connected to MQTT broker' : 'Disconnected from MQTT broker'}
        >
          {mqttOnline ? <Wifi size={12} className="text-primary shrink-0" /> : <WifiOff size={12} className="text-red-400 shrink-0" />}
          <span className="hidden sm:inline font-mono">
            {mqttOnline ? 'MQTT Connected' : 'MQTT Offline'}
          </span>
        </div>

        {/* Fullscreen Icon Button */}
        <button
          type="button"
          onClick={onToggleFullScreen}
          aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="p-1.5 rounded-lg bg-transparent border-0 text-primary hover:bg-muted transition-all shrink-0 cursor-pointer"
          title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullScreen ? <Minimize2 size={15} className="text-primary" /> : <Maximize2 size={15} className="text-primary" />}
        </button>

        {/* "⋯" More Button */}
        <button
          ref={moreMenuButtonRef}
          type="button"
          onClick={onToggleMoreMenu}
          aria-label="More simulator and account options"
          aria-expanded={showMoreMenu}
          className={`p-1.5 rounded-lg border-0 transition-all cursor-pointer ${
            showMoreMenu 
              ? 'bg-muted text-primary shadow' 
              : 'bg-transparent text-primary hover:bg-muted'
          }`}
          title="More simulator and account options"
        >
          <MoreHorizontal size={15} className="text-primary" />
        </button>
      </div>
    </header>
  );
}
