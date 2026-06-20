import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { Search, Filter, Cpu, Eye, ThumbsUp, Copy, Plus, Sparkles, FolderCode, Calendar } from 'lucide-react';
import { Button } from './ui/neon-button';

export default function ProjectFeed() {
  const navigate = useNavigate();
  
  // States
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  // Fetch Public Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'projects'),
          where('visibility', '==', 'public')
        );
        const querySnapshot = await getDocs(q);
        const projectsList = [];
        const tagsSet = new Set();

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          projectsList.push({
            id: doc.id,
            ...data
          });
          
          // Collect unique tags
          if (data.componentsList && Array.isArray(data.componentsList)) {
            data.componentsList.forEach(tag => tagsSet.add(tag));
          }
        });

        // Sort by newest first
        projectsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setProjects(projectsList);
        setAllTags(Array.from(tagsSet));
      } catch (err) {
        console.error("Error loading feed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle Project View click & view count increment
  const handleProjectClick = async (projectId) => {
    try {
      // Background increment view count in Firestore
      const projRef = doc(db, 'projects', projectId);
      updateDoc(projRef, {
        'metrics.views': increment(1)
      }).catch(() => {});
      
      // Navigate to detail
      navigate(`/hub/project/${projectId}`);
    } catch (err) {
      console.error(err);
      navigate(`/hub/project/${projectId}`);
    }
  };

  // Filtered Projects
  const filteredProjects = projects.filter(proj => {
    const matchesSearch = 
      proj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (proj.componentsList && proj.componentsList.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesTag = selectedTag ? (proj.componentsList && proj.componentsList.includes(selectedTag)) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Publish CTA */}
      <div className="bg-gradient-to-r from-violet-900/20 via-primary/5 to-cyan-500/10 border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 relative z-10 text-right md:text-right md:order-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span>🇯🇴</span>
            مجتمع مطوري IoT الأردني
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">🇯🇴 منصة IOT365 الأردنية</h2>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
            المجتمع الأردني لمطوري الأجهزة الذكية — شارك مشاريعك مع المبدعين في الأردن، وحمّل الأكواد والتوثيقات المبنية على ESP32 وArduino.
          </p>
        </div>

        <button
          onClick={() => navigate('/hub/new')}
          className="bg-primary text-black font-black px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/95 transition-all shadow-lg shadow-primary/25 text-sm cursor-pointer md:order-1 relative z-10"
        >
          <Plus size={18} />
          أنشر مشروعك المادي
        </button>
      </div>

      {/* Search and Filters Layout */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="ابحث بالاسم، الوصف، أو القطعة (ESP32, DHT11...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card/5 border border-border rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:border-primary text-sm text-right rtl-text text-white placeholder:text-muted-foreground"
          />
        </div>

        {/* Clear Filters Indicator */}
        {(searchTerm || selectedTag) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedTag('');
            }}
            className="px-4 py-3 bg-card/5 border border-border rounded-2xl text-xs text-muted-foreground hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            إلغاء التصفية
          </button>
        )}
      </div>

      {/* Quick Tags Filter List */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs text-muted-foreground font-semibold whitespace-nowrap">القطع الأكثر استخداماً:</span>
          <button
            onClick={() => setSelectedTag('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
              !selectedTag
                ? 'bg-primary border-transparent text-black'
                : 'bg-card/5 border-border text-muted-foreground hover:border-white/20'
            }`}
          >
            الكل
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-primary border-transparent text-black shadow-md shadow-primary/10'
                  : 'bg-card/5 border-border text-muted-foreground hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="bg-card/[0.01] border border-border rounded-3xl p-6 h-64 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-card/10 rounded-md w-3/4" />
                <div className="h-3 bg-card/5 rounded-md w-full" />
                <div className="h-3 bg-card/5 rounded-md w-5/6" />
              </div>
              <div className="flex gap-2 justify-end">
                <div className="h-6 bg-card/10 rounded-full w-16" />
                <div className="h-6 bg-card/10 rounded-full w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-card/[0.01] border border-border rounded-3xl p-8 backdrop-blur-xl">
          <FolderCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">لم يتم العثور على أي مشاريع</h3>
          <p className="text-xs text-muted-foreground mt-2">جرب البحث بكلمات أخرى أو إلغاء مرشحات البحث النشطة.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => handleProjectClick(proj.id)}
              className="group bg-card/[0.02] hover:bg-card/[0.04] border border-border hover:border-primary/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between h-[340px] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-primary/5 cursor-pointer"
            >
              {/* Background gradient on hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

              <div>
                {/* Images indicator or Project header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-zinc-500 font-mono">
                    <Calendar size={11} />
                    <span>{new Date(proj.createdAt).toLocaleDateString()}</span>
                  </div>
                  {proj.images && proj.images.length > 0 ? (
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shadow-sm shrink-0">
                      <img src={proj.images[0]} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-card/5 border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                      <Cpu size={20} />
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-extrabold text-white group-hover:text-primary transition-colors text-right line-clamp-1">
                  {proj.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 text-right leading-relaxed line-clamp-3">
                  {proj.summary}
                </p>
              </div>

              <div>
                {/* Tags List */}
                <div className="flex flex-wrap gap-1.5 justify-end mt-4 line-clamp-1 h-6">
                  {proj.componentsList && proj.componentsList.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg bg-zinc-900 border border-border text-muted-foreground group-hover:border-primary/20 group-hover:text-primary transition-colors whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                  {proj.componentsList && proj.componentsList.length > 3 && (
                    <span className="text-[9px] font-bold px-1.5 py-1 text-muted-foreground whitespace-nowrap">
                      +{proj.componentsList.length - 3}
                    </span>
                  )}
                </div>

                {/* Card Footer: Author & Metrics */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                  
                  {/* Metrics list */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground dark:text-zinc-500 font-mono">
                    <div className="flex items-center gap-1" title="Views">
                      <Eye size={12} />
                      <span>{proj.metrics?.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Likes">
                      <ThumbsUp size={12} />
                      <span>{proj.metrics?.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Clones">
                      <Copy size={12} />
                      <span>{proj.metrics?.clones || 0}</span>
                    </div>
                  </div>

                  {/* Author Name */}
                  <div className="flex items-center gap-2 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${proj.ownerUsername}`);
                  }}>
                    <span className="text-xs text-muted-foreground hover:text-white font-medium transition-colors">
                      @{proj.ownerUsername}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-slate-800 border border-border flex items-center justify-center text-[9px] font-bold text-white uppercase shadow-sm">
                      {proj.ownerName.charAt(0)}
                    </div>
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
