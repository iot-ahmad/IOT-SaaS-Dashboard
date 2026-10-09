import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import {
  Search, Cpu, Eye, ThumbsUp, Copy, Plus, Calendar,
  Zap, Leaf, Bot, Home, Wifi, Thermometer, LayoutGrid, TrendingUp, Star,
  Layers, Filter
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: LayoutGrid, keywords: [] },
  { id: 'esp32', label: 'ESP32 & IoT', icon: Wifi, keywords: ['esp32', 'esp8266', 'wifi', 'mqtt', 'iot'] },
  { id: 'home', label: 'أتمتة منزلية', icon: Home, keywords: ['relay', 'smart home', 'مبدل', 'منزلي', 'إضاءة', 'lighting'] },
  { id: 'farm', label: 'زراعة ذكية', icon: Leaf, keywords: ['soil', 'humidity', 'moisture', 'irrigation', 'farm', 'زراعة', 'تربة', 'ري'] },
  { id: 'robot', label: 'روبوتات', icon: Bot, keywords: ['motor', 'servo', 'robot', 'روبوت', 'محرك'] },
  { id: 'sensor', label: 'حساسات ورصد', icon: Thermometer, keywords: ['dht11', 'dht22', 'bme280', 'sensor', 'temperature', 'حرارة', 'حساس'] },
  { id: 'energy', label: 'طاقة وبطاريات', icon: Zap, keywords: ['solar', 'battery', 'power', 'energy', 'طاقة', 'شمسية'] },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'الأكثر مشاهدة', icon: TrendingUp },
  { id: 'newest', label: 'الأحدث', icon: Calendar },
  { id: 'liked', label: 'الأعلى تقييماً', icon: Star },
];

export default function ExploreProjects({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        let fetched = [];
        if (db) {
          const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        setProjects(fetched);
      } catch (err) {
        console.error('Firestore fetch error in ExploreProjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchSummary = p.summary?.toLowerCase().includes(q);
      const matchTags = p.componentsList?.some(tag => tag.toLowerCase().includes(q));
      const matchAuthor = p.ownerName?.toLowerCase().includes(q) || p.ownerUsername?.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchTags && !matchAuthor) return false;
    }

    if (activeCategory !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === activeCategory);
      if (catObj && catObj.keywords.length > 0) {
        const text = `${p.title} ${p.summary} ${(p.componentsList || []).join(' ')}`.toLowerCase();
        const hasKeyword = catObj.keywords.some(k => text.includes(k.toLowerCase()));
        if (!hasKeyword) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'liked') {
      return (b.metrics?.likes || 0) - (a.metrics?.likes || 0);
    }
    return (b.metrics?.views || 0) - (a.metrics?.views || 0);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers size={20} className="text-zinc-400" />
            <span>استكشاف المشاريع</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            مشاريع إنترنت الأشياء والدوائر الإلكترونية المنشورة من المجتمع
          </p>
        </div>

        <button
          onClick={() => navigate('/hub/new')}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          <span>نشر مشروع جديد</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="ابحث بالاسم أو الحساسات (BME280, DHT22) أو المتحكم (ESP32)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl py-2.5 px-3 pr-10 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-500"
            />
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-2 bg-[#1e2024] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-300 w-full md:w-auto">
              <Filter size={13} className="text-zinc-400 shrink-0" />
              <span className="text-zinc-500 font-medium">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-[#18191c] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.12] text-white border border-white/[0.18]'
                    : 'bg-[#1e2024] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-zinc-400'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ── Projects Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3 animate-pulse h-72">
              <div className="h-36 bg-white/[0.04] rounded-xl" />
              <div className="h-4 bg-white/[0.04] rounded-lg w-3/4" />
              <div className="h-3 bg-white/[0.04] rounded-lg w-full" />
              <div className="h-3 bg-white/[0.04] rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <Cpu size={40} className="text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">لا توجد مشاريع منشورة حالياً</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery ? 'لم يتم العثور على نتائج تطابق معايير البحث الحالية.' : 'كن أول من يوثق وينشر مشروعه في المجتمع!'}
          </p>
          <button
            onClick={() => navigate('/hub/new')}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-medium text-xs transition-all"
          >
            نشر مشروع جديد
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/hub/project/${proj.id}`)}
              className="group bg-[#18191c] hover:bg-[#1f2025] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer"
            >
              {/* Image Preview */}
              <div className="relative h-44 bg-[#141518] overflow-hidden border-b border-white/[0.06]">
                {proj.images?.[0] ? (
                  <img
                    src={proj.images[0]}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-[#16171a]">
                    <Cpu size={28} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    <span className="text-[10px] text-zinc-600 font-mono">Hardware Project</span>
                  </div>
                )}

                {/* Difficulty & Date */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-zinc-300">
                    {proj.difficulty || 'مبتدئ'}
                  </span>
                </div>

                <div className="absolute top-2.5 left-2.5 text-[9px] font-mono text-zinc-400 bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar size={9} />
                  <span>{new Date(proj.createdAt || Date.now()).toLocaleDateString('ar-JO')}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col space-y-2.5">
                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-zinc-200 transition-colors line-clamp-1">
                  {proj.title}
                </h3>

                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed flex-1">
                  {proj.summary}
                </p>

                {/* Tags */}
                {proj.componentsList && proj.componentsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {proj.componentsList.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                    {proj.componentsList.length > 3 && (
                      <span className="text-[9px] text-zinc-600 font-mono px-1">
                        +{proj.componentsList.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] mt-auto text-[10px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-white/[0.08] text-zinc-300 text-[9px] font-bold flex items-center justify-center">
                      {(proj.ownerName || 'U').charAt(0)}
                    </div>
                    <span className="text-zinc-400 font-medium truncate max-w-[110px]">
                      {proj.ownerName || 'مطور'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-mono">
                    <span className="flex items-center gap-1"><Eye size={10} /> {proj.metrics?.views || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={10} /> {proj.metrics?.likes || 0}</span>
                    <span className="flex items-center gap-1"><Copy size={10} /> {proj.timesUsedAsTemplate || proj.metrics?.clones || 0}</span>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
