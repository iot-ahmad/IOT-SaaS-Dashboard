import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Code2, Cpu, Compass, HelpCircle, Copy, Check, Download,
  Wifi, Terminal, Zap, Bell, Gamepad2, Globe, ShieldCheck, ArrowRight,
  ChevronDown, ChevronUp, Layers, Wrench
} from 'lucide-react';
import { getDefaultBrokerHost, getRootCaForHost, buildEsp32TlsHelpers } from '../config/mqttSecurity';

/* ── Copy Button ─────────────────────────────────────────────────────────── */
function CopyBtn({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer border ${
        copied
          ? 'bg-primary/15 border-primary/35 text-primary'
          : 'bg-muted border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-primary" />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}

/* ── Code Viewer Block ───────────────────────────────────────────────────── */
function CodeBlock({ code, language = 'cpp', filename }) {
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'iot365_firmware.ino';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden text-left" dir="ltr">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/60 border-b border-border flex-wrap">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-primary" />
          <span className="text-[11px] font-mono font-bold text-foreground">
            {filename || language.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CopyBtn text={code} label="Copy Code" />
          {filename && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Download size={12} />
              <span>Download .ino</span>
            </button>
          )}
        </div>
      </div>
      <pre className="bg-background p-4 sm:p-5 overflow-x-auto text-[11.5px] leading-relaxed font-mono text-foreground/85 scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ── Pre-filled Firmware Builders ────────────────────────────────────────── */
function buildTemplates({ uid, host, tlsPort, username, topicSuffix, tlsHelpers }) {
  const cleanTopic = (topicSuffix || 'actuator/led').replace(/^\/+/, '');
  const sharedHeader = `/*
 * IOT365 Verified TLS Firmware Template
 * Namespace: ${uid}/#
 * Broker:    ${host}:${tlsPort}
 * NOTE: Copy your MQTT password from Dashboard -> Connect Device
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <time.h>

const char* WIFI_SSID     = "YOUR_WIFI_SSID";      // Or "Wokwi-GUEST" in Wokwi Simulator
const char* WIFI_PASS     = "YOUR_WIFI_PASSWORD";  // Or "" in Wokwi Simulator

const char* MQTT_HOST     = "${host}";
const int   MQTT_PORT     = ${tlsPort};
const char* MQTT_USER     = "${username}";
const char* MQTT_PASS     = "YOUR_MQTT_PASSWORD";
const char* USER_UID      = "${uid}";

${tlsHelpers}

WiFiClientSecure espClient;
PubSubClient client(espClient);`;

  const wifiReconnectTail = `void setupWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println(" connected!");
  syncTimeForTLS();
  espClient.setCACert(root_ca);
}

void reconnectMQTT(const char* subTopic) {
  while (!client.connected()) {
    String clientId = makeUniqueClientId("ESP32");
    Serial.print("Connecting to MQTT TLS...");
    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println(" connected!");
      if (subTopic && strlen(subTopic) > 0) {
        client.subscribe(subTopic);
        Serial.printf("Subscribed to: %s\\n", subTopic);
      }
    } else {
      Serial.printf(" failed (rc=%d), retrying in 3s...\\n", client.state());
      delay(3000);
    }
  }
}`;

  return [
    {
      id: 'switch',
      label: 'LED / Relay Switch',
      filename: 'iot365_led_switch.ino',
      defaultTopic: 'actuator/led',
      summary: 'Subscribes to an LED Switch or Relay widget (ON/OFF or 1/0) and controls a GPIO pin.',
      code: `${sharedHeader}

const int LED_PIN = 2; // Built-in LED or Relay GPIO
String CONTROL_TOPIC = String(USER_UID) + "/${cleanTopic}";

void onMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  msg.toUpperCase();

  bool turnOn = (msg == "ON" || msg == "1" || msg == "TRUE");
  digitalWrite(LED_PIN, turnOn ? HIGH : LOW);
  Serial.printf("[%s] -> %s\\n", topic, turnOn ? "ON" : "OFF");
}

${wifiReconnectTail}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  setupWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(onMessage);
}

void loop() {
  if (!client.connected()) reconnectMQTT(CONTROL_TOPIC.c_str());
  client.loop();
}`,
    },
    {
      id: 'sensor',
      label: 'DHT22 Sensor Telemetry',
      filename: 'iot365_dht22_sensor.ino',
      defaultTopic: 'sensor/temp',
      summary: 'Reads temperature & humidity every 3 seconds and publishes numeric values to Gauge/Chart widgets.',
      code: `${sharedHeader}
#include <DHT.h> // Install "DHT sensor library" by Adafruit

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

String TEMP_TOPIC     = String(USER_UID) + "/${cleanTopic}";
String HUMIDITY_TOPIC = String(USER_UID) + "/sensor/humidity";
unsigned long lastPub = 0;

${wifiReconnectTail}

void setup() {
  Serial.begin(115200);
  dht.begin();
  setupWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
}

void loop() {
  if (!client.connected()) reconnectMQTT(nullptr);
  client.loop();

  if (millis() - lastPub >= 3000) {
    lastPub = millis();
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();
    if (!isnan(temp) && !isnan(hum)) {
      client.publish(TEMP_TOPIC.c_str(), String(temp, 1).c_str());
      client.publish(HUMIDITY_TOPIC.c_str(), String(hum, 1).c_str());
      Serial.printf("Published -> Temp: %.1f C, Humidity: %.1f%%\\n", temp, hum);
    }
  }
}`,
    },
    {
      id: 'pwm',
      label: 'PWM Dimmer / Servo',
      filename: 'iot365_pwm_slider.ino',
      defaultTopic: 'actuator/dimmer',
      summary: 'Receives slider integer values (0-100 or 0-255) and drives a PWM LED or servo output smoothly.',
      code: `${sharedHeader}

const int PWM_PIN = 18;
String SLIDER_TOPIC = String(USER_UID) + "/${cleanTopic}";

void onMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  int val = constrain(msg.toInt(), 0, 255);
  analogWrite(PWM_PIN, val);
  Serial.printf("PWM Slider (%s) -> %d\\n", topic, val);
}

${wifiReconnectTail}

void setup() {
  Serial.begin(115200);
  pinMode(PWM_PIN, OUTPUT);
  setupWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(onMessage);
}

void loop() {
  if (!client.connected()) reconnectMQTT(SLIDER_TOPIC.c_str());
  client.loop();
}`,
    },
    {
      id: 'dpad',
      label: 'RC Car / Robot D-Pad',
      filename: 'iot365_rc_car_dpad.ino',
      defaultTopic: 'car/move',
      summary: 'Handles FORWARD, BACK, LEFT, RIGHT, and STOP commands from D-Pad or Joystick widgets.',
      code: `${sharedHeader}

const int IN1 = 26, IN2 = 27, IN3 = 14, IN4 = 12;
String DRIVE_TOPIC = String(USER_UID) + "/${cleanTopic}";

void setMotors(bool a1, bool a2, bool b1, bool b2) {
  digitalWrite(IN1, a1); digitalWrite(IN2, a2);
  digitalWrite(IN3, b1); digitalWrite(IN4, b2);
}

void onMessage(char* topic, byte* payload, unsigned int length) {
  String cmd;
  for (unsigned int i = 0; i < length; i++) cmd += (char)payload[i];
  cmd.trim();
  cmd.toUpperCase();

  if      (cmd == "FORWARD") setMotors(1, 0, 1, 0);
  else if (cmd == "BACK")    setMotors(0, 1, 0, 1);
  else if (cmd == "LEFT")    setMotors(0, 1, 1, 0);
  else if (cmd == "RIGHT")   setMotors(1, 0, 0, 1);
  else                       setMotors(0, 0, 0, 0); // STOP
  Serial.println("Drive CMD: " + cmd);
}

${wifiReconnectTail}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  setMotors(0, 0, 0, 0);
  setupWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(onMessage);
}

void loop() {
  if (!client.connected()) reconnectMQTT(DRIVE_TOPIC.c_str());
  client.loop();
}`,
    },
    {
      id: 'rgb_alerts',
      label: 'RGB Strip + Direct Alerts',
      filename: 'iot365_rgb_and_alerts.ino',
      defaultTopic: 'actuator/rgb',
      summary: 'Parses R,G,B color CSV payloads (e.g. 163,230,53) and publishes critical alerts to USER_UID/alerts.',
      code: `${sharedHeader}

const int PIN_R = 25, PIN_G = 26, PIN_B = 27;
String RGB_TOPIC    = String(USER_UID) + "/${cleanTopic}";
String ALERTS_TOPIC = String(USER_UID) + "/alerts";

void onMessage(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  int r = 0, g = 0, b = 0;
  if (sscanf(msg.c_str(), "%d,%d,%d", &r, &g, &b) == 3) {
    analogWrite(PIN_R, constrain(r, 0, 255));
    analogWrite(PIN_G, constrain(g, 0, 255));
    analogWrite(PIN_B, constrain(b, 0, 255));
    Serial.printf("RGB updated -> R:%d G:%d B:%d\\n", r, g, b);
  }
}

${wifiReconnectTail}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_R, OUTPUT); pinMode(PIN_G, OUTPUT); pinMode(PIN_B, OUTPUT);
  setupWiFi();
  client.setServer(MQTT_HOST, MQTT_PORT);
  client.setCallback(onMessage);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT(RGB_TOPIC.c_str());
    // Notify the dashboard Alerts page that this controller booted cleanly:
    client.publish(ALERTS_TOPIC.c_str(), "OK: RGB Controller online and verified TLS");
  }
  client.loop();
}`,
    },
  ];
}

const WIDGET_REFERENCE = [
  { widget: 'LED Switch / Relay', dir: 'Dashboard -> ESP32', payload: 'ON  or  OFF', topic: 'actuator/led', notes: 'Also accepts 1/0 if synced back by hardware.' },
  { widget: 'PWM Dimmer / Fan / Curtain', dir: 'Dashboard -> ESP32', payload: '0 to 100 (or 0-255)', topic: 'actuator/dimmer', notes: 'Sends integer string whenever slider moves.' },
  { widget: 'Servo Slider / Gripper', dir: 'Dashboard -> ESP32', payload: '0 to 180 (degrees)', topic: 'actuator/servo', notes: 'Use map() or ESP32Servo to set shaft angle.' },
  { widget: 'D-Pad & Joystick', dir: 'Dashboard -> ESP32', payload: 'FORWARD | BACK | LEFT | RIGHT | STOP', topic: 'car/move', notes: 'Automatically sends STOP when button/stick releases.' },
  { widget: 'RGB Strip Controller', dir: 'Dashboard -> ESP32', payload: 'R,G,B (e.g. 163,230,53)', topic: 'actuator/rgb', notes: 'Comma-separated 0-255 RGB channels scaled by brightness.' },
  { widget: 'Door Lock / Water Valve', dir: 'Dashboard -> ESP32', payload: 'OPEN | LOCK  or  OPEN | CLOSE', topic: 'security/lock', notes: 'Latching toggle for solenoids and locks.' },
  { widget: 'Buzzer / Momentary Pulse', dir: 'Dashboard -> ESP32', payload: 'BEEP  or  custom payload', topic: 'alarm/buzzer', notes: 'Sends once per click.' },
  { widget: 'Gauge / Chart / Telemetry', dir: 'ESP32 -> Dashboard', payload: 'Numeric string (e.g. 24.8)', topic: 'sensor/temp', notes: 'Updates live dial and historical sparkline automatically.' },
  { widget: 'OLED / LCD & Dropdown', dir: 'Dashboard -> ESP32', payload: 'Any UTF-8 string', topic: 'display/text', notes: 'Send screen messages or operating modes like AUTO.' },
  { widget: 'Direct Hardware Alerts', dir: 'ESP32 -> Dashboard', payload: 'CRITICAL: ... | WARN: ... | OK: ...', topic: 'alerts', notes: 'Recorded live in Dashboard -> Alerts History.' },
];

const FAQS = [
  {
    q: 'Why does PubSubClient return error rc = -2 on ESP32?',
    a: 'rc = -2 means TCP/TLS connection failed before MQTT login. Check: (1) Wi-Fi has internet access, (2) MQTT_PORT is set to 8883 (TLS) and NOT 8084 (browser WebSockets), and (3) syncTimeForTLS() finished so mbedTLS accepts the certificate validity window.',
  },
  {
    q: 'Why does PubSubClient return error rc = 5 (Not Authorized)?',
    a: 'Your MQTT_USERNAME / MQTT_PASSWORD do not match your isolated EMQX account, or your code tried publishing to a topic outside your personal namespace ({UID}/#). Copy or rotate your credentials from Dashboard -> Connect Device.',
  },
  {
    q: 'My ESP32 connects, so why does the dashboard widget stay unchanged?',
    a: 'Dashboard widgets automatically prepend your UID prefix. Inside the widget settings enter ONLY the suffix (e.g., sensor/temp), while on your ESP32 publish to the full topic ({UID}/sensor/temp). Watch the bottom Live MQTT Bus to inspect arriving RX packets.',
  },
  {
    q: 'Why does my ESP32 connect and disconnect every few seconds?',
    a: 'Two devices (or an extra tab/board) are sharing the same MQTT Client ID. Always keep makeUniqueClientId("ESP32") from the templates above, which derives a unique ID from the chip MAC address.',
  },
  {
    q: 'Can I test code without owning a physical ESP32 yet?',
    a: 'Yes! Open Hardware & Tools -> Wokwi Simulator from the sidebar. Paste any template above, set WIFI_SSID = "Wokwi-GUEST" and WIFI_PASS = "", and watch packets flow directly to Universal Controller.',
  },
  {
    q: 'Is IOT365 free and is my MQTT traffic isolated?',
    a: 'Yes, IOT365 is completely free for makers, students, and engineers. Each account gets isolated ACL rules restricting publish/subscribe strictly to your own UID namespace.',
  },
];

const TABS = [
  { id: 'quickstart', label: 'Quick Start', icon: BookOpen },
  { id: 'code', label: 'ESP32 Code', icon: Code2 },
  { id: 'payloads', label: 'Widgets & Payloads', icon: Layers },
  { id: 'tour', label: 'Platform Tour', icon: Compass },
  { id: 'faq', label: 'Troubleshooting', icon: HelpCircle },
];

export default function DeveloperGuide({ userUID, mqttMode = 'demo', mqttConfig = {}, onOpenTool }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quickstart');
  const [selectedTplId, setSelectedTplId] = useState('switch');
  const [topicSuffix, setTopicSuffix] = useState('actuator/led');
  const [openFaqIdx, setOpenFaqIdx] = useState(0);

  const cleanUid = userUID || 'YOUR_UID';
  const activeHost = mqttConfig?.host && mqttConfig.host !== 'YOUR_MQTT_BROKER_HOST'
    ? mqttConfig.host
    : getDefaultBrokerHost();
  const tlsPort = Number(mqttConfig?.tlsPort) || 8883;
  const caInfo = getRootCaForHost(activeHost);
  const usernamePlaceholder = mqttConfig?.username || cleanUid;
  const tlsHelpers = buildEsp32TlsHelpers(activeHost);

  const templates = buildTemplates({
    uid: cleanUid,
    host: activeHost,
    tlsPort,
    username: usernamePlaceholder,
    topicSuffix,
    tlsHelpers,
  });

  const activeTemplate = templates.find((t) => t.id === selectedTplId) || templates[0];

  const handleSelectTemplate = (tpl) => {
    setSelectedTplId(tpl.id);
    setTopicSuffix(tpl.defaultTopic);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background text-foreground font-sans" dir="ltr">
      {/* ── Fixed Top Header & Live Specs Strip ──────────────────────── */}
      <div className="shrink-0 border-b border-border bg-card/60 px-3 sm:px-6 pt-4 pb-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-primary shrink-0" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                IOT365 Developer Docs &amp; Firmware Center
              </h1>
              <p className="text-xs text-muted-foreground">
                Pre-filled ESP32 TLS firmware, widget payload specs, and complete platform guide
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenTool?.('connection')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Wifi size={14} />
            <span>Open Connect Device</span>
          </button>
        </div>

        {/* Live Account Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-muted/50 border border-border rounded-xl px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Your UID Prefix</span>
              <span className="font-mono text-primary font-bold truncate block">{cleanUid}</span>
            </div>
            <CopyBtn text={cleanUid} label="UID" />
          </div>

          <div className="bg-muted/50 border border-border rounded-xl px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Broker Host</span>
              <span className="font-mono text-foreground truncate block">{activeHost}</span>
            </div>
            <CopyBtn text={activeHost} label="Host" />
          </div>

          <div className="bg-muted/50 border border-border rounded-xl px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">ESP32 TLS Port</span>
            <span className="font-mono text-primary font-bold">{tlsPort}</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-2">WSS {caInfo.wsPort}</span>
          </div>

          <div className="bg-muted/50 border border-border rounded-xl px-3 py-2">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Root CA &amp; Mode</span>
            <span className="font-mono text-foreground truncate block">
              {caInfo.name} · <span className="text-primary font-bold uppercase">{mqttMode}</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-primary/15 border-primary/35 text-primary'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon size={14} className="text-primary shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Documentation Body ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-5 pb-24 space-y-6 scrollbar-thin">
        {/* TAB 1: QUICK START */}
        {activeTab === 'quickstart' && (
          <div className="max-w-5xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  num: '01',
                  title: 'Get Your Isolated MQTT Credentials',
                  desc: 'Open Connect Device in the sidebar. IOT365 automatically provisions a dedicated EMQX account locked strictly to your namespace (UID/#). Copy your password from there.',
                  actionLabel: 'Open Connect Device',
                  onClick: () => onOpenTool?.('connection'),
                },
                {
                  num: '02',
                  title: 'Install Required Arduino Libraries',
                  desc: 'In Arduino IDE (or PlatformIO), install "PubSubClient" by Nick O\'Leary. For DHT sensors, install "DHT sensor library" by Adafruit; for servos, use ESP32Servo.',
                  actionLabel: 'Jump to ESP32 Code',
                  onClick: () => setActiveTab('code'),
                },
                {
                  num: '03',
                  title: 'Flash Verified TLS Firmware',
                  desc: 'Pick a ready-to-compile sketch from the ESP32 Code tab. Your UID, Broker Host, and Root CA are already injected — just paste your Wi-Fi and MQTT password.',
                  actionLabel: 'Generate Sketch',
                  onClick: () => setActiveTab('code'),
                },
                {
                  num: '04',
                  title: 'Add Widgets & Inspect Live Packets',
                  desc: 'Open Universal Controller, drag widgets by the 6-dot handle, set the matching topic suffix (e.g., actuator/led), and monitor traffic in the bottom Live MQTT Bus.',
                  actionLabel: 'Check Payload Specs',
                  onClick: () => setActiveTab('payloads'),
                },
              ].map((step) => (
                <div key={step.num} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-mono font-bold text-primary">STEP {step.num}</span>
                    <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={step.onClick}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer w-fit"
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Topic Architecture */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Topic Namespace &amp; ACL Isolation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every message on the broker uses a two-part topic so another user can never read or command your hardware.
                In dashboard widgets you type only the <strong className="text-foreground">suffix</strong>; IOT365 automatically prepends your UID. On your ESP32 firmware, always publish and subscribe to the <strong className="text-foreground">full topic</strong>:
              </p>
              <div className="bg-background border border-border rounded-xl p-4 font-mono text-xs flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded bg-primary/15 text-primary font-bold">{cleanUid}</span>
                <span className="text-muted-foreground">/</span>
                <span className="px-2 py-1 rounded bg-muted text-foreground">sensor_or_actuator/channel</span>
                <span className="text-muted-foreground ml-auto text-[11px]">ACL scope: {cleanUid}/#</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Control LED', full: `${cleanUid}/actuator/led`, widgetVal: 'actuator/led' },
                  { label: 'Read Temperature', full: `${cleanUid}/sensor/temp`, widgetVal: 'sensor/temp' },
                  { label: 'Hardware Alert', full: `${cleanUid}/alerts`, widgetVal: 'Auto-monitored by Alerts' },
                ].map((ex) => (
                  <div key={ex.label} className="bg-muted/40 border border-border rounded-xl p-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-foreground block">{ex.label}</span>
                    <code className="block text-[10px] font-mono text-primary break-all">{ex.full}</code>
                    <span className="block text-[10px] text-muted-foreground">Widget field: <code className="font-mono text-foreground">{ex.widgetVal}</code></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ESP32 CODE GENERATOR */}
        {activeTab === 'code' && (
          <div className="max-w-5xl space-y-5">
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl) => {
                  const isActive = tpl.id === selectedTplId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{activeTemplate.label}</h3>
                  <p className="text-xs text-muted-foreground">{activeTemplate.summary}</p>
                </div>

                <div className="w-full sm:w-64 shrink-0">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    Topic Suffix (live-updates code)
                  </label>
                  <input
                    type="text"
                    value={topicSuffix}
                    onChange={(e) => setTopicSuffix(e.target.value)}
                    placeholder={activeTemplate.defaultTopic}
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary/60"
                  />
                </div>
              </div>
            </div>

            <CodeBlock
              code={activeTemplate.code}
              language="cpp"
              filename={activeTemplate.filename}
            />
          </div>
        )}

        {/* TAB 3: WIDGETS & PAYLOADS */}
        {activeTab === 'payloads' && (
          <div className="max-w-5xl space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-1">Universal Controller Payload Specification</h3>
              <p className="text-xs text-muted-foreground">
                Match your firmware parser to the exact payload format emitted or expected by each dashboard widget.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-x-auto">
              <table className="w-full text-left min-w-[720px]">
                <thead className="bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Widget Type</th>
                    <th className="px-4 py-3">Direction</th>
                    <th className="px-4 py-3">Payload Format</th>
                    <th className="px-4 py-3">Full Example Topic</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {WIDGET_REFERENCE.map((row) => (
                    <tr key={row.widget} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{row.widget}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-primary whitespace-nowrap">{row.dir}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-foreground">{row.payload}</td>
                      <td className="px-4 py-3">
                        <CopyBtn text={`${cleanUid}/${row.topic}`} label={`${cleanUid}/${row.topic}`} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PLATFORM TOUR */}
        {activeTab === 'tour' && (
          <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Gamepad2,
                title: 'Universal Controller & Workspaces',
                desc: 'Create unlimited custom dashboards from the sidebar (+ button). Drag widgets exclusively by the 6-dot handle, resize cards, and persist layouts automatically to cloud storage.',
                btn: null,
              },
              {
                icon: Wifi,
                title: 'Connect Device (Private Broker & ACL)',
                desc: 'View your auto-isolated EMQX Serverless username, copy or rotate your password, or connect your own custom WSS/TLS MQTT cluster.',
                btn: 'Open Connect Device',
                onClick: () => onOpenTool?.('connection'),
              },
              {
                icon: Wrench,
                title: 'Wokwi Simulator',
                desc: 'Simulate ESP32 wiring and firmware directly inside the browser and test bidirectional MQTT packets against your live widgets.',
                btn: 'Open Simulator',
                onClick: () => onOpenTool?.('simulator'),
              },
              {
                icon: Cpu,
                title: 'Connected Devices Registry',
                desc: 'Register boards, track GPIO pinouts, copy UID-prefixed topics, and observe real-time device online/offline telemetry.',
                btn: 'Open Devices',
                onClick: () => onOpenTool?.('devices'),
              },
              {
                icon: Zap,
                title: 'Automations (IF -> THEN Rules)',
                desc: 'Trigger automatic MQTT commands whenever an incoming sensor crosses >, <, or = thresholds with built-in 10s spam throttling.',
                btn: 'Open Automations',
                onClick: () => onOpenTool?.('automations'),
              },
              {
                icon: Bell,
                title: 'System Alerts & Live MQTT Bus',
                desc: 'Monitor threshold breach rules in real time, receive direct hardware warnings on UID/alerts, and inspect every RX/TX frame in the bottom bus.',
                btn: 'Open Alerts',
                onClick: () => onOpenTool?.('alerts'),
              },
              {
                icon: Globe,
                title: 'IOT365 Community Hub',
                desc: 'Publish complete circuit schematics & code, bookmark builds, ask questions in Technical Discussions, and message fellow hardware engineers.',
                btn: 'Visit Community Hub',
                onClick: () => navigate('/hub'),
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Icon size={18} className="text-primary shrink-0" />
                      <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                  {item.btn && (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer w-fit"
                    >
                      <span>{item.btn}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: TROUBLESHOOTING & FAQ */}
        {activeTab === 'faq' && (
          <div className="max-w-4xl space-y-3">
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-foreground">{item.q}</span>
                    {isOpen
                      ? <ChevronUp size={16} className="text-primary shrink-0" />
                      : <ChevronDown size={16} className="text-primary shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 border-t border-border text-xs text-muted-foreground leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
