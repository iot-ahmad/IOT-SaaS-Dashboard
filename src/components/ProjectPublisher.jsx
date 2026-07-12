import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import { uploadToCloudinary, compressImage } from '../lib/cloudinaryUpload';
import {
  ArrowLeft, ArrowRight, Upload, X, Cpu, Eye, Code, CheckCircle2,
  AlertCircle, Sparkles, Plus, Trash2, ImagePlus, Zap, FileText,
  ChevronRight, Info
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// MarkdownPreview – exported so the project view can reuse it
// ─────────────────────────────────────────────────────────────
export const MarkdownPreview = ({ text }) => {
  if (!text) return <p className="text-muted-foreground dark:text-white/20 text-sm italic">لا يوجد توثيق بعد...</p>;

  const parseMarkdown = (markdownText) => {
    const lines = markdownText.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push({ type: 'code', content: codeLines.join('\n'), language: codeLanguage });
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim() || 'cpp';
        }
        continue;
      }
      if (inCodeBlock) { codeLines.push(line); continue; }

      if (line.startsWith('# ')) { elements.push({ type: 'h1', content: line.substring(2) }); continue; }
      if (line.startsWith('## ')) { elements.push({ type: 'h2', content: line.substring(3) }); continue; }
      if (line.startsWith('### ')) { elements.push({ type: 'h3', content: line.substring(4) }); continue; }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        elements.push({ type: 'li', content: line.trim().substring(2) }); continue;
      }
      if (line.startsWith('> ')) { elements.push({ type: 'blockquote', content: line.substring(2) }); continue; }
      // Image: ![alt](url)
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) { elements.push({ type: 'img', alt: imgMatch[1], src: imgMatch[2] }); continue; }

      elements.push({ type: 'p', content: line });
    }
    if (inCodeBlock && codeLines.length > 0) {
      elements.push({ type: 'code', content: codeLines.join('\n'), language: codeLanguage });
    }
    return elements;
  };

  const highlightCode = (code) => {
    const keywords = /\b(const|let|var|void|setup|loop|if|else|for|while|return|class|import|from|export|default|include|define|int|float|double|char|bool|boolean|string|String|digitalWrite|digitalRead|analogWrite|analogRead|pinMode|delay|Serial|begin|println|print|pub|fn|struct|new)\b/g;
    const strings = /(["|'`])(.*?)\1/g;
    const numbers = /\b(\d+)\b/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g;

    let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(comments, '<span class="text-muted-foreground dark:text-zinc-500 font-mono">$1</span>');
    html = html.replace(keywords, (m) => `<span class="text-[#c084fc] dark:text-purple-400 font-bold">${m}</span>`);
    html = html.replace(strings, '<span class="text-emerald-400 font-mono">"$2"</span>');
    html = html.replace(numbers, '<span class="text-amber-400 font-mono">$1</span>');
    return html;
  };

  const formatText = (t) => {
    let s = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-foreground">$1</strong>');
    s = s.replace(/`([^`]+)`/g, '<code class="bg-zinc-900 border border-border px-1.5 py-0.5 rounded font-mono text-pink-400 text-xs">$1</code>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-semibold">$1</a>');
    return s;
  };

  const parsedElements = parseMarkdown(text);

  return (
    <div className="space-y-4 font-sans text-foreground/90 leading-relaxed text-right rtl-text">
      {parsedElements.map((el, idx) => {
        if (el.type === 'h1') return (
          <h1 key={idx} className="text-2xl font-extrabold text-foreground mt-6 mb-3 border-b border-border pb-2">
            <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          </h1>
        );
        if (el.type === 'h2') return (
          <h2 key={idx} className="text-xl font-bold text-foreground mt-5 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          </h2>
        );
        if (el.type === 'h3') return (
          <h3 key={idx} className="text-lg font-bold text-foreground mt-4 mb-2">
            <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          </h3>
        );
        if (el.type === 'li') return (
          <div key={idx} className="flex gap-2 items-start text-sm pr-2 mt-1">
            <span className="text-primary mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          </div>
        );
        if (el.type === 'blockquote') return (
          <blockquote key={idx} className="border-r-4 border-primary/50 pr-4 pl-0 my-3 text-sm text-muted-foreground italic bg-card/[0.01] py-2 rounded-l-lg"
            dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
        );
        if (el.type === 'img') return (
          <div key={idx} className="my-4 rounded-2xl overflow-hidden border border-border shadow-lg">
            <img src={el.src} alt={el.alt || ''} className="w-full max-h-[420px] object-contain bg-black/30" loading="lazy" />
            {el.alt && <p className="text-[11px] text-muted-foreground text-center py-2 border-t border-border">{el.alt}</p>}
          </div>
        );
        if (el.type === 'code') return (
          <div key={idx} className="my-4 font-mono text-left" dir="ltr">
            <div className="flex items-center justify-between bg-zinc-950 px-4 py-1.5 border-t border-x border-border rounded-t-xl text-[10px] text-muted-foreground font-sans tracking-wide">
              <span>{el.language.toUpperCase()}</span>
              <button type="button" onClick={() => navigator.clipboard.writeText(el.content)}
                className="hover:text-primary transition-colors cursor-pointer">نسخ الكود</button>
            </div>
            <pre className="bg-[#030406] border border-border rounded-b-xl p-4 overflow-x-auto text-xs leading-relaxed font-mono scrollbar-thin text-left ltr-text text-slate-300">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(el.content) }} />
            </pre>
          </div>
        );
        if (el.content?.trim() === '') return <div key={idx} className="h-2" />;
        return <p key={idx} className="text-sm text-slate-300/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />;
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ComponentCard – individual hardware component editor card
// ─────────────────────────────────────────────────────────────
function ComponentCard({ comp, onChange, onRemove }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localError, setLocalError] = useState('');

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError('');
    setUploading(true);
    setUploadProgress(0);
    try {
      const compressed = await compressImage(file, 900, 900, 0.80);
      const url = await uploadToCloudinary(compressed, (p) => setUploadProgress(p), 'iot365/components');
      onChange({ ...comp, imageUrl: url });
    } catch (err) {
      setLocalError('فشل رفع الصورة – ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#0d0e12] border border-border rounded-2xl p-5 space-y-4 relative group hover:border-primary/30 transition-colors">
      {/* Remove Button */}
      <button type="button" onClick={onRemove}
        className="absolute top-3 left-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
        <Trash2 size={14} />
      </button>

      <div className="flex gap-4 items-start">
        {/* Image Upload Area */}
        <div className="shrink-0">
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImagePick} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className={`w-20 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden relative ${
              comp.imageUrl ? 'border-primary/30 hover:border-primary/60' : 'border-border hover:border-primary/50 bg-card/5'
            }`}>
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-[9px] text-primary font-bold">{uploadProgress}%</span>
              </div>
            ) : comp.imageUrl ? (
              <>
                <img src={comp.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImagePlus size={16} className="text-white" />
                </div>
              </>
            ) : (
              <>
                <ImagePlus size={18} className="text-muted-foreground mb-1" />
                <span className="text-[9px] text-muted-foreground leading-tight">أضف<br/>صورة</span>
              </>
            )}
          </button>
          {localError && <p className="text-[9px] text-red-400 mt-1 max-w-[80px] text-center leading-tight">{localError}</p>}
        </div>

        {/* Name + Function */}
        <div className="flex-1 space-y-3">
          <input
            type="text"
            placeholder="اسم القطعة / الجهاز (مثال: ESP32 DevKit)"
            value={comp.name}
            onChange={(e) => onChange({ ...comp, name: e.target.value })}
            className="w-full bg-card dark:bg-[#030406] border border-border rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-primary/60 text-sm text-right text-foreground placeholder:text-muted-foreground transition-colors"
            dir="rtl"
          />
          <textarea
            rows={2}
            placeholder="وظيفة هذه القطعة في المشروع..."
            value={comp.function}
            onChange={(e) => onChange({ ...comp, function: e.target.value })}
            className="w-full bg-card dark:bg-[#030406] border border-border rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-primary/60 text-sm text-right text-foreground placeholder:text-muted-foreground resize-none transition-colors"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Component: ProjectPublisher
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'البيانات الأساسية', icon: FileText },
  { num: 2, label: 'الأجهزة والقطع', icon: Cpu },
  { num: 3, label: 'التوثيق التقني', icon: Code },
  { num: 4, label: 'التوصيل الكهربائي', icon: Zap },
];

export default function ProjectPublisher({ user }) {
  const navigate = useNavigate();
  const wiringFileRef = useRef();

  const [projectId] = useState(() => doc(collection(db, 'projects')).id);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsername, setHasUsername] = useState(true);
  const [checkingUser, setCheckingUser] = useState(true);

  // Step 1
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState([]);

  // Step 2 – Components (each with name, function, imageUrl)
  const [componentsList, setComponentsList] = useState([
    { id: Date.now(), name: '', function: '', imageUrl: '' }
  ]);

  // Step 3 – Technical Documentation
  const [docTab, setDocTab] = useState('overview');
  const [secOverview, setSecOverview] = useState('');
  const [secCode, setSecCode] = useState('// اكتب الكود البرمجي هنا\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  // your logic here\n  delay(1000);\n}');
  const [secChallenges, setSecChallenges] = useState('');

  // Step 4 – Wiring Diagram
  const [wiringImageUrl, setWiringImageUrl] = useState('');
  const [wiringUploading, setWiringUploading] = useState(false);
  const [wiringProgress, setWiringProgress] = useState(0);
  const [wiringDescription, setWiringDescription] = useState('');

  // Check username
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        setHasUsername(snap.exists() && !!snap.data().username);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingUser(false);
      }
    };
    check();
  }, [user]);

  // ── Handlers ──────────────────────────────────────────────

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tagsList.includes(val)) setTagsList(prev => [...prev, val]);
      setTagInput('');
    }
  };

  const addComponent = () => {
    setComponentsList(prev => [...prev, { id: Date.now(), name: '', function: '', imageUrl: '' }]);
  };

  const updateComponent = (id, updated) => {
    setComponentsList(prev => prev.map(c => c.id === id ? updated : c));
  };

  const removeComponent = (id) => {
    setComponentsList(prev => prev.filter(c => c.id !== id));
  };

  const handleWiringUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWiringUploading(true);
    setWiringProgress(0);
    try {
      const compressed = await compressImage(file, 1400, 1400, 0.85);
      const url = await uploadToCloudinary(compressed, (p) => setWiringProgress(p), 'iot365/wiring');
      setWiringImageUrl(url);
    } catch (err) {
      setError('فشل رفع مخطط التوصيل: ' + err.message);
    } finally {
      setWiringUploading(false);
    }
  };

  // Build compiled content for Firestore
  const buildDocContent = () => {
    const compSection = componentsList
      .filter(c => c.name)
      .map(c => `### ${c.name}\n${c.imageUrl ? `![${c.name}](${c.imageUrl})\n` : ''}${c.function || ''}`)
      .join('\n\n');

    return `# ${title || 'توثيق المشروع'}

## 📄 نظرة عامة (Overview)
${secOverview || 'لا يوجد وصف مضاف...'}

## 🔌 الأجهزة والقطع المستخدمة
${compSection || 'لم يتم إضافة أجهزة بعد...'}

## 💻 كود التشغيل (Arduino Sketch)
\`\`\`cpp
${secCode || '// الكود هنا'}
\`\`\`

## ⚡ مخطط التوصيل الكهربائي
${wiringDescription || ''}
${wiringImageUrl ? `\n![مخطط التوصيل](${wiringImageUrl})` : ''}

## ⚠️ ملاحظات وتحديات
${secChallenges || 'لا توجد ملاحظات مضافة...'}`;
  };

  const handlePublish = async () => {
    if (!title.trim() || !summary.trim()) {
      setError('الرجاء ملء العنوان والوصف المختصر على الأقل.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const profile = userSnap.exists() ? userSnap.data() : {};

      const projectData = {
        id: projectId,
        ownerId: user.uid,
        ownerUsername: profile.username || 'user',
        ownerName: profile.displayName || user.displayName || 'Developer',
        title: title.trim(),
        summary: summary.trim(),
        content: buildDocContent(),
        // Structured data for rich display
        componentsData: componentsList.filter(c => c.name),
        wiringImageUrl: wiringImageUrl || null,
        wiringDescription: wiringDescription.trim() || null,
        images: componentsList.filter(c => c.imageUrl).map(c => c.imageUrl),
        schematics: wiringImageUrl ? [wiringImageUrl] : [],
        componentsList: tagsList,
        visibility,
        metrics: { views: 0, likes: 0, clones: 0 },
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'projects', projectId), projectData);
      navigate(`/hub/project/${projectId}`);
    } catch (err) {
      console.error(err);
      setError('فشل نشر المشروع. تأكد من اتصال الإنترنت وصلاحيات قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // ── Early returns ──────────────────────────────────────────

  if (checkingUser) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasUsername) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">تحتاج إلى تعيين اسم مستخدم أولاً</h3>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          لتتمكن من نشر مشاريعك، يرجى التوجه لصفحة الإعدادات وإنشاء رابط Vanity URL.
        </p>
        <button onClick={() => navigate('/settings')}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="mt-6 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer">
          توجه إلى الإعدادات الآن
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6 animate-pulse" />
            أنشئ مشروع IoT جديد
          </h2>
          <p className="text-xs text-muted-foreground mt-1">شارك تصميم دوائرك وأكوادك مع مجتمع المطورين</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-center">
                <button type="button" onClick={() => step > s.num && setStep(s.num)}
                  disabled={step <= s.num}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    step === s.num
                      ? 'bg-primary text-black shadow-lg shadow-primary/20 ring-2 ring-primary/45'
                      : step > s.num
                      ? 'bg-primary/10 text-primary border border-primary/20 cursor-pointer'
                      : 'bg-card/5 text-muted-foreground border border-border'
                  }`}>
                  <Icon size={12} />
                  <span className="hidden sm:inline">{s.label}</span>
                  {step > s.num && <CheckCircle2 size={11} />}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className={`mx-0.5 ${step > s.num ? 'text-primary/60' : 'text-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* ─── STEP 1: Basic Info ──────────────────────────── */}
      {step === 1 && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl space-y-5 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <FileText size={18} className="text-primary" /> الخطوة 1: البيانات الأساسية
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 text-right">عنوان المشروع *</label>
                <input required type="text" placeholder="مثال: محطة طقس ذكية تدعم التنبيهات الفورية"
                  value={title} onChange={(e) => setTitle(e.target.value)} dir="rtl"
                  className="w-full bg-card/5 border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right text-foreground transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1.5 text-right">الخصوصية</label>
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
                  className="w-full bg-card dark:bg-[#0d0e12] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right text-foreground transition-colors">
                  <option value="public">عام (Public)</option>
                  <option value="private">خاص (Private)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 text-right">الوصف المختصر *</label>
              <textarea required rows={3} placeholder="صف الفكرة والهدف من مشروعك باختصار..."
                value={summary} onChange={(e) => setSummary(e.target.value)} dir="rtl"
                className="w-full bg-card/5 border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right text-foreground resize-none transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 text-right">
                وسوم / تصنيفات البحث (اختياري)
              </label>
              <input type="text" placeholder="اضغط Enter لإضافة وسم (ESP32, IoT, Arduino...)"
                value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                className="w-full bg-card/5 border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right text-foreground transition-colors" dir="rtl" />
              <div className="flex flex-wrap gap-2 mt-3">
                {tagsList.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    {tag}
                    <button type="button" onClick={() => setTagsList(t => t.filter((_, i) => i !== idx))}
                      className="hover:text-white transition-colors cursor-pointer"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Hardware Components ─────────────────── */}
      {step === 2 && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl space-y-5 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <button type="button" onClick={addComponent}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20">
              <Plus size={14} /> إضافة جهاز / قطعة
            </button>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Cpu size={18} className="text-primary" /> الخطوة 2: الأجهزة والقطع
            </h3>
          </div>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-2.5 text-right" dir="rtl">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              أضف كل جهاز أو قطعة إلكترونية بشكل منفصل مع صورة لها ووصف وظيفتها في المشروع.
              الصور تُرفع تلقائياً إلى Cloudinary عند اختيارها.
            </p>
          </div>

          <div className="space-y-4">
            {componentsList.map((comp) => (
              <ComponentCard
                key={comp.id}
                comp={comp}
                onChange={(updated) => updateComponent(comp.id, updated)}
                onRemove={() => removeComponent(comp.id)}
              />
            ))}
          </div>

          {componentsList.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Cpu size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد أجهزة مضافة. اضغط "إضافة جهاز" لتبدأ.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 3: Technical Docs ───────────────────────── */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Editor Panel */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[680px]">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 shrink-0">
              <Code size={16} className="text-primary animate-pulse" /> الخطوة 3: التوثيق التقني
            </h3>

            {/* Tabs */}
            <div className="flex gap-1.5 bg-muted dark:bg-[#0d0e12] border border-border p-1 rounded-xl shrink-0" dir="rtl">
              {[
                { id: 'overview', label: '📄 نظرة عامة' },
                { id: 'code', label: '💻 الكود' },
                { id: 'challenges', label: '⚠️ تحديات' },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => setDocTab(t.id)}
                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    docTab === t.id
                      ? 'bg-primary text-black shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/10'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col min-h-0">
              {docTab === 'overview' && (
                <textarea value={secOverview} onChange={(e) => setSecOverview(e.target.value)}
                  placeholder="اكتب هنا نظرة عامة عن المشروع وهدفه الأساسي..."
                  className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary/40 resize-none overflow-y-auto scrollbar-thin text-right leading-relaxed transition-colors"
                  dir="rtl" />
              )}
              {docTab === 'code' && (
                <textarea value={secCode} onChange={(e) => setSecCode(e.target.value)}
                  placeholder="// اكتب كود Arduino / ESP32 هنا"
                  className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary/40 resize-none overflow-y-auto scrollbar-thin text-left leading-relaxed transition-colors"
                  dir="ltr" />
              )}
              {docTab === 'challenges' && (
                <textarea value={secChallenges} onChange={(e) => setSecChallenges(e.target.value)}
                  placeholder="اكتب الصعوبات والتحديات التي واجهتها والحلول التي وجدتها..."
                  className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary/40 resize-none overflow-y-auto scrollbar-thin text-right leading-relaxed transition-colors"
                  dir="rtl" />
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="bg-card/[0.01] border border-border p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[680px] overflow-hidden">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 shrink-0">
              <Eye size={16} className="text-primary" /> معاينة حية للمستند
            </h3>
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
              <MarkdownPreview text={buildDocContent()} />
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: Wiring Diagram ───────────────────────── */}
      {step === 4 && (
        <div className="bg-card/[0.01] border border-border p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
            <Zap size={18} className="text-primary" /> الخطوة 4: التوصيل الكهربائي النهائي
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Zone */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-foreground text-right">صورة مخطط التوصيل (Wiring Diagram)</label>

              <input type="file" ref={wiringFileRef} accept="image/*" className="hidden" onChange={handleWiringUpload} />

              {wiringImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-primary/30 group shadow-xl shadow-primary/5">
                  <img src={wiringImageUrl} alt="مخطط التوصيل" className="w-full max-h-[300px] object-contain bg-black/40" />
                  <button type="button" onClick={() => { setWiringImageUrl(''); wiringFileRef.current.value = ''; }}
                    className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer">
                    <X size={14} />
                  </button>
                  <button type="button" onClick={() => wiringFileRef.current?.click()}
                    className="absolute bottom-3 left-3 px-3 py-1.5 text-xs bg-black/70 hover:bg-primary text-white hover:text-black rounded-xl transition-colors cursor-pointer font-bold">
                    تغيير الصورة
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => wiringFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-2xl p-10 bg-card/[0.01] hover:bg-card/[0.02] hover:border-primary/40 transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
                  {wiringUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-primary font-bold text-sm">{wiringProgress}%</span>
                      <span className="text-xs text-muted-foreground">جاري الرفع إلى Cloudinary...</span>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                      <span className="text-sm font-bold text-foreground/90">اسحب صورة مخطط التوصيل أو اضغط للتصفح</span>
                      <span className="text-[11px] text-muted-foreground mt-1">يدعم Fritzing diagrams أو صور التوصيل الفعلية</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Wiring Description */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-foreground text-right">شرح التوصيل (اختياري)</label>
              <textarea rows={8}
                placeholder="اشرح هنا طريقة التوصيل خطوة بخطوة:&#10;&#10;1. وصّل VCC الحساس بـ 3.3V على لوحة ESP32&#10;2. وصّل GND بـ GND&#10;3. وصّل منفذ البيانات (DATA) بـ GPIO25..."
                value={wiringDescription} onChange={(e) => setWiringDescription(e.target.value)} dir="rtl"
                className="w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary/40 resize-none overflow-y-auto scrollbar-thin text-right leading-relaxed transition-colors h-full" />
            </div>
          </div>

          {/* Summary preview of components */}
          {componentsList.filter(c => c.name).length > 0 && (
            <div className="border-t border-border pt-5">
              <p className="text-xs text-muted-foreground text-right mb-3">ملخص الأجهزة المُدخلة ({componentsList.filter(c => c.name).length} قطعة):</p>
              <div className="flex flex-wrap gap-3">
                {componentsList.filter(c => c.name).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-card dark:bg-[#0d0e12] border border-border rounded-xl px-3 py-2">
                    {c.imageUrl && (
                      <img src={c.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-border" />
                    )}
                    {!c.imageUrl && <Cpu size={14} className="text-primary" />}
                    <span className="text-xs font-semibold text-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Navigation Controls ──────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {step < 4 ? (
            <button type="button" onClick={() => { setError(''); setStep(step + 1); }}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer">
              الخطوة التالية <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={handlePublish}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="font-bold px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50">
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> جاري النشر...</>
              ) : (
                <><CheckCircle2 size={16} /> نشر المشروع للمجتمع</>
              )}
            </button>
          )}
        </div>
        <div>
          {step > 1 && (
            <button type="button" onClick={() => { setError(''); setStep(step - 1); }}
              className="bg-card/5 text-foreground border border-border px-6 py-2.5 rounded-xl hover:bg-card/10 transition-colors flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={16} /> الخطوة السابقة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
