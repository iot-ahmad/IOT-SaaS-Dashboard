import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import {
  Search, Cpu, Eye, ThumbsUp, Copy, Plus, Calendar,
  Zap, Leaf, Bot, Home, Wifi, Thermometer, LayoutGrid, TrendingUp, Star,
  Flame, ArrowRight, BookOpen, Layers
} from 'lucide-react';
import { FEATURED_TEMPLATES } from '../data/featuredTemplates';
import FeaturedTemplatesModal from './ui/FeaturedTemplatesModal';

// ─── Category config (icon + label + filter keyword) ──────────────────────────
const CATEGORIES = [
  { id: 'all',        label: 'All',               icon: LayoutGrid,   color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: [] },
  { id: 'home',       label: 'Home Automation',   icon: Home,         color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['relay','smart home','مبدل','منزلي','إضاءة','lighting'] },
  { id: 'farm',       label: 'Smart Agriculture', icon: Leaf,         color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['soil','humidity','moisture','irrigation','farm','زراعة','تربة','ري'] },
  { id: 'robot',      label: 'Robotics',          icon: Bot,          color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['motor','servo','robot','روبوت','محرك'] },
  { id: 'iot',        label: 'IoT & Wireless',    icon: Wifi,         color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['esp32','esp8266','wifi','mqtt','iot'] },
  { id: 'sensor',     label: 'Sensors',           icon: Thermometer,  color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['dht11','dht22','sensor','temperature','حرارة','حساس'] },
  { id: 'energy',     label: 'Power & Energy',    icon: Zap,          color: 'text-primary', bg: 'bg-primary/10', activeBg: 'bg-primary', keywords: ['solar','battery','power','energy','طاقة','شمسية'] },
];

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'newest',  label: 'Newest',        icon: Calendar },
  { id: 'popular', label: 'Most Viewed',   icon: TrendingUp },
  { id: 'liked',   label: 'Highest Rated', icon: Star },
];

