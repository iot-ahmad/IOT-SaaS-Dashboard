import { useState, useRef, useEffect } from 'react';
import { Copy, Check, BookOpen, Cpu, Wifi, Database, ChevronRight, Code2, Zap, Send, Sparkles, HelpCircle, RefreshCw, Terminal, Sliders, Gauge, Palette } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
        copied ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:bg-white/10 hover:text-slate-900 dark:text-white'
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

/* ── step pill ────────────────────────────────────────────────────────────── */
function Step({ n, label, desc }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        {n}
      </div>
      <div className="pt-1">
        <p className="font-bold text-slate-800 dark:text-white text-sm">{label}</p>
        {desc && <p className="text-xs text-slate-500 dark:text-white/40 mt-1 leading-relaxed">{desc}</p>}
      </div>
    </div>
  );
}

/* ── MQTT Examples ────────────────────────────────────────────────────────── */

const MQTT_BASIC = `#include <WiFi.h>
#include <PubSubClient.h>

// 1. إعدادات الشبكة ✏️
const char* ssid     = "اسم_الشبكة";
const char* password = "كلمة_المرور";

// 2. إعدادات السيرفر والـ UID
const char* mqtt_server = "broker.hivemq.com";
String userUID = "انسخ_الـ_UID_هنا"; 
String topic   = "actuator/led"; // نفس الـ Topic الذي حددته في الزر

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  
  // استقبال الأوامر من الموقع
  if (msg == "ON")  digitalWrite(2, HIGH);  // تشغيل الـ LED المدمج
  if (msg == "OFF") digitalWrite(2, LOW);   // إطفاء الـ LED
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_Device")) {
      // الاشتراك في الـ Topic مسبوقاً بالـ UID الفريد
      client.subscribe((userUID + "/" + topic).c_str());
    } else { 
      delay(5000); 
    }
  }
}

void setup() {
  pinMode(2, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();
}`;

const MQTT_SENSOR = `#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* ssid = "اسم_الشبكة";
const char* password = "كلمة_المرور";
const char* mqtt_server = "broker.hivemq.com";
String userUID = "انسخ_الـ_UID_هنا";

DHT dht(4, DHT22); // حساس DHT22 متصل بالمنفذ GPIO4
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  dht.begin();
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    client.connect("ESP32_Sensor");
  }
  
  float t = dht.readTemperature();
  if (!isnan(t)) {
    // إرسال البيانات مسبوقة بالـ UID الفريد
    String fullTopic = userUID + "/sensor/temperature";
    client.publish(fullTopic.c_str(), String(t).c_str());
  }
  client.loop();
  delay(5000); // إرسال قراءة جديدة كل 5 ثواني
}`;

const MQTT_CAR = `#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "اسم_الشبكة";
const char* password = "كلمة_المرور";
String userUID = "انسخ_الـ_UID_هنا";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  String cmd = "";
  for (int i = 0; i < length; i++) cmd += (char)payload[i];

  // استقبال أوامر التوجيه من الـ D-Pad
  if (cmd == "FORWARD") {
    // كود تحريك المحركات للأمام
  }
  else if (cmd == "BACK") {
    // كود تحريك المحركات للخلف
  }
  else if (cmd == "LEFT") {
    // الانعطاف ليسار السيارة
  }
  else if (cmd == "RIGHT") {
    // الانعطاف ليمين السيارة
  }
  else if (cmd == "STOP") {
    // إيقاف جميع المحركات
  }
}

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  client.setServer("broker.hivemq.com", 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    if (client.connect("ESP32_Car")) {
      // الاشتراك في موضوع حركة السيارة
      client.subscribe((userUID + "/car/move").c_str());
    }
  }
  client.loop();
}`;

const TABS = [
  { id: 'basic',  label: 'LED Control',  icon: Zap,   code: MQTT_BASIC  },
  { id: 'sensor', label: 'Temperature',  icon: Cpu,   code: MQTT_SENSOR },
  { id: 'car',    label: 'RC Car / D-Pad', icon: Wifi,  code: MQTT_CAR    },
];

