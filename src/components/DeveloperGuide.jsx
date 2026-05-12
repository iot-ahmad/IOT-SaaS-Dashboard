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

/* ── main codes ───────────────────────────────────────────────────────────── */
const BASIC_CODE = `#include <WiFi.h>
#include <FirebaseESP32.h>

// ═══════════════════════════════════════════════════
//  1. غيّر هذه المتغيرات فقط ✏️
// ═══════════════════════════════════════════════════
const char* WIFI_SSID     = "اسم_الشبكة";
const char* WIFI_PASSWORD = "كلمة_المرور";

String userUID  = "ضع_رقم_الـ_UID_هنا";   // انسخه من صفحة Settings
String myKey    = "led_control";           // نفس الـ Data Key الذي سميته في الموقع

// ═══════════════════════════════════════════════════
//  2. إعدادات Firebase (لا تغيّرها)
// ═══════════════════════════════════════════════════
#define FIREBASE_HOST "iot-0-1c24c-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"   // من Firebase Console → Project Settings

FirebaseData   firebaseData;
FirebaseConfig config;
FirebaseAuth   auth;

// ═══════════════════════════════════════════════════
//  3. بناء المسار الديناميكي
// ═══════════════════════════════════════════════════
String buildPath(String key) {
  return "/users/" + userUID + "/widgets/" + key;
}

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);   // LED built-in

  // الاتصال بالواي فاي
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\\nWiFi Connected!");

  // الاتصال بـ Firebase
  config.host           = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  String path = buildPath(myKey);   // /users/[UID]/widgets/led_control

  // ══ قراءة البيانات من Firebase ══
  if (Firebase.getString(firebaseData, path)) {
    String value = firebaseData.stringData();
    Serial.println("Value: " + value);

    if      (value == "ON")  { digitalWrite(2, HIGH); }
    else if (value == "OFF") { digitalWrite(2, LOW);  }
  } else {
    Serial.println("Firebase error: " + firebaseData.errorReason());
  }

  delay(1000);
}`;

const SENSOR_CODE = `#include <WiFi.h>
#include <FirebaseESP32.h>
#include <DHT.h>

const char* WIFI_SSID     = "اسم_الشبكة";
const char* WIFI_PASSWORD = "كلمة_المرور";

String userUID    = "ضع_رقم_الـ_UID_هنا";
String tempKey    = "temperature_1";    // Data Key للـ Gauge الخاص بالحرارة
String humidKey   = "humidity_1";       // Data Key للـ Gauge الخاص بالرطوبة

#define FIREBASE_HOST "iot-0-1c24c-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"
#define DHT_PIN 4
#define DHT_TYPE DHT22

FirebaseData   firebaseData;
FirebaseConfig config;
FirebaseAuth   auth;
DHT dht(DHT_PIN, DHT_TYPE);

String buildPath(String key) {
  return "/users/" + userUID + "/widgets/" + key;
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  float temp  = dht.readTemperature();
  float humid = dht.readHumidity();

  if (!isnan(temp) && !isnan(humid)) {
    // ══ كتابة قراءة الحرارة إلى Firebase ══
    Firebase.setFloat(firebaseData, buildPath(tempKey),  temp);
    Firebase.setFloat(firebaseData, buildPath(humidKey), humid);

    Serial.printf("Temp: %.1f°C | Humidity: %.1f%%\\n", temp, humid);
  }

  delay(5000);  // أرسل كل 5 ثواني
}`;

const RCCAR_CODE = `#include <WiFi.h>
#include <FirebaseESP32.h>

const char* WIFI_SSID     = "اسم_الشبكة";
const char* WIFI_PASSWORD = "كلمة_المرور";

String userUID    = "ضع_رقم_الـ_UID_هنا";
String moveKey    = "car_direction";   // Data Key للـ D-Pad
String speedKey   = "car_speed";      // Data Key للـ Speed Slider

// أرقام pins المحرك (L298N أو L293D)
#define IN1 25
#define IN2 26
#define IN3 27
#define IN4 14
#define ENA 32   // PWM للسرعة اليسار
#define ENB 33   // PWM للسرعة اليمين

#define FIREBASE_HOST "iot-0-1c24c-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YOUR_DATABASE_SECRET"

FirebaseData   firebaseData;
FirebaseConfig config;
FirebaseAuth   auth;

String buildPath(String key) {
  return "/users/" + userUID + "/widgets/" + key;
}

void setMotors(int speed, bool fwdL, bool fwdR) {
  analogWrite(ENA, speed);
  analogWrite(ENB, speed);
  digitalWrite(IN1, fwdL);
  digitalWrite(IN2, !fwdL);
  digitalWrite(IN3, fwdR);
  digitalWrite(IN4, !fwdR);
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

int currentSpeed = 150;

void loop() {
  // اقرأ السرعة
  if (Firebase.getInt(firebaseData, buildPath(speedKey))) {
    currentSpeed = constrain(firebaseData.intData(), 0, 255);
  }

  // اقرأ الاتجاه
  if (Firebase.getString(firebaseData, buildPath(moveKey))) {
    String cmd = firebaseData.stringData();

    if      (cmd == "FORWARD") setMotors(currentSpeed, true,  true);
    else if (cmd == "BACK")    setMotors(currentSpeed, false, false);
    else if (cmd == "LEFT")    setMotors(currentSpeed, false, true);
    else if (cmd == "RIGHT")   setMotors(currentSpeed, true,  false);
    else                       setMotors(0, false, false);  // STOP
  }

  delay(100);
}`;

