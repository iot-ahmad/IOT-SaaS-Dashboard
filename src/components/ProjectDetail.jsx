import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, deleteDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import {
  ArrowLeft, Cpu, Eye, ThumbsUp, Copy, Calendar,
  Check, AlertCircle, Zap, User, ChevronLeft, ChevronRight,
  Trash2, MessageSquare, HelpCircle, Layers, ShieldCheck, Share2
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
  const [activeCompIdx, setActiveCompIdx] = useState(0);
  const [publicQaList, setPublicQaList] = useState([]);
  const viewIncremented = useRef(false);

  const handleDelete = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'projects', projectId));
      navigate('/hub/explore');
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
        setProject(prev => prev ? { ...prev, metrics: { ...prev.metrics, likes: (prev.metrics?.likes || 0) + 1 } } : null);
        await updateDoc(docRef, { 'metrics.likes': increment(1) });
      }
    } catch (err) { console.error(err); }
  };

  const handleClone = async () => {
    if (!project) return;
    try {
      navigator.clipboard.writeText(project.content || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      const docRef = doc(db, 'projects', projectId);
      updateDoc(docRef, { 'metrics.clones': increment(1) }).catch(() => {});
      setProject(prev => prev ? { ...prev, metrics: { ...prev.metrics, clones: (prev.metrics?.clones || 0) + 1 } } : null);
    } catch (err) { console.error(err); }
  };

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
      recipientName: project.ownerName || 'مطور المشروع',
      recipientAvatar: '',
      projectId: project.id,
      projectTitle: project.title
    });
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-[#18191c] border border-white/[0.08] p-8 rounded-2xl" dir="rtl">
        <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">خطأ في التحميل</h3>
        <p className="text-xs text-zinc-400 mt-2">{error || 'المشروع غير موجود.'}</p>
        <button
          onClick={() => navigate('/hub/explore')}
          className="mt-5 font-medium px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs transition-all cursor-pointer"
        >
          العودة لاستكشاف المشاريع
        </button>
      </div>
    );
  }

  const structuredComponents = project.componentsData || [];
  const connectionsData = project.connectionsData || [];
  const tagComponents = project.componentsList || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-right" dir="rtl">

      {/* ── Breadcrumb & Action Bar ─────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-white/[0.08] pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <button onClick={() => navigate('/hub/explore')} className="hover:text-white transition-colors">
            المشاريع
          </button>
          <span>/</span>
          <span className="text-white font-medium truncate max-w-[200px]">{project.title}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 cursor-pointer ${
              liked
                ? 'bg-white/[0.15] border-white/30 text-white'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <ThumbsUp size={13} className={liked ? 'fill-white' : ''} />
            <span>{liked ? 'أعجبني' : 'إعجاب'}</span>
            <span className="text-[10px] font-mono text-zinc-400">({project.metrics?.likes || 0})</span>
          </button>

          {/* Message Owner */}
          {(!currentUser || currentUser.uid !== project.ownerId) && (
            <button
              onClick={handleMessageOwner}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>مراسلة المطور</span>
            </button>
          )}

          {/* Copy Documentation */}
          <button
            onClick={handleClone}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ التوثيق'}</span>
          </button>

          {/* Delete (Owner) */}
          {currentUser && project.ownerId === currentUser.uid && (
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-xl text-xs font-medium border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>حذف</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Hero: Project Summary & Author Card ─────────────── */}
      <div className="bg-[#18191c] border border-white/[0.08] p-6 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                {project.difficulty || 'مبتدئ'}
              </span>
              <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                <Calendar size={11} />
                {new Date(project.createdAt || Date.now()).toLocaleDateString('ar-JO')}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">{project.title}</h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{project.summary}</p>
          </div>

          {/* Author info */}
          <div className="bg-[#1e2024] border border-white/[0.08] rounded-xl p-3.5 min-w-[200px] space-y-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] text-zinc-300 font-bold flex items-center justify-center text-xs">
                {(project.ownerName || 'U').charAt(0)}
              </div>
              <div>
                <button
                  onClick={() => navigate(`/${project.ownerUsername || 'user'}`)}
                  className="font-bold text-white hover:text-zinc-200 transition-colors text-xs block text-right"
                >
                  {project.ownerName || 'مطور'}
                </button>
                <p className="text-[10px] text-zinc-500 font-mono">@{project.ownerUsername || 'maker'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-white/[0.06] text-center text-zinc-400 text-[10px] font-mono">
              <div>
                <span className="block font-bold text-white text-xs">{project.metrics?.views || 0}</span>
                <span>مشاهدة</span>
              </div>
              <div>
                <span className="block font-bold text-white text-xs">{project.metrics?.likes || 0}</span>
                <span>إعجاب</span>
              </div>
              <div>
                <span className="block font-bold text-white text-xs">{project.metrics?.clones || 0}</span>
                <span>نسخ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tagComponents.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.06]">
            {tagComponents.map((tag, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-zinc-400 font-mono">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Bill of Materials (BOM) ─────────────────────────── */}
      {structuredComponents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu size={16} className="text-zinc-400" />
            <span>الأجهزة والقطع المستخدمة ({structuredComponents.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {structuredComponents.map((comp, idx) => (
              <div
                key={idx}
                className="bg-[#18191c] border border-white/[0.08] rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] bg-[#141518] shrink-0 flex items-center justify-center">
                    {comp.imageUrl ? (
                      <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Cpu size={18} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 block w-fit mb-0.5">
                      {comp.category || 'PART'}
                    </span>
                    <h3 className="font-bold text-white text-xs truncate">{comp.name}</h3>
                  </div>
                </div>
                {comp.function && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{comp.function}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wiring & Circuit Schematic Section ─────────────── */}
      <div className="bg-[#18191c] border border-white/[0.08] p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-zinc-400" />
            <span>مخطط التوصيل الكهربائي</span>
          </h2>
          {connectionsData.length > 0 && (
            <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded">
              {connectionsData.length} أسلاك موصولة
            </span>
          )}
        </div>

        {connectionsData.length > 0 ? (
          <SchematicSvgViewer components={structuredComponents} connections={connectionsData} />
        ) : project.wiringImageUrl ? (
          <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/40 text-center p-3">
            <img src={project.wiringImageUrl} alt="مخطط التوصيل" className="w-full object-contain max-h-[380px] mx-auto rounded-lg" />
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic">لم يتم إرفاق مخطط توصيل مرئي لهذا المشروع.</p>
        )}

        {project.wiringDescription && (
          <div className="space-y-1 pt-1">
            <h4 className="text-xs font-medium text-zinc-300">ملاحظات التوصيل:</h4>
            <div className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line bg-[#1e2024] p-3 rounded-xl border border-white/[0.06]">
              {project.wiringDescription}
            </div>
          </div>
        )}
      </div>

      {/* ── Technical Documentation ─────────────────────────── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Layers size={14} className="text-zinc-400" />
            <span>التوثيق الفني والأكواد البرمجية</span>
          </h3>
          <button
            onClick={handleClone}
            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Copy size={12} />
            <span>نسخ التوثيق</span>
          </button>
        </div>
        <div className="p-6 md:p-8">
          <MarkdownPreview text={project.content} />
        </div>
      </div>

      {/* ── Q&A Subcollection ──────────────────────────────── */}
      {publicQaList.length > 0 && (
        <div className="bg-[#18191c] border border-white/[0.08] p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2">
            الأسئلة الشائعة حول المشروع ({publicQaList.length})
          </h3>
          <div className="space-y-2">
            {publicQaList.map(qa => (
              <div key={qa.id} className="p-3 rounded-xl bg-[#1e2024] border border-white/[0.06] space-y-1.5">
                <h4 className="font-bold text-white text-xs">{qa.question}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