const WIDGETS_GUIDE = [
  { name: 'Switch (زر تشغيل)', icon: Zap, payload: 'ON / OFF', desc: 'يرسل أمر التشغيل أو الإيقاف للتحكم بالريلاي، الأضواء أو الموتور.' },
  { name: 'Slider (مؤشر منزلق)', icon: Sliders, payload: 'رقم (مثال: 0 إلى 255)', desc: 'يرسل قيم رقمية للتحكم بالسرعة، شدة الإضاءة (PWM)، أو الزوايا.' },
  { name: 'Gauge (عداد دائري)', icon: Gauge, payload: 'رقم (مثال: 32.5)', desc: 'يستقبل قيم الحساسات ويعرضها بشكل دائري أنيق وجذاب.' },
  { name: 'Chart (مخطط بياني)', icon: Cpu, payload: 'رقم (مثال: 120)', desc: 'يرسم قراءات الحساسات عبر الزمن لمراقبة التغيرات.' },
  { name: 'Color Picker (محدد ألوان)', icon: Palette, payload: 'RGB أو Hex (مثال: 255,0,0)', desc: 'يرسل قيم الألوان للتحكم بإضاءات النيو بكسل والـ RGB LEDs.' },
  { name: 'Console Terminal', icon: Terminal, payload: 'نصوص حرة (String)', desc: 'يعرض سجل البيانات والرسائل النصية المرسلة من الـ ESP32.' },
];