const TABS = [
  { id: 'basic',  label: 'LED Control',    icon: Zap,      code: BASIC_CODE   },
  { id: 'sensor', label: 'DHT22 Sensor',   icon: Cpu,      code: SENSOR_CODE  },
  { id: 'rccar',  label: 'RC Car',         icon: Wifi,     code: RCCAR_CODE   },
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
          <h2 className="text-xl font-bold text-white">Developer Guide</h2>
          <p className="text-sm text-white/40 mt-0.5">
            كيفية ربط جهاز ESP32 بالموقع عبر Firebase Realtime Database
          </p>
        </div>
      </div>

      {/* ── Path Structure Card ────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-amber-400" />
          <h3 className="font-bold text-amber-300 text-sm uppercase tracking-wider">
            بنية مسار البيانات في Firebase
          </h3>
        </div>

        {/* Path visual */}
        <div className="flex items-center flex-wrap gap-1 font-mono text-sm mb-4">
          {[
            { seg: '/users/', color: 'text-white/40' },
            { seg: userUID ? `${userUID.slice(0,10)}…` : '[UID]', color: 'text-primary', bg: 'bg-primary/10 px-2 py-0.5 rounded-md' },
            { seg: '/widgets/', color: 'text-white/40' },
            { seg: '[Data_Key]', color: 'text-amber-300', bg: 'bg-amber-400/10 px-2 py-0.5 rounded-md' },
          ].map((p, i) => (
            <span key={i} className={`${p.color} ${p.bg || ''}`}>{p.seg}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-white/30 mb-1 font-semibold uppercase tracking-wider text-[10px]">UID الخاص بك</p>
            <code className="text-primary break-all text-[11px]">{userUID || '—'}</code>
            <p className="text-white/20 mt-1.5 leading-relaxed">يُولَّد تلقائياً عند تسجيل الدخول بـ Google</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-white/30 mb-1 font-semibold uppercase tracking-wider text-[10px]">Data Key مثال</p>
            <code className="text-amber-300 text-[11px]">led_control</code>
            <p className="text-white/20 mt-1.5 leading-relaxed">أنت تختاره عند إضافة أداة جديدة في الموقع</p>
          </div>
          <div className="bg-black/30 rounded-xl p-3 border border-white/5">
            <p className="text-white/30 mb-1 font-semibold uppercase tracking-wider text-[10px]">المسار الكامل</p>
            <code className="text-white/60 text-[11px] break-all">users/[UID]/widgets/led_control</code>
            <p className="text-white/20 mt-1.5 leading-relaxed">هذا هو المسار الذي يقرأ منه الـ ESP32</p>
          </div>
        </div>
      </div>

      {/* ── Steps ─────────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">
          <ChevronRight size={18} className="text-primary" />
          خطوات الإعداد
        </h3>
        <div className="space-y-5">
          <Step n={1} label="انسخ الـ UID من صفحة Settings"
            desc="اذهب إلى Tools → Settings وانسخ الـ Device UID الخاص بك." />
          <Step n={2} label="أضف أداة في الموقع وحدد Data Key"
            desc='اضغط "Add Tool" في Universal Controller، وفي حقل Data Key اكتب اسماً مثل: led_control' />
          <Step n={3} label="افتح كود C++ واستبدل المتغيرات"
            desc="انسخ الكود أدناه وضع فيه الـ UID والـ Data Key بنفس الأسماء التي اخترتها." />
          <Step n={4} label="ثبّت مكتبة FirebaseESP32"
            desc="من Arduino IDE: Tools → Manage Libraries → ابحث عن Firebase ESP32 Client واثبّتها." />
          <Step n={5} label="ارفع الكود وراقب Serial Monitor"
            desc="يجب أن ترى القيم تتغير في الـ Serial Monitor عند تشغيل وإيقاف الأداة من الموقع." />
        </div>
      </div>

      {/* ── Code Tabs ─────────────────────────────────────────────── */}
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2 px-5 py-3 border-r border-white/5">
            <Code2 size={14} className="text-white/30" />
            <span className="text-xs text-white/30 font-semibold">C++ Examples</span>
          </div>
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
            basic:  <p className="text-xs text-white/40">يقرأ قيمة <code className="text-amber-300">ON/OFF</code> من Firebase ويتحكم في LED. مثالي لاختبار الاتصال أول مرة.</p>,
            sensor: <p className="text-xs text-white/40">يقرأ من حساس DHT22 ويرفع درجة الحرارة والرطوبة إلى Firebase كل 5 ثواني.</p>,
            rccar:  <p className="text-xs text-white/40">يقرأ الأوامر من D-Pad والسرعة من Slider ويتحكم في 4 محركات عبر L298N.</p>,
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
            { name: 'Firebase ESP32 Client', author: 'mobizt', note: 'الاتصال بـ Firebase' },
            { name: 'DHT sensor library', author: 'Adafruit', note: 'لحساسات DHT11 / DHT22' },
            { name: 'WiFi (built-in)', author: 'Espressif', note: 'مدمجة مع ESP32 board' },
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