const formatDifficulty = (diff) => {
  const map = { 'مبتدئ': 'Beginner', 'متوسط': 'Intermediate', 'متقدم': 'Advanced' };
  return map[diff] || diff || 'Beginner';
};

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="hub-card animate-pulse">
      <div className="hub-card-img-wrap bg-zinc-800/60" />
      <div className="p-4 space-y-2.5">
        <div className="h-3.5 bg-zinc-800/80 rounded-lg w-3/4" />
        <div className="h-3 bg-zinc-800/50 rounded-lg w-full" />
        <div className="h-3 bg-zinc-800/50 rounded-lg w-5/6" />
        <div className="flex gap-1.5 justify-start pt-1">
          <div className="h-5 bg-zinc-800/60 rounded-lg w-14" />
          <div className="h-5 bg-zinc-800/60 rounded-lg w-14" />
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ proj, onClick, onAuthorClick, onUseTemplate }) {
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
              <div className="absolute inset-0 bg-card flex items-center justify-center">
                <Cpu className="text-primary animate-pulse" size={28} />
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
          <div className="absolute inset-0 bg-card flex flex-col items-center justify-center gap-2">
            <Cpu className="text-primary group-hover:scale-110 transition-transform" size={26} />
            <span className="text-[10px] text-muted-foreground font-mono">No preview</span>
          </div>
        )}

        {/* Gradient overlay at bottom of image */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-card/90 to-transparent pointer-events-none" />

        {/* Difficulty badge */}
        {proj.difficulty && (
          <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md border border-border px-2 py-0.5 rounded-md text-[9px] font-bold text-primary">
            {formatDifficulty(proj.difficulty)}
          </div>
        )}

        {/* Date badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/50 backdrop-blur-sm border border-border text-[9px] text-foreground/80 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1">
          <Calendar size={8} className="text-primary" />
          {new Date(proj.createdAt).toLocaleDateString('en-US')}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1 text-left" dir="ltr">
        {/* Title */}
        <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
          {proj.title}
        </h3>

        {/* Summary */}
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {proj.summary}
        </p>

        {/* Component Tags */}
        {proj.componentsList && proj.componentsList.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-start">
            {proj.componentsList.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary group-hover:border-primary/40 transition-colors whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {proj.componentsList.length > 3 && (
              <span className="text-[9px] text-primary font-mono px-1">+{proj.componentsList.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer: Author + Metrics */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-border">
          {/* Author */}
          <button
            className="flex items-center gap-1.5 group/author"
            onClick={(e) => { e.stopPropagation(); onAuthorClick(proj.ownerUsername); }}
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] font-bold text-primary uppercase shadow-sm group-hover/author:border-primary/50 transition-colors">
              {(proj.ownerName || proj.ownerUsername || 'U').charAt(0)}
            </div>
            <span className="text-[11px] text-muted-foreground group-hover/author:text-foreground transition-colors font-medium">
              @{proj.ownerUsername}
            </span>
          </button>

          {/* Metrics */}
          <div className="flex items-center gap-3 text-[10px] text-primary font-mono font-bold">
            <div className="flex items-center gap-1" title="Views">
              <Eye size={11} className="text-primary" />
              <span>{proj.metrics?.views || 0}</span>
            </div>
            <div className="flex items-center gap-1" title="Likes">
              <ThumbsUp size={11} className="text-primary" />
              <span>{proj.metrics?.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1" title="Used as Template">
              <Copy size={11} className="text-primary" />
              <span>{proj.timesUsedAsTemplate || 0}</span>
            </div>
          </div>
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
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
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

  const handleSelectTemplate = (template) => {
    navigate(`/hub/new?template=${template.id}`);
  };

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
      <style>{`
        .hub-card {
          display: flex;
          flex-direction: column;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .25s, box-shadow .25s, transform .25s;
          position: relative;
        }
        .hub-card:hover {
          border-color: var(--primary);
          box-shadow: 0 12px 40px rgba(0,0,0,.45);
          transform: translateY(-2px);
        }
        .hub-card-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: var(--background);
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

      <div className="space-y-6 pb-12" dir="ltr">

        {/* ══════════════════════════════════════════════════════════════════
            FEATURED & TEMPLATE PROJECTS SPOTLIGHT HERO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Flame size={20} className="text-primary" />
                Featured &amp; Template Projects
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified engineering blueprints and ready-to-use wiring schematics to jumpstart your project
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTemplatesModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Layers size={13} className="text-primary" />
                View All Templates
              </button>
              <button
                onClick={() => navigate(user ? '/hub/new' : '/login')}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="px-4 py-1.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 shadow-md shadow-primary/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                Publish New Project
              </button>
            </div>
          </div>

          {/* Featured Cards Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURED_TEMPLATES.map(template => (
              <div
                key={template.id}
                className="group relative bg-background border border-border hover:border-primary/50 rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="relative h-32 w-full bg-background overflow-hidden">
                  <img
                    src={template.coverImage}
                    alt={template.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-border px-2 py-0.5 rounded-md text-[9px] font-bold text-primary">
                    {formatDifficulty(template.difficulty)}
                  </div>
                  <div className="absolute top-2 left-2 bg-primary/15 backdrop-blur-md border border-primary/30 text-primary px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1">
                    <Copy size={9} className="text-primary" />
                    Used {template.timesUsedAsTemplate} times
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {template.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                      {template.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {template.components?.length || 0} parts · {template.connections?.length || 0} wires
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(template)}
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      className="text-[10px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-sm shadow-primary/20"
                    >
                      <Copy size={11} />
                      Use as Template
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEARCH + SORT ROW
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          {/* All category trigger */}
          <button
            onClick={handleAllClick}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground border-transparent shadow-md'
                : 'bg-card/5 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            <LayoutGrid size={13} />
            <span>All</span>
            {selectedCategory !== 'all' && (
              <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded font-medium">
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </button>

          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
            <input
              ref={searchRef}
              type="text"
              dir="ltr"
              placeholder="Search by title, description, or component (ESP32, DHT11, Relay...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-card/5 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 bg-card/5 border border-border rounded-xl px-1 py-1 shrink-0">
            {SORT_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isActive = sortBy === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
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
              className="px-4 py-2.5 bg-card/5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear Filters ×
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            COMPONENT TAGS STRIP
        ══════════════════════════════════════════════════════════════════ */}
        {allComponentTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap shrink-0">Components:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                !selectedTag
                  ? 'bg-zinc-700 border-zinc-600 text-white'
                  : 'bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              All
            </button>
            {allComponentTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedTag === tag
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'bg-transparent border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
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
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {activeCat && activeCat.id !== 'all' && (
                <span className={`flex items-center gap-1 ${activeCat.color} font-bold`}>
                  <activeCat.icon size={11} />
                  {activeCat.label}
                  <span className="text-muted-foreground font-normal">·</span>
                </span>
              )}
              <span>{sorted.length} Published Projects</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
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
          <div className="text-center py-20 border border-border rounded-2xl bg-card">
            <Cpu className="text-primary mx-auto mb-4" size={32} />
            <h3 className="text-base font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto">
              {hasFilters ? 'Try changing the category or search terms.' : 'Be the first to publish a project in the community!'}
            </p>
            {!hasFilters && (
              <button
                onClick={() => navigate(user ? '/hub/new' : '/login')}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="mt-5 inline-flex items-center gap-2 text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 cursor-pointer"
              >
                <Plus size={14} />
                Publish First Project
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

      {/* Featured Templates Modal */}
      <FeaturedTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </>
  );
}
