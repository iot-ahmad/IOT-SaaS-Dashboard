import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Copy, Check, X, Download, BarChart2,
  Trash2, Wifi, WifiOff, Activity, Thermometer, Zap, CircuitBoard,
  Sparkles, Layers, CheckCheck, Play
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
    projectName: 'المحطة الشاملة (Mega All-In-One Station)',
    badge: '🌟 موصى به للاختبار الشامل',
    description: '11 مستشعر ومشغل يجمع كل حساسات وأدوات المنصة لاختبار لوحة التحكم بالكامل.',
    devices: [
      { name: 'درجة الحرارة DHT22 Temp', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', chartType: 'area' },
      { name: 'الرطوبة النسبية DHT22 Hum', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', chartType: 'line' },
      { name: 'مسافة السونار HC-SR04', type: 'Sensor', pin: 'GPIO 5', topic: 'sensor/distance', chartType: 'bar' },
      { name: 'رطوبة التربة Soil Probe', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', chartType: 'area' },
      { name: 'شدة الإضاءة LDR Sensor', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', chartType: 'line' },
      { name: 'كاشف الحركة PIR Motion', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', chartType: 'scatter' },
      { name: 'مصباح LED الرئيسي', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
      { name: 'مرحّل Relay 220V', type: 'Actuator', pin: 'GPIO 25', topic: 'actuator/relay' },
      { name: 'محرك السيرفو SG90', type: 'Motor', pin: 'GPIO 13', topic: 'actuator/servo' },
      { name: 'مروحة التبريد PWM Fan', type: 'Actuator', pin: 'GPIO 4', topic: 'actuator/dimmer' },
      { name: 'صفارة الإنذار Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
    ]
  },
  {
    projectId: 'smart-farm',
    projectName: 'المزرعة الذكية والري التلقائي (Smart Farm)',
    badge: '🌱 زراعة ذكية و STEM',
    description: 'مستشعرات حرارة ورطوبة البيوت المحمية، رطوبة التربة، ومضخة وصمام الري الآلي.',
    devices: [
      { name: 'حرارة البيوت المحمية DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', chartType: 'area' },
      { name: 'رطوبة هواء المحمية DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', chartType: 'line' },
      { name: 'مستشعر رطوبة التربة Soil Probe', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', chartType: 'area' },
      { name: 'مضخة مياه الري الذاتي Pump', type: 'Actuator', pin: 'GPIO 25', topic: 'farm/pump' },
      { name: 'صمام مياه الري الآلي Servo Valve', type: 'Motor', pin: 'GPIO 13', topic: 'farm/valve' },
      { name: 'مصباح التحذير من جفاف الخزان', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
    ]
  },
  {
    projectId: 'smart-home',
    projectName: 'المنزل الذكي ونظام الحماية (Smart Home)',
    badge: '🔒 أمن وسلامة وأتمتة',
    description: 'كاشف الحركة والسرقة، حساس الإضاءة، قفل الباب الإلكتروني، وصفارة الإنذار.',
    devices: [
      { name: 'كاشف الحركة والسرقة PIR', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', chartType: 'scatter' },
      { name: 'مستشعر الإضاءة المحيطة LDR', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', chartType: 'line' },
      { name: 'سيرفو قفل الباب الذكي Door Lock', type: 'Motor', pin: 'GPIO 13', topic: 'security/door' },
      { name: 'صفارة إنذار الطوارئ Siren Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
      { name: 'مصباح إضاءة الغرفة الرئيسية', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
    ]
  },
  {
    projectId: 'rc-car',
    projectName: 'السيارة الذكية والروبوت (RC Car)',
    badge: '🏎️ روبوتكس وتحكم D-Pad',
    description: 'رادار كشف الحواجز سونار، محركات الدفع، منظم السرعة، المصابيح، والبوق.',
    devices: [
      { name: 'رادار كشف الحواجز Sonar HC-SR04', type: 'Sensor', pin: 'GPIO 5', topic: 'sensor/distance', chartType: 'bar' },
      { name: 'محركات دفع السيارة D-Pad', type: 'Motor', pin: 'GPIO 4', topic: 'car/move' },
      { name: 'منظم سرعة الحركة PWM Speed', type: 'Actuator', pin: 'GPIO 4', topic: 'car/speed' },
      { name: 'المصابيح الأمامية Headlights', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led' },
      { name: 'بوق السيارة التحذيري Horn', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer' },
    ]
  }
];

// ── Chart Types ────────────────────────────────────────────────────────────────
const CHART_TYPES = [
  { id: 'area',    label: '📈 Area',    desc: 'Continuous data over time (temp, humidity)' },
  { id: 'line',    label: '📉 Line',    desc: 'Precise value tracking, minimal visual noise' },
  { id: 'bar',     label: '📊 Bar',     desc: 'Comparing discrete readings or events' },
  { id: 'scatter', label: '🔵 Scatter', desc: 'Detect patterns and outliers' },
  { id: 'radar',   label: '🕸 Radar',   desc: 'Multi-variable comparison (max 8 points)' },
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition-all max-w-[260px] truncate
        ${copied ? 'bg-primary/20 text-primary' : 'bg-card/5 text-white/40 hover:bg-card/10 hover:text-white/70'}`}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
      ${offline ? 'bg-red-500/10 text-red-500 dark:text-red-400' : 'bg-primary/10 text-primary font-bold'}`}>
      {offline ? <WifiOff size={10} /> : <Wifi size={10} className="animate-pulse" />}
      {offline ? 'Offline' : label}
    </span>
  );
}

// ── Custom Tooltip for charts ────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-border rounded-xl px-4 py-2 text-sm shadow-xl">
      <p className="text-white/40 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold text-white">{p.value}</span></p>
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

  const gridProps = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.05)' };
  const xProps = { dataKey: 'time', tick: { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } };
  const yProps = { tick: { fontSize: 10, fill: 'rgba(255,255,255,0.3)' } };
  const radarData = data.slice(-8).map((r, i) => ({ subject: r.time, value: r.value }));

  const renderChart = () => {
    if (!hasData) return (
      <div className="h-[220px] flex items-center justify-center text-white/20 text-sm">
        Waiting for MQTT data from ESP32...
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
              <XAxis dataKey="time" name="Time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <YAxis dataKey="value" name="Value" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="var(--chart-3)" name="Reading" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
              <Radar name="Reading" dataKey="value" stroke="var(--chart-4)" fill="var(--chart-4)" fillOpacity={0.25} />
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
    <div className="mt-4 space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[['Avg', avg], ['Max', max], ['Min', min]].map(([label, val]) => (
          <div key={label} className="bg-card/[0.03] border border-border rounded-xl p-3 text-center">
            <p className="text-[10px] text-white/40 uppercase mb-1">{label}</p>
            <p className="text-xl font-bold text-white">{val}</p>
          </div>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            onClick={() => onChartTypeChange(device.id, ct.id)}
            title={ct.desc}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all border ${
              chartType === ct.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card/5 text-white/40 hover:border-white/20 hover:text-white/70'
            }`}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card/[0.02] border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-primary" />
            <span className="text-xs font-semibold text-white/60">Live Readings</span>
            <span className="text-[10px] text-white/30">· {data.length} points</span>
          </div>
          <button onClick={exportXLSX} className="flex items-center gap-1.5 text-xs text-white/50 hover:text-primary transition-colors bg-card/5 px-3 py-1.5 rounded-lg">
            <Download size={12} /> Export Excel
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
      {/* Sibling backdrop overlay to avoid nesting backdrop-filter with overflow-y-scroll child */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-[#0d0e10] border border-border rounded-2xl w-full max-w-md relative shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-bold">Add New Device</h3>
            <p className="text-xs text-white/40 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-card/5">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
        </div>

        <div className="p-5 space-y-4">
          {step === 1 ? (
            <>
              {/* Device Name */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Device Name *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Temperature Sensor, Relay 1..."
                  className="w-full bg-card/5 border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm"
                />
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Device Type *</label>
                <div className="space-y-2">
                  {DEVICE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm
                        ${type === t.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card/5 text-white/60 hover:border-white/20'}`}
                    >
                      <span className="font-medium">{t.label}</span>
                      <span className="block text-[11px] mt-0.5 opacity-60">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full bg-primary text-black font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Next →
              </button>
            </>
          ) : (
            <>
              {/* GPIO Pin Selection */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">GPIO Pin *</label>
                <select
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full bg-[#0a0b0d] border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm text-white"
                >
                  <option value="">— Select a Pin —</option>
                  {GPIO_OPTIONS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {pin && (
                  <p className="text-[11px] mt-1.5 text-white/50">
                    {GPIO_OPTIONS.find(g => g.value === pin)?.type === 'adc'
                      ? '⚠ ADC pin — suitable for analog sensors (0–4095 range)'
                      : '✓ Digital pin — suitable for relays, DHT, digital sensors'}
                  </p>
                )}
              </div>

              {/* MQTT Topic */}
              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">MQTT Topic Suffix</label>
                <input
                  value={topicSuffix}
                  onChange={e => setTopicSuffix(e.target.value.replace(/\s/g, '_'))}
                  className="w-full bg-card/5 border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm font-mono"
                />
                <p className="text-[11px] text-white/30 mt-1.5">Full MQTT topic (auto-generated):</p>
                <div className="mt-1 flex items-center gap-2 bg-card/5 rounded-lg px-3 py-2">
                  <CircuitBoard size={12} className="text-primary flex-shrink-0" />
                  <span className="text-[11px] font-mono text-primary break-all">{fullTopic}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card/[0.03] border border-border rounded-xl p-4 space-y-2 text-sm">
                <p className="text-white/40 text-xs font-semibold uppercase mb-2">Summary</p>
                {[['Name', name], ['Type', type], ['Pin', pin || '—'], ['Topic', topicSuffix || '—']].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-card/5 border border-border text-white/70 font-bold py-2.5 rounded-xl hover:bg-card/10 transition-colors">
                  ← Back
                </button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!pin || !topicSuffix}
                  variant="solid"
                  className="flex-1 mx-0 rounded-xl py-2.5 disabled:opacity-40"
                >
                  Add Device ✓
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
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">استيراد أجهزة مشاريع المحاكي الجاهزة</h3>
              <p className="text-xs text-muted-foreground mt-0.5">اختر المشروع لإضافة حساساته ومشغلاته مسبقة الربط بنقرة واحدة</p>
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
              <span>{p.projectName.split('(')[0]}</span>
              <span className="ml-1 text-[10px] opacity-75 font-mono">({p.devices.length})</span>
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
              استيراد هذا المشروع ({activePreset.devices.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {activePreset.devices.map((dev, i) => {
              const isAdded = existingTopics.has(dev.topic);
              return (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    isAdded ? 'bg-white/[0.03] border-white/15' : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground truncate">{dev.name}</span>
                      {isAdded && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/60">مضاف ✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-mono">
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border/60">{dev.pin}</span>
                      <span className="truncate text-primary">{dev.topic}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded shrink-0 bg-white/[0.06] text-white/50 border border-white/[0.08]">
                    {dev.type}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground text-center sm:text-right">
            تتم إضافة الأجهزة تلقائياً بمنافذ GPIO ومواضيع MQTT المطابقة لمحاكي Wokwi.
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                const allDevs = PROJECT_DEVICE_PRESETS.flatMap(p => p.devices);
                onImport(allDevs);
              }}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              استيراد كافة المشاريع معاً
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground font-medium text-xs hover:bg-muted/80"
            >
              إلغاء
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
      alert('جميع أجهزة هذا المشروع مسجلة بالفعل في قائمتك!');
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

  const typeIcon = (type) => {
    if (type === 'Sensor') return <Thermometer size={14} className="text-white/50" />;
    if (type === 'Actuator') return <Zap size={14} className="text-white/50" />;
    return <CircuitBoard size={14} className="text-white/50" />;
  };

  const existingTopicsSet = new Set(devices.map(d => d.topic));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Connected Devices</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPresetsModal(true)}
            className="mx-0 flex items-center gap-1.5 rounded-xl text-sm px-3.5 py-2 border-primary/40 text-primary hover:bg-primary/10 font-bold shadow-sm"
          >
            <Sparkles size={16} className="text-primary" />
            أجهزة المشاريع الجاهزة
          </Button>
          <Button
            type="button"
            variant="ghost"
            neon={false}
            onClick={exportAllXLSX}
            className="mx-0 flex items-center gap-2 rounded-xl text-sm px-4 py-2"
          >
            <Download size={16} /> Export All
          </Button>
          <Button
            type="button"
            variant="solid"
            onClick={() => setShowAdd(true)}
            className="mx-0 flex items-center gap-2 rounded-xl text-sm px-4 py-2"
          >
            <Plus size={18} /> Add Device
          </Button>
        </div>
      </div>

      {/* Quick Presets Banner if user has few devices */}
      {devices.length <= 2 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">تجهيز أجهزة المحاكي للاختبار المباشر</h4>
              <p className="text-xs text-muted-foreground mt-0.5">أضف حساسات ومشغلات مشروع المحطة الشاملة (All-In-One) بنقرة واحدة لتسجيلها وتتبع قراءاتها</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => handleImportPreset(PROJECT_DEVICE_PRESETS[0].devices)}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-sm transition-all active:scale-95"
            >
              + إضافة أجهزة المحطة الشاملة (11 جهاز)
            </button>
            <button
              onClick={() => setShowPresetsModal(true)}
              className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground font-medium text-xs hover:bg-muted/80 transition-all"
            >
              باقي المشاريع
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-muted border border-border rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:border-primary/50 text-sm text-foreground placeholder:text-muted-foreground dark:placeholder:text-white/30"
          placeholder="Search devices..."
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-background dark:bg-card/[0.02] border border-border rounded-2xl">
          <CircuitBoard size={40} className="text-muted-foreground dark:text-white/10 mb-4" />
          <h3 className="text-lg font-bold text-muted-foreground dark:text-white/40">
            {search ? 'No devices match your search' : 'No Devices Yet'}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-white/25 mt-2 max-w-sm">
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
            <div key={device.id} className="bg-card dark:bg-card/[0.02] border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-white/20 shadow-sm dark:shadow-none">
              {/* Row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  {typeIcon(device.type)}
                </div>

                {/* Name + type */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{device.name}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{device.type}</span>
                    {isSensor && latestReading !== undefined && (
                      <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-mono font-bold animate-fadeIn">
                        {latestReading}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <CopyBtn text={`${userUID}/${device.topic}`} />
                    <span className="text-[10px] font-mono text-white/30 bg-card/5 px-2 py-0.5 rounded">{device.pin}</span>
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
                      className={`p-2 rounded-lg transition-colors text-sm ${expanded ? 'bg-primary/10 text-primary' : 'text-white/30 hover:text-white hover:bg-card/5'}`}
                      title="View Chart"
                    >
                      <BarChart2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(device.id)}
                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Device"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Expanded chart panel */}
              {expanded && isSensor && (
                <div className="px-5 pb-5 border-t border-border pt-4">
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
