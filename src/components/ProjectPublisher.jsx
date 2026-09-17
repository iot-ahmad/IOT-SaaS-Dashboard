import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft, ArrowRight, Upload, X, Cpu, Eye, Code, CheckCircle2,
  AlertCircle, Sparkles, Plus, Trash2, ImagePlus, Zap, FileText,
  ChevronRight, Info, Flame, Copy, HelpCircle, Layers, Star, MessageSquare
} from 'lucide-react';
import ComponentPicker from './ui/ComponentPicker';
import WiringBuilder, { SchematicSvgViewer } from './ui/WiringBuilder';
import ProjectLivePreview from './ui/ProjectLivePreview';
import FeaturedTemplatesModal from './ui/FeaturedTemplatesModal';
import { FEATURED_TEMPLATES } from '../data/featuredTemplates';

// ─────────────────────────────────────────────────────────────
// MarkdownPreview – exported so other components can reuse it
// ─────────────────────────────────────────────────────────────
export const MarkdownPreview = ({ text }) => {
  if (!text) return <p className="text-muted-foreground text-sm italic">لا يوجد توثيق بعد...</p>;

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
    html = html.replace(comments, '<span class="text-zinc-500 font-mono">$1</span>');
    html = html.replace(keywords, (m) => `<span class="text-purple-400 font-bold">${m}</span>`);
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
    <div className="space-y-4 font-sans text-foreground/90 leading-relaxed text-right rtl-text" dir="rtl">
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
// Wizard Steps Configuration
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'البيانات الأساسية', icon: FileText },
  { num: 2, label: 'الأجهزة والقطع', icon: Cpu },
  { num: 3, label: 'التوثيق التقني', icon: Code },
  { num: 4, label: 'التوصيل الكهربائي', icon: Zap },
  { num: 5, label: 'المعاينة والنشر', icon: Eye },
];

