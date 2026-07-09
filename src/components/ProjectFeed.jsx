import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import {
  Search, Cpu, Eye, ThumbsUp, Copy, Plus, Calendar,
  Zap, Leaf, Bot, Home, Wifi, Thermometer, LayoutGrid, TrendingUp, Star
} from 'lucide-react';

// ─── Category config (icon + label + filter keyword) ──────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'الكل',            icon: LayoutGrid,   color: 'text-blue-500',  bg: 'bg-blue-500/10',  activeBg: 'bg-blue-500',  keywords: [] },
  { id: 'home',       label: 'أتمتة منزلية',    icon: Home,         color: 'text-sky-400',    bg: 'bg-sky-400/10',    activeBg: 'bg-sky-400',    keywords: ['relay','smart home','مبدل','منزلي','إضاءة','lighting'] },
  { id: 'farm',       label: 'زراعة ذكية',       icon: Leaf,         color: 'text-emerald-400',bg: 'bg-emerald-400/10',activeBg: 'bg-emerald-400',keywords: ['soil','humidity','moisture','irrigation','farm','زراعة','تربة','ري'] },
  { id: 'robot',      label: 'روبوتات',          icon: Bot,          color: 'text-violet-400', bg: 'bg-violet-400/10', activeBg: 'bg-violet-400', keywords: ['motor','servo','robot','روبوت','محرك'] },
  { id: 'iot',        label: 'إنترنت الأشياء',   icon: Wifi,         color: 'text-cyan-400',   bg: 'bg-cyan-400/10',   activeBg: 'bg-cyan-400',   keywords: ['esp32','esp8266','wifi','mqtt','iot'] },
  { id: 'sensor',     label: 'حساسات',           icon: Thermometer,  color: 'text-rose-400',   bg: 'bg-rose-400/10',   activeBg: 'bg-rose-400',   keywords: ['dht11','dht22','sensor','temperature','حرارة','حساس'] },
  { id: 'energy',     label: 'طاقة',             icon: Zap,          color: 'text-blue-500', bg: 'bg-blue-500/10', activeBg: 'bg-blue-500', keywords: ['solar','battery','power','energy','طاقة','شمسية'] },
];

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'newest',  label: 'الأحدث',    icon: Calendar },
  { id: 'popular', label: 'الأكثر مشاهدة', icon: TrendingUp },
  { id: 'liked',   label: 'الأعلى تقييماً', icon: Star },
];

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="hub-card animate-pulse">
      <div className="hub-card-img-wrap bg-zinc-800/60" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 bg-zinc-800/80 rounded-lg w-3/4 ml-auto" />
        <div className="h-3 bg-zinc-800/50 rounded-lg w-full" />
        <div className="h-3 bg-zinc-800/50 rounded-lg w-5/6 ml-auto" />
        <div className="flex gap-1.5 justify-end pt-1">
          <div className="h-5 bg-zinc-800/60 rounded-lg w-14" />
          <div className="h-5 bg-zinc-800/60 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ proj, onClick, onAuthorClick }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const hasImage = proj.images && proj.images.length > 0;

  return (
    <div
      onClick={() => onClick(proj.id)}
      className="hub-card group cursor-pointer"
    >
      {/* ── Cover Image / Placeholder ── */}
      <div className="hub-card-img-wrap">
        {hasImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <Cpu className="text-zinc-700 animate-pulse" size={28} />
              </div>
            )}
            <img
              src={proj.images[0]}
              alt={proj.title}
              onLoad={() => setImgLoaded(true)}
              className={`hub-card-img transition-all duration-700 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Cpu className="text-blue-500" size={22} />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">No preview</span>
          </div>
        )}

        {/* Gradient overlay at bottom of image */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-zinc-950/90 to-transparent pointer-events-none" />

        {/* Image count badge */}
        {proj.images && proj.images.length > 1 && (
          <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] text-white px-1.5 py-0.5 rounded-md font-mono">
            {proj.images.length} صور
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/50 backdrop-blur-sm border border-white/10 text-[9px] text-zinc-300 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1">
          <Calendar size={8} />
          {new Date(proj.createdAt).toLocaleDateString('ar-JO')}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Title */}
        <h3 className="text-sm font-extrabold text-white group-hover:text-blue-500 transition-colors text-right leading-snug line-clamp-1">
          {proj.title}
        </h3>

        {/* Summary */}
        <p className="text-[11px] text-zinc-500 text-right leading-relaxed line-clamp-2 flex-1">
          {proj.summary}
        </p>

        {/* Component Tags */}
        {proj.componentsList && proj.componentsList.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-end">
            {proj.componentsList.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/8 border border-blue-500/15 text-blue-500/70 group-hover:border-blue-500/30 group-hover:text-blue-500 transition-colors whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {proj.componentsList.length > 3 && (
              <span className="text-[9px] text-zinc-600 font-mono px-1">+{proj.componentsList.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer: Author + Metrics */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-white/[0.05]">
          {/* Metrics */}
          <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
            <div className="flex items-center gap-1 hover:text-blue-500 transition-colors" title="مشاهدات">
              <Eye size={11} />
              <span>{proj.metrics?.views || 0}</span>
            </div>
            <div className="flex items-center gap-1 hover:text-rose-400 transition-colors" title="إعجابات">
              <ThumbsUp size={11} />
              <span>{proj.metrics?.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1 hover:text-sky-400 transition-colors" title="نسخ">
              <Copy size={11} />
              <span>{proj.metrics?.clones || 0}</span>
            </div>
          </div>

          {/* Author */}
          <button
            className="flex items-center gap-1.5 group/author"
            onClick={(e) => { e.stopPropagation(); onAuthorClick(proj.ownerUsername); }}
          >
            <span className="text-[11px] text-zinc-500 group-hover/author:text-white transition-colors font-medium">
              @{proj.ownerUsername}
            </span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/20 flex items-center justify-center text-[9px] font-bold text-blue-500 uppercase shadow-sm group-hover/author:border-blue-500/50 transition-colors">
              {(proj.ownerName || proj.ownerUsername || 'U').charAt(0)}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Feed ────────────────────────────────────────────────────────────────
export default function ProjectFeed({ user }) {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [allComponentTags, setAllComponentTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const lastClickRef = useRef(0);

  // ── Fetch public projects ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'projects'), where('visibility', '==', 'public'));
        const snap = await getDocs(q);
        const list = [];
        const tagsSet = new Set();
        snap.forEach((d) => {
          const data = d.data();
          list.push({ id: d.id, ...data });
          if (data.componentsList && Array.isArray(data.componentsList)) {
            data.componentsList.forEach(t => tagsSet.add(t));
          }
        });
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setProjects(list);
        setAllComponentTags(Array.from(tagsSet));
      } catch (err) {
        console.error('Error loading feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // ── Click handlers ────────────────────────────────────────────────────────
  const handleProjectClick = async (projectId) => {
    try {
      updateDoc(doc(db, 'projects', projectId), { 'metrics.views': increment(1) }).catch(() => {});
    } catch {}
    navigate(`/hub/project/${projectId}`);
  };

  const handleAuthorClick = (username) => navigate(`/${username}`);

  // ── Double-click on "الكل" shows category picker ────────────────────────────
  const handleAllClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 400) {
      setShowCategoryPicker(true);
    } else {
      setSelectedCategory('all');
      setSelectedTag('');
    }
    lastClickRef.current = now;
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = projects.filter(proj => {
    const textOk = !searchTerm ||
      proj.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.componentsList?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const catOk = (() => {
      if (selectedCategory === 'all') return true;
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (!cat || cat.keywords.length === 0) return true;
      const comps = (proj.componentsList || []).map(t => t.toLowerCase());
      const title = (proj.title || '').toLowerCase();
      const summary = (proj.summary || '').toLowerCase();
      return cat.keywords.some(kw => comps.includes(kw) || title.includes(kw) || summary.includes(kw));
    })();

    const tagOk = !selectedTag ||
      (proj.componentsList && proj.componentsList.map(t => t.toLowerCase()).includes(selectedTag.toLowerCase()));

    return textOk && catOk && tagOk;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return (b.metrics?.views || 0) - (a.metrics?.views || 0);
    if (sortBy === 'liked')   return (b.metrics?.likes || 0) - (a.metrics?.likes || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const hasFilters = searchTerm || selectedCategory !== 'all' || selectedTag;
  const activeCat = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <>
      {/* ── Inline styles for hub card ─────────────────────────────────── */}
      <style>{`
        .hub-card {
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .25s, box-shadow .25s, transform .25s;
          position: relative;
        }
        .hub-card:hover {
          border-color: rgba(26,109,255,.35);
          box-shadow: 0 12px 40px rgba(0,0,0,.45), 0 0 0 0.5px rgba(26,109,255,.15);
          transform: translateY(-2px);
        }
        .hub-card-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: #111;
          flex-shrink: 0;
        }
        .hub-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="space-y-5 pb-10" dir="rtl">




        {/* ══════════════════════════════════════════════════════════════════
            CATEGORY PICKER OVERLAY (double-click on الكل)
        ══════════════════════════════════════════════════════════════════ */}
        {showCategoryPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Sibling backdrop overlay to avoid nesting backdrop-filter with overflow-y-scroll child */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowCategoryPicker(false)} />
            <div
              className="relative"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(10,10,20,0.97)',
                border: '1px solid rgba(26,109,255,0.2)',
                borderRadius: 24,
                padding: '28px 24px',
                maxWidth: 520,
                width: '92%',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(26,109,255,0.1)',
                animation: 'catPickerIn 0.22s cubic-bezier(.34,1.56,.64,1) both',
              }}
            >
              <style>{`
                @keyframes catPickerIn {
                  from { opacity:0; transform: scale(0.88) translateY(16px); }
                  to   { opacity:1; transform: scale(1) translateY(0); }
                }
                @keyframes catCardIn {
                  from { opacity:0; transform: translateY(20px) scale(0.92); }
                  to   { opacity:1; transform: translateY(0) scale(1); }
                }
              `}</style>

              {/* Header */}
              <div className="flex items-center justify-between mb-6" dir="rtl">
                <div>
                  <h2 className="text-white font-black text-base">اختر فئة</h2>
                  <p className="text-zinc-500 text-[11px] mt-0.5">اضغط على الفئة للتصفية</p>
                </div>
                <button
                  onClick={() => setShowCategoryPicker(false)}
                  style={{ color: '#71717a', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontSize: 13 }}
                >✕</button>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3" dir="rtl">
                {CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedTag('');
                        setShowCategoryPicker(false);
                      }}
                      style={{
                        animationDelay: `${i * 45}ms`,
                        animationFillMode: 'both',
                        animation: `catCardIn 0.3s cubic-bezier(.34,1.4,.64,1) ${i * 45}ms both`,
                        background: isActive
                          ? `rgba(26,109,255,0.18)`
                          : 'rgba(255,255,255,0.03)',
                        border: isActive
                          ? '1.5px solid rgba(26,109,255,0.55)'
                          : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 16,
                        padding: '16px 8px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      {/* Icon circle */}
                      <div style={{
                        width: 44, height: 44,
                        borderRadius: '50%',
                        background: isActive ? 'rgba(26,109,255,0.2)' : 'rgba(255,255,255,0.05)',
                        border: isActive ? '1.5px solid rgba(26,109,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isActive ? '0 0 16px rgba(26,109,255,0.3)' : 'none',
                        transition: 'all 0.18s',
                      }}>
                        <Icon size={20} style={{ color: isActive ? '#1a6dff' : '#52525b' }} />
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: isActive ? '#ffffff' : '#71717a',
                        textAlign: 'center',
                        lineHeight: 1.3,
                        transition: 'color 0.18s',
                      }}>{cat.label}</span>
                      {isActive && (
                        <span style={{ fontSize: 9, color: '#1a6dff', fontWeight: 800, marginTop: -4 }}>✓ محدد</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SEARCH + SORT ROW
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* زر الكل */}
          <button
            onClick={handleAllClick}
            onDoubleClick={() => setShowCategoryPicker(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-blue-500 text-black border-transparent shadow-md'
                : 'bg-white/[0.03] border-white/[0.07] text-zinc-500 hover:text-white hover:border-white/15'
            }`}
            title="اضغط مرتين لاختيار الفئة"
          >
            <LayoutGrid size={13} />
            <span>الكل</span>
            {selectedCategory !== 'all' && (
              <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded font-medium">
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </button>

          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={14} />
            <input
              ref={searchRef}
              type="text"
              dir="rtl"
              placeholder="ابحث بالاسم، الوصف، أو القطعة (ESP32, DHT11...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/40 transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-1 py-1 shrink-0">
            {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-500 text-black shadow-sm'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  <Icon size={11} />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedTag(''); }}
              className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs text-zinc-500 hover:text-white hover:border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              إلغاء التصفية ×
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            COMPONENT TAGS STRIP (dynamic from real data)
        ══════════════════════════════════════════════════════════════════ */}
        {allComponentTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] text-zinc-600 font-mono whitespace-nowrap shrink-0">القطع:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                !selectedTag
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-transparent border-white/[0.07] text-zinc-600 hover:border-white/15 hover:text-zinc-400'
              }`}
            >
              الكل
            </button>
            {allComponentTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedTag === tag
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-500'
                    : 'bg-transparent border-white/[0.07] text-zinc-600 hover:border-blue-500/20 hover:text-zinc-400'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            RESULTS HEADER
        ══════════════════════════════════════════════════════════════════ */}
        {!loading && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-600">
              {activeCat && activeCat.id !== 'all' && (
                <span className={`flex items-center gap-1 ${activeCat.color} font-bold`}>
                  <activeCat.icon size={11} />
                  {activeCat.label}
                  <span className="text-zinc-600 font-normal">·</span>
                </span>
              )}
              <span>{sorted.length} مشروع{sorted.length !== 1 ? '' : ''}</span>
            </div>
            <span className="text-[10px] text-zinc-700 font-mono">
              {SORT_OPTIONS.find(s => s.id === sortBy)?.label}
            </span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            PROJECT GRID
        ══════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 border border-white/[0.05] rounded-2xl bg-white/[0.01]">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Cpu className="text-zinc-700" size={26} />
            </div>
            <h3 className="text-base font-bold text-white">لا توجد مشاريع</h3>
            <p className="text-xs text-zinc-600 mt-1.5 max-w-xs mx-auto">
              {hasFilters
                ? 'جرب تغيير الفئة أو كلمات البحث.'
                : 'كن أول من ينشر مشروعاً على المنصة!'}
            </p>
            {!hasFilters && (
              <button
                onClick={() => navigate(user ? '/hub/new' : '/login')}
                className="mt-5 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-black text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Plus size={14} />
                أنشر أول مشروع
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map(proj => (
              <ProjectCard
                key={proj.id}
                proj={proj}
                onClick={handleProjectClick}
                onAuthorClick={handleAuthorClick}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

