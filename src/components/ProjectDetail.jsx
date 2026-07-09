import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import {
  ArrowLeft, Cpu, Eye, ThumbsUp, Copy, Calendar, FileText,
  Check, Sparkles, AlertCircle, Zap, User, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { MarkdownPreview } from './ProjectPublisher';

export default function ProjectDetail({ currentUser }) {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [activeCompIdx, setActiveCompIdx] = useState(0);
  const viewIncremented = useRef(false);

  const handleDelete = async () => {
    if (!window.confirm('هل تريد الحذف؟')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'projects', projectId));
      navigate('/hub');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء محاولة حذف المشروع.');
      setLoading(false);
    }
  };

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
          if (data.images?.length > 0) setActiveImage(data.images[0]);
          const likedKey = `liked_project_${projectId}`;
          if (localStorage.getItem(likedKey)) setLiked(true);
          if (!viewIncremented.current) {
            viewIncremented.current = true;
            updateDoc(docRef, { 'metrics.views': increment(1) }).catch(() => {});
          }
        } else {
          setError('المشروع غير موجود أو تم حذفه.');
        }
      } catch (err) {
        console.error(err);
        setError('حدث خطأ أثناء تحميل تفاصيل المشروع.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleLike = async () => {
    const docRef = doc(db, 'projects', projectId);
    const likedKey = `liked_project_${projectId}`;
    try {
      if (liked) {
        setLiked(false);
        localStorage.removeItem(likedKey);
        setProject(prev => prev ? { ...prev, metrics: { ...prev.metrics, likes: Math.max(0, prev.metrics.likes - 1) } } : null);
        await updateDoc(docRef, { 'metrics.likes': increment(-1) });
      } else {
        setLiked(true);
        localStorage.setItem(likedKey, 'true');
        setProject(prev => prev ? { ...prev, metrics: { ...prev.metrics, likes: prev.metrics.likes + 1 } } : null);
        await updateDoc(docRef, { 'metrics.likes': increment(1) });
      }
    } catch (err) { console.error(err); }
  };

  const handleClone = async () => {
    if (!project) return;
    try {
      navigator.clipboard.writeText(project.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      const docRef = doc(db, 'projects', projectId);
      updateDoc(docRef, { 'metrics.clones': increment(1) }).catch(() => {});
      setProject(prev => prev ? { ...prev, metrics: { ...prev.metrics, clones: prev.metrics.clones + 1 } } : null);
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل المشروع...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">خطأ في التحميل</h3>
        <p className="text-sm text-muted-foreground mt-3">{error || 'المشروع غير موجود.'}</p>
        <button onClick={() => navigate('/hub')}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="mt-6 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer">
          العودة للمستودع العام
        </button>
      </div>
    );
  }

  // Structured components data (new format) or fallback to tags only
  const structuredComponents = project.componentsData || [];
  const tagComponents = project.componentsList || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Top Action Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-5">
        <div className="flex gap-2 flex-wrap">
          {/* Like */}
          <button onClick={handleLike}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              liked
                ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-sm shadow-red-500/10'
                : 'bg-card/5 border-border text-muted-foreground hover:border-white/20 hover:text-white'
            }`}>
            <ThumbsUp size={14} className={liked ? 'fill-current' : ''} />
            <span>{liked ? 'أعجبني ❤️' : 'إعجاب'}</span>
            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">{project.metrics?.likes || 0}</span>
          </button>

          {/* Copy Documentation */}
          <button onClick={handleClone}
            style={copied ? {} : { background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            className={`px-4 py-2.5 text-xs font-bold transition-all rounded-xl border flex items-center gap-2 cursor-pointer ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'border-transparent hover:opacity-90 shadow-lg shadow-primary/20'
            }`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ! ✓' : 'نسخ التوثيق'}</span>
          </button>

          {/* Delete Project (Owner Only) */}
          {currentUser && project.ownerId === currentUser.uid && (
            <button onClick={handleDelete}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-2 cursor-pointer shadow-sm shadow-red-500/5">
              <Trash2 size={14} />
              <span>حذف المشروع</span>
            </button>
          )}
        </div>

        <button onClick={() => navigate('/hub')}
          className="bg-card/5 text-slate-300 border border-border px-4 py-2.5 rounded-xl hover:bg-card/10 transition-colors flex items-center gap-2 text-xs cursor-pointer">
          المستودع العام <ArrowLeft size={14} />
        </button>
      </div>

      {/* ── Hero: Title + Summary + Author ─────────────────── */}
      <div className="bg-card/[0.01] border border-border p-8 rounded-3xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-3 text-right" dir="rtl">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                project.visibility === 'public'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              }`}>
                {project.visibility === 'public' ? '🌐 عام' : '🔒 خاص'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar size={11} />
                {new Date(project.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{project.title}</h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mr-auto">{project.summary}</p>
          </div>

          {/* Author Card mini */}
          <div className="shrink-0 bg-[#0d0e12] border border-border rounded-2xl p-4 space-y-3 min-w-[180px]">
            <div className="flex items-center gap-3 justify-end">
              <div className="text-right">
                <button onClick={() => navigate(`/${project.ownerUsername}`)}
                  className="font-bold text-white hover:text-primary transition-colors text-sm cursor-pointer">{project.ownerName}</button>
                <p className="text-[11px] text-muted-foreground">@{project.ownerUsername}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary uppercase shrink-0">
                {project.ownerName.charAt(0)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
              {[
                { icon: Eye, val: project.metrics?.views || 0, label: 'مشاهدة' },
                { icon: ThumbsUp, val: project.metrics?.likes || 0, label: 'إعجاب' },
                { icon: Copy, val: project.metrics?.clones || 0, label: 'نسخ' },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label}>
                  <Icon size={12} className="text-muted-foreground mx-auto mb-0.5" />
                  <span className="block text-xs font-black text-white font-mono">{val}</span>
                  <span className="text-[9px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        {tagComponents.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
            {tagComponents.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/15 text-[11px] text-primary font-bold">
                <Cpu size={10} /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Structured Hardware Components Section ─────────── */}
      {structuredComponents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeCompIdx > 0 && (
                <button onClick={() => setActiveCompIdx(i => i - 1)}
                  className="p-2 rounded-xl bg-card/5 border border-border hover:border-primary/30 text-muted-foreground hover:text-white transition-all cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {activeCompIdx + 1} / {structuredComponents.length}
              </span>
              {activeCompIdx < structuredComponents.length - 1 && (
                <button onClick={() => setActiveCompIdx(i => i + 1)}
                  className="p-2 rounded-xl bg-card/5 border border-border hover:border-primary/30 text-muted-foreground hover:text-white transition-all cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-primary" /> الأجهزة والقطع المستخدمة
            </h2>
          </div>

          {/* Component Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {structuredComponents.map((comp, idx) => (
              <div key={idx}
                className={`bg-card/[0.01] border rounded-2xl p-5 space-y-3 backdrop-blur-xl transition-all ${
                  activeCompIdx === idx ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-border hover:border-border/80'
                }`}
                onClick={() => setActiveCompIdx(idx)}>
                {comp.imageUrl ? (
                  <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-black/30">
                    <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-contain" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-xl border border-border bg-zinc-950 flex items-center justify-center">
                    <Cpu size={32} className="text-muted-foreground/30" />
                  </div>
                )}
                <div className="text-right" dir="rtl">
                  <h3 className="font-bold text-white text-sm">{comp.name}</h3>
                  {comp.function && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{comp.function}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wiring Diagram Section ─────────────────────────── */}
      {(project.wiringImageUrl || project.wiringDescription) && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-border pb-2" dir="rtl">
            <Zap size={18} className="text-primary" /> مخطط التوصيل الكهربائي النهائي
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {project.wiringImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-border shadow-xl bg-black/40">
                <img src={project.wiringImageUrl} alt="مخطط التوصيل" className="w-full object-contain max-h-[420px]" loading="lazy" />
              </div>
            )}
            {project.wiringDescription && (
              <div className="text-right space-y-2" dir="rtl">
                <h4 className="text-sm font-bold text-white">شرح التوصيل</h4>
                <div className="text-sm text-slate-300/90 leading-relaxed whitespace-pre-line">
                  {project.wiringDescription}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Full Technical Documentation ───────────────────── */}
      <div className="bg-card/[0.01] border border-border rounded-3xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">Documentation & Code Preview</span>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-primary animate-pulse" /> التوثيق الفني والبرمجي
          </h3>
        </div>
        {/* Full-width, unconstrained documentation reading area */}
        <div className="p-8 md:p-12">
          <MarkdownPreview text={project.content} />
        </div>
      </div>

      {/* ── Old-style image gallery (backward compat) ──────── */}
      {project.images && project.images.length > 0 && structuredComponents.length === 0 && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-4">
          <h3 className="text-sm font-bold text-white text-right" dir="rtl">صور المشروع</h3>
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-black/40">
            <img src={activeImage} alt={project.title} className="w-full h-full object-contain" />
          </div>
          {project.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {project.images.map((imgUrl, idx) => (
                <button key={idx} onClick={() => setActiveImage(imgUrl)}
                  className={`aspect-video w-20 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer ${
                    activeImage === imgUrl ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-white/30'
                  }`}>
                  <img src={imgUrl} alt={`img-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
