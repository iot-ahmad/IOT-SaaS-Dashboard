import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Copy, Check, X, Download, BarChart2,
  Trash2, Wifi, WifiOff, Activity, Thermometer, Zap, CircuitBoard,
  Cpu, Layers, CheckCheck, Play
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ReferenceLine
} from 'recharts';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/neon-button';

// ── Project Devices Presets for Wokwi Simulator & Dashboard ─────────────────
export const PROJECT_DEVICE_PRESETS = [
  {
    projectId: 'all-in-one',
    projectName: 'Mega All-In-One Station',
    badge: 'Recommended for Full Testing',
    description: '11 sensors and actuators combining all platform capabilities to test the control dashboard end-to-end.',
    devices: [
      { name: 'DHT22 Temperature', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', chartType: 'area' },
      { name: 'DHT22 Relative Humidity', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', chartType: 'line' },
      { name: 'HC-SR04 Ultrasonic Distance', type: 'Sensor', pin: 'GPIO 5', topic: 'sensor/distance', chartType: 'bar' },
      { name: 'Soil Moisture Probe', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', chartType: 'area' },
      { name: 'LDR Ambient Light Sensor', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', chartType: 'line' },
      { name: 'PIR Motion Detector', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', chartType: 'scatter' },
      { name: 'Main Status LED', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
      { name: '220V Power Relay', type: 'Actuator', pin: 'GPIO 25', topic: 'actuator/relay' },
      { name: 'SG90 Servo Motor', type: 'Motor', pin: 'GPIO 13', topic: 'actuator/servo' },
      { name: 'PWM Cooling Fan', type: 'Actuator', pin: 'GPIO 4', topic: 'actuator/dimmer' },
      { name: 'Alert Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
    ]
  },
  {
    projectId: 'smart-farm',
    projectName: 'Smart Farm & Automated Irrigation',
    badge: 'Smart Agriculture & STEM',
    description: 'Greenhouse temperature and humidity sensors, soil moisture probe, and automated irrigation pump and valve.',
    devices: [
      { name: 'Greenhouse Temp (DHT22)', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', chartType: 'area' },
      { name: 'Greenhouse Humidity (DHT22)', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', chartType: 'line' },
      { name: 'Soil Moisture Probe', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', chartType: 'area' },
      { name: 'Irrigation Water Pump', type: 'Actuator', pin: 'GPIO 25', topic: 'farm/pump' },
      { name: 'Irrigation Servo Valve', type: 'Motor', pin: 'GPIO 13', topic: 'farm/valve' },
      { name: 'Low Tank Warning LED', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
    ]
  },
  {
    projectId: 'smart-home',
    projectName: 'Smart Home & Security System',
    badge: 'Security, Safety & Automation',
    description: 'Intrusion motion detector, ambient light sensor, electronic door lock, and emergency alarm siren.',
    devices: [
      { name: 'PIR Intrusion Motion Detector', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', chartType: 'scatter' },
      { name: 'Ambient Light Sensor (LDR)', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', chartType: 'line' },
      { name: 'Smart Door Lock Servo', type: 'Motor', pin: 'GPIO 13', topic: 'security/door' },
      { name: 'Emergency Siren Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
      { name: 'Main Room Light LED', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
    ]
  },
  {
    projectId: 'rc-car',
    projectName: 'Smart Robot & RC Car',
    badge: 'Robotics & D-Pad Control',
    description: 'Ultrasonic obstacle radar, drive motors, PWM speed controller, headlights, and warning horn.',
    devices: [
      { name: 'HC-SR04 Obstacle Sonar Radar', type: 'Sensor', pin: 'GPIO 5', topic: 'sensor/distance', chartType: 'bar' },
      { name: 'Car Drive Motors (D-Pad)', type: 'Motor', pin: 'GPIO 4', topic: 'car/move' },
      { name: 'PWM Speed Controller', type: 'Actuator', pin: 'GPIO 4', topic: 'car/speed' },
      { name: 'Front Headlights', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
      { name: 'Car Warning Horn', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
    ]
  }
];

// ── Chart Types ────────────────────────────────────────────────────────────────
const CHART_TYPES = [
  { id: 'area',    label: 'Area',    desc: 'Continuous data over time (temp, humidity)' },
  { id: 'line',    label: 'Line',    desc: 'Precise value tracking, minimal visual noise' },
  { id: 'bar',     label: 'Bar',     desc: 'Comparing discrete readings or events' },
  { id: 'scatter', label: 'Scatter', desc: 'Detect patterns and outliers' },
  { id: 'radar',   label: 'Radar',   desc: 'Multi-variable comparison (max 8 points)' },
];

// ── ESP32 GPIO options ──────────────────────────────────────────────────────
const GPIO_OPTIONS = [
  { value: 'GPIO 0',  label: 'GPIO 0  — Boot button / General', type: 'digital' },
  { value: 'GPIO 2',  label: 'GPIO 2  — Onboard LED / General', type: 'digital' },
  { value: 'GPIO 4',  label: 'GPIO 4  — DHT22 Temp/Humidity',    type: 'digital' },
  { value: 'GPIO 5',  label: 'GPIO 5  — SPI CS / General',       type: 'digital' },
  { value: 'GPIO 12', label: 'GPIO 12 — General',                type: 'digital' },
  { value: 'GPIO 13', label: 'GPIO 13 — General',                type: 'digital' },
  { value: 'GPIO 14', label: 'GPIO 14 — General',                type: 'digital' },
  { value: 'GPIO 15', label: 'GPIO 15 — General',                type: 'digital' },
  { value: 'GPIO 16', label: 'GPIO 16 — UART RX2',               type: 'digital' },
  { value: 'GPIO 17', label: 'GPIO 17 — UART TX2',               type: 'digital' },
  { value: 'GPIO 18', label: 'GPIO 18 — SPI CLK',                type: 'digital' },
  { value: 'GPIO 19', label: 'GPIO 19 — SPI MISO',               type: 'digital' },
  { value: 'GPIO 21', label: 'GPIO 21 — I2C SDA',                type: 'digital' },
  { value: 'GPIO 22', label: 'GPIO 22 — I2C SCL',                type: 'digital' },
  { value: 'GPIO 23', label: 'GPIO 23 — SPI MOSI',               type: 'digital' },
  { value: 'GPIO 25', label: 'GPIO 25 — DAC / Relay',            type: 'digital' },
  { value: 'GPIO 26', label: 'GPIO 26 — DAC / Relay',            type: 'digital' },
  { value: 'GPIO 27', label: 'GPIO 27 — Servo / Relay',          type: 'digital' },
  { value: 'GPIO 32', label: 'GPIO 32 — ADC1 CH4 / Digital',     type: 'adc' },
  { value: 'GPIO 33', label: 'GPIO 33 — ADC1 CH5 / Digital',     type: 'adc' },
  { value: 'GPIO 34', label: 'GPIO 34 — ADC1 CH6 (Input only)',  type: 'adc' },
  { value: 'GPIO 35', label: 'GPIO 35 — ADC1 CH7 (Input only)',  type: 'adc' },
  { value: 'GPIO 36', label: 'GPIO 36 — ADC1 CH0 VP (Input only)', type: 'adc' },
  { value: 'GPIO 39', label: 'GPIO 39 — ADC1 CH3 VN (Input only)', type: 'adc' },
];

const DEVICE_TYPES = [
  { value: 'Sensor',   label: ' Sensor',        desc: 'Reads data from environment (temperature, moisture…)' },
  { value: 'Actuator', label: ' Actuator',       desc: 'Receives commands to control hardware (relay, motor…)' },
  { value: 'Motor',    label: ' Motor / Servo',  desc: 'Controls movement (servo, stepper, DC motor…)' },
];

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all max-w-[260px] truncate cursor-pointer
        ${copied ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-muted/60 border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      {copied ? <Check size={10} className="text-primary" /> : <Copy size={10} className="text-primary" />}
      <span className="truncate">{text}</span>
    </button>
  );
}

function StatusBadge({ ts, isLive }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.floor((now - ts) / 1000);
  const offline = !isLive && (isNaN(diff) || diff > 45);
  const label = isLive ? 'Online' : diff < 5 ? 'Just now' : diff < 60 ? `${diff}s ago` : diff < 3600 ? `${Math.floor(diff/60)}m ago` : `${Math.floor(diff/3600)}h ago`;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border
      ${offline
        ? 'bg-muted text-muted-foreground border-border'
        : 'bg-primary/10 text-primary border-primary/25'}`}>
      {offline ? <WifiOff size={11} /> : <Wifi size={11} className="text-primary" />}
      <span>{offline ? 'Offline' : label}</span>
    </span>
  );
}

// ── Custom Tooltip for charts ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3.5 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground font-mono text-[10px] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: <span className="font-bold font-mono text-foreground">{p.value}</span></p>
      ))}
    </div>
  );
}

// ── Sensor Chart Panel ───────────────────────────────────────────────────────
function SensorChartPanel({ device, readings, onChartTypeChange }) {
  const data = readings[device.topic] || [];
  const hasData = data.length > 0;
  const chartType = device.chartType || 'area';

  const avg = hasData ? (data.reduce((s, r) => s + r.value, 0) / data.length).toFixed(1) : '—';
  const max = hasData ? Math.max(...data.map(r => r.value)).toFixed(1) : '—';
  const min = hasData ? Math.min(...data.map(r => r.value)).toFixed(1) : '—';

  const exportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(r => ({ Time: r.time, Value: r.value })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, device.name);
    XLSX.writeFile(wb, `${slugify(device.name)}_readings.xlsx`);
  };

  const gridProps = { strokeDasharray: '3 3', stroke: 'rgba(240,240,232,0.08)' };
  const xProps = { dataKey: 'time', tick: { fontSize: 10, fill: '#b5b6ad' } };
  const yProps = { tick: { fontSize: 10, fill: '#b5b6ad' } };
  const radarData = data.slice(-8).map((r, i) => ({ subject: r.time, value: r.value }));

  const renderChart = () => {
    if (!hasData) return (
      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs font-mono">
        Waiting for MQTT telemetry from ESP32...
      </div>
    );
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={Number(avg)} stroke="var(--chart-2)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} name="Reading" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Reading" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" name="Time" tick={{ fontSize: 10, fill: '#b5b6ad' }} />
              <YAxis dataKey="value" name="Value" tick={{ fontSize: 10, fill: '#b5b6ad' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="var(--chart-1)" name="Reading" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(240,240,232,0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#b5b6ad' }} />
              <Radar name="Reading" dataKey="value" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        );
      default: // area
        return (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad_${device.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis {...xProps} />
              <YAxis {...yProps} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={Number(avg)} stroke="var(--chart-2)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2}
                fill={`url(#grad_${device.id})`} name="Reading" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="mt-2 space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Avg', avg], ['Max', max], ['Min', min]].map(([label, val]) => (
          <div key={label} className="bg-muted/40 border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-0.5">{label}</p>
            <p className="text-lg font-bold font-mono tabular-nums text-primary">{val}</p>
          </div>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-1.5 flex-wrap">
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            onClick={() => onChartTypeChange(device.id, ct.id)}
            title={ct.desc}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all border cursor-pointer ${
              chartType === ct.id
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-muted/25 border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Live Readings</span>
            <span className="text-[10px] font-mono text-muted-foreground">· <span className="text-primary font-bold">{data.length}</span> pts</span>
          </div>
          <button onClick={exportXLSX} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-muted border border-border px-3 py-1.5 rounded-lg cursor-pointer">
            <Download size={12} className="text-primary" /> Export Excel
          </button>
        </div>
        <div className="-mx-4 sm:mx-0">
          {renderChart()}
        </div>
      </div>
    </div>
  );
}


// ── Add Device Modal ─────────────────────────────────────────────────────────
function AddDeviceModal({ onClose, onAdd, userUID }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState('Sensor');
  const [pin, setPin] = useState('');
  const [topicSuffix, setTopicSuffix] = useState('');

  // Auto-generate topic from name
  useEffect(() => {
    if (name) setTopicSuffix(slugify(name));
  }, [name]);

  const fullTopic = `${userUID}/${topicSuffix}`;

  const handleConfirm = () => {
    if (!name || !pin || !topicSuffix) return;
    onAdd({
      id: Date.now(),
      name,
      type,
      pin,
      topic: topicSuffix,
      lastSeen: Date.now() - 60000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="hw-panel bg-card border border-border rounded-2xl w-full max-w-md relative shadow-2xl overflow-hidden text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-bold">Add New Device</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>

        <div className="p-5 space-y-4">
          {step === 1 ? (
            <>
              {/* Device Name */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Device Name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Temperature Sensor, Relay 1..."
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm text-foreground"
                />
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Device Type *</label>
                <div className="space-y-2">
                  {DEVICE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm cursor-pointer
                        ${type === t.value
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                      <span className="font-semibold">{t.label}</span>
                      <span className="block text-[11px] mt-0.5 opacity-80">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Next →
              </button>
            </>
          ) : (
            <>
              {/* GPIO Pin Selection */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">GPIO Pin *</label>
                <select
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm text-foreground"
                >
                  <option value="">— Select a Pin —</option>
                  {GPIO_OPTIONS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {pin && (
                  <p className="text-[11px] mt-1.5 text-muted-foreground">
                    {GPIO_OPTIONS.find(g => g.value === pin)?.type === 'adc'
                      ? 'ADC pin — suitable for analog sensors (0–4095 range)'
                      : 'Digital pin — suitable for relays, DHT, digital sensors'}
                  </p>
                )}
              </div>

              {/* MQTT Topic */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">MQTT Topic Suffix</label>
                <input
                  value={topicSuffix}
                  onChange={e => setTopicSuffix(e.target.value.replace(/\s/g, '_'))}
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm font-mono text-foreground"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">Full MQTT topic (auto-generated):</p>
                <div className="mt-1 flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-2">
                  <CircuitBoard size={12} className="text-primary flex-shrink-0" />
                  <span className="text-[11px] font-mono text-primary break-all">{fullTopic}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted/35 border border-border rounded-xl p-4 space-y-2 text-xs">
                <p className="text-muted-foreground font-semibold uppercase mb-2">Summary</p>
                {[['Name', name], ['Type', type], ['Pin', pin || '—'], ['Topic', topicSuffix || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-foreground font-mono font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-muted border border-border text-foreground font-semibold py-2.5 rounded-xl hover:bg-muted/80 transition-colors cursor-pointer">
                  ← Back
                </button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!pin || !topicSuffix}
                  variant="solid"
                  className="flex-1 mx-0 rounded-xl py-2.5 disabled:opacity-40"
                >
                  Add Device
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Project Presets Modal ───────────────────────────────────────────────────
function ProjectPresetsModal({ onClose, onImport, existingTopics }) {
  const [selectedProjectId, setSelectedProjectId] = useState('all-in-one');
  const activePreset = PROJECT_DEVICE_PRESETS.find(p => p.projectId === selectedProjectId) || PROJECT_DEVICE_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <Layers size={20} className="text-primary shrink-0" />
            <div>
              <h3 className="text-base font-bold text-foreground">Import Ready Simulator Project Devices</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select a project to add its pre-mapped sensors and actuators with one click</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20 px-4 pt-2 gap-2 overflow-x-auto scrollbar-none">
          {PROJECT_DEVICE_PRESETS.map(p => (
            <button
              key={p.projectId}
              onClick={() => setSelectedProjectId(p.projectId)}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                selectedProjectId === p.projectId
                  ? 'border-primary text-primary bg-background shadow-sm'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{p.projectName.split('(')[0].trim()}</span>
              <span className="ml-1 text-[10px] opacity-85 font-mono text-primary">({p.devices.length})</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{activePreset.badge}</span>
                <h4 className="text-sm font-extrabold text-foreground">{activePreset.projectName}</h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activePreset.description}</p>
            </div>
            <button
              onClick={() => onImport(activePreset.devices)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <Plus size={15} />
              Import This Project ({activePreset.devices.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePreset.devices.map((dev, i) => {
              const isAdded = existingTopics.has(dev.topic);
              return (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    isAdded ? 'bg-primary/10 border-primary/25' : 'bg-muted/40 border-border'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate">{dev.name}</span>
                      {isAdded && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Added</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono">
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border">{dev.pin}</span>
                      <span className="truncate text-primary">{dev.topic}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded shrink-0 bg-muted text-muted-foreground border border-border">
                    {dev.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground text-center sm:text-left">
            Devices are automatically configured with GPIO pins and MQTT topics matching the Wokwi simulator.
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                const allDevs = PROJECT_DEVICE_PRESETS.flatMap(p => p.devices);
                onImport(allDevs);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Layers size={14} />
              Import All Projects
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-medium text-xs hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main DevicesView ─────────────────────────────────────────────────────────
export default function DevicesView({ userUID, lastSeen, deviceStates }) {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  // readings: { [topic]: [{time, value}] }
  const [readings, setReadings] = useState({});

  // Load devices from Firestore
  useEffect(() => {
    if (!userUID) return;
    const load = async () => {
      try {
        const ref = doc(db, 'users', userUID, 'settings', 'devices');
        const snap = await getDoc(ref);
        if (snap.exists()) setDevices(snap.data().list || []);
      } catch (err) {
        console.error("Failed to load devices from Firestore", err);
      }
    };
    load();
  }, [userUID]);

  // Collect MQTT readings for sensors
  useEffect(() => {
    if (!deviceStates) return;
    const ts = new Date().toLocaleTimeString();
    setReadings(prev => {
      const next = { ...prev };
      Object.entries(deviceStates).forEach(([topic, value]) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const suffix = topic.includes('/') ? topic.split('/').slice(1).join('/') : topic;
          const leaf = topic.split('/').pop();
          const entry = { time: ts, value: num };
          
          [topic, suffix, leaf].forEach(k => {
            if (k) {
              const existing = next[k] || [];
              next[k] = [...existing.slice(-49), entry];
            }
          });
        }
      });
      return next;
    });
  }, [deviceStates]);

  const saveDevices = async (list) => {
    setDevices(list);
    try {
      await setDoc(doc(db, 'users', userUID, 'settings', 'devices'), { list });
    } catch (err) {
      console.error("Failed to save devices to Firestore", err);
    }
  };

  const handleAdd = (device) => saveDevices([...devices, device]);
  const handleDelete = (id) => saveDevices(devices.filter(d => d.id !== id));
  const handleChartTypeChange = (id, chartType) => {
    const updated = devices.map(d => d.id === id ? { ...d, chartType } : d);
    saveDevices(updated);
  };

  const handleImportPreset = (presetDevicesList) => {
    const existingTopics = new Set(devices.map(d => d.topic));
    const now = Date.now();
    const newItems = presetDevicesList
      .filter(p => !existingTopics.has(p.topic))
      .map((p, idx) => ({
        id: now + idx + Math.floor(Math.random() * 1000),
        name: p.name,
        type: p.type,
        pin: p.pin,
        topic: p.topic,
        chartType: p.chartType || 'area',
        lastSeen: now - 10000,
      }));

    if (newItems.length === 0) {
      alert('All devices from this project are already registered in your list!');
      return;
    }

    const updated = [...devices, ...newItems];
    saveDevices(updated);
    setShowPresetsModal(false);
  };

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  const exportAllXLSX = () => {
    const wb = XLSX.utils.book_new();
    devices.forEach(d => {
      const data = readings[d.topic] || [];
      const ws = XLSX.utils.json_to_sheet(
        data.length ? data.map(r => ({ Time: r.time, Value: r.value }))
          : [{ Note: 'No readings yet' }]
      );
      XLSX.utils.book_append_sheet(wb, ws, d.name.slice(0, 31));
    });
    XLSX.writeFile(wb, `iot_devices_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
  };

  const typeIconBadge = (type) => {
    if (type === 'Sensor') {
      return <Thermometer size={20} className="text-primary shrink-0" />;
    }
    if (type === 'Actuator') {
      return <Zap size={20} className="text-primary shrink-0" />;
    }
    return <CircuitBoard size={20} className="text-primary shrink-0" />;
  };

  const existingTopicsSet = new Set(devices.map(d => d.topic));
  const nowSnapshot = Date.now();
  const onlineDevicesCount = devices.filter(d => {
    const topicSuffix = d.topic?.includes('/') ? d.topic.split('/').slice(1).join('/') : d.topic;
    const leafTopic = d.topic?.split('/').pop();
    const liveVal = deviceStates?.[d.topic] ?? deviceStates?.[`${userUID}/${d.topic}`] ?? deviceStates?.[topicSuffix] ?? deviceStates?.[leafTopic];
    if (liveVal !== undefined && liveVal !== null && liveVal !== '') return true;
    const ts = lastSeen?.[d.topic] || lastSeen?.[topicSuffix] || d.lastSeen;
    return ts && (nowSnapshot - ts) / 1000 <= 45;
  }).length;
  const sensorCount = devices.filter(d => d.type === 'Sensor').length;
  const actuatorMotorCount = devices.filter(d => d.type !== 'Sensor').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Connected Devices</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage ESP32 pins, MQTT topics, and real-time telemetry logs</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPresetsModal(true)}
            className="mx-0 flex items-center gap-1.5 rounded-xl text-xs sm:text-sm px-3.5 py-2 border-primary/40 text-primary hover:bg-primary/10 font-bold"
          >
            <Layers size={15} className="text-primary" />
            Project Presets
          </Button>
          <Button
            type="button"
            variant="ghost"
            neon={false}
            onClick={exportAllXLSX}
            className="mx-0 flex items-center gap-2 rounded-xl text-xs sm:text-sm px-3.5 py-2 border border-border"
          >
            <Download size={15} className="text-primary" /> Export All
          </Button>
          <Button
            type="button"
            variant="solid"
            onClick={() => setShowAdd(true)}
            className="mx-0 flex items-center gap-2 rounded-xl text-xs sm:text-sm px-4 py-2"
          >
            <Plus size={16} /> Add Device
          </Button>
        </div>
      </div>

      {/* Fleet Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="hw-panel bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Devices</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{devices.length}</p>
        </div>
        <div className="hw-panel bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Online Now</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{onlineDevicesCount}</p>
        </div>
        <div className="hw-panel bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sensors</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{sensorCount}</p>
        </div>
        <div className="hw-panel bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actuators & Motors</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-primary mt-1">{actuatorMotorCount}</p>
        </div>
      </div>

      {/* Quick Presets Banner if user has few devices */}
      {devices.length <= 2 && (
        <div className="hw-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3">
            <Cpu size={22} className="text-primary shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-foreground">Quick Setup for Live Simulator Testing</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Import all sensors and actuators from the All-In-One Station project with one click to register and track their live telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handleImportPreset(PROJECT_DEVICE_PRESETS[0].devices)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              + Add All-In-One Station (11 Devices)
            </button>
            <button
              onClick={() => setShowPresetsModal(true)}
              className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-medium text-xs hover:bg-muted/80 transition-all cursor-pointer"
            >
              More Projects
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" size={15} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-input border border-border rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary/50 text-sm text-foreground placeholder:text-muted-foreground"
          placeholder="Search devices by name or type..."
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="hw-panel flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
          <CircuitBoard size={38} className="text-primary/60 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            {search ? 'No devices match your search' : 'No Devices Yet'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-sm">
            {!search && 'Click "+ Add Device" to register your first ESP32 sensor or actuator.'}
          </p>
        </div>
      )}

      {/* Device cards */}
      <div className="space-y-3">
        {filtered.map(device => {
          const expanded = expandedId === device.id;
          const topicSuffix = device.topic?.includes('/') ? device.topic.split('/').slice(1).join('/') : device.topic;
          const leafTopic = device.topic?.split('/').pop();
          const liveVal = deviceStates?.[device.topic] ?? deviceStates?.[`${userUID}/${device.topic}`] ?? deviceStates?.[topicSuffix] ?? deviceStates?.[leafTopic];
          const isLive = liveVal !== undefined && liveVal !== null && liveVal !== '';
          const ts = isLive ? Date.now() : (lastSeen?.[device.topic] || lastSeen?.[topicSuffix] || device.lastSeen);
          const isSensor = device.type === 'Sensor';
          const latestReading = isLive ? liveVal : readings[device.topic]?.slice(-1)[0]?.value ?? readings[topicSuffix]?.slice(-1)[0]?.value;

          return (
            <div key={device.id} className="hw-panel bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-white/15">
              {/* Row */}
              <div className="flex items-center gap-4 px-5 py-4 flex-wrap sm:flex-nowrap">
                {/* Icon */}
                {typeIconBadge(device.type)}

                {/* Name + type */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{device.name}</span>
                    <span className="text-[10px] font-medium bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">{device.type}</span>
                    {isSensor && latestReading !== undefined && (
                      <span className="text-xs bg-primary/12 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full font-mono font-bold tabular-nums animate-fadeIn">
                        {latestReading}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <CopyBtn text={`${userUID}/${device.topic}`} />
                    <span className="text-[10px] font-mono font-semibold text-foreground/80 bg-muted border border-border px-2 py-0.5 rounded">{device.pin}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <StatusBadge ts={ts} isLive={isLive} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isSensor && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : device.id)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${expanded ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                      title="View Chart"
                    >
                      <BarChart2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Device"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded chart panel */}
              {expanded && isSensor && (
                <div className="px-5 pb-5 border-t border-border pt-4 bg-muted/15">
                  <SensorChartPanel device={device} readings={readings} onChartTypeChange={handleChartTypeChange} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddDeviceModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          userUID={userUID}
        />
      )}

      {showPresetsModal && (
        <ProjectPresetsModal
          onClose={() => setShowPresetsModal(false)}
          onImport={handleImportPreset}
          existingTopics={existingTopicsSet}
        />
      )}
    </div>
  );
}
