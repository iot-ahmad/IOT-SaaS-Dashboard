import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Check, Send, Sparkles, RefreshCw, Bot, Paperclip, Plus, ArrowUp, Cpu, Zap, Globe, Terminal, Play, CircleUserRound } from 'lucide-react';

/* ── tiny copy button ─────────────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
        copied ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

/* ── code block ───────────────────────────────────────────────────────────── */
function CodeBlock({ code, language = 'cpp' }) {
  return (
    <div className="relative group my-2">
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={code} />
      </div>
      <pre className="bg-[#050608] border border-slate-200 dark:border-white/[0.07] rounded-xl p-5 overflow-x-auto text-[11.5px] leading-relaxed font-mono text-slate-700 dark:text-white/70 scrollbar-thin">
        <code>{code}</code>
      </pre>
      <div className="absolute top-3 left-3 text-[9px] text-slate-400 dark:text-white/20 font-mono uppercase tracking-widest pointer-events-none">
        {language}
      </div>
    </div>
  );
}

const getBotResponse = (input, uid) => {
  const text = input.toLowerCase();
  const cleanUid = uid || 'YOUR_UID';

  if (text.includes('مطور') || text.includes('من قام') || text.includes('احمد') || text.includes('أحمد') || text.includes('creator') || text.includes('developer') || text.includes('batayneh') || text.includes('بطاينه') || text.includes('بطاينة') || text.includes('صنع') || text.includes('برمج')) {
    return `**تم تصميم وتطوير منصة IOT365 بالكامل بواسطة المطور أحمد البطاينة (Ahmad Al-Batayneh) 💻✨.**\n\nتم تطوير هذه المنصة لتوفير أداة قوية، سريعة، ومجانية للطلاب والباحثين والمهندسين لربط لوحات ESP32 ومشاريع إنترنت الأشياء لحظياً دون الدخول في تعقيدات إنشاء قواعد البيانات والسيرفرات الخاصة.`;
  }

  if (text.includes('broker') || text.includes('بروك') || text.includes('hivemq') || text.includes('سيرفر') || text.includes('server') || text.includes('port') || text.includes('بورت') || text.includes('host') || text.includes('عنوان') || text.includes('منفذ')) {
    return `**معلومات الاتصال بالـ MQTT Broker لـ IOT365 🌐:**\n\n*   **Host (العنوان):** \`broker.hivemq.com\`\n*   **Port (المنفذ):** \`1883\` (بدون تشفير)\n*   **WebSockets Port (للموقع):** \`8000\` (على المسار \`/mqtt\`)\n\n> 💡 تأكد من مطابقة هذه البيانات في كود الـ Arduino الخاص بك:\n\`\`\`cpp\nclient.setServer("broker.hivemq.com", 1883);\n\`\`\``;
  }

  if (text.includes('كيف') && (text.includes('اربط') || text.includes('أربط') || text.includes('اتصال') || text.includes('connect') || text.includes('esp32') || text.includes('طريقة') || text.includes('شغل'))) {
    return `**دليل ربط جهاز الـ ESP32 بالمنصة في 4 خطوات 🚀:**\n\n1.  **نسخ الـ UID:** انسخ معرفك الفريد (\`${cleanUid}\`) من الأعلى.\n2.  **كود الـ WiFi:** قم بتوصيل الـ ESP32 بشبكة الإنترنت الخاصة بك.\n3.  **تسمية المواضيع:** أرسل واستقبل البيانات عبر مواضيع تبدأ بـ UID الخاص بك:\n    \`[UID]/[Topic]\` (مثل: \`${cleanUid}/actuator/led\`).\n4.  **تصميم الـ Dashboard:** أضف أداة التحكم واضبط الـ Topic الخاص بها ليتطابق مع الكود.`;
  }

  if (text.includes('مجاني') || text.includes('free') || text.includes('فلوس') || text.includes('دفع') || text.includes('سعر') || text.includes('billing') || text.includes('اشتراك') || text.includes('باقة') || text.includes('باقات')) {
    return `**هل منصة IOT365 مجانية؟ 💰**\n\n**نعم، المنصة مجانية بالكامل لجميع المطورين، الطلاب، والأفراد!** 🎉\n\nأما بالنسبة لـ *Billing & Plan (قريباً)*، فهي مخصصة للجامعات والمؤسسات التعليمية التي ترغب في الحصول على لوحات تحكم مخصصة وإدارة مشاريع الطلاب بشكل جماعي، أو للاستضافة على خوادم خاصة بالجامعة. استخدامك الشخصي سيبقى مجانياً بالكامل.`;
  }

  if (text.includes('حفظ') || text.includes('احفظ') || text.includes('save') || text.includes('firestore') || text.includes('تخزين') || text.includes('حذف') || text.includes('يروح') || text.includes('ضيع')) {
    return `**حفظ وتعديل لوحة التحكم (الـ Dashboard) 💾:**\n\n*   **حفظ تلقائي وفوري:** لا تحتاج للضغط على أي زر للحفظ. يتم حفظ كافة الأدوات التي تضيفها وتعديلاتها (المواقع، الأحجام، التسميات، الأجهزة) تلقائياً في حسابك السحابي المدعوم بـ Firebase.\n*   **تغيير الأسماء وحذف المشاريع:** يمكنك إعادة تسمية أي لوحة تحكم أو حذفها مباشرة من القائمة الجانبية بنقرة زر واحدة.`;
  }

  if (text.includes('topic') || text.includes('عنوان الموضوع') || text.includes('موضوع') || text.includes('توبيك') || text.includes('بنية')) {
    return `**بنية المواضيع (Topics) الفريدة في IOT365 📂:**\n\nلمنع تداخل البيانات بين المستخدمين على السيرفر العام، نستخدم بنية تبدأ بـ الـ UID الخاص بك:\n\`\`\`text\n[userUID]/[Topic_Name]\n\`\`\`\n**أمثلة:**\n*   مفتاح تشغيل: \`${cleanUid}/actuator/led\`\n*   مخطط بياني للحرارة: \`${cleanUid}/sensor/temp\`\n*   أداة D-Pad للسيارة: \`${cleanUid}/car/move\``;
  }

  if (text.includes('d-pad') || text.includes('سيارة') || text.includes('car') || text.includes('rc') || text.includes('اتجاه') || text.includes('أزرار') || text.includes('حركة')) {
    return `**التحكم بالسيارات الذكية (RC Car) 🚗:**\n\n*   تستخدم أداة الـ **D-Pad** للتحكم بالسيارات الذكية لحظياً.\n*   تقوم الأداة بإرسال الأوامر التالية كـ String: \`FORWARD\`, \`BACK\`, \`LEFT\`, \`RIGHT\`, \`STOP\`.\n*   تستقبل السيارة الأوامر عبر موضوع التوجيه، مثل: \`${cleanUid}/car/move\`.\n\n> 💡 تفقد كود "RC Car / D-Pad" في قسم الأكواد الجاهزة بالدليل لمثال متكامل!`;
  }

  if (text.includes('alert') || text.includes('تنبيه') || text.includes('اشعار') || text.includes('إشعار') || text.includes('رنين') || text.includes('جرس')) {
    return `**نظام الإشعارات والتنبيهات (Alerts) 🔔:**\n\n*   **قواعد التنبيه الذكية:** يمكنك ضبط تنبيهات داخل قسم الـ Alerts للمراقبة التلقائية لقراءات الحساسات (مثل: إذا تجاوزت الرطوبة حدّاً معيناً، أرسل إشعارا).\n*   **إرسال التنبيهات من ال ESP32:** يمكنك برمجة جهازك ليرسل رسالة تنبيه نصية مباشرة على الـ Topic الخاص بالتنبيهات ليظهر كإشعار منبثق فوري باللوحة.`;
  }

  if (text.includes('dht') || text.includes('حساس') || text.includes('حرارة') || text.includes('رطوبة') || text.includes('سنسور')) {
    return `**قراءة بيانات الحساسات (مثل DHT11 / DHT22) 🌡️:**\n\n*   قم بتوصيل الحساس بالـ ESP32.\n*   أرسل القيمة كـ String أو Float عبر موضوع الحساس مثل: \`${cleanUid}/sensor/temperature\`.\n*   أضف أداة **Gauge (عداد)** أو **Chart (مخطط)** في اللوحة واضبط الـ Topic ليعرض القراءة محدثة تلقائياً كل بضع ثوانٍ.`;
  }

  return `عذراً، لم أفهم استفسارك بشكل كامل. 😅\n\nهل يمكنك إعادة صياغة السؤال؟ أو اختر أحد المواضيع الشائعة:\n*   كيف أربط ESP32؟\n*   معلومات الـ MQTT Broker\n*   تسمية الـ Topics والـ UID\n*   حفظ تصميم لوحة التحكم\n*   مطور المشروع ومجانيته`;
};

