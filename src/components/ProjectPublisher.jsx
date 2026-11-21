import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import {
  ArrowLeft, ArrowRight, Upload, X, Cpu, Eye, Code, CheckCircle2,
  AlertCircle, Plus, Trash2, ImagePlus, Zap, FileText,
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
  if (!text) return <p className="text-muted-foreground text-sm italic">No documentation added yet...</p>;

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
    if (!code) return '';
    // Escape HTML special characters
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Single-pass tokenizer to avoid replacing inside generated HTML class names
    const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:const|let|var|void|setup|loop|if|else|for|while|return|class|import|from|export|default|include|define|int|float|double|char|bool|boolean|string|String|digitalWrite|digitalRead|analogWrite|analogRead|pinMode|delay|Serial|begin|println|print|pub|fn|struct|new)\b)|(\b\d+\b)/g;

    return safe.replace(tokenRegex, (match, comment, str, keyword, num) => {
      if (comment) return `<span style="color:#71717a">${comment}</span>`;
      if (str) return `<span style="color:#34d399">${str}</span>`;
      if (keyword) return `<span style="color:#c084fc;font-weight:600">${keyword}</span>`;
      if (num) return `<span style="color:#fbbf24">${num}</span>`;
      return match;
    });
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
    <div className="space-y-4 font-sans text-foreground/90 leading-relaxed text-left" dir="ltr">
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
          <div key={idx} className="flex gap-2 items-start text-sm pl-2 mt-1">
            <span className="text-primary mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          </div>
        );
        if (el.type === 'blockquote') return (
          <blockquote key={idx} className="border-l-4 border-primary/50 pl-4 pr-0 my-3 text-sm text-muted-foreground italic bg-card/[0.01] py-2 rounded-r-lg"
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
                className="hover:text-primary transition-colors cursor-pointer">Copy Code</button>
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
  { num: 1, label: 'Basic Info', icon: FileText },
  { num: 2, label: 'Hardware & Parts', icon: Cpu },
  { num: 3, label: 'Technical Docs', icon: Code },
  { num: 4, label: 'Wiring & Schematic', icon: Zap },
  { num: 5, label: 'Review & Publish', icon: Eye },
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
  const [difficulty, setDifficulty] = useState('Beginner');
  const [visibility, setVisibility] = useState('public');
  const [tagInput, setTagInput] = useState('');
  const [tagsList, setTagsList] = useState(['ESP32', 'IoT']);

  // Step 2: Components List (visual card based)
  const [componentsList, setComponentsList] = useState([
    {
      id: 'default-mcu',
      name: 'ESP32 NodeMCU DevKit V1',
      category: 'MCU',
      function: 'Central processing unit and cloud connectivity controller',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
    },
    {
      id: 'default-sensor',
      name: 'DHT22 / AM2302',
      category: 'SENSOR',
      function: 'Ambient temperature and relative humidity sensing',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
    }
  ]);

  // Step 3: Technical Documentation
  const [docTab, setDocTab] = useState('overview');
  const [secOverview, setSecOverview] = useState('');
  const [secCode, setSecCode] = useState('// Write your Arduino / ESP32 firmware code here\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("IoT Project Initialized!");\n}\n\nvoid loop() {\n  // logic here\n  delay(1000);\n}');
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
    setTitle(`Project based on: ${template.title}`);
    setSummary(template.summary || '');
    setDifficulty(template.difficulty || 'Beginner');
    setTagsList(template.tags || ['ESP32', 'IoT']);
    if (template.components && template.components.length > 0) {
      setComponentsList(template.components);
    }
    if (template.connections && template.connections.length > 0) {
      setConnectionsList(template.connections);
    }
    if (template.wiringImageUrl) {
      setWiringImageUrl(template.wiringImageUrl);
    }
    if (template.wiringDescription) {
      setWiringDescription(template.wiringDescription);
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

    return `# ${title || 'Project Documentation'}

## Overview
${secOverview || 'No overview description added...'}

## Hardware Components Used
${compSection || 'No hardware components added yet...'}

## Firmware Code (Arduino Sketch)
\`\`\`cpp
${secCode || '// Code here'}
\`\`\`

## Wiring & Schematic Diagram
${wiringDescription || ''}
${wiringImageUrl ? `\n![Wiring Diagram](${wiringImageUrl})` : ''}

## Notes & Challenges
${secChallenges || 'No additional notes added...'}`;
  };

  // ─── Publish to Firestore ───
  const handlePublish = async () => {
    if (!title.trim() || !summary.trim()) {
      setError('Please fill in both the project title and short summary.');
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
      setError('Failed to publish project. Please check your internet connection and database permissions.');
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
      <div className="max-w-md mx-auto text-center py-16 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl" dir="ltr">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Username Required First</h3>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          To publish projects to the community hub, please go to your profile settings and claim a unique username.
        </p>
        <button
          onClick={() => navigate('/settings')}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="mt-6 font-bold px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
        >
          Go to Settings Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left" dir="ltr">
      
      {/* ─── Top Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <Code size={20} className="text-zinc-400" />
              <span>IoT Project Publisher & Documentation Studio</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Design your circuits, document smart wiring schematics, and share your firmware with the developer community
          </p>
        </div>
      </div>

      {/* ─── Step Indicators (Neutral Gray Glassmorphism) ─── */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-none gap-2 bg-[#18191c] border border-white/[0.08] p-2 rounded-2xl">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = step === s.num;
          const isPassed = step > s.num;

          return (
            <div key={s.num} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-white/[0.15] text-white border border-white/25 shadow-sm font-bold'
                    : isPassed
                    ? 'bg-white/[0.05] text-zinc-300 border border-white/[0.08]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
                {isPassed && <CheckCircle2 size={12} className="text-zinc-300" />}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} className={`mx-1 ${isPassed ? 'text-zinc-400' : 'text-zinc-600'}`} />
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
                  Step 1: Basic Project Information
                </h3>

                {/* Smart Template Nudge */}
                <button
                  type="button"
                  onClick={() => setTemplatesModalOpen(true)}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle size={13} />
                  Not sure where to start? Browse featured templates
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">Project Title *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Smart IoT Weather Station with Real-Time MQTT Alerts"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-card/5 dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-card dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">Short Summary (Displayed on the project card in the Hub) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly describe the goal of your project and the problem it solves..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full bg-card/5 dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground resize-none transition-colors"
                  />
                </div>

                {/* Visibility & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">Visibility</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full bg-card dark:bg-[#07090e] border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-foreground transition-colors"
                    >
                      <option value="public">Public (Visible in Community Hub)</option>
                      <option value="private">Private (Only Me)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground">Search Tags (Press Enter to add a tag)</label>
                    <input
                      type="text"
                      placeholder="e.g., ESP32, MQTT, Soil Moisture, OLED..."
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
                Step 2: Hardware Components & Parts
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
                  <Code size={16} className="text-primary" />
                  Documentation & Firmware Code Editor
                </h3>

                <div className="flex gap-1.5 bg-muted dark:bg-[#0c0e14] border border-border p-1 rounded-xl shrink-0">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'code', label: 'C++ / Arduino Code' },
                    { id: 'challenges', label: 'Challenges & Solutions' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDocTab(t.id)}
                      className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                        docTab === t.id
                          ? 'bg-primary text-primary-foreground shadow-md'
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
                      placeholder="Write a detailed explanation of how the project works and its software architecture..."
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin leading-relaxed transition-colors"
                    />
                  )}
                  {docTab === 'code' && (
                    <textarea
                      value={secCode}
                      onChange={(e) => setSecCode(e.target.value)}
                      placeholder="// Write your Arduino / ESP32 code here"
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin text-left leading-relaxed transition-colors"
                      dir="ltr"
                    />
                  )}
                  {docTab === 'challenges' && (
                    <textarea
                      value={secChallenges}
                      onChange={(e) => setSecChallenges(e.target.value)}
                      placeholder="Document any technical challenges you encountered (e.g., power supply noise, sensor calibration, timing issues) and how you resolved them..."
                      className="flex-1 w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-4 text-xs font-mono text-foreground focus:outline-none focus:border-primary resize-none overflow-y-auto scrollbar-thin leading-relaxed transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-card/[0.02] border border-border p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[640px] overflow-hidden">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 shrink-0">
                  <Eye size={16} className="text-primary" />
                  Markdown Live Preview
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
                Step 4: Electrical Wiring & Schematic
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
                    Step 5: Comprehensive Pre-Publish Review
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This is how your project will appear to other developers in the community hub
                  </p>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Ready to Publish
                </span>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">Title & Difficulty:</span>
                  <h4 className="text-xs font-extrabold text-foreground">{title || 'Untitled Project'}</h4>
                  <span className="inline-block text-[10px] text-primary font-bold">{difficulty}</span>
                </div>

                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">Parts & Connections:</span>
                  <h4 className="text-xs font-extrabold text-foreground">{componentsList.length} Electronic Parts</h4>
                  <span className="inline-block text-[10px] text-sky-400 font-mono">{connectionsList.length} Connected Wires</span>
                </div>

                <div className="p-4 rounded-2xl bg-card dark:bg-[#0a0c12] border border-border space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold">Community Engagement:</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground pt-1">
                    <MessageSquare size={13} className="text-primary" />
                    <span>"Contact Developer" button enabled automatically</span>
                  </div>
                </div>
              </div>

              {/* Visual Schematic Snapshot */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">Wiring Schematic & Pinout Guide:</span>
                <SchematicSvgViewer
                  wiringImageUrl={wiringImageUrl}
                  wiringDescription={wiringDescription}
                  components={componentsList}
                />
              </div>

              {/* Documentation Preview */}
              <div className="space-y-2 border-t border-border pt-4">
                <span className="text-xs font-bold text-foreground">Final Technical Documentation:</span>
                <div className="p-5 rounded-2xl bg-card dark:bg-[#080a0f] border border-border max-h-96 overflow-y-auto scrollbar-thin">
                  <MarkdownPreview text={buildDocContent()} />
                </div>
              </div>
            </div>
          )}

          {/* ─── Navigation Controls ─── */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step - 1);
                  }}
                  className="bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08] px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <ArrowLeft size={14} /> Previous Step
                </button>
              )}
            </div>

            <div>
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep(step + 1);
                  }}
                  className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs"
                >
                  <span>Next Step</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePublish}
                  className="bg-white/[0.12] hover:bg-white/[0.2] border border-white/[0.2] text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                >
                  {loading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> Publishing...</>
                  ) : (
                    <><CheckCircle2 size={15} /> Confirm & Publish Project to Hub</>
                  )}
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
          wiringDescription={wiringDescription}
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