export default function ProjectPublisher({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [projectId] = useState(() => doc(collection(db, 'projects')).id);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsername, setHasUsername] = useState(true);
  const [checkingUser, setCheckingUser] = useState(true);

  // Template Modal State
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [activeTemplateOrigin, setActiveTemplateOrigin] = useState(null);

  // Mobile Live Preview Drawer
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [difficulty, setDifficulty] = useState('مبتدئ');
  const [visibility, setVisibility] = useState('public');
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState(['ESP32', 'IoT']);

  // Step 2: Components List (visual card based)
  const [componentsList, setComponentsList] = useState([
    {
      id: 'default-mcu',
      name: 'ESP32 NodeMCU DevKit V1',
      category: 'MCU',
      function: 'وحدة المعالجة المركزية والاتصال السحابي',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'default-sensor',
      name: 'DHT22 / AM2302',
      category: 'SENSOR',
      function: 'قياس درجات الحرارة والرطوبة',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
    }
  ]);

  // Step 3: Technical Documentation
  const [docTab, setDocTab] = useState('overview');
  const [secOverview, setSecOverview] = useState('');
  const [secCode, setSecCode] = useState('// اكتب كود Arduino / ESP32 هنا\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("IoT Project Initialized!");\n}\n\nvoid loop() {\n  // logic here\n  delay(1000);\n}');
  const [secChallenges, setSecChallenges] = useState('');

  // Step 4: Wiring Diagram (Auto Builder & Upload)
  const [connectionsList, setConnectionsList] = useState([
    { id: 'w1', fromComp: 'DHT22 / AM2302', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'Power' },
    { id: 'w2', fromComp: 'DHT22 / AM2302', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'Ground' },
    { id: 'w3', fromComp: 'DHT22 / AM2302', fromPin: 'DATA', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO25', color: '#F59E0B', note: 'Signal' }
  ]);
  const [wiringImageUrl, setWiringImageUrl] = useState('');
  const [wiringDescription, setWiringDescription] = useState('');

  // Check username on mount
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

  // Check if initiated with template param
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId) {
      const found = FEATURED_TEMPLATES.find(t => t.id === templateId);
      if (found) {
        handleApplyTemplate(found);
      }
    }
  }, [searchParams]);

  // ─── Template Application Handler ───
  const handleApplyTemplate = (template) => {
    setActiveTemplateOrigin(template.title);
    setTitle(`مشروع مستند إلى: ${template.title}`);
    setSummary(template.summary || '');
    setDifficulty(template.difficulty || 'مبتدئ');
    setTagsList(template.tags || ['ESP32', 'IoT']);
    if (template.components && template.components.length > 0) {
      setComponentsList(template.components);
    }
    if (template.connections && template.connections.length > 0) {
      setConnectionsList(template.connections);
    }
    if (template.overviewTemplate) {
      setSecOverview(template.overviewTemplate);
    }
    if (template.codeTemplate) {
      setSecCode(template.codeTemplate);
    }
  };

  // ─── Tags Handler ───
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tagsList.includes(val)) setTagsList(prev => [...prev, val]);
      setTagInput('');
    }
  };

  // ─── Markdown Compilation ───
  const buildDocContent = () => {
    const compSection = componentsList
      .filter(c => c.name)
      .map(c => `### ${c.name} (${c.category || 'PART'})\n${c.imageUrl ? `![${c.name}](${c.imageUrl})\n` : ''}${c.function || ''}`)
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

  // ─── Publish to Firestore ───
  const handlePublish = async () => {
    if (!title.trim() || !summary.trim()) {
      setError('الرجاء ملء العنوان والوصف المختصر للمشروع.');
      setStep(1);
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
        difficulty,
        content: buildDocContent(),
        // Structured parts and wiring
        componentsData: componentsList.filter(c => c.name),
        connectionsData: connectionsList,
        wiringImageUrl: wiringImageUrl || null,
        wiringDescription: wiringDescription.trim() || null,
        images: componentsList.filter(c => c.imageUrl).map(c => c.imageUrl),
        schematics: wiringImageUrl ? [wiringImageUrl] : [],
        componentsList: tagsList,
        visibility,
        is_featured: false,
        timesUsedAsTemplate: 0,
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

  // ─── Early returns ───
  if (checkingUser) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasUsername) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl" dir="rtl">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">تحتاج إلى تعيين اسم مستخدم أولاً</h3>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          لتتمكن من نشر مشاريعك في المجتمع، يرجى التوجه لصفحة ملفك الشخصي وتعيين اسم المستخدم.
        </p>
        <button
          onClick={() => navigate('/settings')}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="mt-6 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
        >
          توجه إلى الإعدادات الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 text-right" dir="rtl">
      
      {/* ─── Top Header & Templates Button ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Sparkles className="text-primary w-6 h-6 animate-pulse" />
              محرر ونشر مشاريع IoT المتكامل
            </h2>
            <button
              type="button"
              onClick={() => setIsMobilePreviewOpen(true)}
              className="xl:hidden px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} />
              معاينة البطاقة
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            صمم دوائرك، ابنِ مخططات التوصيل الذكية، وشارك كودك مع مجتمع مطوري الأجهزة الذكية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Featured Templates Trigger */}
          <button
            type="button"
            onClick={() => setTemplatesModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Flame size={15} />
            استخدم نموذجاً جاهزاً (Templates)
          </button>
        </div>
      </div>

      {/* ─── Template Banner (If started from template) ─── */}
      {activeTemplateOrigin && (
        <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-4 flex items-center justify-between gap-3 text-sky-400 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Copy size={16} className="shrink-0" />
            <span>
              بدأت من هيكل النموذج: <strong className="text-white font-bold">{activeTemplateOrigin}</strong> — قم بتعديل القطع والأكواد بما يناسب مشروعك الخاص.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTemplateOrigin(null)}
            className="text-[11px] text-muted-foreground hover:text-white"
          >
            إغلاق التنبيه
          </button>
        </div>
      )}

      {/* ─── Step Indicators ─── */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-none gap-2 bg-card/20 border border-border p-2 rounded-2xl">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = step === s.num;
          const isPassed = step > s.num;

          return (
            <div key={s.num} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-primary text-black shadow-lg shadow-primary/20 ring-2 ring-primary/45'
                    : isPassed
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-card/5 text-muted-foreground border border-border hover:bg-card/10'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
                {isPassed && <CheckCircle2 size={12} />}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className={`mx-1 rotate-180 ${isPassed ? 'text-primary' : 'text-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs">
          <AlertCircle className="shrink-0" size={16} />
          <p>{error}</p>
        </div>
      )}

      {/* ─── Main Grid: Form Steps + Live Preview Sidebar ─── */}
      <div className="flex gap-6 items-start">
        
        {/* Left / Main Workspace Area */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ─── STEP 1: Basic Info ─── */}
          {step === 1 && (
            <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText size={18} className="text-primary" />
                  الخطوة 1: البيانات الأساسية للبطاقة
                </h3>

                {/* Smart Template Nudge */}
                <button
                  type="button"
                  onClick={() => setTemplatesModalOpen(true)}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle size={13} />
                  غير متأكد مما تكتب؟ شاهد نماذج مشابهة
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">عنوان المشروع *</label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: محطة طقس ذكية متكاملة تدعم التنبيهات الفورية"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-card/5 dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">مستوى الصعوبة</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-card dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    >
                      <option value="مبتدئ">مبتدئ (Beginner)</option>
                      <option value="متوسط">متوسط (Intermediate)</option>
                      <option value="متقدم">متقدم (Advanced)</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">الوصف الموجز (يظهر على بطاقة المشروع في المستودع) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="صف الهدف من مشروعك وما المشكلة التي يحلها باختصار..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full bg-card/5 dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground resize-none transition-colors"
                  />
                </div>

                {/* Visibility & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">الخصوصية</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-card dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    >
                      <option value="public">عام في المجتمع (Public)</option>
                      <option value="private">خاص بي فقط (Private)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">وسوم البحث (اضغط Enter لإضافة وسم)</label>
                    <input
                      type="text"
                      placeholder="مثال: ESP32, MQTT, Soil Moisture, OLED..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-full bg-card/5 dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {tagsList.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                          {tag}
                          <button
                            type="button"
                            onClick={() => setTagsList(t => t.filter((_, i) => i !== idx))}
                            className="hover:text-white transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Devices & Parts ─── */}
          {step === 2 && (
            <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-5 backdrop-blur-xl">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Cpu size={18} className="text-primary" />
                الخطوة 2: الأجهزة والقطع المستخدمة (Hardware Components)
              </h3>

              <ComponentPicker
                components={componentsList}
                onChange={setComponentsList}
              />
            </div>
          )}

          {/* ─── STEP 3: Technical Docs ─── */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[640px]">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 shrink-0">
                  <Code size={16} className="text-primary animate-pulse" />
                  محرر التوثيق والأكواد البرمجية
                </h3>

                <div className="flex gap-1.5 bg-muted dark:bg-[#0c0e14] border border-border p-1 rounded-xl shrink-0">
                  {[
                    { id: 'overview', label: '📄 نظرة عامة' },
                    { id: 'code', label: '💻 كود C++ / Arduino' },
                    { id: 'challenges', label: '⚠️ التحديات والحلول' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDocTab(t.id)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        docTab === t.id
                          ? 'bg-primary text-black shadow-md'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  {docTab === 'overview' && (
                    <textarea
                      value={secOverview}
                      onChange={(e) => setSecOverview(e.target.value)}
                      placeholder="اكتب شرحاً تفصيلياً عن وظيفة المشروع وهيكليته البرمجية..."
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin leading-relaxed transition-colors"
                    />
                  )}
                  {docTab === 'code' && (
                    <textarea
                      value={secCode}
                      onChange={(e) => setSecCode(e.target.value)}
                      placeholder="// اكتب كود Arduino / ESP32 هنا"
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin text-left leading-relaxed transition-colors"
                      dir="ltr"
                    />
                  )}
                  {docTab === 'challenges' && (
                    <textarea
                      value={secChallenges}
                      onChange={(e) => setSecChallenges(e.target.value)}
                      placeholder="اكتب الصعوبات التقنية التي واجهتك (مثل مشاكل التغذية أو التوقيت) والحلول..."
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin leading-relaxed transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[640px] overflow-hidden">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 shrink-0">
                  <Eye size={16} className="text-primary" />
                  معاينة التنسيق (Markdown Live Preview)
                </h3>
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
                  <MarkdownPreview text={buildDocContent()} />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Wiring Diagram & Schematic ─── */}
          {step === 4 && (
            <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-5 backdrop-blur-xl">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Zap size={18} className="text-primary" />
                الخطوة 4: التوصيل الكهربائي والمخطط (Wiring & Schematic)
              </h3>

              <WiringBuilder
                components={componentsList}
                connections={connectionsList}
                onConnectionsChange={setConnectionsList}
                wiringImageUrl={wiringImageUrl}
                onWiringImageChange={setWiringImageUrl}
                wiringDescription={wiringDescription}
                onWiringDescriptionChange={setWiringDescription}
              />
            </div>
          )}

          {/* ─── STEP 5: Final Review & Publish ─── */}
          {step === 5 && (
            <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-6 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    الخطوة 5: المعاينة الشاملة قبل النشر
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    هكذا سيظهر مشروعك بالضبط لبقية مطوري المجتمع
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  جاهز للنشر
                </span>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">العنوان والصعوبة:</span>
                  <h4 className="text-xs font-extrabold text-foreground">{title || 'بدون عنوان'}</h4>
                  <span className="inline-block text-[10px] text-primary font-bold">{difficulty}</span>
                </div>

                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">القطع والتوصيلات:</span>
                  <h4 className="text-xs font-extrabold text-foreground">{componentsList.length} قطع إلكترونية</h4>
                  <span className="inline-block text-[10px] text-sky-400 font-mono">{connectionsList.length} أسلاك موصولة</span>
                </div>

                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">تفاعل المجتمع:</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground pt-1">
                    <MessageSquare size={13} className="text-primary" />
                    <span>زر "تواصل مع المطور" مفعّل تلقائياً</span>
                  </div>
                </div>
              </div>

              {/* Visual Schematic Snapshot */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground">مخطط التوصيل الكهربائي للمشروع:</span>
                {wiringImageUrl ? (
                  <div className="rounded-2xl overflow-hidden border border-border bg-black/40 text-center p-4">
                    <img src={wiringImageUrl} alt="مخطط التوصيل" className="max-h-80 mx-auto object-contain rounded-xl" />
                  </div>
                ) : (
                  <SchematicSvgViewer components={componentsList} connections={connectionsList} />
                )}
              </div>

              {/* Documentation Preview */}
              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs font-bold text-foreground">التوثيق التقني النهائي:</span>
                <div className="p-5 rounded-2xl bg-card dark:bg-[#080a0f] border border-border max-h-96 overflow-y-auto scrollbar-thin">
                  <MarkdownPreview text={buildDocContent()} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation Controls ─── */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step + 1);
                  }}
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  className="font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer text-xs"
                >
                  الخطوة التالية <ArrowRight size={15} className="rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePublish}
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  className="font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xl shadow-primary/25 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> جاري النشر للمجتمع...</>
                  ) : (
                    <><CheckCircle2 size={16} /> تأكيد ونشر المشروع في المستودع العام</>
                  )}
                </button>
              )}
            </div>

            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                  className="bg-card/5 text-foreground border border-border px-5 py-2.5 rounded-xl hover:bg-card/10 transition-colors flex items-center gap-2 cursor-pointer text-xs"
                >
                  <ArrowLeft size={15} className="rotate-180" /> الخطوة السابقة
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Persistent Live Project Card Preview */}
        <ProjectLivePreview
          title={title}
          summary={summary}
          difficulty={difficulty}
          visibility={visibility}
          tags={tagsList}
          components={componentsList}
          connections={connectionsList}
          wiringImageUrl={wiringImageUrl}
          user={user}
          isMobileDrawerOpen={isMobilePreviewOpen}
          onCloseMobileDrawer={() => setIsMobilePreviewOpen(false)}
        />
      </div>

      {/* ─── Featured Templates Modal ─── */}
      <FeaturedTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={handleApplyTemplate}
      />
    </div>
  );
}
