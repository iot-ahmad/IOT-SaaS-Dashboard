import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Zap, Search, Filter, MoreVertical, Plus, CheckCircle2, AlertTriangle, Info, User, Globe, Copy, Check, Terminal, CircuitBoard, Bell, Shield, Link as LinkIcon, CreditCard, Lock, Smartphone, Mail, Activity, ChevronUp, ChevronDown, Trash2, X, Sparkles, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';

import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Card = ({ children, className = '' }) => (
  <div className={`bg-card/[0.02] border border-border rounded-2xl p-6 backdrop-blur-md hover:bg-card/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-300 dark:border-white/20 ${className}`}>
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${copied ? 'bg-blue-500/20 text-blue-400' : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground/70'}`}
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
        <button
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="flex items-center gap-2 px-4 py-2 font-bold hover:opacity-90 transition-opacity shadow-lg text-sm"
        >
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-white/30" size={16} />
          <input className="w-full bg-muted border border-border rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm placeholder:text-muted-foreground dark:text-white/30" placeholder="Search devices..." />
        </div>
        <button className="bg-muted border border-border px-4 rounded-xl text-muted-foreground flex items-center gap-2 text-sm hover:bg-secondary transition-colors">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Device Table */}
      <Card className="!p-0 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold border-b border-border">
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
              <tr key={device.id} className="hover:bg-card/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                      <Cpu size={14} />
                    </div>
                    <div>
                      <span className="font-medium text-sm">{device.name}</span>
                      <span className="block text-xs text-muted-foreground dark:text-white/30">{device.type}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <CopyTopicButton topic={device.topic} userUID={userUID} />
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{device.pin}</span>
                </td>
                <td className="px-5 py-3">
                  <LastSeenBadge lastSeenTimestamp={device.lastSeen} />
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {new Date(device.lastSeen).toLocaleTimeString()}
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-muted-foreground dark:text-white/30 hover:text-foreground transition-colors"><MoreVertical size={16} /></button>
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
            <div key={p.pin} className="bg-muted border border-border rounded-xl p-3 hover:bg-secondary transition-colors">
              <span className={`text-xs font-bold font-mono ${p.color}`}>{p.pin}</span>
              <p className="text-[11px] text-foreground/90/50 mt-1">{p.label}</p>
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
            <pre className="bg-[#030406] border border-border dark:border-white/[0.07] rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-emerald-400 dark:text-emerald-400/90 scrollbar-thin text-left ltr-text">
              <code>{part.code}</code>
            </pre>
          </div>
        );
      }

      let line = part.content;
      if (line.trim() === '') return <div key={idx} className="h-1.5" />;

      let html = line.replace(/`([^`]+)`/g, '<bdi><code class="bg-muted bg-background/40 border border-border px-1.5 py-0.5 rounded font-mono text-amber-500 dark:text-amber-300 text-[10px]">$1</code></bdi>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
      
      if (/^\*(?!\*)/.test(line.trim())) {
        html = html.trim().substring(1).trim();
        return (
          <div key={idx} className="flex gap-2 items-start text-xs mt-1 text-foreground/70 text-right rtl-text">
            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }

      if (line.trim().startsWith('>')) {
        html = html.trim().substring(1).trim();
        return (
          <blockquote key={idx} className="border-r-2 border-primary/50 pr-3 pl-0 my-2 text-xs text-muted-foreground italic bg-background dark:bg-card/[0.01] py-1 text-right rtl-text rounded-l-md" dangerouslySetInnerHTML={{ __html: html }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-foreground/70 leading-relaxed mt-0.5 text-right rtl-text" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-amber-500/10 border-primary/20 shadow-lg relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(245,158,11,0.15)] shrink-0">
          <Sparkles size={18} className="animate-pulse" />
        </div>
        <div className="text-left font-sans">
          <h3 className="font-extrabold text-foreground text-sm">Cosmos3 Physical AI Diagnostics</h3>
          <p className="text-[10px] text-muted-foreground dark:text-white/30 font-medium">محرك التحليل والذكاء الفيزيائي للعتاد والأتمتة الهندسية</p>
        </div>
      </div>

      <form onSubmit={handleDiagnose} className="space-y-4 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 text-left">
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">الجهاز أو الحساس المستهدف</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-muted bg-background/50 border border-border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-primary/50 text-foreground"
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
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">المشكلة الفيزيائية أو سيناريو الأتمتة المعقد</label>
            <div className="flex gap-2">
              <input
                required
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="مثال: توقف مضخة المياه فجأة، أو تضارب الري التلقائي عند نزول المطر..."
                className="flex-1 bg-muted bg-background/50 border border-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
              <button
                type="submit"
                disabled={loading || !scenario.trim()}
                className="bg-primary text-black px-5 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors text-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {loading ? 'تحليل...' : 'تشخيص'}
              </button>
            </div>
          </div>
        </div>

        {/* Presets badges */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          <span className="text-[10px] text-muted-foreground/60 self-center">أمثلة سريعة:</span>
          {[
            { label: '🚨 توقف مضخة المياه فجأة', sc: 'المضخة متوقفة ولا تسحب مياه رغم وجود أمر تشغيل والرطوبة منخفضة جداً' },
            { label: '🔋 انخفاض بطارية ESP32 وحلول التوفير', sc: 'البطارية انخفضت لـ 2.8 فولت ونريد كود sleep موفر للطاقة' },
            { label: '🌧️ تضارب أتمتة الري مع المطر المكتشف', sc: 'رطوبة التربة منخفضة وتطلب ري ولكن حساس المطر يرصد هطول أمطار' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setScenario(preset.sc)}
              className="text-[9px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-right shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {/* Result Diagnostic Panel */}
      {(loading || response) && (
        <div className="mt-5 border-t border-border pt-4 text-left">
          <div className="bg-[#07090d] border border-border rounded-2xl p-5 shadow-inner relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] text-primary font-mono uppercase tracking-wider font-bold">PHYSICAL REAL-TIME DIAGNOSTIC</span>
            </div>
            
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-primary animate-spin" />
                <p className="text-xs text-muted-foreground dark:text-white/30 animate-pulse">يقوم Cosmos3 بتحليل الخواص الفيزيائية للعتاد واستخلاص السلوك الهندسي...</p>
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
        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="flex items-center gap-2 px-4 py-2 font-bold hover:opacity-90 transition-opacity shadow-lg text-sm"
        >
          <Zap size={18} /> New Rule
        </button>
      </div>



      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : autos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No automations yet. Click "New Rule" to create one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {autos.map(auto => (
            <Card key={auto.id} className="relative group">
              <button onClick={() => handleDelete(auto.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity p-1 bg-card/5 rounded-md backdrop-blur-md z-10 hidden md:block">
                <Trash2 size={16} />
              </button>
              <button onClick={() => handleDelete(auto.id)} className="absolute top-4 right-14 text-muted-foreground hover:text-red-400 p-1 md:hidden">
                <Trash2 size={16} />
              </button>
              <div className="flex justify-between items-start mb-4 pr-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${auto.active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground dark:text-white/30'}`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{auto.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{auto.rule}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleAuto(auto.id)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${auto.active ? 'bg-primary' : 'bg-slate-300 dark:bg-card/20'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-card transition-transform duration-300 ${auto.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="space-y-2 mb-4 relative z-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground dark:text-white/30">Trigger:</span>
                  <CopyTopicButton topic={auto.trigger} userUID={userUID} />
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground dark:text-white/30">Action:</span>
                  <CopyTopicButton topic={auto.action} userUID={userUID} />
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground dark:text-white/30 border-t border-border pt-3">
                <span>Last ran: {auto.lastRan}</span>
                <span>Used: {auto.usage}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Sibling backdrop overlay to avoid nesting backdrop-filter with overflow-y-scroll child */}
          <div className="absolute inset-0 bg-slate-900/40 bg-background/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="bg-card dark:bg-[#0a0b0d] border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Automation Rule</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Turn on light at night" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Trigger Metric</label>
                  <input required name="trigger" placeholder="e.g. Temp" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-muted dark:bg-[#13151a] border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 30" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Trigger Topic</label>
                <input required name="triggerTopic" placeholder="e.g. sensor/temp" className="w-full font-mono bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Description</label>
                <input required name="action" placeholder="e.g. Turn Fan ON" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Topic Payload (Topic:Payload)</label>
                <input required name="actionTopic" placeholder="e.g. actuator/fan:ON" className="w-full font-mono bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <button
                type="submit"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="w-full font-bold py-2.5 hover:opacity-90 transition-opacity shadow-lg mt-2"
              >
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
        <div className="flex bg-secondary dark:bg-card/5 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-card dark:bg-card/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-white/70'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'rules' ? 'bg-card dark:bg-card/10 text-foreground shadow-sm' : 'text-muted-foreground hover:text-slate-700 dark:hover:text-white/70'}`}
          >
            Alert Rules
          </button>
        </div>
      </div>



      {loading ? (
        <div className="text-muted-foreground text-sm">Loading alerts...</div>
      ) : activeTab === 'history' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{alerts.length} alerts</span>
            {alerts.length > 0 && (
              <button onClick={clearAllAlerts} className="text-sm text-red-500 hover:text-red-400 transition-colors">Clear All</button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No new alerts.</div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const { icon: Icon, color, bg } = getIcon(alert.type);
                return (
                  <div key={alert.id} className="p-4 rounded-xl border border-border flex items-center justify-between bg-card/[0.02] hover:bg-card/[0.04] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${bg} ${color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{alert.msg}</p>
                        <p className="text-xs text-muted-foreground dark:text-white/30">{alert.time}</p>
                      </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-xs text-muted-foreground dark:text-white/30 hover:text-foreground transition-colors">Dismiss</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="flex items-center gap-2 px-4 py-2 font-bold hover:opacity-90 transition-opacity shadow-lg text-sm"
            >
              <Bell size={16} /> New Alert Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No alert rules configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="p-5 rounded-xl border border-border bg-card/[0.02] relative group">
                  <button onClick={() => deleteRule(rule.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-red-400 opacity-0 md:group-hover:opacity-100 transition-opacity p-1 bg-card/5 rounded-md backdrop-blur-md z-10 md:block hidden">
                    <Trash2 size={16} />
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="absolute top-4 right-14 text-muted-foreground hover:text-red-400 p-1 md:hidden">
                    <Trash2 size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-3 pr-6">
                    <h3 className="font-bold text-sm">{rule.name}</h3>
                    <button 
                      onClick={() => toggleRule(rule.id)}
                      className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${rule.active ? 'bg-primary' : 'bg-slate-300 dark:bg-card/20'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-card transition-transform duration-300 ${rule.active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-foreground/90/50">Condition: <span className="font-medium text-foreground">{rule.condition}</span></p>
                    <p className="text-xs text-foreground/90/50">Topic: <span className="font-mono text-foreground">{rule.topic}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Sibling backdrop overlay to avoid nesting backdrop-filter with overflow-y-scroll child */}
          <div className="absolute inset-0 bg-slate-900/40 bg-background/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="bg-card dark:bg-[#0a0b0d] border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4">New Alert Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Critical Temp Alert" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Topic to Monitor</label>
                <input required name="topic" placeholder="e.g. sensor/greenhouse/temp" className="w-full font-mono bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Metric</label>
                  <input required name="metric" placeholder="e.g. Temp" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-muted dark:bg-[#13151a] border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 40" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <button
                type="submit"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="w-full font-bold py-2.5 hover:opacity-90 transition-opacity shadow-lg mt-2"
              >
                Save Alert Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



// ==================== LIVE TERMINAL ====================
export const LiveTerminal = ({ messages, isConnected, isSidebarCollapsed }) => {
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

  const leftClass = isSidebarCollapsed ? 'md:left-16' : 'md:left-64';

  return (
    <div className={`fixed bottom-0 left-0 ${leftClass} right-0 z-40 bg-[#0a0b0d]/95 backdrop-blur-md border-t border-border transition-all duration-300 flex flex-col pb-[env(safe-area-inset-bottom,0px)] ${isExpanded ? 'h-32 md:h-36' : 'h-9 md:h-10'}`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-card/5 transition-colors flex-shrink-0"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-bold text-foreground/60">Live Terminal</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-blue-400 animate-pulse' : 'bg-red-400'}`}></span>
          <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">▶ MQTT publishes</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground dark:text-white/30">
            {messages.filter(m => m.type === 'outgoing').length} out · {messages.length} total
          </span>
          <div className="text-muted-foreground hover:text-white">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 font-mono text-[11px] space-y-0.5 border-t border-border">
          {messages.length === 0 && (
            <p className="text-muted-foreground/60 italic">Waiting for MQTT messages from ESP32...</p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2">
              <span className="text-muted-foreground/60 flex-shrink-0">{msg.timestamp}</span>
              <span className={`${colorMap[msg.type] || 'text-foreground/90/50'}`}>
                {msg.type === 'incoming' ? '◀' : msg.type === 'outgoing' ? '▶' : '●'}
              </span>
              <span className="text-foreground/70">{msg.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
