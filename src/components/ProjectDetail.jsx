import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { ArrowLeft, Cpu, Eye, ThumbsUp, Copy, Calendar, User, FileText, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './ui/neon-button';
import { MarkdownPreview } from './ProjectPublisher';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // States
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const viewIncremented = useRef(false);

  // Load project details
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'projects', projectId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();
          setProject(data);
          
          if (data.images && data.images.length > 0) {
            setActiveImage(data.images[0]);
          }

          // Check if already liked in local storage
          const likedKey = `liked_project_${projectId}`;
          if (localStorage.getItem(likedKey)) {
            setLiked(true);
          }

          // Increment view count on mount if not already incremented in this session
          if (!viewIncremented.current) {
            viewIncremented.current = true;
            updateDoc(docRef, {
              'metrics.views': increment(1)
            }).catch(() => {});
          }

        } else {
          setError('المشروع غير موجود أو تم حذفه.');
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError('حدث خطأ أثناء تحميل تفاصيل المشروع.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Handle Like
  const handleLike = async () => {
    const docRef = doc(db, 'projects', projectId);
    const likedKey = `liked_project_${projectId}`;
    
    try {
      if (liked) {
        // Unlike
        setLiked(false);
        localStorage.removeItem(likedKey);
        setProject(prev => prev ? {
          ...prev,
          metrics: { ...prev.metrics, likes: Math.max(0, prev.metrics.likes - 1) }
        } : null);
        await updateDoc(docRef, {
          'metrics.likes': increment(-1)
        });
      } else {
        // Like
        setLiked(true);
        localStorage.setItem(likedKey, 'true');
        setProject(prev => prev ? {
          ...prev,
          metrics: { ...prev.metrics, likes: prev.metrics.likes + 1 }
        } : null);
        await updateDoc(docRef, {
          'metrics.likes': increment(1)
        });
      }
    } catch (err) {
      console.error("Error liking project:", err);
    }
  };

  // Handle Clone / Copy Documentation
  const handleClone = async () => {
    if (!project) return;
    try {
      navigator.clipboard.writeText(project.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Increment clones count
      const docRef = doc(db, 'projects', projectId);
      updateDoc(docRef, {
        'metrics.clones': increment(1)
      }).catch(() => {});

      setProject(prev => prev ? {
        ...prev,
        metrics: { ...prev.metrics, clones: prev.metrics.clones + 1 }
      } : null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">خطأ في التحميل</h3>
        <p className="text-sm text-muted-foreground mt-3">{error || 'المشروع غير موجود.'}</p>
        <button
          onClick={() => navigate('/hub')}
          className="mt-6 bg-primary text-black font-bold px-6 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
        >
          العودة للمستودع العام
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Back button & Action list */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div className="flex gap-2">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              liked
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-card/5 border-border text-muted-foreground hover:border-white/20'
            }`}
          >
            <ThumbsUp size={14} className={liked ? 'fill-current' : ''} />
            <span>{liked ? 'أعجبني' : 'إعجاب'}</span>
          </button>
          
          {/* Clone/Copy Code */}
          <button
            onClick={handleClone}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              copied
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-primary text-black border-transparent hover:bg-primary/90'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'تم نسخ التوثيق!' : 'نسخ التوثيق البرمجي'}</span>
          </button>
        </div>

        <button
          onClick={() => navigate('/hub')}
          className="bg-card/5 text-slate-300 border border-border px-4 py-2 rounded-xl hover:bg-card/10 transition-colors flex items-center gap-2 text-xs cursor-pointer"
        >
          المستودع العام
          <ArrowLeft size={14} />
        </button>
      </div>

      {/* Main Grid: Info Cards & Media */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Author card, Components list, Schematics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Author Card */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase text-right">المطور المسؤول</h4>
            <div className="flex items-center gap-3 justify-end text-right">
              <div>
                <button
                  onClick={() => navigate(`/${project.ownerUsername}`)}
                  className="font-bold text-white hover:text-primary transition-colors text-sm"
                >
                  {project.ownerName}
                </button>
                <p className="text-xs text-muted-foreground">@{project.ownerUsername}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-border flex items-center justify-center text-sm font-bold text-white uppercase shadow-md shrink-0">
                {project.ownerName.charAt(0)}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 mt-3 text-xs text-muted-foreground">
              <span className="font-mono">{new Date(project.createdAt).toLocaleDateString()}</span>
              <span>تاريخ النشر</span>
            </div>
          </div>

          {/* Project Hardware Metrics */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl">
            <h4 className="text-xs font-bold text-muted-foreground uppercase text-right mb-4">التفاعل مع المشروع</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-card/5 p-3 rounded-2xl border border-border">
                <Eye className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <span className="block text-sm font-black text-white font-mono">{project.metrics?.views || 0}</span>
                <span className="text-[10px] text-muted-foreground">مشاهدة</span>
              </div>
              <div className="bg-card/5 p-3 rounded-2xl border border-border">
                <ThumbsUp className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <span className="block text-sm font-black text-white font-mono">{project.metrics?.likes || 0}</span>
                <span className="text-[10px] text-muted-foreground">إعجاب</span>
              </div>
              <div className="bg-card/5 p-3 rounded-2xl border border-border">
                <Copy className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                <span className="block text-sm font-black text-white font-mono">{project.metrics?.clones || 0}</span>
                <span className="text-[10px] text-muted-foreground">نسخ الكود</span>
              </div>
            </div>
          </div>

          {/* Components List */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl">
            <h4 className="text-xs font-bold text-muted-foreground uppercase text-right mb-3">القطع الإلكترونية المستخدمة</h4>
            <div className="flex flex-wrap gap-2 justify-end">
              {project.componentsList && project.componentsList.length > 0 ? (
                project.componentsList.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-border text-xs text-primary font-bold"
                  >
                    <Cpu size={12} className="shrink-0" />
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">لم يتم تحديد قطع لهذا المشروع.</span>
              )}
            </div>
          </div>

          {/* Schematic Diagrams & Files */}
          {project.schematics && project.schematics.length > 0 && (
            <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase text-right">مخططات التوصيل والدوائر الكهربائية</h4>
              <div className="space-y-2">
                {project.schematics.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-card/5 border border-border rounded-xl p-3 text-xs text-slate-300 hover:bg-card/10 hover:text-white transition-all hover:border-primary/20"
                  >
                    <FileText size={14} className="text-primary shrink-0" />
                    <span className="truncate font-mono font-medium max-w-[80%]">مخطط الدائرة الكهربائية #{idx + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Title, description, image gallery, documentation markdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-4">
            <div className="space-y-2 text-right">
              <h1 className="text-2xl md:text-3xl font-black text-white">{project.title}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{project.summary}</p>
            </div>

            {/* Image Gallery */}
            {project.images && project.images.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black/40">
                  <img src={activeImage} alt={project.title} className="w-full h-full object-contain" />
                </div>
                
                {project.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {project.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(imgUrl)}
                        className={`aspect-video w-20 rounded-xl overflow-hidden border shrink-0 transition-all ${
                          activeImage === imgUrl ? 'border-primary scale-95 ring-2 ring-primary/45' : 'border-border hover:border-white/30'
                        }`}
                      >
                        <img src={imgUrl} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Technical Documentation Markup */}
          <div className="bg-card/[0.01] border border-border p-8 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
              <span className="text-[10px] text-muted-foreground font-mono">DOCUMENTATION & CODE PREVIEW</span>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-primary" /> التوثيق الفني والبرمجي
              </h3>
            </div>
            
            <MarkdownPreview text={project.content} />
          </div>

        </div>

      </div>

    </div>
  );
}
