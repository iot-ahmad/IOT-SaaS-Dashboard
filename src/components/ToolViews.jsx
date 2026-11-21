import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Zap, Search, Filter, MoreVertical, Plus, CheckCircle2, AlertTriangle, Info, User, Globe, Copy, Check, Terminal, CircuitBoard, Bell, Shield, Link as LinkIcon, CreditCard, Lock, Smartphone, Mail, Activity, ChevronUp, ChevronDown, Trash2, X, Play, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/neon-button';

import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Card = ({ children, className = '' }) => (
  <div className={`hw-panel bg-card border border-border rounded-xl p-5 transition-all duration-200 hover:border-white/15 ${className}`}>
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${copied ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground/70'}`}
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} className="text-primary" />}
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isOffline ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-primary/10 border-primary/25 text-primary'}`}>
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
          className="flex items-center gap-2 px-4 py-2 font-bold hover:opacity-90 transition-opacity shadow-lg text-sm rounded-xl"
        >
          <Plus size={18} /> Add Device
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
          <input className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm placeholder:text-muted-foreground" placeholder="Search devices..." />
        </div>
        <button className="bg-muted border border-border px-4 rounded-xl text-foreground flex items-center gap-2 text-sm hover:bg-secondary transition-colors">
          <Filter size={16} className="text-primary" /> Filter
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
          <tbody className="divide-y divide-border">
            {mergedDevices.map(device => (
              <tr key={device.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-primary flex-shrink-0" />
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
    return `**Physical Hardware Diagnostic Report (Cosmos3 - Physical AI)**

**1. Physical Fault Isolation:**
*   **Condition:** Sudden drop in pump operating current detected while the GPIO control signal remains active.
*   **Physical Diagnosis:** Mechanical blockage in the pump intake impeller, or dry running caused by depleted water levels in the main tank, which can overheat and damage internal windings.

**2. Recommended Engineering Automation (Smart Rules):**
*   **Automatic Protection Rule:**
    \`If Tank Water Level < 10% → Immediately stop Water Pump and trigger critical alert\`
*   **ESP32 Hardware Protection Firmware:**
\`\`\`cpp
// Hardware-level dry-run protection
if (waterLevelPercent < 10.0) {
  digitalWrite(PUMP_PIN, LOW); // Shut off pump immediately
  client.publish("users/YOUR_UID/alerts", "CRITICAL: Dry run protection triggered!");
}
\`\`\``;
  }
  
  if (sc.includes('بطارية') || sc.includes('battery') || sc.includes('شحن') || sc.includes('شاحن') || sc.includes('power') || sc.includes('sleep')) {
    return `**Physical Hardware Diagnostic Report (Cosmos3 - Physical AI)**

**1. Physical Fault Isolation:**
*   **Condition:** Battery voltage dropped to 2.8V, below the safe operating threshold for the ESP32 LDO voltage regulator.
*   **Physical Diagnosis:** High-frequency sensor wake cycles drawing ~80mA continuously without Deep Sleep enabled, causing rapid LiPo cell discharge.

**2. Recommended Engineering Action & Resolution:**
*   **Recommended Automation:** Reduce telemetry publishing frequency, dim any local display backlight, and send a maintenance alert when battery charge drops below 15%.
*   **Enable ESP32 Deep Sleep (C++):**
\`\`\`cpp
// Put ESP32 into deep sleep for 15 minutes after each reading to conserve power
esp_sleep_enable_timer_wakeup(15 * 60 * 1000000ULL);
esp_deep_sleep_start();
\`\`\``;
  }

  if (sc.includes('مطر') || sc.includes('rain') || sc.includes('ري') || sc.includes('سقي') || sc.includes('irrigation')) {
    return `**Physical Hardware Diagnostic Report (Cosmos3 - Physical AI)**

**1. Physical Fault Isolation:**
*   **Condition:** Automation Logic Conflict detected: soil moisture sensor reads low (< 20%) and requests irrigation while the rain sensor detects active rainfall.
*   **Physical Diagnosis:** Direct rainfall is saturating surface sensors before water percolates to root depth. Activating irrigation now would over-saturate roots and waste water.

**2. Recommended Smart Automation (Logical Resolution):**
*   **Hybrid Automation Rule:**
    \`If Soil Moisture < 20% AND Rain Sensor = 0 (No Rain) → Start Irrigation. Otherwise, inhibit and defer irrigation.\`
*   **Smart Automation Firmware:**
\`\`\`cpp
bool isRaining = digitalRead(RAIN_SENSOR_PIN) == LOW; // LOW indicates rain detected
int moisture = analogRead(SOIL_PIN);
int moisturePercent = map(moisture, 4095, 1200, 0, 100);

if (moisturePercent < 20 && !isRaining) {
  digitalWrite(IRRIGATION_PIN, HIGH); // Safe irrigation start
} else {
  digitalWrite(IRRIGATION_PIN, LOW);  // Inhibit or defer irrigation
}
\`\`\``;
  }

  return `**Physical Hardware Diagnostic Report (Cosmos3 - Physical AI)**

**1. Physical Fault Isolation:**
*   Your diagnostic query for **[${device}]** has been analyzed by the Cosmos3 engine.
*   **Diagnosis:** The model recommends verifying power rail stability and I2C/SPI bus pull-up resistors, and checking for electromagnetic or thermal interference affecting sensor accuracy.

**2. Automation Recommendations:**
*   Configure local fail-safe rules on the microcontroller to prevent physical hardware damage if cloud connectivity is temporarily lost (Offline Mode).`;
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
      setResponse('An error occurred while running the physical hardware diagnostic.');
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
              content: `You are Cosmos3 Physical AI, an engineering diagnostic engine for IoT hardware and embedded systems.
Your responsibilities:
1. Analyze physical hardware behavior and faults (e.g., sensor battery drain, pump stall, automation rule conflicts, circuit faults).
2. Provide accurate engineering diagnostics grounded in physical reasoning.
3. Suggest practical fixes, smart automation scenarios, and fail-safe firmware rules.
Respond in clear, professional English with a structured engineering format.`
            },
            {
              role: "user",
              content: `Target Device: ${dev}\nPhysical issue or scenario to analyze: ${sc}`
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
      return `**Cosmos3 Engine Connection Warning**\n\n*Cause:* API key may be invalid or expired. Falling back to the built-in physical diagnostic simulator:\n\n${getMockCosmosResponse(dev, sc)}`;
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
            <pre className="bg-background border border-border rounded-xl p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-foreground/85 scrollbar-thin text-left ltr-text">
              <code>{part.code}</code>
            </pre>
          </div>
        );
      }

      let line = part.content;
      if (line.trim() === '') return <div key={idx} className="h-1.5" />;

      let html = line.replace(/`([^`]+)`/g, '<bdi><code class="bg-muted border border-border px-1.5 py-0.5 rounded font-mono text-primary text-[10px]">$1</code></bdi>');
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
      
      if (/^\*(?!\*)/.test(line.trim())) {
        html = html.trim().substring(1).trim();
        return (
          <div key={idx} className="flex gap-2 items-start text-xs mt-1 text-foreground/80 text-left">
            <span className="text-primary font-bold shrink-0">—</span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }

      if (line.trim().startsWith('>')) {
        html = html.trim().substring(1).trim();
        return (
          <blockquote key={idx} className="border-l-2 border-primary/50 pl-3 pr-0 my-2 text-xs text-muted-foreground italic bg-background py-1 text-left rounded-r-md" dangerouslySetInnerHTML={{ __html: html }} />
        );
      }

      return (
        <p key={idx} className="text-xs text-foreground/80 leading-relaxed mt-0.5 text-left" dangerouslySetInnerHTML={{ __html: html }} />
      );
    });
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-lg relative overflow-hidden mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Cpu size={22} className="text-primary shrink-0" />
        <div className="text-left font-sans">
          <h3 className="font-extrabold text-foreground text-sm">Cosmos3 Physical AI Diagnostics</h3>
          <p className="text-[10px] text-muted-foreground font-medium">Physical AI analysis engine for hardware diagnostics and engineering automation</p>
        </div>
      </div>

      <form onSubmit={handleDiagnose} className="space-y-4 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 text-left">
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">Target Device or Sensor</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-primary/50 text-foreground"
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
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">Physical Issue or Complex Automation Scenario</label>
            <div className="flex gap-2">
              <input
                required
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="e.g., Water pump stopped suddenly, or auto-irrigation conflicts with detected rain..."
                className="flex-1 bg-input border border-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
              <button
                type="submit"
                disabled={loading || !scenario.trim()}
                className="bg-primary text-primary-foreground px-5 rounded-xl font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors text-xs disabled:opacity-50"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                {loading ? 'Analyzing...' : 'Diagnose'}
              </button>
            </div>
          </div>
        </div>

        {/* Presets badges */}
        <div className="flex flex-wrap gap-2 pt-1.5">
          <span className="text-[10px] text-muted-foreground/60 self-center">Quick Examples:</span>
          {[
            { label: 'Sudden water pump failure', sc: 'Water pump stopped drawing water despite active ON command and critically low soil moisture' },
            { label: 'ESP32 battery drain & sleep optimization', sc: 'Battery voltage dropped to 2.8V; need deep sleep power-saving firmware' },
            { label: 'Irrigation conflict with rain sensor', sc: 'Soil moisture is low requesting irrigation, but the rain sensor detects active rainfall' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setScenario(preset.sc)}
              className="text-[9px] font-semibold px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-left shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </form>

      {/* Result Diagnostic Panel */}
      {(loading || response) && (
        <div className="mt-5 border-t border-border pt-4 text-left">
          <div className="bg-background border border-border rounded-2xl p-5 shadow-inner relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="text-[9px] text-primary font-mono uppercase tracking-wider font-bold">PHYSICAL REAL-TIME DIAGNOSTIC</span>
            </div>
            
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-primary animate-spin" />
                <p className="text-xs text-muted-foreground">Cosmos3 is analyzing physical hardware parameters and deriving engineering behavior...</p>
              </div>
            ) : (
              <div dir="ltr" className="space-y-2 text-foreground font-sans leading-relaxed text-left">
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
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Workflow Automations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Autonomous IF → THEN rules triggered by real-time MQTT sensor updates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm cursor-pointer"
        >
          <Zap size={16} /> New Rule
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading automations...</div>
      ) : autos.length === 0 ? (
        <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 text-muted-foreground text-sm">
          No automations yet. Click "New Rule" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {autos.map(auto => (
            <Card key={auto.id} className="relative group flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Zap size={20} className={auto.active ? 'text-primary shrink-0' : 'text-muted-foreground shrink-0'} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-foreground truncate">{auto.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{auto.rule}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAuto(auto.id)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                      auto.active ? 'bg-primary' : 'bg-muted border border-border'
                    }`}
                    title={auto.active ? 'Disable rule' : 'Enable rule'}
                  >
                    <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${auto.active ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/80'}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(auto.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* IF -> THEN Flow Blocks */}
              <div className="space-y-2">
                <div className="bg-muted/40 border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                      IF
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-foreground">
                      {auto.operator} <span className="text-primary">{auto.value}</span>
                    </span>
                  </div>
                  <CopyTopicButton topic={auto.trigger} userUID={userUID} />
                </div>

                <div className="bg-muted/40 border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 shrink-0">
                    THEN
                  </span>
                  <CopyTopicButton topic={auto.action} userUID={userUID} />
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground font-mono border-t border-border pt-3">
                <span>Last ran: <span className="text-primary">{auto.lastRan}</span></span>
                <span>Runs: <span className="text-primary">{auto.usage}</span></span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="hw-panel bg-card border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Automation Rule</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Turn on light at night" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Trigger Metric</label>
                  <input required name="trigger" placeholder="e.g. Temp" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 30" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Trigger Topic</label>
                <input required name="triggerTopic" placeholder="e.g. sensor/temp" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Description</label>
                <input required name="action" placeholder="e.g. Turn Fan ON" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Action Topic Payload (Topic:Payload)</label>
                <input required name="actionTopic" placeholder="e.g. actuator/fan:ON" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
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
      case 'critical': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/12 border-red-500/25', accent: 'border-l-2 border-l-red-500', badge: 'CRITICAL' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/12 border-amber-500/25', accent: 'border-l-2 border-l-amber-500', badge: 'WARNING' };
      case 'success': return { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/12 border-primary/25', accent: 'border-l-2 border-l-primary', badge: 'SUCCESS' };
      default: return { icon: Info, color: 'text-primary', bg: 'bg-primary/12 border-primary/25', accent: 'border-l-2 border-l-primary', badge: 'INFO' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">System Alerts</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Hardware fault diagnostics and threshold notifications</p>
        </div>
        <div className="flex bg-muted border border-border p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'history' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${activeTab === 'rules' ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
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
            <span className="text-xs font-mono text-muted-foreground"><span className="text-primary font-bold">{alerts.length}</span> alerts</span>
            {alerts.length > 0 && (
              <button onClick={clearAllAlerts} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer">Clear All</button>
            )}
          </div>
          {alerts.length === 0 ? (
            <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 text-muted-foreground text-sm">No new alerts.</div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const { icon: Icon, color, bg, accent, badge } = getIcon(alert.type);
                return (
                  <div key={alert.id} className={`hw-panel p-4 rounded-xl border border-border ${accent} flex items-center justify-between gap-3 bg-card hover:border-primary/30 transition-colors`}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Icon size={18} className={`${color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${bg} ${color}`}>{badge}</span>
                          <p className="text-sm font-semibold text-foreground">{alert.msg}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{alert.time}</p>
                      </div>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-muted transition-colors shrink-0 cursor-pointer">Dismiss</button>
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 text-sm cursor-pointer"
            >
              <Bell size={15} /> New Alert Rule
            </button>
          </div>
          {rules.length === 0 ? (
            <div className="hw-panel bg-card border border-border rounded-xl text-center py-12 text-muted-foreground text-sm">No alert rules configured.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="hw-panel p-5 rounded-xl border border-border bg-card relative group hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-sm text-foreground">{rule.name}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => toggleRule(rule.id)}
                        className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${rule.active ? 'bg-primary' : 'bg-muted border border-border'}`}
                      >
                        <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${rule.active ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/80'}`} />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" title="Delete rule">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Condition: <span className="font-semibold text-foreground">{rule.condition}</span></p>
                    <p className="text-xs text-muted-foreground">Topic: <span className="font-mono text-primary">{rule.topic}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="hw-panel bg-card border border-border p-6 rounded-2xl w-full max-w-md relative text-foreground shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">New Alert Rule</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Rule Name</label>
                <input required name="name" placeholder="e.g. Critical Temp Alert" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Topic to Monitor</label>
                <input required name="topic" placeholder="e.g. sensor/greenhouse/temp" className="w-full font-mono bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Metric</label>
                  <input required name="metric" placeholder="e.g. Temp" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                  <select required name="operator" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50">
                    <option>&gt;</option>
                    <option>&lt;</option>
                    <option>=</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs text-muted-foreground mb-1">Value</label>
                  <input required name="value" placeholder="e.g. 40" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
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
export const LiveTerminal = ({ messages, isConnected, isSidebarCollapsed = false }) => {
  const scrollRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'incoming' | 'outgoing'

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded, filter]);

  const filteredMessages = filter === 'all'
    ? messages
    : messages.filter(m => m.type === filter);

  const rxCount = messages.filter(m => m.type === 'incoming').length;
  const txCount = messages.filter(m => m.type === 'outgoing').length;

  return (
    <div className={`fixed bottom-0 left-0 ${isSidebarCollapsed ? 'md:left-16' : 'md:left-64'} right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border transition-all duration-300 ${isExpanded ? 'h-52' : 'h-10'}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        className="w-full h-10 flex items-center justify-between px-4 hover:bg-muted/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-primary" />
          <span className="text-xs font-bold text-foreground tracking-wide">Live MQTT Bus</span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
            isConnected
              ? 'bg-primary/10 border-primary/25 text-primary'
              : 'bg-red-500/10 border-red-500/25 text-red-400'
          }`}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>

          {/* Interactive Bus Filters */}
          <div className="hidden sm:flex items-center gap-1 ml-2 bg-muted/60 border border-border rounded-md p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'incoming', label: 'RX' },
              { id: 'outgoing', label: 'TX' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFilter(f.id);
                  if (!isExpanded) setIsExpanded(true);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  filter === f.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
            RX <span className="text-primary font-bold">{rxCount}</span> · TX <span className="text-primary font-bold">{txCount}</span> · <span className="text-primary font-bold">{messages.length}</span> total
          </span>
          <div className="text-primary">
            {isExpanded ? <ChevronDown size={16} className="text-primary" /> : <ChevronUp size={16} className="text-primary" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div ref={scrollRef} className="h-40 overflow-y-auto px-4 py-2.5 font-mono text-[11px] space-y-1 bg-background border-t border-border scrollbar-thin">
          {filteredMessages.length === 0 && (
            <p className="text-muted-foreground italic">Waiting for MQTT packets from ESP32 or dashboard...</p>
          )}
          {filteredMessages.map(msg => {
            const badge =
              msg.type === 'incoming'
                ? <span className="px-1.5 py-0.2 rounded bg-primary/15 text-primary font-bold shrink-0">RX ◀</span>
                : msg.type === 'outgoing'
                  ? <span className="px-1.5 py-0.2 rounded bg-muted text-primary font-bold shrink-0">TX ▶</span>
                  : msg.type === 'error'
                    ? <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 font-bold shrink-0">ERR ✕</span>
                    : <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-bold shrink-0">SYS ●</span>;

            return (
              <div key={msg.id} className="flex items-center gap-2 leading-relaxed">
                <span className="text-muted-foreground flex-shrink-0">{msg.timestamp}</span>
                {badge}
                <span className="text-foreground break-all">{msg.text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
