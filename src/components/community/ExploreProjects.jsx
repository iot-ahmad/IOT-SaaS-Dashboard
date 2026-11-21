import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  Search, Cpu, Eye, ThumbsUp, Copy, Plus, Calendar,
  Zap, Leaf, Bot, Home, Wifi, Thermometer, LayoutGrid, TrendingUp, Star,
  Layers, Filter, Bookmark
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: LayoutGrid, keywords: [] },
  { id: 'esp32', label: 'ESP32 & IoT', icon: Wifi, keywords: ['esp32', 'esp8266', 'wifi', 'mqtt', 'iot'] },
  { id: 'home', label: 'Home Automation', icon: Home, keywords: ['relay', 'smart home', 'مبدل', 'منزلي', 'إضاءة', 'lighting'] },
  { id: 'farm', label: 'Smart Agriculture', icon: Leaf, keywords: ['soil', 'humidity', 'moisture', 'irrigation', 'farm', 'زراعة', 'تربة', 'ري'] },
  { id: 'robot', label: 'Robotics', icon: Bot, keywords: ['motor', 'servo', 'robot', 'روبوت', 'محرك'] },
  { id: 'sensor', label: 'Sensors & Monitoring', icon: Thermometer, keywords: ['dht11', 'dht22', 'bme280', 'sensor', 'temperature', 'حرارة', 'حساس'] },
  { id: 'energy', label: 'Power & Batteries', icon: Zap, keywords: ['solar', 'battery', 'power', 'energy', 'طاقة', 'شمسية'] },
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Viewed', icon: TrendingUp },
  { id: 'newest', label: 'Newest', icon: Calendar },
  { id: 'liked', label: 'Highest Rated', icon: Star },
];

const formatDifficulty = (diff) => {
  const map = { 'مبتدئ': 'Beginner', 'متوسط': 'Intermediate', 'متقدم': 'Advanced' };
  return map[diff] || diff || 'Beginner';
};

export default function ExploreProjects({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('popular');
  const [savedMap, setSavedMap] = useState({});
  const [savingIds, setSavingIds] = useState({});

  useEffect(() => {
    if (!user?.uid || !db) {
      setSavedMap({});
      return;
    }
    const q = query(collection(db, 'saved_projects'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const nextMap = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.projectId) nextMap[data.projectId] = d.id;
        });
        setSavedMap(nextMap);
      },
      () => setSavedMap({}),
    );
    return () => unsub();
  }, [user?.uid]);

  const handleToggleSave = async (e, proj) => {
    e.stopPropagation();
    if (!user?.uid) {
      navigate('/login');
      return;
    }
    if (savingIds[proj.id]) return;
    setSavingIds((prev) => ({ ...prev, [proj.id]: true }));
    try {
      const existingDocId = savedMap[proj.id];
      if (existingDocId) {
        await deleteDoc(doc(db, 'saved_projects', existingDocId));
      } else {
        await setDoc(doc(db, 'saved_projects', `${user.uid}_${proj.id}`), {
          userId: user.uid,
          projectId: proj.id,
          title: proj.title || 'Untitled Project',
          summary: proj.summary || '',
          difficulty: formatDifficulty(proj.difficulty),
          ownerName: proj.ownerName || 'Developer',
          ownerUsername: proj.ownerUsername || '',
          thumbnail: proj.images?.[0] || '',
          componentsList: proj.componentsList || [],
          savedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setSavingIds((prev) => ({ ...prev, [proj.id]: false }));
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Layers size={20} className="text-primary" />
            <span>Explore Projects</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            IoT and electronic circuit projects published by the community
          </p>
        </div>

        <button
          onClick={() => navigate('/hub/new')}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto hover:bg-primary/90"
        >
          <Plus size={14} />
          <span>Publish New Project</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by title, sensors (BME280, DHT22), or microcontroller (ESP32)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-border rounded-xl py-2.5 pl-10 pr-14 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground"
            />
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-2 bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground w-full md:w-auto">
              <Filter size={13} className="text-primary shrink-0" />
              <span className="text-muted-foreground font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-foreground font-medium focus:outline-none cursor-pointer text-xs"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-popover text-foreground">
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
                    ? 'bg-primary/15 text-primary border border-primary/35 font-semibold'
                    : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={13} className="text-primary" />
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
            <div key={n} className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse h-72">
              <div className="h-36 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded-lg w-3/4" />
              <div className="h-3 bg-muted rounded-lg w-full" />
              <div className="h-3 bg-muted rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Cpu size={40} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No published projects found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery ? 'No results match your current search criteria.' : 'Be the first to document and publish your project in the community!'}
          </p>
          <button
            onClick={() => navigate('/hub/new')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all cursor-pointer"
          >
            Publish New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/hub/project/${proj.id}`)}
              className="group bg-card hover:border-primary/45 border border-border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col cursor-pointer"
            >
              {/* Image Preview */}
              <div className="relative h-44 bg-background overflow-hidden border-b border-border">
                {proj.images?.[0] ? (
                  <img
                    src={proj.images[0]}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-background">
                    <Cpu size={28} className="text-primary transition-colors" />
                    <span className="text-[10px] text-muted-foreground font-mono">Hardware Project</span>
                  </div>
                )}

                {/* Difficulty & Date */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-border text-primary">
                    {formatDifficulty(proj.difficulty)}
                  </span>
                </div>

                <div className="absolute top-2.5 left-2.5 text-[9px] font-mono text-muted-foreground bg-black/70 backdrop-blur-sm border border-border px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar size={9} className="text-primary" />
                  <span>{new Date(proj.createdAt || Date.now()).toLocaleDateString('en-US')}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col space-y-2.5">
                <h3 className="text-xs md:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {proj.title}
                </h3>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {proj.summary}
                </p>

                {/* Tags */}
                {proj.componentsList && proj.componentsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {proj.componentsList.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                    {proj.componentsList.length > 3 && (
                      <span className="text-[9px] text-primary font-mono px-1">
                        +{proj.componentsList.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border mt-auto text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-muted text-primary text-[9px] font-bold flex items-center justify-center">
                      {(proj.ownerName || 'U').charAt(0)}
                    </div>
                    <span className="text-muted-foreground font-medium truncate max-w-[110px]">
                      {proj.ownerName || 'Developer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 font-mono text-primary font-bold">
                    <span className="flex items-center gap-1"><Eye size={10} className="text-primary" /> {proj.metrics?.views || 0}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={10} className="text-primary" /> {proj.metrics?.likes || 0}</span>
                    <span className="flex items-center gap-1"><Copy size={10} className="text-primary" /> {proj.timesUsedAsTemplate || proj.metrics?.clones || 0}</span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(e, proj)}
                      disabled={Boolean(savingIds[proj.id])}
                      title={savedMap[proj.id] ? 'Remove from saved' : 'Save project'}
                      className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Bookmark
                        size={12}
                        className="text-primary"
                        fill={savedMap[proj.id] ? 'currentColor' : 'none'}
                      />
                    </button>
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
