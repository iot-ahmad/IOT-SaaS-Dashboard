import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { doc, collection, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { ArrowLeft, ArrowRight, Upload, X, Cpu, Eye, Code, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from './ui/neon-button';

// Helper function to compress images using Canvas
const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      // Non-image files (like PDFs or ZIPs for schematics) don't get compressed
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // fallback to original on failure
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Custom Markdown syntax-highlighted renderer for the preview
export const MarkdownPreview = ({ text }) => {
  if (!text) return <p className="text-slate-500 dark:text-white/20 text-sm italic">لا يوجد توثيق بعد...</p>;

  // Simple, fast parser for Markdown elements
  const parseMarkdown = (markdownText) => {
    const lines = markdownText.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push({
            type: 'code',
            content: codeLines.join('\n'),
            language: codeLanguage
          });
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim() || 'cpp';
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push({ type: 'h1', content: line.substring(2) });
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push({ type: 'h2', content: line.substring(3) });
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push({ type: 'h3', content: line.substring(4) });
        continue;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        // Find starting spacing to determine list level (optional, keep it simple for now)
        elements.push({ type: 'li', content: line.trim().substring(2) });
        continue;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push({ type: 'blockquote', content: line.substring(2) });
        continue;
      }

      // Normal paragraphs
      elements.push({ type: 'p', content: line });
    }

    // Handle open code block at EOF
    if (inCodeBlock && codeLines.length > 0) {
      elements.push({
        type: 'code',
        content: codeLines.join('\n'),
        language: codeLanguage
      });
    }

    return elements;
  };

  const highlightCode = (code, language) => {
    // Basic syntax highlighting for C++ (Arduino) / Python / JS
    const keywords = /\b(const|let|var|void|setup|loop|if|else|for|while|return|class|import|from|export|default|include|define|int|float|double|char|bool|boolean|string|String|digitalWrite|digitalRead|analogWrite|analogRead|pinMode|delay|Serial|begin|println|print|pub|fn|struct|new)\b/g;
    const strings = /(["'`])(.*?)\1/g;
    const numbers = /\b(\d+)\b/g;
    const comments = /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g;

    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Wrap comments first
    html = html.replace(comments, '<span class="text-slate-500 dark:text-zinc-500 font-mono">$1</span>');
    
    // Keywords (avoid replacing inside class tags)
    html = html.replace(keywords, (match) => {
      return `<span class="text-[#c084fc] dark:text-purple-400 font-bold">${match}</span>`;
    });

    // Strings
    html = html.replace(strings, '<span class="text-emerald-400 dark:text-emerald-400/90 font-mono">"$2"</span>');
    
    // Numbers
    html = html.replace(numbers, '<span class="text-amber-400 dark:text-amber-300 font-mono">$1</span>');

    return html;
  };

  const formatText = (textStr) => {
    // Process bold, inline code, links
    let formatted = textStr
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // **bold**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
    
    // `inline code`
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-1.5 py-0.5 rounded font-mono text-pink-400 text-xs">$1</code>');
    
    // [link](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-semibold">$1</a>');

    return formatted;
  };

  const parsedElements = parseMarkdown(text);

  return (
    <div className="space-y-4 font-sans text-slate-300 leading-relaxed text-right rtl-text">
      {parsedElements.map((el, idx) => {
        if (el.type === 'h1') {
          return (
            <h1 key={idx} className="text-2xl font-extrabold text-white mt-6 mb-3 border-b border-white/10 pb-2">
              <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
            </h1>
          );
        }
        if (el.type === 'h2') {
          return (
            <h2 key={idx} className="text-xl font-bold text-white mt-5 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
            </h2>
          );
        }
        if (el.type === 'h3') {
          return (
            <h3 key={idx} className="text-lg font-bold text-white/95 mt-4 mb-2">
              <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
            </h3>
          );
        }
        if (el.type === 'li') {
          return (
            <div key={idx} className="flex gap-2 items-start text-sm pr-2 mt-1">
              <span className="text-primary mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
              <span dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
            </div>
          );
        }
        if (el.type === 'blockquote') {
          return (
            <blockquote key={idx} className="border-r-4 border-primary/50 pr-4 pl-0 my-3 text-sm text-slate-400 italic bg-white/[0.01] py-2 rounded-l-lg" dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
          );
        }
        if (el.type === 'code') {
          return (
            <div key={idx} className="my-4 font-mono text-left" dir="ltr">
              <div className="flex items-center justify-between bg-zinc-950 px-4 py-1.5 border-t border-x border-white/5 rounded-t-xl text-[10px] text-slate-500 font-sans tracking-wide">
                <span>{el.language.toUpperCase()}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(el.content);
                  }}
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  نسخ الكود
                </button>
              </div>
              <pre className="bg-[#030406] border border-white/5 rounded-b-xl p-4 overflow-x-auto text-xs leading-relaxed font-mono scrollbar-thin text-left ltr-text text-slate-300">
                <code dangerouslySetInnerHTML={{ __html: highlightCode(el.content, el.language) }} />
              </pre>
            </div>
          );
        }
        
        // Paragraphs
        if (el.content.trim() === '') return <div key={idx} className="h-2" />;
        return (
          <p key={idx} className="text-sm text-slate-300/90 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatText(el.content) }} />
        );
      })}
    </div>
  );
};