function useAutoResizeTextarea({ minHeight, maxHeight }) {
  const textareaRef = useRef(null);

  const adjustHeight = useCallback(
    (reset) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      // Temporarily shrink to get the right scrollHeight
      textarea.style.height = `${minHeight}px`;

      // Calculate new height
      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    // Set initial height
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  // Adjust height on window resize
  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

export default function DeveloperGuide({ userUID }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `مرحباً بك! أنا مساعد IOT365 الذكي 🤖\n\nيمكنني مساعدتك في أي سؤال بخصوص ربط الـ ESP32، بنية الـ Topics، كتابة الأكواد، حفظ التصاميم، أو أي استفسار تقني آخر.\n\nاسألني بحرية! 🚀`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputVal.trim() && !isTyping) {
        handleSend();
        adjustHeight(true);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputVal('');
    setIsTyping(true);

    const groqKey  = import.meta.env.VITE_GROQ_API_KEY;

    // If no valid key → use static fallback responses
    if (!groqKey || groqKey.startsWith('your_')) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: getBotResponse(query, userUID) }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    const systemPrompt = `أنت مساعد ذكي متخصص لمنصة IOT365. مهمتك مساعدة الطلاب والمطورين في مشاريع إنترنت الأشياء والـ ESP32 وبرمجة Arduino C++ وبروتوكول MQTT.
معلومات المنصة:
- UID المستخدم الحالي: ${userUID || 'YOUR_UID'}
- MQTT Broker: broker.hivemq.com — المنفذ: 1883
- بنية Topics: [UID]/[اسم_الموضوع] — مثال: ${userUID || 'YOUR_UID'}/sensor/temp
قواعد الإجابة:
- أجب دائماً باللغة العربية.
- عند كتابة أكواد ESP32/C++ اكتب كوداً نظيفاً ومتكاملاً وخالياً من الأخطاء.
- اجعل إجاباتك دقيقة وعملية ومركّزة.`;

    const tryApi = async (url, key, modelName, bodyOverride = {}) => {
      const contextMessages = updatedMessages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: 'system', content: systemPrompt }, ...contextMessages],
          temperature: 0.7,
          max_tokens: 2048,
          ...bodyOverride
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    };

    try {
      // Primary: Groq (supports browser CORS natively)
      const botText = await tryApi(
        'https://api.groq.com/openai/v1/chat/completions',
        groqKey,
        'llama-3.3-70b-versatile'
      );
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botText }]);
    } catch (err) {
      console.warn('Groq failed, using static fallback:', err);
      // Last resort: static keyword-based response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: getBotResponse(query, userUID)
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderBotMessage = (text) => {
    const parts = [];
    const lines = text.split('\n');
    let inCode = false;
    let codeLines = [];
    let codeLang = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) {
        if (inCode) {
          parts.push({ type: 'code', code: codeLines.join('\n'), lang: codeLang });
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
          codeLang = line.replace('```', '').trim() || 'cpp';
        }
      } else {
        if (inCode) codeLines.push(line);
        else parts.push({ type: 'text', content: line });
      }
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <div key={idx} className="my-2.5 font-mono">
            <CodeBlock code={part.code} language={part.lang} />
          </div>
        );
      }

      let line = part.content;
      if (line.trim() === '') return <div key={idx} className="h-1.5" />;

      let html = line.replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-1.5 py-0.5 rounded font-mono text-amber-500 dark:text-amber-300 text-[10px]">$1</code>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

      if (/^\*(?!\*)/.test(line.trim())) {
        html = html.trim().substring(1).trim();
        return (
          <div key={idx} className="flex gap-2 items-start text-xs mt-1 text-slate-700 dark:text-white/70">
            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }

      if (line.trim().startsWith('>')) {
        html = html.trim().substring(1).trim();
        return (
          <blockquote key={idx} className="border-l-2 border-primary/50 pl-3 my-2 text-xs text-slate-500 dark:text-white/40 italic bg-slate-50 dark:bg-white/[0.01] py-1 pr-2 rounded-r-md" dangerouslySetInnerHTML={{ __html: html }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-white/70 leading-relaxed mt-0.5" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>

      {/* ── Chat Header ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#07080a] border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between shrink-0 rounded-t-3xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] shrink-0 overflow-hidden">
            <img src="/logo_icon.png" alt="Bot" className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>'; }} />
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base">IOT365 Smart Assistant</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium">مساعدك الذكي لمشاريع ESP32 و MQTT</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* UID Badge */}
          {userUID && (
            <div className="hidden sm:flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 items-center gap-2">
              <p className="text-[9px] text-slate-400 dark:text-white/30 uppercase font-bold tracking-wider">UID</p>
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-white/80">{userUID.substring(0, 8)}...</span>
              <CopyBtn text={userUID} />
            </div>
          )}
          {/* Clear chat */}
          <button
            onClick={() => setMessages([{ id: 1, sender: 'bot', text: `مرحباً بك! أنا مساعد IOT365 الذكي 🤖\n\nيمكنني مساعدتك في أي سؤال بخصوص ربط الـ ESP32، بنية الـ Topics، كتابة الأكواد، حفظ التصاميم، أو أي استفسار تقني آخر.\n\nاسألني بحرية! 🚀` }])}
            className="p-2.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            title="مسح المحادثة"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 dark:bg-black/10 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 self-start overflow-hidden">
                <img src="/logo_icon.png" alt="Bot" className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; e.target.parentNode.classList.add('p-1.5'); e.target.insertAdjacentHTML('afterend', '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>'); }} />
              </div>
            )}

            <div className={`p-4 rounded-2xl text-left border ${
              msg.sender === 'user'
                ? 'bg-primary text-black border-transparent rounded-tr-none text-sm font-semibold shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.07] text-slate-800 dark:text-white/90 rounded-tl-none space-y-1 shadow-sm'
            }`}>
              {msg.sender === 'user' ? (
                <p className="leading-relaxed">{msg.text}</p>
              ) : (
                renderBotMessage(msg.text)
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo_icon.png" alt="Bot" className="w-full h-full object-contain" onError={(e) => { e.target.style.display='none'; }} />
            </div>
            <div className="p-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.07] rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Box & Suggestions (Vercel v0 Style) ────────────────── */}
      <div className="p-6 bg-white dark:bg-[#07080a] border-t border-slate-200 dark:border-white/10 shrink-0 rounded-b-3xl flex flex-col gap-4">
        
        {/* Input Box */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (inputVal.trim() && !isTyping) { handleSend(); adjustHeight(true); } }}
          className="relative bg-slate-50 dark:bg-[#0b0c10] rounded-xl border border-slate-200 dark:border-neutral-800 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        >
          <div className="overflow-y-auto">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="اكتب سؤالك هنا... (مثال: كيف أربط ESP32 بالـ DHT22؟)"
              className="w-full px-4 py-3 resize-none bg-transparent border-none text-slate-800 dark:text-white text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500 min-h-[60px]"
              style={{
                overflow: "hidden",
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 border-t border-slate-100 dark:border-neutral-900 bg-slate-50/50 dark:bg-[#0b0c10]/50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-slate-500 dark:text-zinc-400"
                title="إرفاق ملف"
              >
                <Paperclip className="w-4 h-4 text-slate-600 dark:text-white" />
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 hidden group-hover:inline transition-opacity">
                  Attach
                </span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-zinc-400 transition-colors border border-dashed border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Project
              </button>
              
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className={`px-2 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  inputVal.trim() && !isTyping
                    ? "bg-primary text-black shadow-md shadow-primary/20"
                    : "bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
                }`}
              >
                <ArrowUp
                  className={`w-4 h-4 ${
                    inputVal.trim() && !isTyping
                      ? "text-black"
                      : "text-slate-400 dark:text-zinc-500"
                  }`}
                />
                <span className="sr-only">إرسال</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick Suggestions (v0 Style Action Buttons) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {[
            { label: 'عنوان الـ Broker؟', q: 'ما هي معلومات الـ MQTT Broker؟', icon: <Globe className="w-3.5 h-3.5" /> },
            { label: 'كيف أربط ESP32؟', q: 'كيف أربط جهاز الـ ESP32؟', icon: <Cpu className="w-3.5 h-3.5" /> },
            { label: 'حفظ التصميم؟', q: 'كيف أحفظ لوحة التحكم والأسماء؟', icon: <Plus className="w-3.5 h-3.5" /> },
            { label: 'حساس الحرارة؟', q: 'كيف أقرأ بيانات حساس DHT22؟', icon: <Zap className="w-3.5 h-3.5" /> },
            { label: 'سيارة RC؟', q: 'كيف أتحكم بسيارة RC عبر D-Pad؟', icon: <Play className="w-3.5 h-3.5" /> },
            { label: 'مطور المشروع؟', q: 'من هو مطور منصة IOT365؟', icon: <CircleUserRound className="w-3.5 h-3.5" /> },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.q)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-[#0b0c10] hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-full border border-slate-200 dark:border-neutral-800 transition-colors text-xs font-medium"
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
