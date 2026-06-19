import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Zap, Search, Filter, MoreVertical, Plus, CheckCircle2, AlertTriangle, Info, User, Globe, Copy, Check, Terminal, CircuitBoard, Bell, Shield, Link as LinkIcon, CreditCard, Lock, Smartphone, Mail, Activity, ChevronUp, ChevronDown, Trash2, X, Sparkles, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';

import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md hover:bg-white/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-300 dark:border-white/20 ${className}`}>
    {children}
  </div>
);

// Copy Topic Button Component
const CopyTopicButton = ({ topic, userUID }) => {
  const [copied, setCopied] = useState(false);
  const fullTopic = `${userUID}/${topic}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullTopic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      title={`Copy: ${fullTopic}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${copied ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:bg-slate-200 dark:bg-white/10 hover:text-slate-700 dark:text-white/70'}`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : fullTopic}
    </button>
  );
};

// Last Seen indicator
const LastSeenBadge = ({ lastSeenTimestamp }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const diffSec = Math.floor((now - lastSeenTimestamp) / 1000);
  const isOffline = diffSec > 30;

  let label;
  if (diffSec < 5) label = 'Just now';
  else if (diffSec < 60) label = `${diffSec}s ago`;
  else if (diffSec < 3600) label = `${Math.floor(diffSec / 60)}m ago`;
  else label = `${Math.floor(diffSec / 3600)}h ago`;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${isOffline ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-400' : 'bg-blue-400 animate-pulse'}`}></span>
      {isOffline ? 'Offline' : label}
    </span>
  );
};