export default function ProjectPublisher({ user }) {
  const navigate = useNavigate();
  
  // States
  const [projectId] = useState(() => doc(collection(db, 'projects')).id); // Pre-generate Project Doc ID
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasUsername, setHasUsername] = useState(true);
  const [checkingUser, setCheckingUser] = useState(true);
  
  // Step 1 Form Data
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [tagInput, setTagInput] = useState('');
  const [componentsList, setComponentsList] = useState([]);

  // Step 2 Media Lists
  const [images, setImages] = useState([]); // URLs
  const [schematics, setSchematics] = useState([]); // URLs
  const [uploadsInProgress, setUploadsInProgress] = useState({}); // { fileName: progress }

  // Step 3 Content
  const [content, setContent] = useState(
`# توثيق المشروع الهندسي

اكتب توثيق مشروعك هنا بصيغة Markdown. يمكنك تضمين أكواد برمجية وملاحظات تشغيلية.

## القطع المستخدمة ووظيفتها
- **ESP32 DevKit** المتحكم الرئيسي لقراءة الحساس وبث البيانات.
- **حساس رطوبة التربة** لقياس مستوى رطوبة الأرض.

## طريقة التوصيل الكهربائي
قم بتوصيل الحساس بالمنفذ A0 التناظري لـ ESP32 مع توصيل خط التغذية 3.3V و الأرضي GND.

## كود التشغيل (Arduino Sketch)
\`\`\`cpp
#define SOIL_PIN 34

void setup() {
  Serial.begin(115200);
  pinMode(SOIL_PIN, INPUT);
}

void loop() {
  int value = analogRead(SOIL_PIN);
  Serial.println(value);
  delay(1000);
}
\`\`\`
`
  );

  // Check if current user has profile username setup
  useEffect(() => {
    if (!user) return;
    const checkUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().username) {
          setHasUsername(true);
        } else {
          setHasUsername(false);
        }
      } catch (err) {
        console.error("Error checking user:", err);
      } finally {
        setCheckingUser(false);
      }
    };
    checkUser();
  }, [user]);

  // Handle Component Tag Addition
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !componentsList.includes(val)) {
        setComponentsList([...componentsList, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setComponentsList(componentsList.filter((_, idx) => idx !== indexToRemove));
  };

  // Upload file logic with compression
  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (let file of files) {
      const fileId = `${Date.now()}_${file.name}`;
      
      try {
        // Client-side image compression
        let uploadFile = file;
        if (type === 'images' && file.type.startsWith('image/')) {
          setUploadsInProgress(prev => ({ ...prev, [file.name]: 'مرحلة الضغط...' }));
          uploadFile = await compressImage(file);
        }

        const storagePath = `projects/${projectId}/${type}/${fileId}`;
        const fileRef = ref(storage, storagePath);

        const uploadTask = uploadBytesResumable(fileRef, uploadFile);

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadsInProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }, 
          (error) => {
            console.error("Upload error:", error);
            setError(`فشل رفع الملف: ${file.name}`);
            setUploadsInProgress(prev => {
              const copy = { ...prev };
              delete copy[file.name];
              return copy;
            });
          }, 
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (type === 'images') {
              setImages(prev => [...prev, { url: downloadUrl, refPath: storagePath, name: file.name }]);
            } else {
              setSchematics(prev => [...prev, { url: downloadUrl, refPath: storagePath, name: file.name }]);
            }
            setUploadsInProgress(prev => {
              const copy = { ...prev };
              delete copy[file.name];
              return copy;
            });
          }
        );

      } catch (err) {
        console.error("Compression/Upload error:", err);
        setError("حدث خطأ أثناء معالجة الملف.");
      }
    }
  };

  // Delete media item from storage
  const handleRemoveMedia = async (item, type) => {
    try {
      const fileRef = ref(storage, item.refPath);
      await deleteObject(fileRef);
      if (type === 'images') {
        setImages(images.filter(img => img.refPath !== item.refPath));
      } else {
        setSchematics(schematics.filter(sch => sch.refPath !== item.refPath));
      }
    } catch (err) {
      console.error("Delete error:", err);
      // Even if file not in storage, remove locally
      if (type === 'images') {
        setImages(images.filter(img => img.refPath !== item.refPath));
      } else {
        setSchematics(schematics.filter(sch => sch.refPath !== item.refPath));
      }
    }
  };

  // Publish project handler
  const handlePublish = async () => {
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setError("الرجاء ملء جميع الحقول المطلوبة (العنوان، الوصف المختصر، والتوثيق).");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get user profile detail (to save username and displayName inside project document for fast loading)
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const profile = userSnap.exists() ? userSnap.data() : {};
      
      const projectData = {
        id: projectId,
        ownerId: user.uid,
        ownerUsername: profile.username || 'user',
        ownerName: profile.displayName || user.displayName || 'Developer',
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        images: images.map(img => img.url),
        schematics: schematics.map(sch => sch.url),
        componentsList: componentsList,
        visibility: visibility,
        metrics: {
          views: 0,
          likes: 0,
          clones: 0
        },
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'projects', projectId), projectData);
      
      // Redirect to newly published project page or Global Hub
      navigate(`/hub/project/${projectId}`);
    } catch (err) {
      console.error("Publishing error:", err);
      setError("فشل نشر المشروع. تأكد من اتصال الإنترنت وصلاحيات قاعدة البيانات.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingUser) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user does not have a vanity username set up
  if (!hasUsername) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl">
        <AlertCircle className="w-16 h-16 text-violet-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">تحتاج إلى تعيين اسم مستخدم أولاً</h3>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          لتتمكن من نشر مشاريعك ومشاركتها مع مجتمع المطورين العالمي، يرجى التوجه لصفحة حسابك الشخصي وإنشاء رابط Vanity URL فريد (Username).
        </p>
        <button
          onClick={() => navigate('/settings')} // Redirect to settings
          className="mt-6 bg-primary text-black font-bold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all shadow-lg shadow-primary/20"
        >
          توجه إلى الإعدادات الآن
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Upper Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-primary w-6 h-6 animate-pulse" />
            أنشئ مشروع IoT عالمي جديد
          </h2>
          <p className="text-xs text-slate-500 mt-1">شارك مخططات الدوائر وأكواد البرمجة مع مجتمع إنترنت الأشياء العالمي</p>
        </div>
        
        {/* Step Progress indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <button
                type="button"
                onClick={() => step > num && setStep(num)}
                disabled={step <= num}
                className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                  step === num
                    ? 'bg-primary text-black shadow-lg shadow-primary/20 ring-2 ring-primary/45'
                    : step > num
                    ? 'bg-primary/10 text-primary border border-primary/20 cursor-pointer'
                    : 'bg-white/5 text-slate-500 border border-white/5'
                }`}
              >
                {num}
              </button>
              {num < 3 && <div className={`w-8 h-0.5 ${step > num ? 'bg-primary/50' : 'bg-white/5'}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="shrink-0" size={18} />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-5 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
            <Cpu size={18} className="text-primary" /> الخطوة 1: البيانات الأساسية للعتاد
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1.5 text-right">عنوان المشروع *</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: محطة طقس ذكية تدعم التنبيهات الفورية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right rtl-text text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 text-right">خصوصية المشروع *</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full bg-[#0d0e12] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right rtl-text text-white"
                >
                  <option value="public">عام (Public Feed)</option>
                  <option value="private">خاص (Private - لك فقط)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 text-right">الوصف المختصر للمشروع *</label>
              <textarea
                required
                rows={3}
                placeholder="صف الفكرة والهدف من مشروعك باختصار لجذب المطورين لمشاهدته..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right rtl-text text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 text-right">المكونات والقطع الإلكترونية المستخدمة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="اضغط Enter أو فاصلة لإضافة قطعة (مثال: ESP32, DHT22, LED)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-primary text-sm text-right rtl-text text-white"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {componentsList.length === 0 && (
                  <p className="text-xs text-slate-600">لا توجد قطع مضافة حالياً. أضف بعض القطع لتسهيل البحث عن مشروعك.</p>
                )}
                {componentsList.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(idx)} className="hover:text-white transition-colors cursor-pointer">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Media and Schematic Upload */}
      {step === 2 && (
        <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
            <Upload size={18} className="text-primary" /> الخطوة 2: الصور والمخططات الهندسية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Images Drop Zone */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-white text-right">صور المشروع (العتاد المادي)</label>
              <div className="border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/40 transition-colors flex flex-col items-center justify-center text-center relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'images')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-slate-500 group-hover:text-primary transition-colors mb-3" />
                <span className="text-xs font-bold text-slate-300">اسحب الصور وأفلتها هنا أو اضغط للتصفح</span>
                <span className="text-[10px] text-slate-500 mt-1">يتم ضغط الصور تلقائياً للحفاظ على سرعة التحميل</span>
              </div>

              {/* Uploading List */}
              {Object.keys(uploadsInProgress).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(uploadsInProgress).map(([name, progress]) => (
                    <div key={name} className="flex items-center justify-between text-xs bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <span className="text-slate-400 max-w-[70%] truncate font-mono">{name}</span>
                      <span className="text-primary font-bold">{progress}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Images Grid */}
              <div className="grid grid-cols-3 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group shadow-md">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(img, 'images')}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-md transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Schematics Drop Zone */}
            <div className="space-y-4">
              <label className="block text-sm font-bold text-white text-right">مخططات التوصيل والدوائر الكهربائية</label>
              <div className="border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.01] hover:bg-white/[0.02] hover:border-primary/40 transition-colors flex flex-col items-center justify-center text-center relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'schematics')}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 text-slate-500 group-hover:text-primary transition-colors mb-3" />
                <span className="text-xs font-bold text-slate-300">اسحب مخططات Fritzing أو صور التوصيل هنا</span>
                <span className="text-[10px] text-slate-500 mt-1">امتدادات مقبولة: الصور والـ PDF</span>
              </div>

              {/* Schematics Grid */}
              <div className="space-y-2">
                {schematics.map((sch, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-medium truncate max-w-[80%]">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="truncate font-mono">{sch.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(sch, 'schematics')}
                      className="p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: Documentation & Preview */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Markdown Editor */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[600px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-mono">يدعم التنسيق المتقدم والأكواد الملونة</span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Code size={16} className="text-primary" /> التوثيق الهندسي (Markdown)
              </h3>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full bg-[#030406] border border-white/5 rounded-2xl p-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-primary/40 resize-none overflow-y-auto scrollbar-thin text-left ltr-text leading-relaxed"
            />
          </div>

          {/* Real-time Document Preview */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4 backdrop-blur-xl flex flex-col h-[600px] overflow-hidden">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Eye size={16} className="text-primary" /> معاينة التوثيق الهندسي
            </h3>
            <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
              <MarkdownPreview text={content} />
            </div>
          </div>

        </div>
      )}

      {/* Wizard Action Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-primary text-black font-bold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
            >
              الخطوة التالية
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handlePublish}
              className="bg-primary text-black font-bold px-8 py-2.5 rounded-xl hover:bg-primary/95 transition-all flex items-center gap-2 shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'جاري النشر...' : 'نشر المشروع للمجتمع العالمي'}
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>

        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="bg-white/5 text-slate-300 border border-white/5 px-6 py-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              الخطوة السابقة
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
