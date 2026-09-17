import React, { useState } from 'react';
import {
  Eye, Cpu, ThumbsUp, Copy, Calendar, Sparkles, Zap,
  CheckCircle2, Layers, MessageSquare, BookOpen, User, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { SchematicSvgViewer } from './WiringBuilder';

export default function ProjectLivePreview({
  title = '',
  summary = '',
  difficulty = 'مبتدئ',
  visibility = 'public',
  tags = [],
  components = [],
  connections = [],
  wiringImageUrl = '',
  user = {},
  isMobileDrawerOpen = false,
  onCloseMobileDrawer = () => {}
}) {
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'detail'
  const [isCollapsedDesktop, setIsCollapsedDesktop] = useState(false);

  // Determine cover image
  const coverImage = wiringImageUrl || (components.find(c => c.imageUrl)?.imageUrl) || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80';

  const validComponents = components.filter(c => c && c.name && c.name.trim().length > 0);

  const difficultyColors = {
    'مبتدئ': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'متوسط': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'متقدم': 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  };

  const previewCardContent = (
    <div className="space-y-4 text-right" dir="rtl">
      {/* ── Community Card Mock ── */}
      <div className="hub-card group border border-primary/30 shadow-2xl shadow-primary/5 bg-[#090b10] rounded-2xl overflow-hidden transition-all">
        {/* Cover image wrap */}
        <div className="relative h-44 w-full bg-zinc-950 overflow-hidden">
          <img
            src={coverImage}
            alt={title || 'Project Preview'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#090b10] to-transparent pointer-events-none" />

          {/* Difficulty badge */}
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold">
            <span className={difficultyColors[difficulty] || 'text-emerald-400'}>{difficulty}</span>
          </div>

          {/* Live badge */}
          <div className="absolute top-2.5 left-2.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE PREVIEW
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2.5">
          <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
            {title.trim() || 'عنوان المشروع يظهر هنا في الوقت الفعلي...'}
          </h3>

          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {summary.trim() || 'اكتب وصفاً موجزاً في الخطوة الأولى لمعاينة كيف سيظهر للمستخدمين في المجتمع...'}
          </p>

          {/* Component Chips */}
          <div className="flex flex-wrap gap-1 justify-start pt-1">
            {validComponents.slice(0, 3).map((c, i) => (
              <span
                key={c.id || i}
                className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary truncate max-w-[120px]"
              >
                {c.name}
              </span>
            ))}
            {validComponents.length > 3 && (
              <span className="text-[9px] text-muted-foreground font-mono px-1">
                +{validComponents.length - 3}
              </span>
            )}
            {validComponents.length === 0 && (
              <span className="text-[9px] text-muted-foreground/60 italic">لم تتم إضافة قطع بعد</span>
            )}
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.05] text-[10px] text-muted-foreground font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[9px] text-primary font-bold">
                {(user?.displayName || 'U').charAt(0)}
              </div>
              <span className="text-foreground text-[10px]">{user?.displayName || 'المطور'}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-sky-400">
                <Copy size={11} /> 0 قالب
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <ThumbsUp size={11} /> 0
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Eye size={11} /> 1
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection & Components Summary Pill */}
      <div className="bg-card dark:bg-[#0c0e14] border border-border rounded-xl p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between font-bold text-foreground">
          <span className="flex items-center gap-1.5 text-primary">
            <Zap size={13} />
            حالة الدائرة الكهربائية:
          </span>
          <span className="font-mono text-muted-foreground">{connections.length} أسلاك</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground text-[11px]">
          <span>إجمالي القطع المضافة:</span>
          <span className="font-bold text-foreground">{validComponents.length} قطعة</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Persistent Side Panel ── */}
      <aside className="hidden xl:flex flex-col w-80 shrink-0 sticky top-24 space-y-4">
        <div className="bg-card/[0.02] border border-border/80 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-foreground">المعاينة الحية للمشروع</span>
            </div>

            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-primary text-black' : 'text-muted-foreground'}`}
              >
                البطاقة
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detail')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${viewMode === 'detail' ? 'bg-primary text-black' : 'text-muted-foreground'}`}
              >
                المخطط
              </button>
            </div>
          </div>

          {/* Mode Switch View */}
          {viewMode === 'card' ? (
            previewCardContent
          ) : (
            <div className="space-y-3">
              <SchematicSvgViewer components={components} connections={connections} />
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Collapsible Drawer ── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm xl:hidden">
          <div className="w-full max-w-lg bg-card dark:bg-[#0a0c12] border-t border-border rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground">معاينة بطاقة المشروع</h4>
              </div>
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {previewCardContent}
          </div>
        </div>
      )}
    </>
  );
}