// ==================== DEVICES VIEW ====================
export const DevicesView = ({ userUID, lastSeen }) => {
  const mergedDevices = DEVICES.map(d => ({
    ...d,
    lastSeen: lastSeen[d.topic] || d.lastSeen,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Connected Devices</h2>
        <button className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/30" size={16} />
          <input className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm placeholder:text-slate-500 dark:text-white/30" placeholder="Search devices..." />
        </div>
        <button className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 rounded-xl text-slate-600 dark:text-white/50 flex items-center gap-2 text-sm hover:bg-slate-200 dark:bg-white/10 transition-colors">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Device Table */}
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 text-xs uppercase font-bold border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-5 py-3">Device</th>
              <th className="px-5 py-3">MQTT Topic</th>
              <th className="px-5 py-3">Pin</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Seen</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {mergedDevices.map(device => (
              <tr key={device.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white/40 flex-shrink-0">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{device.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-white/30">{device.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <CopyTopicButton topic={device.topic} userUID={userUID} />
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono text-slate-600 dark:text-white/50 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">{device.pin}</span>
                </td>
                <td className="px-5 py-3">
                  <LastSeenBadge lastSeenTimestamp={device.lastSeen} />
                </td>
                <td className="px-5 py-3 text-xs text-slate-600 dark:text-white/40">
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-slate-500 dark:text-white/30 hover:text-slate-900 dark:text-white transition-colors"><MoreVertical size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Pin Mapping */}
      <Card>
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <CircuitBoard size={20} className="text-primary" /> ESP32 Pin Mapping
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PIN_MAP.map(p => (
            <div key={p.pin} className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl p-3 hover:bg-slate-200 dark:bg-white/10 transition-colors">
              <span className={`text-xs font-bold font-mono ${p.color}`}>{p.pin}</span>
              <p className="text-[11px] text-slate-600 dark:text-white/50 mt-1">{p.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ==================== COSMOS3 PHYSICAL AI DIAGNOSTICS ====================
const getMockCosmosResponse = (device, scenario) => {
  const sc = scenario.toLowerCase();
  if (sc.includes('مضخة') || sc.includes('pump') || sc.includes('موتور') || sc.includes('motor')) {
    return `🤖 **تقرير تشخيص العتاد الفيزيائي (Cosmos3 - Physical AI)**

**1. التحليل الفيزيائي للأعطال (Fault Isolation):**
*   **الحالة:** تم رصد انخفاض تيار التشغيل الكهربائي للمضخة بشكل فجائي مع بقاء إشارة GPIO نشطة.
*   **التشخيص الفيزيائي:** انسداد ميكانيكي (Mechanical Blockage) في مروحة السحب الخاصة بالمضخة، أو تشغيل جاف (Dry Running) للمضخة بسبب نفاد منسوب المياه في الخزان الرئيسي، مما قد يتسبب في تلف الملفات الداخلية للحرارة الزائدة.

**2. الأتمتة والسيناريو الهندسي المقترح (Smart Rules):**
*   **قاعدة الحماية التلقائية:**
    \`إذا كان مستوى المياه في الخزان < 10% ← إيقاف مضخة المياه فوراً وإرسال تنبيه حرج\`
*   **كود الحماية في الـ ESP32:**
\`\`\`cpp
// حماية مدمجة بالعتاد لمنع التشغيل الجاف
if (waterLevelPercent < 10.0) {
  digitalWrite(PUMP_PIN, LOW); // إيقاف المضخة فوراً
  client.publish("users/YOUR_UID/alerts", "CRITICAL: Dry run protection triggered!");
}
\`\`\``;
  }
  
  if (sc.includes('بطارية') || sc.includes('battery') || sc.includes('شحن') || sc.includes('شاحن')) {
    return `🤖 **تقرير تشخيص العتاد الفيزيائي (Cosmos3 - Physical AI)**

**1. التحليل الفيزيائي للأعطال (Fault Isolation):**
*   **الحالة:** هبوط جهد البطارية (Battery Voltage) إلى 2.8V، وهو ما يقل عن الحد التشغيلي الآمن لمنظم الجهد (LDO Regulator) الخاص بـ ESP32.
*   **التشخيص الفيزيائي:** دورة استيقاظ مكثفة للحساس مع استهلاك مستمر للتيار بمعدل ~80mA. عدم تفعيل بروتوكول النوم العميق (Deep Sleep) مما يتسبب في تفريغ سريع لخلية الليثيوم (LiPo).

**2. الإجراء الهندسي والحل المقترح:**
*   **الأتمتة المقترحة:** تقليل وتيرة الإرسال وتخفيض الإضاءة الخلفية للشاشة إن وجدت، وإرسال تنبيه صيانة عند انخفاض الشحن عن 15%.
*   **تفعيل النوم العميق (Deep Sleep C++):**
\`\`\`cpp
// إدخال الـ ESP32 في نوم عميق لمدة 15 دقيقة بعد كل قراءة لتوفير الطاقة
esp_sleep_enable_timer_wakeup(15 * 60 * 1000000ULL);
esp_deep_sleep_start();
\`\`\``;
  }

  if (sc.includes('مطر') || sc.includes('rain') || sc.includes('ري') || sc.includes('سقي') || sc.includes('irrigation')) {
    return `🤖 **تقرير تشخيص العتاد الفيزيائي (Cosmos3 - Physical AI)**

**1. التحليل الفيزيائي للأعطال (Fault Isolation):**
*   **الحالة:** تضارب في سيناريو الأتمتة (Automation Logic Conflict): حساس الرطوبة يسجل مستوى منخفض (< 20%) ويطلب تشغيل الري، بينما مستشعر المطر يرصد هطول أمطار غزيرة.
*   **التشخيص الفيزيائي:** هطول مطري مباشر يغمر الحساسات الخارجية، ولكن التربة لم تمتص المياه بالكامل بعد. تشغيل الري سيؤدي لغرق الجذور وضياع المياه.

**2. الأتمتة الذكية المقترحة (Logical Resolution):**
*   **قاعدة الأتمتة الهجينة:**
    \`إذا كانت رطوبة التربة < 20% و المطر = 0 (لا يوجد مطر) ← تشغيل الري. وإلا، يمنع الري تماماً ويتم تأجيل العملية\`
*   **كود الأتمتة الذكي:**
\`\`\`cpp
bool isRaining = digitalRead(RAIN_SENSOR_PIN) == LOW; // LOW يعني وجود مطر
int moisture = analogRead(SOIL_PIN);
int moisturePercent = map(moisture, 4095, 1200, 0, 100);

if (moisturePercent < 20 && !isRaining) {
  digitalWrite(IRRIGATION_PIN, HIGH); // تشغيل الري الآمن
} else {
  digitalWrite(IRRIGATION_PIN, LOW);  // إيقاف أو تأجيل الري
}
\`\`\``;
  }

  return `🤖 **تقرير تشخيص العتاد الفيزيائي (Cosmos3 - Physical AI)**

**1. التحليل الفيزيائي للأعطال (Fault Isolation):**
*   تم استقبال استعلامك بخصوص جهاز **[${device}]** وتحليله عبر محرك Cosmos3.
*   **التشخيص:** يقترح النموذج مراجعة توصيل الطاقة واستقرار قراءات الحساسات عبر بروتوكول I2C/SPI، مع التأكد من عدم وجود تداخل مغناطيسي أو حراري يؤثر على دقة القراءات.

**2. مقترحات الأتمتة:**
*   إنشاء قواعد أتمتة احتياطية (Fail-safe rules) لمنع حدوث كوارث فيزيائية في حال فقدان الاتصال بالإنترنت (Offline Mode).`;
};

export const CosmosPhysicalDiagnostics = ({ userUID }) => {
  const [device, setDevice] = useState('Soil Sensor #01');
  const [scenario, setScenario] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    setLoading(true);
    setResponse('');
    
    try {
      const res = await callCosmos3API(device, scenario.trim());
      setResponse(res);
    } catch (err) {
      console.error(err);
      setResponse('حدث خطأ أثناء إجراء التشخيص الفيزيائي.');
    } finally {
      setLoading(false);
    }
  };

  const callCosmos3API = async (dev, sc) => {
    const apiKey = import.meta.env.VITE_NVIDIA_API_KEY;
    if (!apiKey || apiKey.startsWith('your_')) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getMockCosmosResponse(dev, sc));
        }, 1200);
      });
    }

    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-51b-instruct",
          messages: [
            {
              role: "system",
              content: `أنت نموذج Cosmos3 الذكاء الفيزيائي (Physical AI) ومحرك التحليل الهندسي لمشاريع إنترنت الأشياء والعتاد (Hardware Diagnostics).
مهمتك:
1. تحليل سلوك العتاد والمشاكل الفيزيائية (مثل انخفاض بطارية الحساس، توقف المضخة، تداخل أو تضارب القواعد، أعطال الدوائر الكهربائية).
2. تقديم تشخيص هندسي دقيق قائم على التفكير الفيزيائي المنطقي (Reasoning).
3. اقتراح حلول عملية، سيناريوهات أتمتة ذكية، وقواعد أتمتة لحل المشكلة.
أجب باللغة العربية بأسلوب احترافي وهندسي مذهل وجذاب.`
            },
            {
              role: "user",
              content: `الجهاز المستهدف: ${dev}\nالمشكلة أو السيناريو الفيزيائي المطلوب تحليله: ${sc}`
            }
          ],
          temperature: 0.2,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("NVIDIA/Cosmos3 API error:", error);
      return `⚠️ **فشل الاتصال بمحرك Cosmos3**\n\n*السبب:* قد يكون مفتاح API غير صحيح أو انتهت صلاحيته. تم تفعيل المحاكي الفيزيائي الاحتياطي:\n\n${getMockCosmosResponse(dev, sc)}`;
    }
  };

  const renderDiagnosticContent = (text) => {
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
          <div key={idx} className="my-3 font-mono text-left" dir="ltr">
            <pre className="bg-[#030406] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-emerald-400 dark:text-emerald-400/90 scrollbar-thin text-left ltr-text">
              <code>{part.code}</code>
            </pre>
          </div>
        );
      }

      let line = part.content;
      if (line.trim() === '') return <div key={idx} className="h-1.5" />;

      let html = line.replace(/`([^`]+)`/g, '<bdi><code class="bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-1.5 py-0.5 rounded font-mono text-amber-500 dark:text-amber-300 text-[10px]">$1</code></bdi>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
      
      if (/^\*(?!\*)/.test(line.trim())) {
        html = html.trim().substring(1).trim();
        return (
          <div key={idx} className="flex gap-2 items-start text-xs mt-1 text-slate-700 dark:text-white/70 text-right rtl-text">
            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }

      if (line.trim().startsWith('>')) {
        html = html.trim().substring(1).trim();
        return (
          <blockquote key={idx} className="border-r-2 border-primary/50 pr-3 pl-0 my-2 text-xs text-slate-500 dark:text-white/40 italic bg-slate-50 dark:bg-white/[0.01] py-1 text-right rtl-text rounded-l-md" dangerouslySetInnerHTML={{ __html: html }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 dark:text-white/70 leading-relaxed mt-0.5 text-right rtl-text" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-500/5 to-violet-500/10 border-violet-500/20 shadow-lg relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.15)] shrink-0">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="text-left font-sans">
          <h3 className="font-extrabold text-slate-950 dark:text-white text-sm">Cosmos3 Physical AI Diagnostics</h3>
          <p className="text-[10px] text-slate-500 dark:text-white/30 font-medium">محرك التحليل والذكاء الفيزيائي للعتاد والأتمتة الهندسية</p>
        </div>
      </div>

      <form onSubmit={handleDiagnose} className="space-y-4 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 text-left">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-white/40 uppercase mb-1.5">الجهاز أو الحساس المستهدف</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-primary/50 text-slate-800 dark:text-white"
            >
              <option>Soil Sensor #01</option>
              <option>Main Irrigation Valve</option>
              <option>Greenhouse Temp</option>
              <option>Water Tank Level</option>
              <option>Water Pump A</option>
              <option>Greenhouse Vents</option>
              <option>Rain Sensor</option>
              <option>Light Sensor</option>
            </select>
          </div>
          <div className="sm:col-span-2 text-left">
            <label className="block text-[11px] font-bold text-slate-600 dark:text-white/40 uppercase mb-1.5">المشكلة الفيزيائية أو سيناريو الأتمتة المعقد</label>
            <div className="flex gap-2">
              <input
                required
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="مثال: توقف مضخة المياه فجأة، أو تضارب الري التلقائي عند نزول المطر..."
                className="flex-1 bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-primary/50 text-slate-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !scenario.trim()}
                className="bg-violet-600 text-white px-5 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-violet-500 transition-colors text-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {loading ? 'تحليل...' : 'تشخيص'}
              </button>
            </div>
          </div>
        </div>

        {/* Presets badges */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          <span className="text-[10px] text-slate-400 dark:text-white/20 self-center">أمثلة سريعة:</span>
          {[
            { label: '🚨 توقف مضخة المياه فجأة', sc: 'المضخة متوقفة ولا تسحب مياه رغم وجود أمر تشغيل والرطوبة منخفضة جداً' },
            { label: '🔋 انخفاض بطارية ESP32 وحلول التوفير', sc: 'البطارية انخفضت لـ 2.8 فولت ونريد كود sleep موفر للطاقة' },
            { label: '🌧️ تضارب أتمتة الري مع المطر المكتشف', sc: 'رطوبة التربة منخفضة وتطلب ري ولكن حساس المطر يرصد هطول أمطار' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setScenario(preset.sc)}
              className="text-[9px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5 transition-all text-right shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {/* Result Diagnostic Panel */}
      {(loading || response) && (
        <div className="mt-5 border-t border-slate-200 dark:border-white/5 pt-4 text-left">
          <div className="bg-[#07090d] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-inner relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-[9px] text-violet-400 font-mono uppercase tracking-wider font-bold">PHYSICAL REAL-TIME DIAGNOSTIC</span>
            </div>
            
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-violet-500 animate-spin" />
                <p className="text-xs text-slate-500 dark:text-white/30 animate-pulse">يقوم Cosmos3 بتحليل الخواص الفيزيائية للعتاد واستخلاص السلوك الهندسي...</p>
              </div>
            ) : (
              <div dir="rtl" className="space-y-2 text-slate-200 font-sans leading-relaxed text-right rtl-text">
                {renderDiagnosticContent(response)}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// ==================== AUTOMATIONS VIEW ====================
export const AutomationsToolView = ({ publish, userUID }) => {
  const [autos, setAutos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from Firestore
  useEffect(() => {
    if (!userUID) return;
    const load = async () => {
      try {
        const ref = doc(db, 'users', userUID, 'settings', 'automations');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAutos(snap.data().list || []);
        } else {
          // Default mock data
          const defaults = [
            { id: 1, name: 'Drought Prevention', rule: 'If Soil Moisture < 20% → Irrigation ON', trigger: 'farm/soil_moisture', action: 'farm/irrigation:1', active: true, operator: '<', value: 20, lastRan: 'Never', usage: '—' },
            { id: 2, name: 'Heat Protection', rule: 'If Temp > 35°C → Open Vents', trigger: 'farm/greenhouse_temp', action: 'farm/vents:1', active: true, operator: '>', value: 35, lastRan: 'Never', usage: '—' },
          ];
          setAutos(defaults);
        }
      } catch (err) {
        console.error("Failed to load automations", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userUID]);

  const saveAutos = async (list) => {
    setAutos(list);
    try {
      await setDoc(doc(db, 'users', userUID, 'settings', 'automations'), { list });
    } catch (err) {
      console.error("Failed to save automations", err);
    }
  };

  const toggleAuto = (id) => {
    const updated = autos.map(a => a.id === id ? { ...a, active: !a.active } : a);
    saveAutos(updated);
  };

  const handleDelete = (id) => {
    saveAutos(autos.filter(a => a.id !== id));
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAuto = {
      id: Date.now(),
      name: fd.get('name'),
      rule: `If ${fd.get('trigger')} ${fd.get('operator')} ${fd.get('value')} → ${fd.get('action')}`,
      trigger: fd.get('triggerTopic'),
      action: fd.get('actionTopic'),
      operator: fd.get('operator'),
      value: Number(fd.get('value')) || 0,
      active: true,
      lastRan: 'Never',
      usage: '—'
    };
    saveAutos([...autos, newAuto]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Workflow Automations</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
          <Zap size={18} /> New Rule
        </button>
      </div>

      {/* Cosmos3 Physical AI Hardware Diagnostics Hub */}
      <CosmosPhysicalDiagnostics userUID={userUID} />

      {loading ? (
        <div className="text-slate-500 text-sm">Loading...</div>
      ) : autos.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-white/40">No automations yet. Click "New Rule" to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {autos.map(auto => (
            <Card key={auto.id} className="relative group">
              <button onClick={() => handleDelete(auto.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity p-1 bg-white/5 rounded-md backdrop-blur-md z-10 hidden md:block">
                <Trash2 size={16} />
              </button>
              <button onClick={() => handleDelete(auto.id)} className="absolute top-4 right-14 text-slate-400 hover:text-red-400 p-1 md:hidden">
                <Trash2 size={16} />
              </button>
              <div className="flex justify-between items-start mb-4 pr-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${auto.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/30'}`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{auto.name}</h3>
                    <p className="text-[11px] text-slate-600 dark:text-white/40 mt-0.5">{auto.rule}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleAuto(auto.id)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${auto.active ? 'bg-primary' : 'bg-slate-300 dark:bg-white/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${auto.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="space-y-2 mb-4 relative z-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-white/30">Trigger:</span>
                  <CopyTopicButton topic={auto.trigger} userUID={userUID} />
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 dark:text-white/30">Action:</span>
                  <CopyTopicButton topic={auto.action} userUID={userUID} />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-white/30 border-t border-slate-200 dark:border-white/5 pt-3">
                <span>Last ran: {auto.lastRan}</span>
                <span>Used: {auto.usage}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-md relative text-slate-900 dark:text-white">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Automation Rule</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Turn on light at night" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Trigger Metric</label>
                  <input required name="trigger" placeholder="e.g. Temp" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-slate-100 dark:bg-[#13151a] border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 30" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Trigger Topic</label>
                <input required name="triggerTopic" placeholder="e.g. sensor/temp" className="w-full font-mono bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Action Description</label>
                <input required name="action" placeholder="e.g. Turn Fan ON" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Action Topic Payload (Topic:Payload)</label>
                <input required name="actionTopic" placeholder="e.g. actuator/fan:ON" className="w-full font-mono bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <button type="submit" className="w-full bg-primary text-black font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors mt-2">
                Save Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== ALERTS VIEW ====================
export const AlertsView = ({ userUID }) => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'rules'
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (!userUID) return;
    const load = async () => {
      try {
        const historyRef = doc(db, 'users', userUID, 'settings', 'alert_history');
        const rulesRef = doc(db, 'users', userUID, 'settings', 'alert_rules');
        
        const [historySnap, rulesSnap] = await Promise.all([
          getDoc(historyRef),
          getDoc(rulesRef)
        ]);

        if (historySnap.exists()) {
          setAlerts(historySnap.data().list || []);
        } else {
          setAlerts([
            { id: 1, type: 'critical', msg: 'Water Pump A failure detected!', time: '1h ago' },
            { id: 2, type: 'warning', msg: 'Soil Sensor #02 battery low (15%)', time: '4h ago' },
            { id: 3, type: 'success', msg: 'Irrigation schedule completed successfully', time: 'Today, 06:00' },
            { id: 4, type: 'info', msg: 'System update available (v2.4.0)', time: 'Yesterday' }
          ]);
        }

        if (rulesSnap.exists()) {
          setRules(rulesSnap.data().list || []);
        } else {
          setRules([
            { id: 1, name: 'Low Battery', condition: 'Battery < 20%', topic: 'sensor/+/battery', active: true },
            { id: 2, name: 'Pump Failure', condition: 'Status = Error', topic: 'actuator/pump/status', active: true },
          ]);
        }
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userUID]);

  const saveAlerts = async (list) => {
    setAlerts(list);
    try { await setDoc(doc(db, 'users', userUID, 'settings', 'alert_history'), { list }); } catch (e) {}
  };

  const saveRules = async (list) => {
    setRules(list);
    try { await setDoc(doc(db, 'users', userUID, 'settings', 'alert_rules'), { list }); } catch (e) {}
  };

  const dismissAlert = (id) => saveAlerts(alerts.filter(a => a.id !== id));
  const clearAllAlerts = () => saveAlerts([]);
  const deleteRule = (id) => saveRules(rules.filter(r => r.id !== id));
  const toggleRule = (id) => saveRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));

  const handleAddRule = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newRule = {
      id: Date.now(),
      name: fd.get('name'),
      condition: `${fd.get('metric')} ${fd.get('operator')} ${fd.get('value')}`,
      topic: fd.get('topic'),
      active: true
    };
    saveRules([...rules, newRule]);
    setShowAddModal(false);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'critical': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10' };
      case 'warning': return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
      case 'success': return { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-400/10' };
      default: return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/10' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">System Alerts</h2>
        <div className="flex bg-slate-200 dark:bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'}`}
          >
            Alert Rules
          </button>
        </div>
      </div>

      {/* Cosmos3 Physical AI & Hardware Reasoning Hub */}
      <CosmosPhysicalDiagnostics userUID={userUID} />

      {loading ? (
        <div className="text-slate-500 text-sm">Loading alerts...</div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-white/40">{alerts.length} alerts</span>
            {alerts.length > 0 && (
              <button onClick={clearAllAlerts} className="text-sm text-red-500 hover:text-red-400 transition-colors">Clear All</button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-white/40">No new alerts.</div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const { icon: Icon, color, bg } = getIcon(alert.type);
                return (
                  <div key={alert.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${bg} ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.msg}</p>
                        <p className="text-xs text-slate-500 dark:text-white/30">{alert.time}</p>
                      </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-xs text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white transition-colors">Dismiss</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddModal(true)} className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors text-sm">
              <Bell size={16} /> New Alert Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-white/40">No alert rules configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="p-5 rounded-xl border border-slate-200 dark:border-white/5 bg-white/[0.02] relative group">
                  <button onClick={() => deleteRule(rule.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity p-1 bg-white/5 rounded-md backdrop-blur-md z-10 md:block hidden">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="absolute top-4 right-14 text-slate-400 hover:text-red-400 p-1 md:hidden">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-3 pr-6">
                    <h3 className="font-bold text-sm">{rule.name}</h3>
                    <button 
                      onClick={() => toggleRule(rule.id)}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${rule.active ? 'bg-primary' : 'bg-slate-300 dark:bg-white/20'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${rule.active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 dark:text-white/50">Condition: <span className="font-medium text-slate-900 dark:text-white">{rule.condition}</span></p>
                    <p className="text-xs text-slate-600 dark:text-white/50">Topic: <span className="font-mono text-slate-900 dark:text-white">{rule.topic}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0a0b0d] border border-slate-200 dark:border-white/10 p-6 rounded-2xl w-full max-w-md relative text-slate-900 dark:text-white">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Alert Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Critical Temp Alert" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Topic to Monitor</label>
                <input required name="topic" placeholder="e.g. sensor/greenhouse/temp" className="w-full font-mono bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Metric</label>
                  <input required name="metric" placeholder="e.g. Temp" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-slate-100 dark:bg-[#13151a] border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 dark:text-white/50 mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 40" className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-black font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors mt-2">
                Save Alert Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SETTINGS VIEW ====================
export const SettingsView = ({ userUID, user, logout }) => {
  const [activeTab, setActiveTab] = useState('General');
  const [uidCopied, setUidCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }

  // General tab state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [language, setLanguage] = useState('English');
  const [timezone, setTimezone] = useState('(GMT+03:00) Amman');

  // Notifications state
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    sms: false,
    marketing: false,
  });

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Connected Accounts
  const [providers, setProviders] = useState([]);

  // Load Settings from Firestore
  useEffect(() => {
    if (!userUID) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'users', userUID, 'settings', 'prefs');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.language) setLanguage(data.language);
          if (data.timezone) setTimezone(data.timezone);
          if (data.notifications) setNotifications(data.notifications);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    fetchSettings();
  }, [userUID]);

  useEffect(() => {
    if (auth.currentUser) {
      setProviders(auth.currentUser.providerData.map(p => p.providerId));
    }
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const copyUID = () => {
    navigator.clipboard.writeText(userUID);
    setUidCopied(true);
    setTimeout(() => setUidCopied(false), 2500);
  };

  const saveGeneral = async () => {
    setLoading(true);
    try {
      if (auth.currentUser && displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      const docRef = doc(db, 'users', userUID, 'settings', 'prefs');
      await setDoc(docRef, { language, timezone }, { merge: true });
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  const saveNotifications = async (newNotifs) => {
    setNotifications(newNotifs);
    try {
      const docRef = doc(db, 'users', userUID, 'settings', 'prefs');
      await setDoc(docRef, { notifications: newNotifs }, { merge: true });
      showToast('Notifications updated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update notifications', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      return showToast('New passwords do not match', 'error');
    }
    if (!currentPassword) {
      return showToast('Current password is required', 'error');
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      showToast('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  const linkAccount = async (provider) => {
    setLoading(true);
    try {
      let authProvider;
      if (provider === 'google.com') authProvider = new GoogleAuthProvider();
      if (provider === 'github.com') authProvider = new GithubAuthProvider();
      await linkWithPopup(auth.currentUser, authProvider);
      setProviders([...providers, provider]);
      showToast(`Linked ${provider} successfully`);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  const unlinkAccount = async (provider) => {
    setLoading(true);
    try {
      await unlink(auth.currentUser, provider);
      setProviders(providers.filter(p => p !== provider));
      showToast(`Unlinked ${provider}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  };

  return (
  <div className="space-y-6 relative">
    {toast && (
      <div className={`absolute top-0 right-0 z-50 px-4 py-2 rounded-lg shadow-lg font-medium text-sm transition-all animate-fadeIn ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
        {toast.msg}
      </div>
    )}

    <h2 className="text-xl font-bold">Profile &amp; Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-2">
        {['General', 'Notifications', 'Security', 'Connected Accounts', 'Billing'].map(item => {
          const isActive = activeTab === item;
          return (
            <Button
              key={item}
              type="button"
              onClick={() => setActiveTab(item)}
              variant={isActive ? 'default' : 'ghost'}
              neon={isActive}
              className="mx-0 w-full text-left rounded-xl flex justify-between items-center"
            >
              {item}
              {item === 'Billing' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full ml-2">قريباً</span>}
            </Button>
          );
        })}
      </div>
      <div className="md:col-span-2 space-y-6">

        {activeTab === 'General' && (
          <>
            {/* ── Device UID — PROMINENT ───────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-violet-950/20 to-transparent p-6 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
              {/* glow blob */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-1">
                <Cpu size={16} className="text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Your Device UID</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-white/40 mb-4 leading-relaxed">
                استخدم هذا الـ UID في كود Arduino الخاص بك لربط جهازك بالموقع.
              </p>

              {/* UID box */}
              <div className="flex items-stretch gap-2 mb-4">
                <code className="flex-1 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-primary break-all leading-relaxed">
                  {userUID}
                </code>
                <button
                  id="btn-copy-uid"
                  onClick={copyUID}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 rounded-xl border text-xs font-bold transition-all duration-300 ${
                    uidCopied
                      ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_16px_rgba(59,130,246,0.3)]'
                      : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {uidCopied ? <Check size={18} /> : <Copy size={18} />}
                  {uidCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Firebase path note */}
              <div className="bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 dark:text-white/30 mb-1 uppercase tracking-wider font-semibold">Firebase Data Path</p>
                <code className="text-[11px] font-mono text-amber-300/70 break-all">
                  users/<span className="text-amber-300">{userUID}</span>/widgets/<span className="text-slate-600 dark:text-white/40">[Data_Key]</span>
                </code>
                <p className="text-[10px] text-slate-500 dark:text-white/30 mt-2 leading-relaxed">
                  كل أداة تُضيفها لها <strong className="text-slate-600 dark:text-white/50">Data Key</strong> خاص بها يُحدد مسار بياناتها في Firebase.
                </p>
              </div>
            </div>

            {/* Profile */}
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18} className="text-primary" /> Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/30 block mb-1">Full Name</label>
                  <input className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/30 block mb-1">Email</label>
                  <input className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50 text-slate-600 dark:text-white/50" value={user?.email || ''} readOnly />
                </div>
              </div>
            </Card>

            {/* Localization */}
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Localization</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/30 block mb-1">Language</label>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-primary/50">
                    <option>English</option>
                    <option>Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-white/30 block mb-1">Timezone</label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 focus:outline-none focus:border-primary/50">
                    <option>(GMT+03:00) Amman</option>
                    <option>(GMT+00:00) UTC</option>
                  </select>
                </div>
              </div>
            </Card>

            <Button
              type="button"
              onClick={saveGeneral}
              disabled={loading}
              className="mx-0 w-full rounded-xl disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save General Settings'}
            </Button>

            <Button
              type="button"
              onClick={logout}
              variant="ghost"
              neon={false}
              className="mx-0 w-full rounded-xl text-red-400 border-red-500/30"
            >
              Sign Out
            </Button>
          </>
        )}

        {activeTab === 'Notifications' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} className="text-yellow-400" /> Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: 'push', label: 'Push Notifications', desc: 'Receive alerts directly on your device' },
                  { id: 'email', label: 'Email Alerts', desc: 'Get daily summaries and critical alerts via email' },
                  { id: 'sms', label: 'SMS Notifications', desc: 'Critical system failures sent to your phone' },
                  { id: 'marketing', label: 'Marketing Communications', desc: 'Updates about new features and offers' },
                ].map((item, i) => {
                  const active = notifications[item.id];
                  return (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-600 dark:text-white/40">{item.desc}</p>
                    </div>
                    <button onClick={() => saveNotifications({...notifications, [item.id]: !active})} className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${active ? 'bg-primary' : 'bg-slate-300 dark:bg-white/20'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                )})}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Security' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-red-400" /> Security</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Lock size={14} className="text-slate-600 dark:text-white/50" /> Change Password</h4>
                  <div className="space-y-3">
                    <input type="password" placeholder="Current Password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-500 dark:text-white/30" />
                    <input type="password" placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-500 dark:text-white/30" />
                    <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-primary/50 placeholder:text-slate-500 dark:text-white/30" />
                    <button onClick={handleChangePassword} disabled={loading} className="bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:bg-white/20 text-slate-900 dark:text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/5 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2"><Smartphone size={14} className="text-slate-600 dark:text-white/50" /> Two-Factor Auth (2FA)</h4>
                      <p className="text-xs text-slate-600 dark:text-white/40 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="bg-primary/20 text-primary text-sm font-bold py-1.5 px-3 rounded-lg hover:bg-primary/30 transition-colors">Enable</button>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-white/5 pt-4">
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Activity size={14} className="text-slate-600 dark:text-white/50" /> Active Sessions</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-100 dark:bg-white/5 p-3 rounded-lg border border-primary/20">
                      <div>
                        <p className="text-xs font-bold text-primary">{navigator.platform} • Current Session</p>
                        <p className="text-[10px] text-slate-600 dark:text-white/40">{navigator.userAgent.slice(0, 60)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Connected Accounts' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><LinkIcon size={18} className="text-purple-400" /> Connected Accounts</h3>
              <p className="text-sm text-slate-600 dark:text-white/40 mb-6">Link external services to log in faster and sync your data.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-2">
                      <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Google</p>
                      <p className={`text-xs ${providers.includes('google.com') ? 'text-primary' : 'text-slate-500'}`}>{providers.includes('google.com') ? 'Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                  <button onClick={() => providers.includes('google.com') ? unlinkAccount('google.com') : linkAccount('google.com')} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${providers.includes('google.com') ? 'text-red-400 hover:bg-red-500/10' : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-white/70'}`}>
                    {providers.includes('google.com') ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 hover:border-slate-200 dark:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#333] text-white rounded-full flex items-center justify-center p-2.5">
                      <svg viewBox="0 0 24 24" className="w-full h-full" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">GitHub</p>
                      <p className={`text-xs ${providers.includes('github.com') ? 'text-primary' : 'text-slate-500'}`}>{providers.includes('github.com') ? 'Connected' : 'Not connected'}</p>
                    </div>
                  </div>
                  <button onClick={() => providers.includes('github.com') ? unlinkAccount('github.com') : linkAccount('github.com')} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${providers.includes('github.com') ? 'text-red-400 hover:bg-red-500/10' : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:bg-white/20 text-slate-700 dark:text-white/70'}`}>
                    {providers.includes('github.com') ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'Billing' && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-primary" /> Billing & Plan</h3>
              
              <div className="bg-gradient-to-br from-purple-950/40 to-black/40 border border-primary/20 rounded-xl p-5 mb-6 relative overflow-hidden text-center">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10 py-6">
                  <div className="inline-block bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-primary/30 mb-4">قريباً (Coming Soon)</div>
                  <h4 className="text-xl font-bold mb-2">مجاني للاستخدام الشخصي</h4>
                  <p className="text-sm text-slate-600 dark:text-white/60 max-w-md mx-auto leading-relaxed">
                    المنصة ستكون مجانية بالكامل للمشاريع الشخصية. سيتم لاحقاً إطلاق خطط مدفوعة مخصصة للجامعات والمؤسسات التعليمية بأسعار رمزية.
                  </p>
                </div>
              </div>

              <h4 className="text-sm font-bold mb-3">Payment Method</h4>
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-[#1a1f2b] rounded flex items-center justify-center border border-slate-200 dark:border-white/10">
                    <span className="text-xs font-bold italic text-slate-800 dark:text-white/80">VISA</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">•••• •••• •••• 4242</p>
                    <p className="text-xs text-slate-600 dark:text-white/40">Expires 12/28</p>
                  </div>
                </div>
                <button className="text-xs text-slate-600 dark:text-white/50 hover:text-slate-900 dark:text-white font-medium">Edit</button>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200 dark:border-white/5 pt-4">
                <span className="text-sm text-slate-700 dark:text-white/70">Billing History</span>
                <button className="text-xs text-primary hover:text-primary/80">View all invoices</button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </div>
  </div>
  );
};

// ==================== LIVE TERMINAL ====================
export const LiveTerminal = ({ messages, isConnected }) => {
  const scrollRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const colorMap = {
    incoming: 'text-blue-400',
    outgoing: 'text-blue-400',
    system: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div className={`fixed bottom-0 left-0 md:left-64 right-0 z-40 bg-[#0a0b0d]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 transition-all duration-300 ${isExpanded ? 'h-36' : 'h-10'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-bold text-slate-700 dark:text-white/60">Live Terminal</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-blue-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-[10px] text-slate-500 dark:text-white/25 hidden sm:inline">▶ MQTT publishes</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-500 dark:text-white/30">
            {messages.filter(m => m.type === 'outgoing').length} out · {messages.length} total
          </span>
          <div className="text-slate-500 hover:text-white">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div ref={scrollRef} className="h-24 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5 border-t border-white/5">
          {messages.length === 0 && (
            <p className="text-slate-400 dark:text-white/20 italic">Waiting for MQTT messages from ESP32...</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2">
              <span className="text-slate-400 dark:text-white/20 flex-shrink-0">{msg.timestamp}</span>
              <span className={`${colorMap[msg.type] || 'text-slate-600 dark:text-white/50'}`}>
                {msg.type === 'incoming' ? '◀' : msg.type === 'outgoing' ? '▶' : '●'}
              </span>
              <span className="text-slate-700 dark:text-white/70">{msg.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
