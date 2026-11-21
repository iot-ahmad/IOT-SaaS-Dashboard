import React from 'react';
import { Play, X, Copy, Check } from 'lucide-react';

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
      className={`relative flex flex-col bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-md transition-all duration-150 ${
        viewMode === 'circuit'
          ? 'w-full h-full'
          : orientation === 'vertical'
            ? 'w-full lg:w-1/2 h-1/2 lg:h-full'
            : 'w-full h-1/2'
      }`}
    >
      {/* Dismissible Play Hint (Single-line blue pill) */}
      {showPlayHint && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-blue-950/40 border-b border-blue-500/20 text-xs shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/30 shrink-0">
              <Play size={10} className="text-blue-400 fill-blue-400 ms-0.5" />
            </span>
            <p className="text-blue-200 font-medium text-xs truncate">
              اضغط Play داخل المحاكي لتشغيل الحساسات وبث القراءات فورياً
            </p>
          </div>
          <button
            type="button"
            onClick={onDismissPlayHint}
            aria-label="إغلاق التنبيه"
            className="text-blue-400 hover:text-blue-200 p-0.5 shrink-0 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Simulator Card Header - Small with Title and ONLY ONE Button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-zinc-900/90 text-xs shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold text-foreground truncate">
            {isCustomProject ? 'محاكي Wokwi' : activeProject.title.split('(')[0]}
          </span>
          {!isCustomProject && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/10 shrink-0 hidden sm:inline">
              {activeProject.badge}
            </span>
          )}
        </div>

        {/* ONE button: Copy Updated Code */}
        <button
          type="button"
          onClick={onCopyCode}
          className="flex items-center gap-1.5 text-xs bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shadow-sm shrink-0"
          title="نسخ الكود المحدث المشفر جاهز للصق في المحاكي"
        >
          {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود المحدّث'}</span>
        </button>
      </div>

      {/* Wokwi Iframe */}
      <div className="flex-1 w-full h-full bg-black relative">
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