export default function DeveloperGuide({ userUID }) {
  const [activeTab, setActiveTab] = useState('basic');
  const activeCode = TABS.find(t => t.id === activeTab)?.code || '';

  // AI Chat Assistant State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `مرحباً بك! أنا مساعد IOT365 الذكي 🤖. كيف يمكنني مساعدتك اليوم؟\n\nيمكنني إجابتك على أي سؤال بخصوص ربط الـ ESP32، عناوين الـ Topics، حفظ التصاميم أو أي استفسار آخر.`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  const handleSend = async (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputVal('');

    // Trigger typing state
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;

    if (!apiKey || apiKey.startsWith('your_')) {
      // Fallback to static bot responses if no real API key is configured
      setTimeout(() => {
        const responseText = getBotResponse(query, userUID);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: responseText }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    try {
      // Build context from the last 8 messages
      const contextMessages = updatedMessages.slice(-8).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `أنت مساعد ذكي لمنصة IOT365 لمساعدة الطلاب والمطورين في مشاريع إنترنت الأشياء والـ ESP32 وبرمجة Arduino C++ بروتوكول MQTT.
معلومات المنصة الأساسية:
- الـ UID الخاص بالمستخدم الحالي هو: ${userUID || 'YOUR_UID'}
- الـ MQTT Broker المستعمل: broker.hivemq.com والمنفذ: 1883.
- بنية الـ Topics هي دائماً: [UID]/[Topic_Name] (مثال: ${userUID || 'YOUR_UID'}/sensor/temp).
أجب باللغة العربية بأسلوب هندسي دقيق وواضح، وعند كتابة أكواد ESP32/C++ اكتب كوداً نظيفاً ومتكاملاً وخالياً من الأخطاء البرمجية (Syntax Errors).`
            },
            ...contextMessages
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const botResponseText = data.choices[0].message.content;
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botResponseText }]);
    } catch (error) {
      console.error("DeepSeek API error:", error);
      // Fallback warning message
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: `⚠️ **حدث خطأ أثناء الاتصال بـ DeepSeek API.**\n\n*السبب:* قد يكون هناك مشكلة في مفتاح API أو مشكلة في الاتصال بالشبكة. \n\n*إجابة بديلة مؤقتة:*\n${getBotResponse(query, userUID)}` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

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
          parts.push({
            type: 'code',
            code: codeLines.join('\n'),
            lang: codeLang
          });
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
          codeLang = line.replace('```', '').trim() || 'cpp';
        }
      } else {
        if (inCode) {
          codeLines.push(line);
        } else {
          parts.push({
            type: 'text',
            content: line
          });
        }
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
      
      if (line.trim().startsWith('*')) {
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
    <div className="space-y-8 pb-12">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            <BookOpen size={22} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">MQTT Developer Guide & Support</h2>
            <p className="text-sm text-slate-500 dark:text-white/40 mt-0.5">
              كل ما تحتاجه لربط أجهزة الـ ESP32 والتحكم بها لحظياً، مع مساعد ذكي للإجابة عن أسئلتك.
            </p>
          </div>
        </div>
        
        {/* User UID info badge */}
        <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 self-start sm:self-center shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-bold tracking-wider">Your unique UID</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-slate-800 dark:text-white">{userUID || 'Loading UID...'}</span>
              {userUID && <CopyBtn text={userUID} />}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Documentation (Colspan 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* ── MQTT Topic Structure ──────────────────────────────────── */}
          <div className="bg-gradient-to-br from-primary/10 to-violet-500/5 border border-primary/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <Wifi size={18} className="text-primary animate-pulse" />
              <h3 className="font-bold text-primary text-sm uppercase tracking-wider">
                بنية الـ MQTT Topics في الموقع
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-white/50 mb-4 leading-relaxed">
              لتفادي تداخل إرسال واستقبال البيانات مع المطورين الآخرين على سيرفر HiveMQ العام، يجب كتابة المواضيع (Topics) بالبنية التالية:
            </p>

            <div className="flex items-center flex-wrap gap-1 font-mono text-xs mb-5 bg-black/25 p-3.5 rounded-xl border border-white/5">
              {[
                { seg: userUID || '[YOUR_UID]', color: 'text-primary font-bold', bg: 'bg-primary/10 px-2 py-0.5 rounded-md' },
                { seg: '/', color: 'text-slate-600 dark:text-white/40' },
                { seg: '[MQTT_Topic]', color: 'text-amber-300 font-bold', bg: 'bg-amber-400/10 px-2 py-0.5 rounded-md' },
              ].map((p, i) => (
                <span key={i} className={`${p.color} ${p.bg || ''}`}>{p.seg}</span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-black/30 rounded-2xl p-4 border border-slate-200 dark:border-white/5">
                <p className="text-slate-500 dark:text-white/30 mb-2 font-bold text-[10px] uppercase">Broker Info</p>
                <div className="space-y-1.5 font-mono">
                  <p><span className="text-slate-600 dark:text-white/40">Host:</span> <span className="text-slate-800 dark:text-white font-semibold">broker.hivemq.com</span></p>
                  <p><span className="text-slate-600 dark:text-white/40">Port:</span> <span className="text-slate-800 dark:text-white font-semibold">1883</span> (TCP)</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-black/30 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex flex-col justify-center">
                <p className="text-slate-500 dark:text-white/30 mb-1 font-bold text-[10px] uppercase">Example Topic</p>
                <code className="text-amber-400 dark:text-amber-300 break-all font-semibold font-mono">{userUID || 'YOUR_UID'}/actuator/led</code>
              </div>
            </div>
          </div>

          {/* ── Steps to Connect ──────────────────────────────────────── */}
          <div className="bg-white/[0.01] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-md">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
              <ChevronRight size={18} className="text-primary" />
              خطوات ربط وتفعيل جهازك
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Step n={1} label="نسخ الـ UID الفريد الخاص بك"
                desc="من بطاقة الـ UID أعلى الصفحة، انسخ المعرف لربطه مع الـ ESP32 في الكود البرمجي لضمان الخصوصية والأمان." />
              <Step n={2} label="إضافة ودجت (Widget) في اللوحة"
                desc="توجه لعلامة تبويب التحكم، أضف الأداة التي تحتاجها واكتب لها عنوان موضوع (مثال: sensor/temp أو actuator/relay)." />
              <Step n={3} label="استخدام مكتبة PubSubClient"
                desc="قم بتثبيت مكتبة MQTT المفضلة في Arduino IDE، واستخدم أحد النماذج الجاهزة أدناه مع استبدال اسم شبكتك ومعرفك الفريد." />
              <Step n={4} label="توصيل الطاقة والتحكم الفوري"
                desc="ارفع الكود للـ ESP32 وشاهد القراءات تتدفق مباشرة على شاشتك، وتحكم بالأجهزة الملحقة في أجزاء من الثانية!" />
            </div>
          </div>

          {/* ── Widgets and Payloads Guide ────────────────────────────── */}
          <div className="bg-white/[0.01] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-md">
            <h3 className="font-extrabold text-slate-800 dark:text-white mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
              <ChevronRight size={18} className="text-primary" />
              الأدوات (Widgets) ونوع البيانات المتوقع
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {WIDGETS_GUIDE.map((widget, i) => {
                const Icon = widget.icon;
                return (
                  <div key={i} className="flex gap-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.04]">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 self-start">
                      <Icon size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs">{widget.name}</h4>
                      <p className="text-[10px] text-primary/80 font-mono mt-0.5">Payload: {widget.payload}</p>
                      <p className="text-[11px] text-slate-500 dark:text-white/40 mt-1 leading-relaxed">{widget.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Code Tabs ─────────────────────────────────────────────── */}
          <div className="bg-white/[0.01] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-md">
            <div className="flex border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-x-auto">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-4 text-xs font-bold transition-all border-b-2 shrink-0 ${
                      isActive
                        ? 'text-violet-500 dark:text-violet-300 border-violet-500 dark:border-violet-400 bg-violet-500/5'
                        : 'text-slate-500 dark:text-white/30 border-transparent hover:text-slate-800 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Active tab description */}
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-black/10">
              {{
                basic:  <p className="text-xs text-slate-500 dark:text-white/40">يقرأ أوامر التشغيل/الإطفاء <code className="text-amber-500 dark:text-amber-300">ON/OFF</code> المرسلة من الموقع لتشغيل أو إطفاء LED (منفذ GPIO2).</p>,
                sensor: <p className="text-xs text-slate-500 dark:text-white/40">يقرأ من حساس الحرارة والرطوبة DHT22 ويرسل القيمة المحدثة للموقع كل 5 ثوانٍ عبر MQTT.</p>,
                car:    <p className="text-xs text-slate-500 dark:text-white/40">يستقبل أوامر الاتجاهات لسيارات الـ RC الذكية من الـ D-pad ويعالج الأوامر تلقائياً.</p>,
              }[activeTab]}
            </div>

            <div className="p-5">
              <CodeBlock code={activeCode} language="C++ / Arduino IDE" />
            </div>
          </div>

          {/* ── Required Libraries ────────────────────────────────────── */}
          <div className="bg-white/[0.01] dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-md">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-xs uppercase tracking-wider">المكتبات المطلوبة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {[
                { name: 'PubSubClient', author: 'Nick O\'Leary', note: 'مكتبة اتصال الـ MQTT الأساسية وخفيفة الوزن جداً.' },
                { name: 'DHT sensor library', author: 'Adafruit', note: 'مكتبة لقراءة حساسات DHT11 و DHT22 وسنسورات الحرارة.' },
              ].map(lib => (
                <div key={lib.name} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-slate-900 dark:text-white font-bold">{lib.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-white/20 font-mono">Library</span>
                  </div>
                  <p className="text-slate-400 dark:text-white/30 text-[10px] mt-0.5">by {lib.author}</p>
                  <p className="text-primary font-semibold mt-2 text-[11px]">{lib.note}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: AI Support Assistant Chatbot */}
        <div className="lg:col-span-1 bg-white dark:bg-[#07080a] border border-slate-200 dark:border-white/10 rounded-3xl shadow-xl flex flex-col h-[650px] sticky top-28 overflow-hidden">
          
          {/* Chat Header */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(59,130,246,0.15)] shrink-0">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">IOT365 Smart Support</h3>
                <p className="text-[9px] text-slate-500 dark:text-white/30 font-medium">مساعدك الذكي لمشاريع الـ ESP32</p>
              </div>
            </div>
            
            <button 
              onClick={() => setMessages([{ id: 1, sender: 'bot', text: `مرحباً بك! أنا مساعد IOT365 الذكي 🤖. كيف يمكنني مساعدتك اليوم؟\n\nيمكنني إجابتك على أي سؤال بخصوص ربط الـ ESP32، عناوين الـ Topics، حفظ التصاميم أو أي استفسار آخر.` }])}
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Clear chat history"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0 self-start p-0.5">
                    <img src="/logo_icon.png" alt="Bot" className="w-full h-full object-contain" />
                  </div>
                )}
                
                <div className={`p-3 rounded-2xl text-left border ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-black border-transparent rounded-tr-none text-xs font-semibold' 
                    : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-800 dark:text-white/90 rounded-tl-none space-y-1'
                }`}>
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed">{msg.text}</p>
                  ) : (
                    renderBotMessage(msg.text)
                  )}
                </div>
              </div>
            ))}
            
            {/* Bot Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 mr-auto max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0 p-0.5">
                  <img src="/logo_icon.png" alt="Bot" className="w-full h-full object-contain" />
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-black/10 border-t border-slate-200 dark:border-white/5 shrink-0 flex flex-wrap gap-1.5">
            {[
              { label: '🔌 عنوان الـ Broker؟', q: 'ما هي معلومات الـ MQTT Broker؟' },
              { label: '🚀 كيف أربط ESP32؟', q: 'كيف أربط جهاز الـ ESP32؟' },
              { label: '💾 حفظ التصميم؟', q: 'كيف أحفظ لوحة التحكم والأسماء؟' },
              { label: '🧑‍💻 مطور المشروع؟', q: 'من هو مطور منصة IOT365؟' },
              { label: '💰 هل الموقع مجاني؟', q: 'هل استخدام الموقع مجاني أم مدفوع؟' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.q)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-right shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            className="p-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 shrink-0 flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="اكتب سؤالك بخصوص الموقع هنا..."
              className="flex-1 bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50 text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="bg-primary text-black p-2.5 rounded-2xl flex items-center justify-center hover:bg-primary/95 transition-colors disabled:opacity-50 shrink-0 shadow-lg shadow-primary/10"
            >
              <Send size={14} />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
