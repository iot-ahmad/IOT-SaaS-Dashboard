import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, deleteDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  ArrowLeft, Cpu, Eye, ThumbsUp, Copy, Calendar, FileText,
  Check, Sparkles, AlertCircle, Zap, User, ChevronLeft, ChevronRight,
  Trash2, MessageSquare, Flame, HelpCircle, Share2, Layers
} from 'lucide-react';
import { MarkdownPreview } from './ProjectPublisher';
import { SchematicSvgViewer } from './ui/WiringBuilder';
import { useMessaging } from '../context/MessagingContext';

export default function ProjectDetail({ currentUser }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { startConversation } = useMessaging();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState('');
  const [activeCompIdx, setActiveCompIdx] = useState(0);
  const [publicQaList, setPublicQaList] = useState([]);
  const viewIncremented = useRef(false);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.')) return;
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

    // Subscribe to Public Q&A subcollection
    const qaRef = collection(db, 'projects', projectId, 'public_qa');
    const q = query(qaRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPublicQaList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn('Public QA subscription info:', err.message);
    });

    return () => unsub();
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

  // Direct Message Project Owner
  const handleMessageOwner = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (project.ownerId === currentUser.uid) {
      alert('أنت صاحب هذا المشروع!');
      return;
    }
    startConversation({
      recipientId: project.ownerId,
      recipientName: project.ownerName || 'Project Author',
      recipientAvatar: '',
      projectId: project.id,
      projectTitle: project.title
    });
  };

  // Use as template
  const handleUseAsTemplate = () => {
    navigate('/hub/new');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل المشروع والمخططات...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto text-center py-20 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">خطأ في التحميل</h3>
        <p className="text-sm text-muted-foreground mt-3">{error || 'المشروع غير موجود.'}</p>
        <button
          onClick={() => navigate('/hub')}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="mt-6 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
        >
          العودة للمستودع العام
        </button>
      </div>
    );
  }

  // Structured components data or fallback
  const structuredComponents = project.componentsData || [];
  const connectionsData = project.connectionsData || [];
  const tagComponents = project.componentsList || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-right" dir="rtl">

      {/* ── Top Action Bar ─────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-border pb-5">
        <div className="flex gap-2 flex-wrap">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
              liked
                ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-sm shadow-red-500/10'
                : 'bg-card/5 border-border text-muted-foreground hover:border-white/20 hover:text-white'
            }`}
          >
            <ThumbsUp size={14} className={liked ? 'fill-current' : ''} />
            <span>{liked ? 'أعجبني ' : 'إعجاب'}</span>
            <span className="bg-black/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">{project.metrics?.likes || 0}</span>
          </button>

          {/* Message Project Owner Button */}
          {(!currentUser || currentUser.uid !== project.ownerId) && (
            <button
              onClick={handleMessageOwner}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-sky-500/10 border border-sky-500/25 text-sky-400 hover:bg-sky-500/20 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageSquare size={14} />
              <span>تواصل مع صاحب المشروع</span>
            </button>
          )}

          {/* Use as template */}
          <button
            onClick={handleUseAsTemplate}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Flame size={14} />
            <span>استخدم كنموذج لمشروعك</span>
          </button>

          {/* Copy Documentation */}
          <button
            onClick={handleClone}
            style={copied ? {} : { background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            className={`px-4 py-2 text-xs font-bold transition-all rounded-xl border flex items-center gap-2 cursor-pointer ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'border-transparent hover:opacity-90 shadow-lg shadow-primary/20'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'تم النسخ! ✓' : 'نسخ التوثيق'}</span>
          </button>

          {/* Delete Project (Owner Only) */}
          {currentUser && project.ownerId === currentUser.uid && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Trash2 size={14} />
              <span>حذف المشروع</span>
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/hub')}
          className="bg-card/5 text-slate-300 border border-border px-4 py-2 rounded-xl hover:bg-card/10 transition-colors flex items-center gap-2 text-xs cursor-pointer"
        >
          المستودع العام <ArrowLeft size={14} className="rotate-180" />
        </button>
      </div>

      {/* ── Hero: Title + Summary + Author ─────────────────── */}
      <div className="bg-card/[0.01] border border-border p-8 rounded-3xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                project.visibility === 'public'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              }`}>
                {project.visibility === 'public' ? ' عام' : ' خاص'}
              </span>
              {project.difficulty && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  {project.difficulty}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Calendar size={11} />
                {new Date(project.createdAt).toLocaleDateString('ar-EG')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{project.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{project.summary}</p>
          </div>

          {/* Author Card mini */}
          <div className="shrink-0 bg-[#0d0e12] border border-border rounded-2xl p-4 space-y-3 min-w-[200px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-sm font-black text-primary uppercase shrink-0">
                {(project.ownerName || 'U').charAt(0)}
              </div>
              <div>
                <button
                  onClick={() => navigate(`/${project.ownerUsername}`)}
                  className="font-bold text-white hover:text-primary transition-colors text-xs cursor-pointer block"
                >
                  {project.ownerName}
                </button>
                <p className="text-[10px] text-muted-foreground">@{project.ownerUsername}</p>
              </div>
            </div>

            {/* Quick Message CTA */}
            {(!currentUser || currentUser.uid !== project.ownerId) && (
              <button
                onClick={handleMessageOwner}
                className="w-full py-1.5 px-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={12} />
                مراسلة المطور
              </button>
            )}

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
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
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
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-primary" />
              الأجهزة والقطع المستخدمة في المشروع ({structuredComponents.length})
            </h2>
            <div className="flex items-center gap-2">
              {activeCompIdx > 0 && (
                <button
                  onClick={() => setActiveCompIdx(i => i - 1)}
                  className="p-1.5 rounded-xl bg-card/5 border border-border hover:border-primary/30 text-muted-foreground hover:text-white transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              )}
              <span className="text-xs text-muted-foreground font-mono">
                {activeCompIdx + 1} / {structuredComponents.length}
              </span>
              {activeCompIdx < structuredComponents.length - 1 && (
                <button
                  onClick={() => setActiveCompIdx(i => i + 1)}
                  className="p-1.5 rounded-xl bg-card/5 border border-border hover:border-primary/30 text-muted-foreground hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Component Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {structuredComponents.map((comp, idx) => (
              <div
                key={idx}
                className={`bg-card/[0.01] border rounded-2xl p-4 space-y-3 backdrop-blur-xl transition-all cursor-pointer ${
                  activeCompIdx === idx ? 'border-primary/60 shadow-lg shadow-primary/5' : 'border-border hover:border-border/80'
                }`}
                onClick={() => setActiveCompIdx(idx)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-black/30 shrink-0">
                    {comp.imageUrl ? (
                      <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Cpu size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary mb-1">
                      {comp.category || 'PART'}
                    </span>
                    <h3 className="font-bold text-white text-xs truncate">{comp.name}</h3>
                  </div>
                </div>

                {comp.function && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{comp.function}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wiring Diagram & Circuit Schematic Section ─────── */}
      <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            مخطط التوصيل والدوائر الإلكترونية (Circuit Wiring)
          </h2>
          {connectionsData.length > 0 && (
            <span className="text-xs font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-xl">
              {connectionsData.length} أسلاك موصولة
            </span>
          )}
        </div>

        {/* Auto Generated Schematic Render */}
        {connectionsData.length > 0 ? (
          <SchematicSvgViewer components={structuredComponents} connections={connectionsData} />
        ) : project.wiringImageUrl ? (
          <div className="rounded-2xl overflow-hidden border border-border shadow-xl bg-black/40 text-center p-4">
            <img src={project.wiringImageUrl} alt="مخطط التوصيل" className="w-full object-contain max-h-[420px] mx-auto rounded-xl" loading="lazy" />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">لم يتم إرفاق مخطط توصيل لهذا المشروع.</p>
        )}

        {project.wiringDescription && (
          <div className="space-y-1.5 pt-2">
            <h4 className="text-xs font-bold text-white">إرشادات التوصيل:</h4>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-card dark:bg-[#07090e] p-4 rounded-2xl border border-border">
              {project.wiringDescription}
            </div>
          </div>
        )}
      </div>

      {/* ── Full Technical Documentation & Code ─────────────── */}
      <div className="bg-card/[0.01] border border-border rounded-3xl backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-primary animate-pulse" /> التوثيق الفني والبرمجي الكامل
          </h3>
          <button
            onClick={handleClone}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Copy size={12} />
            نسخ الكود والتوثيق
          </button>
        </div>
        <div className="p-8 md:p-12">
          <MarkdownPreview text={project.content} />
        </div>
      </div>

      {/* ── Community Q&A Section (Converted from DMs) ──────── */}
      {publicQaList.length > 0 && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <HelpCircle size={18} className="text-amber-400" />
              الأسئلة الشائعة وحلول المجتمع (Community Q&A)
            </h3>
            <span className="text-xs text-muted-foreground font-mono">{publicQaList.length} استفسارات موثقة</span>
          </div>

          <div className="space-y-3">
            {publicQaList.map(qa => (
              <div key={qa.id} className="p-4 rounded-2xl bg-card dark:bg-[#090b10] border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {qa.question}
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    بواسطة {qa.authorName || 'عضو في المجتمع'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-card/40 p-3 rounded-xl border border-white/5">
                  {qa.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
