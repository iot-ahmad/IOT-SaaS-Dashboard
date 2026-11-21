import { useState, useRef, useEffect, useCallback } from 'react';
import { Copy, Check, Send, RefreshCw, Bot, Paperclip, Plus, ArrowUp, Cpu, Zap, Globe, Terminal, Play, CircleUserRound } from 'lucide-react';
import { getDefaultBrokerHost, getRootCaForHost } from '../config/mqttSecurity';
import { BrandLogo } from './ui/BrandLogo';

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
        copied ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground'
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
    <div className="relative group my-2 text-left" dir="ltr">
      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn text={code} />
      </div>
      <pre className="bg-[#050608] border border-border dark:border-white/[0.07] rounded-xl p-5 overflow-x-auto text-[11.5px] leading-relaxed font-mono text-foreground/70 scrollbar-thin text-left ltr-text">
        <code>{code}</code>
      </pre>
      <div className="absolute top-3 left-3 text-[9px] text-muted-foreground/60 font-mono uppercase tracking-widest pointer-events-none">
        {language}
      </div>
    </div>
  );
}

const getBotResponse = (input, uid, brokerHost, tlsPort = 8883) => {
  const text = input.toLowerCase();
  const cleanUid = uid || 'YOUR_UID';
  const activeHost = brokerHost || getDefaultBrokerHost();
  const caInfo = getRootCaForHost(activeHost);

  if (text.includes('مطور') || text.includes('من قام') || text.includes('احمد') || text.includes('أحمد') || text.includes('creator') || text.includes('developer') || text.includes('author') || text.includes('who built') || text.includes('who made') || text.includes('batayneh') || text.includes('بطاينه') || text.includes('بطاينة') || text.includes('صنع') || text.includes('برمج')) {
    return `**The IOT365 platform was completely designed and developed by Ahmad Al-Batayneh.**\n\nIt was built to provide a fast, powerful, and free platform for students, researchers, and engineers to connect ESP32 boards and IoT projects in real time without the complexity of setting up custom databases and backend servers.`;
  }

  if (text.includes('broker') || text.includes('بروك') || text.includes('hivemq') || text.includes('emqx') || text.includes('سيرفر') || text.includes('server') || text.includes('port') || text.includes('بورت') || text.includes('host') || text.includes('عنوان') || text.includes('منفذ')) {
    return `**Secure MQTT Broker Connection Details (TLS 1.2+):**\n\n*   **Host (Active Broker):** \`${activeHost}\`\n*   **TLS Port (Encrypted):** \`${tlsPort}\` (for ESP32 devices via \`WiFiClientSecure\` verifying root CA certificate \`${caInfo.name}\`)\n*   **WebSockets Port (Browser):** \`${caInfo.wsPort}\` (on path \`/mqtt\`)\n*   **Isolated Credentials:** When EMQX Serverless is enabled, your account automatically receives a dedicated username (\`${cleanUid}\`) and password restricted by ACL rules to your namespace (\`${cleanUid}/#\`). You can copy or rotate them from **Connect Device** (in the sidebar).\n*   **Security Notice:** Avoid using any shared demo credentials with physical actuators (locks, relays, pumps).\n\n> Secure connection setup in ESP32 firmware (without \`setInsecure()\` and without a static Client ID):\n\`\`\`cpp\n#include <time.h>\n// 1. Sync time via NTP to validate SSL certificate expiration\nconfigTime(0, 0, "pool.ntp.org", "time.nist.gov");\nwhile (time(nullptr) < 1700000000) delay(300);\n\n// 2. Enable root CA certificate verification (${caInfo.name})\nespClient.setCACert(root_ca);\nclient.setServer("${activeHost}", ${tlsPort});\n\n// 3. Unique Client ID derived from board MAC address to prevent collisions\nString clientId = "ESP32_" + String((uint32_t)(ESP.getEfuseMac() >> 24), HEX) + "_" + String(random(0xFFFF), HEX);\nclient.connect(clientId.c_str(), "YOUR_MQTT_USERNAME", "YOUR_MQTT_PASSWORD");\n\`\`\``;
  }

  if ((text.includes('كيف') || text.includes('how') || text.includes('connect') || text.includes('esp32') || text.includes('link') || text.includes('setup')) && (text.includes('اربط') || text.includes('أربط') || text.includes('اتصال') || text.includes('connect') || text.includes('esp32') || text.includes('طريقة') || text.includes('شغل') || text.includes('how'))) {
    return `**How to Connect Your ESP32 in 4 Steps:**\n\n1.  **Copy Your UID:** Copy your unique identifier (\`${cleanUid}\`) from the top bar.\n2.  **Wi-Fi Setup:** Connect your ESP32 board to your local Wi-Fi network.\n3.  **Topic Naming:** Publish and subscribe using topics prefixed with your UID:\n    \`[UID]/[Topic]\` (e.g., \`${cleanUid}/actuator/led\`).\n4.  **Dashboard Layout:** Add a control widget to your dashboard and match its MQTT Topic to your firmware.`;
  }

  if (text.includes('مجاني') || text.includes('free') || text.includes('فلوس') || text.includes('دفع') || text.includes('سعر') || text.includes('price') || text.includes('pricing') || text.includes('cost') || text.includes('billing') || text.includes('اشتراك') || text.includes('باقة') || text.includes('باقات')) {
    return `**Is IOT365 Free?**\n\n**Yes, the platform is completely free for developers, students, and individual makers.**\n\nThe upcoming *Billing & Plan* tier is designed for universities and educational institutions that require dedicated classroom management dashboards, bulk student project administration, or on-premise server hosting. Personal accounts remain completely free.`;
  }

  if (text.includes('حفظ') || text.includes('احفظ') || text.includes('save') || text.includes('firestore') || text.includes('تخزين') || text.includes('حذف') || text.includes('يروح') || text.includes('ضيع') || text.includes('persist') || text.includes('layout')) {
    return `**Saving & Customizing Your Dashboard:**\n\n*   **Instant Auto-Save:** You do not need to click a save button. Every widget you add or modify (positions, sizes, labels, and topics) is automatically synced to your cloud account backed by Firebase.\n*   **Renaming & Deleting Projects:** You can rename or delete any project dashboard directly from the sidebar with a single click.`;
  }

  if (text.includes('topic') || text.includes('عنوان الموضوع') || text.includes('موضوع') || text.includes('توبيك') || text.includes('بنية') || text.includes('structure')) {
    return `**MQTT Topic Structure in IOT365:**\n\nTo ensure isolation and security on the IOT365 broker, all topics are prefixed with your unique user UID:\n\`\`\`text\n[userUID]/[Topic_Name]\n\`\`\`\n**Examples:**\n*   Toggle Switch: \`${cleanUid}/actuator/led\`\n*   Temperature Gauge: \`${cleanUid}/sensor/temp\`\n*   RC Car D-Pad: \`${cleanUid}/car/move\``;
  }

  if (text.includes('d-pad') || text.includes('dpad') || text.includes('سيارة') || text.includes('car') || text.includes('rc') || text.includes('اتجاه') || text.includes('أزرار') || text.includes('حركة')) {
    return `**Smart RC Car Control (D-Pad):**\n\n*   Use the **D-Pad** or **Joystick** widget for real-time directional control.\n*   The widget publishes string commands: \`FORWARD\`, \`BACK\`, \`LEFT\`, \`RIGHT\`, and \`STOP\`.\n*   Subscribe to your steering topic on the ESP32, such as: \`${cleanUid}/car/move\`.\n\n> Check the "RC Car / D-Pad" template in the Code Generator for a complete working example.`;
  }

  if (text.includes('alert') || text.includes('تنبيه') || text.includes('اشعار') || text.includes('إشعار') || text.includes('رنين') || text.includes('جرس') || text.includes('notification')) {
    return `**Alerts & Notifications System:**\n\n*   **Smart Alert Rules:** Configure threshold rules in the Alerts tab to automatically monitor incoming sensor telemetry (e.g., trigger an alert if soil moisture drops below a threshold).\n*   **Direct ESP32 Alerts:** Your device can also publish alert messages directly to your alerts topic to display real-time notifications on the dashboard.`;
  }

  if (text.includes('dht') || text.includes('temp') || text.includes('sensor') || text.includes('حساس') || text.includes('حرارة') || text.includes('رطوبة') || text.includes('سنسور')) {
    return `**Reading Sensor Data (e.g., DHT11 / DHT22):**\n\n*   Wire your sensor to an ESP32 GPIO pin.\n*   Publish the reading as a string or float to a sensor topic such as: \`${cleanUid}/sensor/temperature\`.\n*   Add a **Gauge / Chart** widget on your dashboard with the matching topic to visualize live readings and historical trends.`;
  }

  return `I didn't quite catch that question.\n\nCould you rephrase your query, or pick one of these common topics?\n*   How to connect an ESP32\n*   MQTT Broker connection details\n*   Topic structure and UID namespace\n*   Saving dashboard layouts\n*   Platform creator and pricing`;
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

export default function DeveloperGuide({ userUID, mqttMode = 'demo', mqttConfig = {} }) {
  const activeHost = mqttConfig?.host || getDefaultBrokerHost();
  const activeTlsPort = mqttConfig?.tlsPort || 8883;
  const activeCaInfo = getRootCaForHost(activeHost);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Welcome! I am the IOT365 Smart Assistant.\n\nI can help you with connecting your ESP32, structuring MQTT topics, writing Arduino/C++ firmware, saving dashboard layouts, or any other technical questions.\n\nAsk me anything!`
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

    const systemPrompt = `You are a specialized AI technical assistant for the IOT365 platform. Your mission is to help students, engineers, and developers with IoT projects, ESP32 boards, Arduino C++ firmware, and MQTT integration.
Platform Details:
- The IOT365 platform was completely designed and developed by Ahmad Al-Batayneh.
- Current User UID: ${userUID || 'YOUR_UID'}
- Active MQTT Broker: ${activeHost} — Encrypted TLS Port: ${activeTlsPort} (Browser WSS: ${activeCaInfo.wsPort}/mqtt) — Mode: ${mqttMode === 'private' ? 'Isolated Private Broker' : 'Demo Mode'}
- Topic Structure: [UID]/[topic_name] — Example: ${userUID || 'YOUR_UID'}/sensor/temp
Your expertise also includes:
- Physical Hardware Diagnostics and troubleshooting issues with pumps, sensors, and electronic circuits.
- Designing smart automation rules and practical engineering solutions for ESP32 systems.
Mandatory Response & Security Rules:
- Always respond in clear, professional English.
- When writing ESP32/C++ code for EMQX Cloud or HiveMQ Cloud, always use espClient.setCACert(root_ca) with the ${activeCaInfo.name} certificate and NTP time synchronization via configTime(), and NEVER use espClient.setInsecure().
- Always generate a unique Client ID derived from ESP.getEfuseMac() and never hardcode a static Client ID such as ESP32_Device.
- Never invent or hardcode real passwords in code; always use placeholders "YOUR_MQTT_USERNAME" and "YOUR_MQTT_PASSWORD".
- Keep your answers accurate, practical, and concise.`;

    try {
      const contextMessages = updatedMessages.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'system', content: systemPrompt }, ...contextMessages]
        })
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: data.content }]);
    } catch (err) {
      console.warn('AI proxy failed, using static fallback:', err);
      // Last resort: static keyword-based response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: getBotResponse(query, userUID, activeHost, activeTlsPort)
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
          <div key={idx} className="my-2.5 font-mono text-left" dir="ltr">
            <CodeBlock code={part.code} language={part.lang} />
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
          <div key={idx} className="flex gap-2 items-start text-xs mt-1 text-foreground/70 text-left">
            <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }

      if (line.trim().startsWith('>')) {
        html = html.trim().substring(1).trim();
        return (
          <blockquote key={idx} className="border-l-2 border-primary/50 pl-3 pr-0 my-2 text-xs text-muted-foreground italic bg-background dark:bg-card/[0.01] py-1 text-left rounded-r-md" dangerouslySetInnerHTML={{ __html: html }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-foreground/70 leading-relaxed mt-0.5 text-left" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-card bg-background border border-border dark:border-white/[0.08] rounded-3xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>

      {/* ── Chat Header ────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0 rounded-t-3xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center shrink-0 overflow-hidden">
            <BrandLogo className="w-full h-full" />
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-foreground text-base">IOT365 Smart Assistant</h2>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Your AI assistant for ESP32 &amp; MQTT projects</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* UID Badge */}
          {userUID && (
            <div className="hidden sm:flex bg-muted border border-border rounded-xl px-3 py-2 items-center gap-2">
              <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">UID</p>
              <span className="font-mono text-xs font-bold text-primary">{userUID.substring(0, 8)}...</span>
              <CopyBtn text={userUID} />
            </div>
          )}
          {/* Clear chat */}
          <button
            onClick={() => setMessages([{ id: 1, sender: 'bot', text: `Welcome! I am the IOT365 Smart Assistant.\n\nI can help you with connecting your ESP32, structuring MQTT topics, writing Arduino/C++ firmware, saving dashboard layouts, or any other technical questions.\n\nAsk me anything!` }])}
            className="p-2.5 rounded-xl text-primary hover:bg-muted transition-all cursor-pointer"
            title="Clear conversation"
          >
            <RefreshCw size={16} className="text-primary" />
          </button>
        </div>
      </div>

      {/* ── Messages Area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-background scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 flex items-center justify-center shrink-0 self-start overflow-hidden">
                <BrandLogo className="w-full h-full" />
              </div>
            )}

            <div dir="ltr" className={`p-4 rounded-2xl text-left border ${
              msg.sender === 'user'
                ? 'bg-primary text-primary-foreground border-transparent rounded-tr-none text-sm font-semibold shadow-lg shadow-primary/20'
                : 'bg-card border-border text-foreground/90 rounded-tl-none space-y-1 shadow-sm'
            }`}>
              {msg.sender === 'user' ? (
                <p className="leading-relaxed text-left"><bdi>{msg.text}</bdi></p>
              ) : (
                renderBotMessage(msg.text)
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-3 mr-auto max-w-[80%]">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 overflow-hidden">
              <BrandLogo className="w-full h-full" />
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl rounded-tl-none flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Box & Suggestions (Vercel v0 Style) ────────────────── */}
      <div className="p-6 bg-card border-t border-border shrink-0 rounded-b-3xl flex flex-col gap-4">
        
        {/* Input Box */}
        <form
          onSubmit={(e) => { e.preventDefault(); if (inputVal.trim() && !isTyping) { handleSend(); adjustHeight(true); } }}
          className="relative bg-input rounded-xl border border-border transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
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
              placeholder="Type your question here... (e.g., How do I connect an ESP32 with a DHT22 sensor?)"
              className="w-full px-4 py-3 resize-none bg-transparent border-none text-foreground text-sm focus:outline-none placeholder:text-muted-foreground min-h-[60px]"
              style={{
                overflow: "hidden",
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 border-t border-border bg-card/50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1 text-primary cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-primary" />
                <span className="text-[10px] text-muted-foreground hidden group-hover:inline transition-opacity">
                  Attach
                </span>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg text-xs text-muted-foreground transition-colors border border-dashed border-border hover:border-primary/40 hover:bg-muted flex items-center justify-between gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                Project
              </button>
              
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping}
                className={`px-2 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  inputVal.trim() && !isTyping
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                <ArrowUp
                  className={`w-4 h-4 ${
                    inputVal.trim() && !isTyping
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </form>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {[
            { label: 'Broker Details?', q: 'What are the MQTT Broker connection details?', icon: <Globe className="w-3.5 h-3.5 text-primary" /> },
            { label: 'Connect ESP32?', q: 'How do I connect my ESP32 device?', icon: <Cpu className="w-3.5 h-3.5 text-primary" /> },
            { label: 'Save Layout?', q: 'How do I save my dashboard layout and project names?', icon: <Plus className="w-3.5 h-3.5 text-primary" /> },
            { label: 'Temperature Sensor?', q: 'How do I read data from a DHT22 sensor?', icon: <Zap className="w-3.5 h-3.5 text-primary" /> },
            { label: 'RC Car Control?', q: 'How do I control an RC car using the D-Pad?', icon: <Play className="w-3.5 h-3.5 text-primary" /> },
            { label: 'Platform Creator?', q: 'Who is the developer of the IOT365 platform?', icon: <CircleUserRound className="w-3.5 h-3.5 text-primary" /> },
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip.q)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-full border border-border transition-colors text-xs font-medium cursor-pointer"
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
