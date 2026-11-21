import React from 'react';
import { Play, X, Copy, Check, Cpu } from 'lucide-react';

export default function SimulatorPanel({
  viewMode,
  orientation,
  isCustomProject,
  activeProject,
  embedUrl,
  iframeKey,
  copiedCode,
  onCopyCode,
  showPlayHint,
  onDismissPlayHint
}) {
  if (viewMode !== 'split' && viewMode !== 'circuit') return null;

  return (
    <section
      className={`relative flex flex-col bg-card border border-border rounded-xl overflow-hidden shadow-md transition-all duration-150 ${
        viewMode === 'circuit'
          ? 'w-full h-full'
          : orientation === 'vertical'
            ? 'w-full lg:w-1/2 h-1/2 lg:h-full'
            : 'w-full h-1/2'
      }`}
    >
      {/* Dismissible Play Hint */}
      {showPlayHint && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-primary/10 border-b border-primary/20 text-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Play size={13} className="text-primary fill-primary shrink-0" />
            <p className="text-foreground font-medium text-xs truncate">
              Click Play inside the simulator to start sensors and stream live telemetry
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissPlayHint}
            aria-label="Dismiss hint"
            className="text-primary hover:opacity-80 p-0.5 shrink-0 cursor-pointer"
          >
            <X size={13} className="text-primary" />
          </button>
        </div>
      )}

      {/* Simulator Card Header - Small with Title and ONLY ONE Button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card text-xs shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Cpu size={14} className="text-primary shrink-0" />
          <span className="font-bold text-foreground truncate">
            {isCustomProject ? 'Wokwi Simulator' : activeProject.title.split('(')[0].trim()}
          </span>
          {!isCustomProject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border shrink-0 hidden sm:inline">
              {activeProject.badge}
            </span>
          )}
        </div>

        {/* ONE button: Copy Updated Code */}
        <button
          type="button"
          onClick={onCopyCode}
          className="flex items-center gap-1.5 text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shadow-sm shrink-0"
          title="Copy updated TLS-secured sketch code ready to paste into the simulator"
        >
          {copiedCode ? <Check size={13} className="text-primary" /> : <Copy size={13} className="text-primary" />}
          <span>{copiedCode ? 'Copied!' : 'Copy Updated Code'}</span>
        </button>
      </div>

      {/* Wokwi Iframe */}
      <div className="flex-1 w-full h-full bg-background relative">
        <iframe
          key={iframeKey}
          src={embedUrl}
          title="Wokwi ESP32 Simulator"
          className="w-full h-full border-0"
          allow="autoplay; camera; microphone; geolocation; clipboard-read; clipboard-write"
        />
      </div>
    </section>
  );
}
