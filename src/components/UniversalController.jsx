import { useState, useEffect, useCallback, useRef } from 'react';
import { Responsive as ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus, X, Thermometer, ToggleLeft, SlidersHorizontal,
  Gamepad2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Trash2, Activity, Zap, Car, GripVertical, Move, Loader2, Radio,
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLS_BY_BP = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// ─── Utility ──────────────────────────────────────────────────────────────────
const uid = () => `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** Clone lg layout to other breakpoints with column clamping */
function layoutsFromLg(lg) {
  const clampItem = (l, maxCols) => {
    const w = Math.max(1, Math.min(l.w, maxCols));
    const x = Math.max(0, Math.min(l.x, Math.max(0, maxCols - w)));
    return { ...l, w, x };
  };
  const arr = lg || [];
  return {
    lg: arr,
    md: arr.map(l => clampItem(l, COLS_BY_BP.md)),
    sm: arr.map(l => clampItem(l, COLS_BY_BP.sm)),
    xs: arr.map(l => clampItem(l, COLS_BY_BP.xs)),
    xxs: arr.map(l => clampItem(l, COLS_BY_BP.xxs)),
  };
}

// ─── Dual-Persistence Hook (Firestore + localStorage) ─────────────────────────
/**
 * Loads widgets/layouts from Firestore on mount.
 * Falls back to localStorage if Firestore fails or data doesn't exist.
 * Saves to BOTH Firestore and localStorage on every change (debounced).
 * This ensures user customizations persist across sessions.
 */
function useControllerFirestore(userUID, storageScopeId) {
  const scopeKey = storageScopeId || 'default';
  // Sanitize scope key for Firestore document ID (no slashes)
  const docId = scopeKey.replace(/[/\\]/g, '_');
  const localKey = `iot_ctrl_${docId}`;
  const firestoreRef = userUID ? doc(db, 'users', userUID, 'controllers', docId) : null;

  const [loaded, setLoaded] = useState(false);
  const [savedWidgets, setSavedWidgets] = useState(null);
  const [savedLayouts, setSavedLayouts] = useState(null);

  // Helper: read from localStorage
  const readLocal = () => {
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return null;
  };

  // Helper: write to localStorage
  const writeLocal = (widgets, layouts, updatedAt) => {
    try {
      localStorage.setItem(localKey, JSON.stringify({ widgets, layouts, updatedAt }));
    } catch { /* quota exceeded etc. */ }
  };

  // Load from Firestore on mount, fallback to localStorage
  useEffect(() => {
    setLoaded(false);
    setSavedWidgets(null);
    setSavedLayouts(null);

    if (!firestoreRef) {
      // No user — load from localStorage only
      const local = readLocal();
      if (local?.widgets) {
        setSavedWidgets(local.widgets);
        setSavedLayouts(local.layouts || null);
      }
      setLoaded(true);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await getDoc(firestoreRef);
        if (!cancelled) {
          const local = readLocal();
          const localWidgets = local?.widgets || null;
          const localLayouts = local?.layouts || null;
          const localTime = local?.updatedAt || 0;

          if (snap.exists()) {
            const cloudData = snap.data();
            const cloudWidgets = cloudData.widgets || null;
            const cloudLayouts = cloudData.layouts || null;
            const cloudTime = cloudData.updatedAt || 0;

            if (localWidgets && localTime > cloudTime) {
              // Local is newer! Use local and sync to Firestore
              setSavedWidgets(localWidgets);
              setSavedLayouts(localLayouts);
              try {
                await setDoc(firestoreRef, {
                  widgets: localWidgets,
                  layouts: localLayouts || {},
                  updatedAt: localTime
                });
              } catch { /* ignore sync write errors */ }
            } else {
              // Cloud is newer or equal! Use cloud and sync to local
              setSavedWidgets(cloudWidgets);
              setSavedLayouts(cloudLayouts);
              writeLocal(cloudWidgets || [], cloudLayouts || {}, cloudTime);
            }
          } else {
            // No Firestore data — use local if available
            if (localWidgets) {
              setSavedWidgets(localWidgets);
              setSavedLayouts(localLayouts);
              // Push local data to Firestore
              try {
                await setDoc(firestoreRef, {
                  widgets: localWidgets,
                  layouts: localLayouts || {},
                  updatedAt: localTime || Date.now()
                });
              } catch { /* ignore migration write errors */ }
            }
          }
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load controller from Firestore, using localStorage fallback', err);
        if (!cancelled) {
          // Firestore failed — fall back to localStorage
          const local = readLocal();
          if (local?.widgets) {
            setSavedWidgets(local.widgets);
            setSavedLayouts(local.layouts || null);
          }
          setLoaded(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userUID, docId]);

  // Debounced save to BOTH Firestore AND localStorage
  const saveTimerRef = useRef(null);
  const save = useCallback((widgets, layouts) => {
    const now = Date.now();
    // Always save to localStorage immediately (sync)
    writeLocal(widgets, layouts, now);

    // Debounced save to Firestore
    if (!firestoreRef) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await setDoc(firestoreRef, { widgets, layouts, updatedAt: now });
      } catch (err) {
        console.error('Failed to save controller to Firestore (localStorage backup is intact)', err);
      }
    }, 500);
  }, [userUID, docId]);

  return { loaded, savedWidgets, savedLayouts, save };
}

// ─── Widget Definitions ───────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'sensors',
    label: 'Sensors',
    icon: Activity,
    color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
    accent: 'text-cyan-400',
    items: [
      { type: 'gauge', label: 'Gauge / Chart', desc: 'Display a numeric sensor value with a live bar', icon: Thermometer, w: 3, h: 3 },
    ],
  },
  {
    id: 'actuators',
    label: 'Actuators',
    icon: Zap,
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
    accent: 'text-amber-400',
    items: [
      { type: 'switch', label: 'LED Switch', desc: 'Toggle an LED or relay ON / OFF', icon: ToggleLeft, w: 2, h: 2 },
      { type: 'slider', label: 'Servo Slider', desc: 'Send a 0–180° value to a servo motor', icon: SlidersHorizontal, w: 3, h: 2 },
    ],
  },
  {
    id: 'robotics',
    label: 'Robotics',
    icon: Car,
    color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    accent: 'text-violet-400',
    items: [
      { type: 'dpad', label: 'Direction Controller (D-Pad)', desc: 'D-Pad: FORWARD, BACK, LEFT, RIGHT, STOP on one topic', icon: Gamepad2, w: 3, h: 4 },
      { type: 'joystick', label: 'Joystick', desc: 'Analog-style stick: same movement commands on one MQTT topic', icon: Move, w: 4, h: 4 },
      { type: 'speed', label: 'Speed Slider', desc: 'Send speed value (0–255) to your speed topic', icon: Car, w: 3, h: 2 },
    ],
  },
];

const DEFAULT_TOPICS = {
  gauge: 'sensor/temperature',
  switch: 'actuator/led',
  slider: 'actuator/servo',
  dpad: 'car/move',
  joystick: 'car/move',
  speed: 'car/speed',
};

// ─── Add Tool Modal ───────────────────────────────────────────────────────────
function AddToolModal({ onClose, onAdd, userUID, esp32Prefix }) {
  const [step, setStep] = useState('category'); // category | config
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({ name: '', topic: '', dataKey: '', unit: '°C', maxVal: 100 });

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const defaultKey = DEFAULT_TOPICS[item.type].replace('/', '_');
    const topic = esp32Prefix ? `${esp32Prefix}/${DEFAULT_TOPICS[item.type]}` : DEFAULT_TOPICS[item.type];
    setForm({ name: item.label, topic, dataKey: defaultKey, unit: '°C', maxVal: 100 });
    setStep('config');
  };

  const handleAdd = () => {
    if (!form.dataKey.trim()) return; // dataKey is required
    onAdd({
      id: uid(),
      type: selectedItem.type,
      name: form.name || selectedItem.label,
      topic: form.topic || DEFAULT_TOPICS[selectedItem.type],
      dataKey: form.dataKey.trim(),
      firebasePath: `users/${userUID}/widgets/${form.dataKey.trim()}`,
      unit: form.unit,
      maxVal: Number(form.maxVal) || 100,
      w: selectedItem.w,
      h: selectedItem.h,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#13151a] border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Add Tool</h2>
            {step === 'config' && (
              <button onClick={() => setStep('category')} className="text-xs text-foreground/90/40 hover:text-foreground mt-0.5 transition-colors">
                ← Back to categories
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground dark:text-white/30 hover:text-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'category' ? (
            <div className="space-y-4">
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.id}>
                    <div className={`flex items-center gap-2 mb-2 ${cat.accent}`}>
                      <CatIcon size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">{cat.label}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cat.items.map(item => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.type}
                            onClick={() => handleSelectItem(item)}
                            className={`flex items-start gap-3 p-3 rounded-xl border bg-gradient-to-br ${cat.color} hover:brightness-125 transition-all text-left`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg bg-muted ${cat.accent}`}>
                              <ItemIcon size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{item.label}</p>
                              <p className="text-[11px] text-foreground/90/40 mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-foreground/90/40 block mb-1">Widget Name</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Front Temperature"
                />
              </div>

              {/* ── Data Key (required) ───────────────────────────────── */}
              <div>
                <label className="text-xs font-semibold text-amber-400 block mb-1 flex items-center gap-1">
                  <span>Data Key</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>
                </label>
                <input
                  className={`w-full bg-muted border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none transition-colors ${
                    form.dataKey.trim() ? 'border-amber-500/40 focus:border-amber-400' : 'border-red-500/40 focus:border-red-400'
                  }`}
                  value={form.dataKey}
                  onChange={e => setForm(f => ({ ...f, dataKey: e.target.value.replace(/\s/g, '_') }))}
                  placeholder="e.g. temperature_1"
                />
                {/* Live Firebase path preview */}
                <div className="mt-2 bg-muted bg-background/40 border border-border rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground dark:text-white/30 mb-0.5">Firebase path:</p>
                  <code className="text-[11px] font-mono text-amber-300/80 break-all">
                    users/{userUID ? userUID.slice(0, 8) + '…' : '[UID]'}/widgets/<span className="text-amber-300">{form.dataKey || '[data_key]'}</span>
                  </code>
                </div>
                <p className="text-[10px] text-muted-foreground dark:text-white/30 mt-1.5 leading-relaxed">
                  استخدم هذا الـ Key في كود Arduino الخاص بك لربط جهازك بهذه الأداة.
                </p>
              </div>

              <div>
                <label className="text-xs text-foreground/90/40 block mb-1">MQTT Topic</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. car/move"
                />
              </div>
              {selectedItem.type === 'gauge' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground/90/40 block mb-1">Unit</label>
                    <input
                      className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                      value={form.unit}
                      onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                      placeholder="°C"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground/90/40 block mb-1">Max Value</label>
                    <input
                      type="number"
                      className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                      value={form.maxVal}
                      onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={!form.dataKey.trim()}
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                className="w-full disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 mt-2"
              >
                Add to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Tool Modal ──────────────────────────────────────────────────────────
function EditToolModal({ widget, onClose, onSave, userUID }) {
  const [form, setForm] = useState({
    name: widget.name || '',
    topic: widget.topic || '',
    dataKey: widget.dataKey || '',
    unit: widget.unit || '°C',
    maxVal: widget.maxVal !== undefined ? widget.maxVal : 100,
  });

  const handleSave = () => {
    if (!form.dataKey.trim()) return; // dataKey is required
    onSave({
      ...widget,
      name: form.name.trim() || widget.name,
      topic: form.topic.trim() || widget.topic,
      dataKey: form.dataKey.trim(),
      firebasePath: `users/${userUID}/widgets/${form.dataKey.trim()}`,
      unit: form.unit,
      maxVal: Number(form.maxVal) || 100,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#13151a] border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-lg">Edit Tool Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modify name, topic, or parameter config for this tool.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground dark:text-white/30 hover:text-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs text-foreground/90/40 block mb-1">Widget Name</label>
            <input
              className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Front Temperature"
            />
          </div>

          {/* Data Key (required) */}
          <div>
            <label className="text-xs font-semibold text-amber-400 block mb-1 flex items-center gap-1">
              <span>Data Key</span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Required</span>
            </label>
            <input
              className={`w-full bg-muted border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none transition-colors ${
                form.dataKey.trim() ? 'border-amber-500/40 focus:border-amber-400' : 'border-red-500/40 focus:border-red-400'
              }`}
              value={form.dataKey}
              onChange={e => setForm(f => ({ ...f, dataKey: e.target.value.replace(/\s/g, '_') }))}
              placeholder="e.g. temperature_1"
            />
            {/* Live Firebase path preview */}
            <div className="mt-2 bg-muted bg-background/40 border border-border rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground dark:text-white/30 mb-0.5">Firebase path:</p>
              <code className="text-[11px] font-mono text-amber-300/80 break-all">
                users/{userUID ? userUID.slice(0, 8) + '…' : '[UID]'}/widgets/<span className="text-amber-300">{form.dataKey || '[data_key]'}</span>
              </code>
            </div>
          </div>

          <div>
            <label className="text-xs text-foreground/90/40 block mb-1">MQTT Topic</label>
            <input
              className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-violet-500/50 transition-colors"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. car/move"
            />
          </div>

          {widget.type === 'gauge' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-foreground/90/40 block mb-1">Unit</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="°C"
                />
              </div>
              <div>
                <label className="text-xs text-foreground/90/40 block mb-1">Max Value</label>
                <input
                  type="number"
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                  value={form.maxVal}
                  onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!form.dataKey.trim()}
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            className="w-full disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 mt-2"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gauge Widget ─────────────────────────────────────────────────────────────
function GaugeWidget({ widget, value, history = [] }) {
  const num = value !== undefined ? parseFloat(value) : NaN;
  const hasData = Number.isFinite(num);
  const pct = hasData
    ? Math.min(100, Math.max(0, (num / widget.maxVal) * 100))
    : 0;
  // Vibrantly colored neon theme colors
  const color = pct > 80 ? '#ff4b5c' : pct > 60 ? '#ffb300' : '#00e5ff';
  const glowColor = pct > 80 ? 'rgba(255, 75, 92, 0.4)' : pct > 60 ? 'rgba(255, 179, 0, 0.4)' : 'rgba(0, 229, 255, 0.4)';

  const chartData = history.map((y, i) => ({ i, v: y }));

  return (
    <div className="flex flex-col h-full gap-2 min-h-0 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2" style={{ color }}>
          <Activity size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0 w-full relative">
        {hasData ? (
          <>
            {/* Gauge Circular Visual */}
            <div className="relative w-28 h-28 flex items-center justify-center my-1 flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="6" fill="none" />
                <circle 
                  cx="56" cy="56" r="48" 
                  className="transition-all duration-700 ease-out" 
                  stroke={color}
                  strokeWidth="6" fill="none" 
                  strokeDasharray="301.6" 
                  strokeDashoffset={301.6 - (301.6 * pct) / 100}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <div className="text-2xl font-black tracking-tight" style={{ color, textShadow: `0 0 10px ${glowColor}` }}>
                  {num.toFixed(1)}
                </div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{widget.unit || ''}</span>
              </div>
            </div>

            {/* Sparkline chart */}
            {chartData.length > 1 && (
              <div className="h-12 flex-1 min-h-[32px] mt-1 -mx-4 w-[calc(100%+2rem)] sm:w-full sm:mx-0 overflow-hidden opacity-60 hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad_${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.15}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <YAxis domain={['auto', 'auto']} hide width={0} />
                    <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#grad_${widget.id})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 py-4 my-auto">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-8 h-8 rounded-full bg-cyan-500/10 animate-ping" />
              <div className="relative w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                <Radio className="text-cyan-400 animate-pulse" size={14} />
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide animate-pulse">Waiting for data...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Switch Widget ────────────────────────────────────────────────────────────
function SwitchWidget({ widget, value, publish }) {
  const isOn = value === '1' || value === 'ON' || value === 'true';

  const toggle = () => publish(widget.topic, isOn ? 'OFF' : 'ON');

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-amber-500">
          <Zap size={16} className={isOn ? "animate-pulse" : ""} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative">
        {/* Pulsing indicator light */}
        <div className="absolute top-0 right-2 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isOn ? 'bg-amber-400' : 'bg-slate-400'}`} style={{ boxShadow: isOn ? '0 0 10px #f59e0b, 0 0 20px #f59e0b' : 'none' }} />
          <span className={`text-[9px] font-extrabold uppercase ${isOn ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
            {isOn ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        {/* Button body */}
        <div
          className={`w-18 h-18 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
            isOn
              ? 'bg-amber-500/10 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-95'
              : 'bg-background dark:bg-card/5 border-border hover:border-slate-400 dark:hover:border-white/30'
          }`}
          onClick={toggle}
          title={isOn ? 'Click to turn OFF' : 'Click to turn ON'}
        >
          <Zap size={32} className={isOn ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'text-muted-foreground/60'} />
        </div>
      </div>
    </div>
  );
}

// ─── Slider Widget (Servo) ────────────────────────────────────────────────────
function SliderWidget({ widget, publish }) {
  const max = widget.type === 'speed' ? 255 : 180;
  const [val, setVal] = useState(0);

  const handleChange = (e) => {
    const v = Number(e.target.value);
    setVal(v);
    publish(widget.topic, String(v));
  };

  const color = widget.type === 'speed' ? '#a78bfa' : '#ffb300';
  const glowColor = widget.type === 'speed' ? 'rgba(167, 139, 250, 0.4)' : 'rgba(255, 179, 0, 0.4)';
  const label = widget.type === 'speed' ? 'Speed' : 'Angle';
  const Icon = widget.type === 'speed' ? Car : SlidersHorizontal;
  const accentClass = widget.type === 'speed' ? 'text-violet-400 animate-pulse' : 'text-amber-500';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className={`flex items-center gap-2 ${accentClass}`}>
          <Icon size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4 px-1">
        <div className="flex justify-between items-baseline">
          <span className="text-3xl font-black font-mono tracking-tight" style={{ color, textShadow: `0 0 10px ${glowColor}` }}>{val}</span>
          <span className="text-[10px] font-bold text-muted-foreground dark:text-white/30 uppercase tracking-widest">{label} / {max}</span>
        </div>
        
        {/* Styled Premium Slider */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={max}
            value={val}
            onChange={handleChange}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-secondary"
            style={{ 
              accentColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const DP_BTN_BASE =
  'flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-150 cursor-pointer select-none active:scale-95';
const DP_BTN_IDLE = 'bg-background dark:bg-card/5 border-border text-foreground/90/50 hover:bg-amber-400/10 dark:hover:bg-amber-400/10 hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:text-amber-500 dark:hover:text-amber-400';
const DP_BTN_GLOW =
  'bg-amber-400 border-amber-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.7)] ring-1 ring-amber-300/60';

function DPadDirButton({ cmd, icon: Icon, activeCmd, onPress, onRelease }) {
  const lit = activeCmd === cmd;
  return (
    <button
      type="button"
      className={`${DP_BTN_BASE} ${lit ? DP_BTN_GLOW : DP_BTN_IDLE}`}
      onMouseDown={() => onPress(cmd)}
      onMouseUp={onRelease}
      onMouseLeave={() => activeCmd === cmd && onRelease()}
      onTouchStart={(e) => { e.preventDefault(); onPress(cmd); }}
      onTouchEnd={onRelease}
    >
      <Icon size={20} />
    </button>
  );
}

// ─── D-Pad Widget ─────────────────────────────────────────────────────────────
function DPadWidget({ widget, publish }) {
  const [active, setActive] = useState(null);
  const timeoutRef = useRef(null);

  const press = (cmd) => {
    setActive(cmd);
    publish(widget.topic, cmd);
    clearTimeout(timeoutRef.current);
  };

  const release = () => {
    publish(widget.topic, 'STOP');
    setActive(null);
    clearTimeout(timeoutRef.current);
  };

  const sendStop = () => {
    setActive('STOP');
    publish(widget.topic, 'STOP');
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActive(null), 160);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Gamepad2 size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-1.5 my-1">
        <DPadDirButton cmd="FORWARD" icon={ChevronUp} activeCmd={active} onPress={press} onRelease={release} />
        <div className="flex gap-1.5">
          <DPadDirButton cmd="LEFT" icon={ChevronLeft} activeCmd={active} onPress={press} onRelease={release} />
          <button
            type="button"
            onClick={sendStop}
            className={`${DP_BTN_BASE} ${active === 'STOP' ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)]' : DP_BTN_IDLE}`}
            title="Send STOP"
          >
            <span className="text-[9px] font-black tracking-tighter">STOP</span>
          </button>
          <DPadDirButton cmd="RIGHT" icon={ChevronRight} activeCmd={active} onPress={press} onRelease={release} />
        </div>
        <DPadDirButton cmd="BACK" icon={ChevronDown} activeCmd={active} onPress={press} onRelease={release} />
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full ${active ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30' : 'bg-muted text-muted-foreground/60'}`}>
            CMD: {active || 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Joystick Widget (same MQTT commands as D-Pad) ───────────────────────────
function JoystickWidget({ widget, publish }) {
  const rootRef = useRef(null);
  const activeRef = useRef(null);
  const [active, setActive] = useState(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const setCmd = (cmd) => {
    activeRef.current = cmd;
    setActive(cmd);
  };

  const deadPx = 14;
  const maxStick = 48;

  const directionFromDelta = (dx, dy) => {
    const dist = Math.hypot(dx, dy);
    if (dist < deadPx) return null;
    const angle = Math.atan2(dy, dx);
    if (angle >= -Math.PI * 0.75 && angle < -Math.PI * 0.25) return 'FORWARD';
    if (angle >= -Math.PI * 0.25 && angle < Math.PI * 0.25) return 'RIGHT';
    if (angle >= Math.PI * 0.25 && angle < Math.PI * 0.75) return 'BACK';
    return 'LEFT';
  };

  const applyPointer = (clientX, clientY) => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const cmd = directionFromDelta(dx, dy);
    const cap = Math.min(dist, maxStick);
    if (dist > 1e-6) {
      dx = (dx / dist) * cap;
      dy = (dy / dist) * cap;
    } else {
      dx = 0;
      dy = 0;
    }
    setKnob({ x: dx, y: dy });

    const prev = activeRef.current;
    if (cmd !== prev) {
      if (cmd) {
        setCmd(cmd);
        publish(widget.topic, cmd);
      } else {
        if (prev !== null) publish(widget.topic, 'STOP');
        setCmd(null);
      }
    }
  };

  const endPointer = () => {
    setKnob({ x: 0, y: 0 });
    if (activeRef.current !== null) publish(widget.topic, 'STOP');
    setCmd(null);
  };

  const knobLit = active != null;

  return (
    <div className="flex flex-col h-full gap-2 min-h-0 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Move size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 gap-2 relative">
        <div
          ref={rootRef}
          className="relative w-36 h-36 rounded-full border border-amber-400/20 bg-gradient-to-b from-amber-950/10 to-black/40 touch-none select-none cursor-grab active:cursor-grabbing shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] flex items-center justify-center"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            applyPointer(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            applyPointer(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
            endPointer();
          }}
          onPointerCancel={endPointer}
        >
          {/* Dash ring inside */}
          <div className="absolute inset-[20%] rounded-full border border-dashed border-amber-400/15 pointer-events-none" />
          
          {/* Glowing knob */}
          <div
            className={`absolute w-12 h-12 rounded-full border-2 transition-all duration-75 flex items-center justify-center shadow-md ${
              knobLit
                ? 'bg-amber-400/40 border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)] scale-95'
                : 'bg-card/10 dark:bg-card/5 border-border dark:border-white/20'
            }`}
            style={{
              left: `calc(50% + ${knob.x}px)`,
              top: `calc(50% + ${knob.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className={`w-3.5 h-3.5 rounded-full ${knobLit ? 'bg-amber-400' : 'bg-muted-foreground/30 dark:bg-card/25'}`} />
          </div>

          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground dark:text-white/20 font-extrabold uppercase pointer-events-none">F</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground dark:text-white/20 font-extrabold uppercase pointer-events-none">B</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground dark:text-white/20 font-extrabold uppercase pointer-events-none">L</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground dark:text-white/20 font-extrabold uppercase pointer-events-none">R</span>
        </div>

        <span className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full ${active ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30 animate-pulse' : 'bg-muted text-muted-foreground dark:text-white/20'}`}>
          DIR: {active || 'IDLE'}
        </span>
      </div>
    </div>
  );
}

// ─── Widget Card Shell ────────────────────────────────────────────────────────
function WidgetCard({ widget, value, publish, onRemove, onEdit, gaugeHistory }) {
  const renderContent = () => {
    switch (widget.type) {
      case 'gauge': return <GaugeWidget widget={widget} value={value} history={gaugeHistory} />;
      case 'switch': return <SwitchWidget widget={widget} value={value} publish={publish} />;
      case 'slider': return <SliderWidget widget={widget} publish={publish} />;
      case 'dpad': return <DPadWidget widget={widget} publish={publish} />;
      case 'joystick': return <JoystickWidget widget={widget} publish={publish} />;
      case 'speed': return <SliderWidget widget={widget} publish={publish} />;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-card/[0.01] dark:bg-[#07080b]/75 border border-border rounded-2xl p-5 backdrop-blur-md hover:bg-card/[0.025] hover:border-slate-300 dark:hover:border-border transition-all duration-300 group flex flex-col relative overflow-hidden shadow-lg shadow-black/10 hover:shadow-[0_8px_30px_rgba(139,92,246,0.015)]">
      {/* Edit button */}
      <button
        onClick={() => onEdit(widget)}
        className="absolute top-2 right-8 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-cyan-400 transition-all text-muted-foreground dark:text-white/30 p-1"
        title="Edit Tool"
      >
        <SlidersHorizontal size={14} />
      </button>
      {/* Drag handle */}
      <div className="drag-handle absolute top-2 right-14 opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity cursor-grab active:cursor-grabbing text-foreground/90/50 p-1">
        <GripVertical size={14} />
      </div>
      {/* Remove button */}
      <button
        onClick={() => onRemove(widget.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition-all text-muted-foreground dark:text-white/30 p-1"
        title="Remove Tool"
      >
        <Trash2 size={14} />
      </button>
      {renderContent()}
    </div>
  );
}

// ─── Main Controller View ─────────────────────────────────────────────────────
export default function UniversalController({ deviceStates, publish, storageScopeId, esp32Prefix, userUID }) {
  const { width, containerRef, mounted } = useContainerWidth();
  const { loaded, savedWidgets, savedLayouts, save } = useControllerFirestore(userUID, storageScopeId);

  const [showModal, setShowModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  const defaultWidgets = [
    { id: 'demo1', type: 'gauge', name: 'Temperature', topic: 'sensor/temp', unit: '°C', maxVal: 100, w: 3, h: 3 },
    { id: 'demo2', type: 'switch', name: 'LED Light', topic: 'actuator/led', unit: '', maxVal: 1, w: 2, h: 2 },
    { id: 'demo3', type: 'dpad', name: 'RC Direction', topic: 'car/move', unit: '', maxVal: 1, w: 3, h: 4 },
    { id: 'demo4', type: 'speed', name: 'RC Speed', topic: 'car/speed', unit: '', maxVal: 255, w: 3, h: 2 },
  ];

  const defaultLayouts = layoutsFromLg([
    { i: 'demo1', x: 0, y: 0, w: 3, h: 3 },
    { i: 'demo2', x: 3, y: 0, w: 2, h: 2 },
    { i: 'demo3', x: 5, y: 0, w: 3, h: 4 },
    { i: 'demo4', x: 0, y: 3, w: 3, h: 2 },
  ]);

  // Initialize state from Firestore data once loaded
  const [widgets, setWidgets] = useState(null);
  const [layouts, setLayouts] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    if (savedWidgets) {
      setWidgets(savedWidgets);
    } else {
      setWidgets(defaultWidgets);
    }

    if (savedLayouts?.lg) {
      if (!savedLayouts.md || !savedLayouts.sm) {
        setLayouts(layoutsFromLg(savedLayouts.lg));
      } else {
        setLayouts(savedLayouts);
      }
    } else {
      setLayouts(defaultLayouts);
    }
  }, [loaded, savedWidgets, savedLayouts]);

  const [gaugeHistory, setGaugeHistory] = useState({});

  // Append incoming MQTT samples for sparkline (depends on deviceStates + widget list).
  /* eslint-disable react-hooks/set-state-in-effect -- derived time-series buffer */
  useEffect(() => {
    if (!widgets) return;
    setGaugeHistory(prev => {
      let next = prev;
      let changed = false;
      for (const w of widgets) {
        if (w.type !== 'gauge') continue;
        const raw = deviceStates?.[w.topic];
        if (raw === undefined) continue;
        const y = parseFloat(raw);
        if (!Number.isFinite(y)) continue;
        const arr = (changed ? next : prev)[w.topic] || [];
        if (arr[arr.length - 1] === y) continue;
        if (!changed) {
          next = { ...prev };
          changed = true;
        }
        next[w.topic] = [...arr.slice(-35), y];
      }
      return changed ? next : prev;
    });
  }, [deviceStates, widgets]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save to Firestore on changes (debounced inside the hook)
  useEffect(() => {
    if (!widgets || !layouts) return; // Don't save before initial load is complete
    save(widgets, layouts);
  }, [widgets, layouts, save]);

  const addWidget = useCallback((widgetDef) => {
    const newLayout = { i: widgetDef.id, x: 0, y: Infinity, w: widgetDef.w, h: widgetDef.h, minW: 2, minH: 2 };
    setWidgets(prev => [...prev, widgetDef]);
    setLayouts(prev => {
      const lg = [...(prev.lg || []), newLayout];
      return layoutsFromLg(lg);
    });
  }, [setWidgets, setLayouts]);

  const removeWidget = useCallback((id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
    setLayouts(prev => {
      const lg = (prev.lg || []).filter(l => l.i !== id);
      return layoutsFromLg(lg);
    });
  }, [setWidgets, setLayouts]);

  const editWidget = useCallback((updatedWidget) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
  }, [setWidgets]);

  const onLayoutChange = useCallback((_, allLayouts) => {
    setLayouts(allLayouts);
  }, [setLayouts]);

  if (!widgets || !layouts) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Header bar */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div>
          {esp32Prefix && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Target ESP32: {esp32Prefix}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          className="flex items-center gap-2 px-4 py-2.5 font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95"
        >
          <Plus size={18} />
          Add Tool
        </button>
      </div>

      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Gamepad2 size={48} className="text-slate-300 dark:text-white/10 mb-4" />
          <p className="text-muted-foreground dark:text-white/30 text-lg font-medium">No tools yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Use Add Tool to place sensors, actuators, or RC controls</p>
        </div>
      ) : (
        mounted && (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            width={width}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={COLS_BY_BP}
            rowHeight={80}
            draggableHandle=".drag-handle"
            isDraggable
            isResizable
            compactType="vertical"
            onLayoutChange={onLayoutChange}
            margin={[16, 16]}
            useCSSTransforms
          >
            {widgets.map(widget => (
              <div key={widget.id}>
                <WidgetCard
                  widget={widget}
                  value={deviceStates?.[widget.topic]}
                  publish={publish}
                  onRemove={removeWidget}
                  onEdit={setEditingWidget}
                  gaugeHistory={gaugeHistory[widget.topic]}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )
      )}

      {showModal && (
        <AddToolModal onClose={() => setShowModal(false)} onAdd={addWidget} userUID={userUID || storageScopeId} esp32Prefix={esp32Prefix} />
      )}

      {editingWidget && (
        <EditToolModal
          widget={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={editWidget}
          userUID={userUID || storageScopeId}
        />
      )}
    </div>
  );
}
