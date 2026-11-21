import React from 'react';
import { Cpu, Maximize2, Minimize2, MoreHorizontal } from 'lucide-react';
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
    <header className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 shrink-0 shadow-sm">
      {/* Right side (RTL start): Title + Project select */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Cpu size={16} className="text-primary" />
          <h1 className="font-extrabold text-xs sm:text-sm text-foreground m-0">
            المحاكي السريع & الداشبورد
          </h1>
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />

        {/* Project select */}
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProjectId(e.target.value)}
          className="bg-zinc-800 border border-white/10 text-foreground text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/40 cursor-pointer shadow-sm max-w-[200px] sm:max-w-xs truncate"
          title="اختيار مشروع المحاكاة"
        >
          <option value="empty">مشروع جديد فارغ (Custom)</option>
          <optgroup label="── مشاريع محاكاة جاهزة ──">
            {SIMULATOR_PROJECTS.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.title}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Center: Segmented view mode control (sim | split | dash) */}
      <div className="flex items-center bg-zinc-800 p-0.5 rounded-lg border border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => onViewModeChange('circuit')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'circuit'
              ? 'bg-zinc-900 border border-white/10 text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
          title="عرض المحاكي فقط"
        >
          المحاكي
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'split'
              ? 'bg-zinc-900 border border-white/10 text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
          title="تجزئة الشاشة نصفين"
        >
          تجزئة
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('dashboard')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'dashboard'
              ? 'bg-zinc-900 border border-white/10 text-foreground shadow-sm'
              : 'text-zinc-400 hover:text-foreground'
          }`}
          title="عرض اللوحة فقط"
        >
          اللوحة
        </button>
      </div>

      {/* Left side (RTL end): MQTT status chip + Fullscreen + "⋯" More */}
      <div className="flex items-center gap-1.5 shrink-0 ms-auto">
        {/* MQTT Status Chip */}
        <div 
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-[11px] font-medium shrink-0"
          title={mqttOnline ? 'متصل بسيرفر MQTT' : 'غير متصل بالـ MQTT'}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${mqttOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="hidden sm:inline text-zinc-300 font-mono">
            {mqttOnline ? 'MQTT Connected' : 'MQTT Offline'}
          </span>
        </div>

        {/* Fullscreen Icon Button */}
        <button
          type="button"
          onClick={onToggleFullScreen}
          aria-label={isFullScreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
          className="p-1.5 rounded-lg bg-zinc-800 border border-white/10 text-zinc-300 hover:text-foreground hover:bg-zinc-700/60 transition-all shrink-0 cursor-pointer"
          title={isFullScreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
        >
          {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* "⋯" More Button */}
        <button
          ref={moreMenuButtonRef}
          type="button"
          onClick={onToggleMoreMenu}
          aria-label="المزيد من خيارات المحاكي والحساب"
          aria-expanded={showMoreMenu}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            showMoreMenu 
              ? 'bg-zinc-700 border-primary/50 text-foreground shadow' 
              : 'bg-zinc-800 border-white/10 text-zinc-300 hover:text-foreground hover:bg-zinc-700/60'
          }`}
          title="المزيد من خيارات المحاكي والحساب"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>
    </header>
  );
}
