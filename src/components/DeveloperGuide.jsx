import { useState } from 'react';
import { Copy, Check, BookOpen, Cpu, Wifi, Database, ChevronRight, Code2, Zap } from 'lucide-react';

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
        copied ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
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
    <div className="relative group">
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={code} />
      </div>
      <pre className="bg-[#0a0c10] border border-white/[0.07] rounded-xl p-5 overflow-x-auto text-[12px] leading-relaxed font-mono text-white/70 scrollbar-thin">
        <code>{code}</code>
      </pre>
      <div className="absolute top-3 left-3 text-[10px] text-white/20 font-mono uppercase tracking-widest">
        {language}
      </div>
    </div>
  );
}

/* ── step pill ────────────────────────────────────────────────────────────── */
function Step({ n, label, desc }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-black text-sm">
        {n}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-white text-sm">{label}</p>
        {desc && <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{desc}</p>}
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

// 2. إعدادات الموقع
const char* mqtt_server = "broker.hivemq.com";
String userUID = "انسخ_الـ_UID_هنا"; 
String topic   = "actuator/led"; // نفس الـ Topic في الموقع

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  
  if (msg == "ON")  digitalWrite(2, HIGH);
  if (msg == "OFF") digitalWrite(2, LOW);
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP32_Device")) {
      client.subscribe((userUID + "/" + topic).c_str());
    } else { delay(5000); }
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

DHT dht(4, DHT22);
WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  dht.begin();
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) {
    client.connect("ESP32_Sensor");
  }
  
  float t = dht.readTemperature();
  if (!isnan(t)) {
    String fullTopic = userUID + "/sensor/temperature";
    client.publish(fullTopic.c_str(), String(t).c_str());
  }
  client.loop();
  delay(5000); // إرسال كل 5 ثواني
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

  if (cmd == "FORWARD") { /* كود المحركات للأمام */ }
  else if (cmd == "BACK") { /* كود المحركات للخلف */ }
  else if (cmd == "STOP") { /* إيقاف */ }
}

void setup() {
  WiFi.begin(ssid, password);
  client.setServer("broker.hivemq.com", 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    if (client.connect("ESP32_Car")) {
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

export default function DeveloperGuide({ userUID }) {
  const [activeTab, setActiveTab] = useState('basic');
  const activeCode = TABS.find(t => t.id === activeTab)?.code || '';

  return (
    <div className="space-y-8 pb-8">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">MQTT Developer Guide</h2>
          <p className="text-sm text-white/40 mt-0.5">
            أسهل طريقة لربط أجهزتك بالموقع عبر بروتوكول MQTT السريع (بدون Firebase)
          </p>
        </div>
      </div>

      {/* ── MQTT Topic Structure ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/10 to-violet-500/5 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wifi size={16} className="text-primary" />
          <h3 className="font-bold text-primary text-sm uppercase tracking-wider">
            بنية الـ MQTT Topics
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-1 font-mono text-sm mb-4">
          {[
            { seg: userUID || '[UID]', color: 'text-primary', bg: 'bg-primary/10 px-2 py-0.5 rounded-md' },
            { seg: '/', color: 'text-white/40' },
            { seg: '[MQTT_Topic]', color: 'text-amber-300', bg: 'bg-amber-400/10 px-2 py-0.5 rounded-md' },
          ].map((p, i) => (
            <span key={i} className={`${p.color} ${p.bg || ''}`}>{p.seg}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-black/30 rounded-xl p-4 border border-white/5">
            <p className="text-white/30 mb-2 font-semibold text-[10px] uppercase">Broker Info</p>
            <div className="space-y-1 font-mono">
              <p><span className="text-white/40">Host:</span> <span className="text-white">broker.hivemq.com</span></p>
              <p><span className="text-white/40">Port:</span> <span className="text-white">1883</span></p>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5">
            <p className="text-white/30 mb-2 font-semibold text-[10px] uppercase">Example Topic</p>
            <code className="text-amber-300 break-all">{userUID || 'UID'}/actuator/led</code>
          </div>
        </div>
      </div>

      {/* ── Steps ─────────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">
          <ChevronRight size={18} className="text-primary" />
          خطوات الربط البسيطة
        </h3>
        <div className="space-y-5">
          <Step n={1} label="انسخ الـ UID الخاص بك"
            desc="هذا المعرف يضمن أن جهازك يتصل بحسابك الخاص فقط." />
          <Step n={2} label="أضف أداة في الـ Controller"
            desc="تأكد من كتابة الـ MQTT Topic بشكل صحيح (مثل actuator/led)." />
          <Step n={3} label="استخدم مكتبة PubSubClient"
            desc="هي المكتبة الأخف والأسرع للـ ESP32 للتعامل مع MQTT." />
          <Step n={4} label="ارفع الكود وتحكم لحظياً"
            desc="لا حاجة لـ Firebase، البيانات تنتقل مباشرة بين الموقع والجهاز." />
        </div>
      </div>

      {/* ── Code Tabs ─────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/10 bg-black/20 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-all border-b-2 ${
                  isActive
                    ? 'text-violet-300 border-violet-400 bg-violet-500/5'
                    : 'text-white/30 border-transparent hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active tab description */}
        <div className="px-5 py-3 border-b border-white/5 bg-black/10">
          {{
            basic:  <p className="text-xs text-white/40">يقرأ أوامر <code className="text-amber-300">ON/OFF</code> عبر MQTT للتحكم في LED مباشرة. (سريع جداً)</p>,
            sensor: <p className="text-xs text-white/40">يقرأ من حساس DHT22 ويرسل الحرارة والرطوبة لحظياً عبر MQTT.</p>,
            car:    <p className="text-xs text-white/40">يستقبل أوامر الحركة للـ D-Pad والسرعة للتحكم الفوري بـ 4 محركات عبر L298N.</p>,
          }[activeTab]}
        </div>

        <div className="p-5">
          <CodeBlock code={activeCode} language="C++ / Arduino" />
        </div>
      </div>

      {/* ── Libraries ─────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 text-sm">المكتبات المطلوبة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { name: 'PubSubClient', author: 'Nick O\'Leary', note: 'المكتبة الأساسية للـ MQTT (خفيفة جداً)' },
            { name: 'DHT sensor library', author: 'Adafruit', note: 'فقط إذا كنت تستخدم حساس حرارة' },
          ].map(lib => (
            <div key={lib.name} className="bg-black/30 border border-white/5 rounded-xl p-3">
              <p className="font-mono text-white/70 font-semibold mb-0.5">{lib.name}</p>
              <p className="text-white/30">by {lib.author}</p>
              <p className="text-primary/60 mt-1.5">{lib.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
