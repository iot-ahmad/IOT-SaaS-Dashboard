import { useState, useEffect, useCallback, useRef } from 'react';
import { Responsive as ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus, X, Thermometer, ToggleLeft, SlidersHorizontal,
  Gamepad2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Trash2, Activity, Zap, Car, GripVertical, Move, Loader2, Radio,
  Lightbulb, Palette, Calendar, FlaskConical, Wind, Blinds,
  Lock, Bell, Camera, Droplets, Sprout, Monitor, Globe,
  Minus, RotateCcw, RotateCw, AlignJustify, Hash, ChevronRight as ChevronRightIcon,
  Power, Cpu, Gauge, GraduationCap, Shield, Leaf, Wrench, Play, Sparkles, Grid, Send, Terminal,
  Bot, Hand, Navigation, Crosshair, LocateFixed
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
    label: '🕹️ تحكم وروبوتكس (Robotics)',
    icon: Gamepad2,
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    accent: 'text-amber-400',
    items: [
      { type: 'dpad', label: 'Direction Controller (D-Pad)', desc: 'D-Pad: FORWARD, BACK, LEFT, RIGHT, STOP on one topic', icon: Gamepad2, w: 3, h: 4 },
      { type: 'joystick', label: 'Joystick', desc: 'Analog-style stick: same movement commands on one MQTT topic', icon: Move, w: 4, h: 4 },
      { type: 'speed', label: 'Speed Slider', desc: 'Send speed value (0–255) to your speed topic', icon: Car, w: 3, h: 2 },
      { type: 'robot_arm',   label: 'Robot Arm (3 Joints)', desc: 'التحكم بذراع روبوتية بثلاثة مفاصل سيرفو مستقلة', icon: Bot,       w: 4, h: 4 },
      { type: 'gripper',     label: 'Gripper / Claw',       desc: 'التحكم بقابض الروبوت (فتح/غلق/قوة القبضة)', icon: Hand,      w: 3, h: 3 },
      { type: 'omni_drive',  label: 'Omni/Mecanum Drive',   desc: 'تحكم كامل بعجلات omni: يمين/يسار/أمام/خلف/دوران', icon: Navigation, w: 4, h: 4 },
      { type: 'robot_speed', label: 'Dual Motor Speed',     desc: 'تحكم مستقل بسرعة المحرك الأيسر والأيمن لتوجيه الروبوت', icon: Gauge,    w: 3, h: 3 },
    ],
  },
  {
    id: 'classroom',
    label: '🏫 تحكم الفصل الدراسي',
    icon: GraduationCap,
    color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
    accent: 'text-violet-400',
    items: [
      { type: 'relay',     label: 'Relay — تشغيل/إطفاء',       desc: 'التحكم بالإضاءة، البروجكتور، المروحة عبر Relay',          icon: Power,          w: 2, h: 2 },
      { type: 'dimmer',    label: 'Dimmer PWM — تعتيم الإضاءة', desc: 'تعتيم الإضاءة تدريجياً أثناء العروض (0-100%)',           icon: Lightbulb,      w: 3, h: 2 },
      { type: 'rgb',       label: 'RGB Strip — شريط ملون',      desc: 'التحكم بألوان شريط RGB/RGBW للتجارب البصرية والمسابقات', icon: Palette,        w: 3, h: 3 },
      { type: 'scene',     label: 'Scenes — أوضاع جاهزة',       desc: 'وضع امتحان / محاضرة / استراحة بضغطة واحدة',            icon: Cpu,            w: 3, h: 3 },
      { type: 'scheduler', label: 'Scheduler — جرس الحصص',      desc: 'جدولة تشغيل/إيقاف تلقائي لجرس الحصص أو الري',         icon: Calendar,       w: 3, h: 3 },
    ],
  },
  {
    id: 'stem',
    label: '🔬 مختبر STEM',
    icon: FlaskConical,
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    accent: 'text-emerald-400',
    items: [
      { type: 'servo',   label: 'Servo Motor — زاوية',       desc: 'التحكم بزاوية السيرفو (0–180°) لتجارب الروبوتيك',       icon: Wrench,          w: 3, h: 2 },
      { type: 'dcmotor', label: 'DC Motor — سرعة واتجاه',    desc: 'التحكم بسرعة واتجاه موتور DC لتجارب الفيزياء',          icon: RotateCw,        w: 3, h: 3 },
      { type: 'stepper', label: 'Stepper — خطوات دقيقة',     desc: 'التحكم دقيق بعدد الخطوات لمشاريع CNC والطباعة الثلاثية', icon: Gauge,           w: 3, h: 2 },
      { type: 'pwmfan',  label: 'PWM Fan — مروحة ذكية',      desc: 'التحكم PWM بالمروحة مع ربطها بحساس حرارة',              icon: Wind,            w: 3, h: 3 },
      { type: 'curtain', label: 'Smart Curtain — ستارة ذكية', desc: 'التحكم بنسبة فتح الستائر — مشروع تعليمي شائع',         icon: Blinds,          w: 3, h: 2 },
    ],
  },
  {
    id: 'security',
    label: '🔒 الأمن والسلامة',
    icon: Shield,
    color: 'from-red-500/20 to-rose-500/20 border-red-500/30',
    accent: 'text-red-400',
    items: [
      { type: 'doorlock', label: 'Door Lock — قفل ذكي',       desc: 'التحكم بقفل الباب الإلكتروني مع مؤقت auto-lock',  icon: Lock,   w: 2, h: 2 },
      { type: 'buzzer',   label: 'Buzzer / Siren — صفارة',   desc: 'تنبيه سلامة فوري — زر لحظي يرسل pulse',        icon: Bell,   w: 2, h: 2 },
      { type: 'pantilt',  label: 'Pan-Tilt Camera — كاميرا', desc: 'التحكم ثنائي المحاور بكاميرا المراقبة التعليمية', icon: Camera, w: 3, h: 3 },
    ],
  },
  {
    id: 'agriculture',
    label: '🌱 مشاريع زراعية',
    icon: Leaf,
    color: 'from-green-500/20 to-lime-500/20 border-green-500/30',
    accent: 'text-green-400',
    items: [
      { type: 'pump',       label: 'Water Pump — مضخة مياه',      desc: 'تشغيل/إيقاف مضخة المياه يدوياً أو بجدول',            icon: Droplets, w: 2, h: 2 },
      { type: 'valve',      label: 'Electric Valve — صمام',        desc: 'التحكم دقيق بصمام المياه الكهربائي',                   icon: Wrench,   w: 2, h: 2 },
      { type: 'irrigation', label: 'Smart Irrigation — ري ذكي',   desc: 'ري تلقائي حسب رطوبة التربة — مشروع تعليمي متكامل',   icon: Sprout,   w: 4, h: 3 },
    ],
  },
  {
    id: 'advanced',
    label: '🎯 أدوات متقدمة',
    icon: Monitor,
    color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/30',
    accent: 'text-sky-400',
    items: [
      { type: 'oled',         label: 'OLED/LCD Display — شاشة',      desc: 'إرسال نص لشاشة OLED أو LCD مباشرة',                     icon: Monitor,       w: 3, h: 2 },
      { type: 'numericInput', label: 'Numeric Input — قيمة رقمية',   desc: 'إرسال قيمة Setpoint لحساس أو متحكم (min/max/step)',      icon: Hash,          w: 2, h: 2 },
      { type: 'dropdown',     label: 'Dropdown — قائمة أوضاع',       desc: 'اختيار وضع التشغيل: Auto / Manual / Test',               icon: AlignJustify,  w: 3, h: 2 },
      { type: 'momentary',    label: 'Momentary Button — زر لحظي',   desc: 'زر يرسل payload محدد لمرة واحدة فقط عند الضغط',          icon: Zap,           w: 2, h: 2 },
    ],
  },
];

const DEFAULT_TOPICS = {
  // Legacy
  gauge:        'sensor/temperature',
  switch:       'actuator/led',
  slider:       'actuator/servo',
  dpad:         'car/move',
  joystick:     'car/move',
  speed:        'car/speed',
  scene:        'classroom/scene',
  scheduler:    'classroom/scheduler',
  curtain:      'stem/curtain',
  pantilt:      'security/pantilt',
  pump:         'farm/pump',
  valve:        'farm/valve',
  irrigation:   'farm/irrigation',
  numericInput: 'control/setpoint',
  dropdown:     'control/mode',
  momentary:    'control/trigger',
  pwmfan:       'stem/fan',
  doorlock:     'security/door',

  // Robotics
  robot_arm:    'robot/arm',
  gripper:      'robot/gripper',
  omni_drive:   'robot/omni',
  robot_speed:  'robot/speed',

  // Digital Outputs
  relay:          'actuator/relay',
  mosfet:         'actuator/mosfet',
  solenoid:       'actuator/solenoid',
  optocoupler:    'actuator/optocoupler',

  // Analog / PWM
  dimmer:         'actuator/dimmer',
  dcmotor_speed:  'motor/speed',
  fan_speed:      'fan/speed',
  dac:            'actuator/dac',

  // Motors
  servo:          'motor/servo',
  dcmotor:        'motor/dc',
  stepper:        'motor/stepper',
  bldc:           'motor/bldc',
  linear_actuator:'actuator/linear',

  // Lighting
  single_led:     'light/led',
  rgb:            'light/rgb',
  neopixel:       'light/neopixel',

  // Sound
  buzzer:         'sound/buzzer',
  speaker:        'sound/speaker',

  // Displays
  oled:           'display/oled',
  seven_segment:  'display/7segment',
  led_matrix:     'display/matrix',

  // Fluids
  solenoid_valve: 'fluid/valve',
  fluid_pump:     'fluid/pump',

  // Locks
  elec_lock:      'security/lock',
  latch:          'security/latch',

  // Comms
  ir_sender:      'signal/ir',
  rf_sender:      'signal/rf',
  bus_controller: 'signal/bus',
};

// ─── Add Tool Modal ───────────────────────────────────────────────────────────
function AddToolModal({ onClose, onAdd, userUID, esp32Prefix }) {
  const [step, setStep] = useState('category'); // category | config
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({
    name: '', topic: '', dataKey: '', unit: '°C', maxVal: 100,
    minVal: 0, step: 1, defaultVal: 0,
    options: 'Auto,Manual,Test,Off',
    payload: 'TRIGGER',
    onTime: '08:00', offTime: '14:00',
    maxChars: 32,
    threshold: 30,
  });

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const defaultKey = (DEFAULT_TOPICS[item.type] || item.type).replace(/\//g, '_');
    const topic = esp32Prefix ? `${esp32Prefix}/${DEFAULT_TOPICS[item.type] || item.type}` : (DEFAULT_TOPICS[item.type] || item.type);
    setForm(f => ({ ...f, name: item.label, topic, dataKey: defaultKey }));
    setStep('config');
  };

  const handleAdd = () => {
    if (!form.dataKey.trim()) return;
    const extra = {};
    if (selectedItem.type === 'numericInput') {
      extra.minVal = Number(form.minVal) || 0;
      extra.maxVal = Number(form.maxVal) || 100;
      extra.step = Number(form.step) || 1;
      extra.defaultVal = Number(form.defaultVal) || 0;
      extra.unit = form.unit;
    }
    if (selectedItem.type === 'dropdown') {
      extra.options = form.options.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (selectedItem.type === 'momentary') {
      extra.payload = form.payload || 'TRIGGER';
    }
    if (selectedItem.type === 'scheduler') {
      extra.onTime = form.onTime || '08:00';
      extra.offTime = form.offTime || '14:00';
    }
    if (selectedItem.type === 'oled') {
      extra.maxChars = Number(form.maxChars) || 32;
    }
    if (selectedItem.type === 'irrigation') {
      extra.threshold = Number(form.threshold) || 30;
    }
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
      ...extra,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-lg">Add Tool</h2>
            {step === 'config' && (
              <button onClick={() => setStep('category')} className="text-xs text-muted-foreground hover:text-foreground mt-0.5 transition-colors">
                ← Back to categories
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground dark:text-white/30 hover:text-foreground transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
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
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
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
                <label className="text-xs text-muted-foreground block mb-1">Widget Name</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
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
                <label className="text-xs text-muted-foreground block mb-1">MQTT Topic</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. car/move"
                />
              </div>
              {selectedItem.type === 'gauge' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Unit</label>
                    <input className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="°C" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Max Value</label>
                    <input type="number" className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      value={form.maxVal} onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))} />
                  </div>
                </div>
              )}
              {selectedItem.type === 'numericInput' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs text-muted-foreground block mb-1">Min</label>
                      <input type="number" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={form.minVal} onChange={e => setForm(f => ({ ...f, minVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Max</label>
                      <input type="number" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={form.maxVal} onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Step</label>
                      <input type="number" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={form.step} onChange={e => setForm(f => ({ ...f, step: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-muted-foreground block mb-1">Default Value</label>
                      <input type="number" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={form.defaultVal} onChange={e => setForm(f => ({ ...f, defaultVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Unit</label>
                      <input className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="°C" /></div>
                  </div>
                </div>
              )}
              {selectedItem.type === 'dropdown' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Options (comma separated)</label>
                  <input className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-primary/50"
                    value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Auto,Manual,Test,Off" />
                  <p className="text-[10px] text-muted-foreground mt-1">أدخل الخيارات مفصولة بفاصلة</p>
                </div>
              )}
              {selectedItem.type === 'momentary' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Payload عند الضغط</label>
                  <input className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-primary/50"
                    value={form.payload} onChange={e => setForm(f => ({ ...f, payload: e.target.value }))} placeholder="TRIGGER" />
                </div>
              )}
              {selectedItem.type === 'scheduler' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-green-400 block mb-1">وقت التشغيل ON</label>
                    <input type="time" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 font-mono text-foreground" value={form.onTime} onChange={e => setForm(f => ({ ...f, onTime: e.target.value }))} /></div>
                  <div><label className="text-xs text-red-400 block mb-1">وقت الإيقاف OFF</label>
                    <input type="time" className="w-full bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 font-mono text-foreground" value={form.offTime} onChange={e => setForm(f => ({ ...f, offTime: e.target.value }))} /></div>
                </div>
              )}
              {selectedItem.type === 'oled' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max Characters</label>
                  <input type="number" className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50"
                    value={form.maxChars} onChange={e => setForm(f => ({ ...f, maxChars: e.target.value }))} min={8} max={128} />
                </div>
              )}
              {selectedItem.type === 'irrigation' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">حد الري التلقائي (رطوبة %)</label>
                  <input type="number" className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50"
                    value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} min={10} max={80} />
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
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Widget Name</label>
            <input
              className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
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
            <label className="text-xs text-muted-foreground block mb-1">MQTT Topic</label>
            <input
              className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-primary/50 transition-colors"
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. car/move"
            />
          </div>

          {widget.type === 'gauge' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Unit</label>
                <input
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  placeholder="°C"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Max Value</label>
                <input
                  type="number"
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
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

  const color = widget.type === 'speed' ? '#f59e0b' : '#ffb300';
  const glowColor = widget.type === 'speed' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 179, 0, 0.4)';
  const label = widget.type === 'speed' ? 'Speed' : 'Angle';
  const Icon = widget.type === 'speed' ? Car : SlidersHorizontal;
  const accentClass = widget.type === 'speed' ? 'text-amber-400 animate-pulse' : 'text-amber-500';

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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CLASSROOM WIDGETS ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Relay Widget ─────────────────────────────────────────────────────────────
function RelayWidget({ widget, value, publish }) {
  const isOn = value === '1' || value === 'ON' || value === 'true';
  const toggle = () => publish(widget.topic, isOn ? 'OFF' : 'ON');

  // Dynamic config based on widget type
  const config = {
    relay:          { icon: Power,    label: 'Relay',       colorClass: 'text-violet-400', accentHex: '#8b5cf6', rgbStr: '139,92,246' },
    mosfet:         { icon: Cpu,      label: 'MOSFET',      colorClass: 'text-cyan-400',    accentHex: '#06b6d4', rgbStr: '6,182,212' },
    solenoid:       { icon: Zap,      label: 'Solenoid',    colorClass: 'text-amber-400',   accentHex: '#f59e0b', rgbStr: '245,158,11' },
    optocoupler:    { icon: Shield,   label: 'Optocoupler', colorClass: 'text-emerald-400', accentHex: '#10b981', rgbStr: '16,185,129' },
    solenoid_valve: { icon: Droplets,  label: 'Valve',       colorClass: 'text-blue-400',    accentHex: '#3b82f6', rgbStr: '59,130,246' },
    latch:          { icon: Lock,     label: 'Latch',       colorClass: 'text-pink-400',    accentHex: '#ec4899', rgbStr: '236,72,153' },
    elec_lock:      { icon: Lock,     label: 'Lock',        colorClass: 'text-red-400',     accentHex: '#ef4444', rgbStr: '239,68,68' },
  }[widget.type] || { icon: Power,    label: 'Relay',       colorClass: 'text-violet-400', accentHex: '#8b5cf6', rgbStr: '139,92,246' };

  const IconComponent = config.icon;
  const shadowStyle = isOn ? `0 0 10px ${config.accentHex}, 0 0 20px ${config.accentHex}` : 'none';
  const glowShadowClass = isOn ? `shadow-[0_0_24px_rgba(${config.rgbStr},0.35)]` : '';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className={`flex items-center gap-2 ${config.colorClass}`}>
          <IconComponent size={16} className={isOn ? 'animate-pulse' : ''} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative">
        <div className="absolute top-0 right-2 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full transition-all bg-current"
            style={{ color: isOn ? config.accentHex : '#475569', boxShadow: shadowStyle }} />
          <span className={`text-[9px] font-extrabold uppercase ${isOn ? config.colorClass : 'text-muted-foreground/60'}`}>
            {isOn ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
            isOn
              ? `bg-muted/15 border-current ${glowShadowClass} scale-95`
              : 'bg-background dark:bg-card/5 border-border hover:border-current/40'
          }`}
          style={{ color: isOn ? config.accentHex : undefined }}
          onClick={toggle}
        >
          <IconComponent size={28} className={isOn ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]' : 'text-muted-foreground/50'} />
        </div>
        <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${
          isOn ? 'bg-muted/10 border-current/30 text-current' : 'bg-muted border-border text-muted-foreground/50'
        }`} style={{ color: isOn ? config.accentHex : undefined }}>{isOn ? `${config.label.toUpperCase()} CLOSED` : `${config.label.toUpperCase()} OPEN`}</span>
      </div>
    </div>
  );
}

// ─── Dimmer Widget ─────────────────────────────────────────────────────────────
function DimmerWidget({ widget, publish }) {
  const [pct, setPct] = useState(0);
  const handleChange = (e) => {
    const v = Number(e.target.value);
    setPct(v);
    publish(widget.topic, String(v));
  };

  // Dynamic config based on widget type
  const config = {
    dimmer:          { icon: Lightbulb, label: 'Brightness',  colorClass: 'text-yellow-400', accentHex: '#f59e0b' },
    dcmotor_speed:   { icon: RotateCw,  label: 'Motor Speed', colorClass: 'text-emerald-400', accentHex: '#10b981' },
    fan_speed:       { icon: Wind,      label: 'Fan Speed',   colorClass: 'text-teal-400',    accentHex: '#14b8a6' },
    dac:             { icon: Activity,  label: 'DAC Output',  colorClass: 'text-cyan-400',    accentHex: '#06b6d4' },
    bldc:            { icon: Play,      label: 'BLDC Speed',  colorClass: 'text-orange-400',  accentHex: '#f97316' },
    linear_actuator: { icon: Blinds,    label: 'Extension',   colorClass: 'text-purple-400',  accentHex: '#a855f7' },
    single_led:      { icon: Lightbulb, label: 'LED Dimmer',  colorClass: 'text-amber-400',   accentHex: '#fbbf24' },
    fluid_pump:      { icon: Droplets,  label: 'Pump Speed',  colorClass: 'text-blue-400',    accentHex: '#3b82f6' },
  }[widget.type] || { icon: Lightbulb, label: 'Level', colorClass: 'text-yellow-400', accentHex: '#f59e0b' };

  const IconComponent = config.icon;
  const shadowStyle = pct > 0 ? `0 0 12px ${config.accentHex}80` : 'none';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className={`flex items-center gap-2 ${config.colorClass}`}>
          <IconComponent size={16} className={pct > 0 ? 'animate-pulse' : ''} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Visual icon container */}
        <div className="flex items-center justify-center">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full transition-all duration-300"
              style={{
                background: `radial-gradient(circle, ${config.accentHex}40 0%, transparent 70%)`,
                opacity: pct / 100
              }}
            />
            <IconComponent size={28} style={{ color: pct > 0 ? config.accentHex : undefined }}
              className={pct > 0 ? 'text-current' : 'text-muted-foreground/40'} />
          </div>
        </div>
        <div className="flex justify-between items-baseline">
          <span className={`text-3xl font-black font-mono tracking-tight ${config.colorClass}`} style={{ textShadow: shadowStyle }}>
            {pct}%
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{config.label}</span>
        </div>
        {/* Gradient track slider */}
        <div style={{ background: `linear-gradient(to right, #1a1a1a, ${config.accentHex})`, borderRadius: '9999px', padding: '2px' }}>
          <input type="range" min="0" max="100" value={pct} onChange={handleChange}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-transparent"
            style={{ accentColor: config.accentHex }} />
        </div>
      </div>
    </div>
  );
}

// ─── RGB Strip Widget ─────────────────────────────────────────────────────────
function RGBWidget({ widget, publish }) {
  const [color, setColor] = useState('#ff0000');
  const [brightness, setBrightness] = useState(100);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return { r, g, b };
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
    const { r, g, b } = hexToRgb(e.target.value);
    const scale = brightness / 100;
    publish(widget.topic, `${Math.round(r*scale)},${Math.round(g*scale)},${Math.round(b*scale)}`);
  };

  const handleBrightness = (e) => {
    const v = Number(e.target.value);
    setBrightness(v);
    const { r, g, b } = hexToRgb(color);
    const scale = v / 100;
    publish(widget.topic, `${Math.round(r*scale)},${Math.round(g*scale)},${Math.round(b*scale)}`);
  };

  const presets = ['#ff0000','#00ff00','#0000ff','#ff6600','#ff00ff','#00ffff','#ffffff','#ffff00'];

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2" style={{ color }}>
          <Palette size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2.5 min-h-0">
        {/* Color preview + picker */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border-2 border-border overflow-hidden flex-shrink-0"
            style={{ background: color, boxShadow: `0 0 16px ${color}66` }}>
            <input type="color" value={color} onChange={handleColorChange}
              className="w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground mb-1">انقر للون المخصص</p>
            <p className="text-xs font-mono font-bold" style={{ color }}>{color.toUpperCase()}</p>
          </div>
        </div>
        {/* Preset colors */}
        <div className="flex gap-1.5 flex-wrap">
          {presets.map(c => (
            <button key={c} onClick={() => { setColor(c); handleColorChange({ target: { value: c } }); }}
              className={`w-6 h-6 rounded-md border-2 transition-all ${ color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
              style={{ background: c }} />
          ))}
        </div>
        {/* Brightness */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Brightness</span>
            <span className="text-[10px] font-mono font-bold text-white/70">{brightness}%</span>
          </div>
          <input type="range" min="0" max="100" value={brightness} onChange={handleBrightness}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Scene Widget ─────────────────────────────────────────────────────────────
function SceneWidget({ widget, publish }) {
  const [active, setActive] = useState(null);
  const scenes = widget.scenes || [
    { key: 'exam',    label: '📝 وضع امتحان',   color: '#ef4444', payload: 'EXAM' },
    { key: 'lecture', label: '📖 وضع محاضرة',   color: '#3b82f6', payload: 'LECTURE' },
    { key: 'break',   label: '☕ وضع استراحة',  color: '#10b981', payload: 'BREAK' },
  ];

  const handleScene = (scene) => {
    setActive(scene.key);
    publish(widget.topic, scene.payload);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-violet-400">
          <Cpu size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        {scenes.map(scene => (
          <button
            key={scene.key}
            onClick={() => handleScene(scene)}
            className={`w-full py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
              active === scene.key
                ? 'scale-95'
                : 'bg-background dark:bg-card/5 border-border/50 hover:border-opacity-80 hover:scale-[0.98]'
            }`}
            style={active === scene.key ? {
              background: `${scene.color}20`,
              borderColor: scene.color,
              color: scene.color,
              boxShadow: `0 0 16px ${scene.color}40`
            } : {}}
          >
            {scene.label}
          </button>
        ))}
        {active && (
          <p className="text-[10px] text-center text-muted-foreground">الوضع النشط: {scenes.find(s => s.key === active)?.label}</p>
        )}
      </div>
    </div>
  );
}

// ─── Scheduler Widget ─────────────────────────────────────────────────────────
function SchedulerWidget({ widget, publish }) {
  const [onTime, setOnTime] = useState(widget.onTime || '08:00');
  const [offTime, setOffTime] = useState(widget.offTime || '14:00');
  const [enabled, setEnabled] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) { clearInterval(timerRef.current); return; }
    const check = () => {
      const now = new Date();
      const cur = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      if (cur === onTime) publish(widget.topic, 'ON');
      if (cur === offTime) publish(widget.topic, 'OFF');
    };
    timerRef.current = setInterval(check, 30000);
    check();
    return () => clearInterval(timerRef.current);
  }, [enabled, onTime, offTime, publish, widget.topic]);

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-violet-400">
          <Calendar size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <button
          onClick={() => setEnabled(v => !v)}
          className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${ enabled ? 'bg-violet-500' : 'bg-slate-600' }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${ enabled ? 'translate-x-5' : 'translate-x-0' }`} />
        </button>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-12 text-green-400 font-bold">ON:</span>
          <input type="time" value={onTime} onChange={e => setOnTime(e.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-violet-400 text-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-12 text-red-400 font-bold">OFF:</span>
          <input type="time" value={offTime} onChange={e => setOffTime(e.target.value)}
            className="flex-1 bg-muted border border-border rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-violet-400 text-foreground" />
        </div>
        <div className={`text-[10px] text-center py-1.5 rounded-lg font-bold ${
          enabled ? 'bg-violet-500/10 text-violet-400 border border-violet-400/30' : 'bg-muted text-muted-foreground'
        }`}>
          {enabled ? '⏱ الجدولة نشطة' : '⏸ الجدولة متوقفة'}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STEM LAB WIDGETS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Servo Widget ─────────────────────────────────────────────────────────────
function ServoWidget({ widget, publish }) {
  const [angle, setAngle] = useState(90);
  const handleChange = (e) => {
    const v = Number(e.target.value);
    setAngle(v);
    publish(widget.topic, String(v));
  };

  const rad = (angle - 90) * (Math.PI / 180);
  const armX = 50 + 30 * Math.sin(rad);
  const armY = 50 - 30 * Math.cos(rad);

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wrench size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2 px-1">
        {/* Arm visual */}
        <div className="flex justify-center">
          <svg width="80" height="60" viewBox="0 0 100 70">
            <circle cx="50" cy="55" r="12" fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth="2" />
            <circle cx="50" cy="55" r="5" fill="#34d399" />
            <line x1="50" y1="55" x2={armX} y2={armY + 5} stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
            <circle cx={armX} cy={armY + 5} r="4" fill="#6ee7b7" />
          </svg>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-black font-mono text-emerald-400" style={{ textShadow: '0 0 10px rgba(52,211,153,0.4)' }}>{angle}°</span>
          <span className="text-[10px] text-muted-foreground">0° — 180°</span>
        </div>
        <input type="range" min="0" max="180" value={angle} onChange={handleChange}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#34d399' }} />
        <div className="flex justify-between text-[9px] text-muted-foreground/50">
          <span>0°</span><span>90°</span><span>180°</span>
        </div>
      </div>
    </div>
  );
}

// ─── DC Motor Widget ──────────────────────────────────────────────────────────
function DCMotorWidget({ widget, publish }) {
  const [speed, setSpeed] = useState(0);
  const [forward, setForward] = useState(true);

  const handleSpeed = (e) => {
    const v = Number(e.target.value);
    setSpeed(v);
    publish(widget.topic, `${forward ? 'F' : 'R'},${v}`);
  };

  const toggleDir = () => {
    const nf = !forward;
    setForward(nf);
    publish(widget.topic, `${nf ? 'F' : 'R'},${speed}`);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <RotateCw size={16} className={speed > 0 ? 'animate-spin' : ''} style={{ animationDuration: speed > 0 ? `${1 - speed/300}s` : '1s' }} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Direction toggle */}
        <div className="flex gap-2">
          <button onClick={() => { setForward(true); publish(widget.topic, `F,${speed}`); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              forward ? 'bg-emerald-500/15 border-emerald-400 text-emerald-400' : 'bg-muted border-border text-muted-foreground'
            }`}>
            ▶ Forward
          </button>
          <button onClick={() => { setForward(false); publish(widget.topic, `R,${speed}`); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              !forward ? 'bg-orange-500/15 border-orange-400 text-orange-400' : 'bg-muted border-border text-muted-foreground'
            }`}>
            ◀ Reverse
          </button>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-black font-mono text-emerald-400">{speed}</span>
          <span className="text-[10px] text-muted-foreground">Speed / 255</span>
        </div>
        <input type="range" min="0" max="255" value={speed} onChange={handleSpeed}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: forward ? '#34d399' : '#fb923c' }} />
        <button onClick={() => { setSpeed(0); publish(widget.topic, 'STOP'); }}
          className="w-full py-1.5 rounded-lg text-xs font-black bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
          ⬛ STOP
        </button>
      </div>
    </div>
  );
}

// ─── Stepper Widget ───────────────────────────────────────────────────────────
function StepperWidget({ widget, publish }) {
  const [steps, setSteps] = useState(200);
  const [speed, setSpeed] = useState(50);

  const sendCmd = (dir) => {
    publish(widget.topic, `${dir},${steps},${speed}`);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Gauge size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2.5 px-1">
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">عدد الخطوات</label>
          <div className="flex items-center gap-2">
            <button onClick={() => setSteps(v => Math.max(1, v - 10))}
              className="w-8 h-8 rounded-lg bg-muted border border-border text-foreground font-bold hover:bg-secondary transition-colors">-</button>
            <input type="number" value={steps} onChange={e => setSteps(Number(e.target.value))}
              className="flex-1 bg-muted border border-border rounded-lg py-1.5 text-center text-sm font-mono font-bold focus:outline-none focus:border-emerald-400 text-foreground" />
            <button onClick={() => setSteps(v => v + 10)}
              className="w-8 h-8 rounded-lg bg-muted border border-border text-foreground font-bold hover:bg-secondary transition-colors">+</button>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">السرعة</label>
            <span className="text-[10px] font-mono font-bold text-emerald-400">{speed} RPM</span>
          </div>
          <input type="range" min="1" max="200" value={speed} onChange={e => setSpeed(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: '#34d399' }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => sendCmd('CW')}
            className="flex-1 py-2 rounded-xl text-xs font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all">
            ↻ CW
          </button>
          <button onClick={() => sendCmd('CCW')}
            className="flex-1 py-2 rounded-xl text-xs font-black bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-all">
            ↺ CCW
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PWM Fan Widget ───────────────────────────────────────────────────────────
function PWMFanWidget({ widget, value, publish }) {
  const [fanSpeed, setFanSpeed] = useState(0);
  const temp = value !== undefined ? parseFloat(value) : null;

  const handleFan = (e) => {
    const v = Number(e.target.value);
    setFanSpeed(v);
    publish(widget.topic, String(v));
  };

  const tempColor = temp !== null ? (temp > 40 ? '#ef4444' : temp > 30 ? '#f59e0b' : '#34d399') : '#6b7280';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Wind size={16} className={fanSpeed > 0 ? 'animate-spin' : ''} style={{ animationDuration: fanSpeed > 0 ? `${2 - fanSpeed/140}s` : '2s' }} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Temp reading */}
        {temp !== null && (
          <div className="flex items-center justify-between bg-muted border border-border rounded-xl px-3 py-2">
            <Thermometer size={14} style={{ color: tempColor }} />
            <span className="text-sm font-black font-mono" style={{ color: tempColor }}>{temp.toFixed(1)}°C</span>
          </div>
        )}
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-black font-mono text-emerald-400">{fanSpeed}</span>
          <span className="text-[10px] text-muted-foreground">PWM / 255</span>
        </div>
        <input type="range" min="0" max="255" value={fanSpeed} onChange={handleFan}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#34d399' }} />
        <div className="flex gap-1.5">
          {[0, 64, 128, 192, 255].map(v => (
            <button key={v} onClick={() => { setFanSpeed(v); publish(widget.topic, String(v)); }}
              className={`flex-1 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                fanSpeed === v ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-muted border-border text-muted-foreground hover:border-emerald-400/40'
              }`}>{v === 0 ? 'OFF' : v === 255 ? 'MAX' : `${Math.round(v/255*100)}%`}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Curtain Widget ───────────────────────────────────────────────────────────
function CurtainWidget({ widget, publish }) {
  const [openPct, setOpenPct] = useState(0);
  const [moving, setMoving] = useState(false);

  const handleChange = (e) => {
    const v = Number(e.target.value);
    setOpenPct(v);
    publish(widget.topic, String(v));
  };

  const goTo = (v) => { setOpenPct(v); publish(widget.topic, String(v)); };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Blinds size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Curtain visual */}
        <div className="relative w-full h-12 bg-muted border border-border rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1 bg-border" />
          </div>
          {/* Left curtain */}
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500/30 to-violet-500/10 border-r border-violet-400/30 transition-all duration-500"
            style={{ width: `${(100 - openPct) / 2}%` }} />
          {/* Right curtain */}
          <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-violet-500/30 to-violet-500/10 border-l border-violet-400/30 transition-all duration-500"
            style={{ width: `${(100 - openPct) / 2}%` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white/60">{openPct}% Open</span>
          </div>
        </div>
        <input type="range" min="0" max="100" value={openPct} onChange={handleChange}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: '#8b5cf6' }} />
        <div className="flex gap-2">
          <button onClick={() => goTo(0)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-muted border border-border text-muted-foreground hover:border-violet-400/40 hover:text-violet-400 transition-all">مغلق</button>
          <button onClick={() => goTo(50)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-muted border border-border text-muted-foreground hover:border-violet-400/40 hover:text-violet-400 transition-all">نصف</button>
          <button onClick={() => goTo(100)} className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-muted border border-border text-muted-foreground hover:border-violet-400/40 hover:text-violet-400 transition-all">مفتوح</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SECURITY WIDGETS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Door Lock Widget ─────────────────────────────────────────────────────────
function DoorLockWidget({ widget, value, publish }) {
  const isLocked = value !== 'OPEN' && value !== '0';
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  const toggle = () => {
    if (!isLocked) {
      publish(widget.topic, 'OPEN');
    } else {
      publish(widget.topic, 'OPEN');
      // Auto-lock after 10 seconds
      clearTimeout(timerRef.current);
      setCountdown(10);
      let c = 10;
      timerRef.current = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(timerRef.current);
          setCountdown(null);
          publish(widget.topic, 'LOCK');
        }
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-red-400">
          <Lock size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div
          onClick={toggle}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
            isLocked
              ? 'bg-red-500/10 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
              : 'bg-green-500/10 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
          }`}
        >
          <Lock size={28} className={isLocked ? 'text-red-400' : 'text-green-400'} />
        </div>
        <span className={`text-xs font-black px-3 py-1 rounded-full border ${
          isLocked
            ? 'bg-red-500/10 border-red-400/30 text-red-400'
            : 'bg-green-500/10 border-green-400/30 text-green-400'
        }`}>{isLocked ? '🔒 مقفل' : '🔓 مفتوح'}</span>
        {countdown !== null && (
          <span className="text-[10px] text-amber-400 animate-pulse">Auto-lock في {countdown}s</span>
        )}
      </div>
    </div>
  );
}

// ─── Buzzer Widget ─────────────────────────────────────────────────────────────
function BuzzerWidget({ widget, publish }) {
  const [active, setActive] = useState(false);

  const trigger = () => {
    setActive(true);
    publish(widget.topic, 'BEEP');
    setTimeout(() => setActive(false), 600);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-red-400">
          <Bell size={16} className={active ? 'animate-bounce' : ''} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* Pulse rings */}
        <div className="relative">
          {active && (
            <>
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping scale-150" />
              <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping scale-200" style={{ animationDelay: '0.1s' }} />
            </>
          )}
          <button
            onClick={trigger}
            className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-150 border-2 select-none active:scale-90 ${
              active
                ? 'bg-red-500/30 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-95'
                : 'bg-background dark:bg-card/5 border-border hover:border-red-400/50 hover:bg-red-500/5'
            }`}
          >
            <Bell size={28} className={active ? 'text-red-400 animate-bounce' : 'text-muted-foreground/60'} />
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground">اضغط لإرسال BEEP</span>
      </div>
    </div>
  );
}

// ─── Pan-Tilt Widget ──────────────────────────────────────────────────────────
function PanTiltWidget({ widget, publish }) {
  const [pan, setPan] = useState(90);
  const [tilt, setTilt] = useState(90);

  const handlePan = (e) => {
    const v = Number(e.target.value);
    setPan(v);
    publish(widget.topic, `PAN,${v}`);
  };

  const handleTilt = (e) => {
    const v = Number(e.target.value);
    setTilt(v);
    publish(widget.topic, `TILT,${v}`);
  };

  const center = () => { setPan(90); setTilt(90); publish(widget.topic, 'CENTER'); };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-red-400">
          <Camera size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Visual indicator */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center">
            <Camera size={16} className="text-red-400" style={{
              transform: `rotateX(${(tilt-90)*0.3}deg) rotateY(${(pan-90)*0.3}deg)`
            }} />
            <div className="absolute inset-2 rounded-full border border-dashed border-red-400/20" />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">← Pan →</label>
            <span className="text-[10px] font-mono font-bold text-red-400">{pan}°</span>
          </div>
          <input type="range" min="0" max="180" value={pan} onChange={handlePan}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#f87171' }} />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">↑ Tilt ↓</label>
            <span className="text-[10px] font-mono font-bold text-red-400">{tilt}°</span>
          </div>
          <input type="range" min="0" max="180" value={tilt} onChange={handleTilt}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#f87171' }} />
        </div>
        <button onClick={center} className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-muted border border-border text-muted-foreground hover:border-red-400/40 hover:text-red-400 transition-all">
          ⊙ توسيط الكاميرا (90°, 90°)
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AGRICULTURE WIDGETS ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Pump Widget ──────────────────────────────────────────────────────────────
function PumpWidget({ widget, value, publish }) {
  const isOn = value === '1' || value === 'ON';
  const [runtime, setRuntime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOn) {
      timerRef.current = setInterval(() => setRuntime(v => v + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRuntime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isOn]);

  const toggle = () => publish(widget.topic, isOn ? 'OFF' : 'ON');
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-green-400">
          <Droplets size={16} className={isOn ? 'animate-bounce' : ''} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div onClick={toggle} className={`w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${
          isOn
            ? 'bg-blue-500/15 border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.4)] scale-95'
            : 'bg-background dark:bg-card/5 border-border hover:border-blue-400/40'
        }`}>
          <Droplets size={28} className={isOn ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-muted-foreground/50'} />
        </div>
        <span className={`text-xs font-black px-3 py-1 rounded-full border ${
          isOn ? 'bg-blue-500/10 border-blue-400/30 text-blue-400' : 'bg-muted border-border text-muted-foreground'
        }`}>{isOn ? '💧 تشغيل' : '⭕ إيقاف'}</span>
        {isOn && <span className="text-[10px] font-mono text-blue-400/70">⏱ {fmt(runtime)}</span>}
      </div>
    </div>
  );
}

// ─── Valve Widget ──────────────────────────────────────────────────────────────
function ValveWidget({ widget, value, publish }) {
  const isOpen = value === '1' || value === 'OPEN';
  const toggle = () => publish(widget.topic, isOpen ? 'CLOSE' : 'OPEN');

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-green-400">
          <Wrench size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        {/* Valve visual */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full">
            <rect x="4" y="28" width="56" height="8" rx="4" fill={isOpen ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.2)'} stroke={isOpen ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
            <circle cx="32" cy="32" r="10" fill={isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'} stroke={isOpen ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
            <line x1="32" y1="22" x2="32" y2="14" stroke={isOpen ? '#22c55e' : '#ef4444'} strokeWidth="2" strokeLinecap="round" />
            <rect x="26" y="10" width="12" height="5" rx="2" fill={isOpen ? '#22c55e' : '#ef4444'}
              transform={isOpen ? 'rotate(90 32 12.5)' : ''} style={{ transition: 'all 0.3s' }} />
          </svg>
        </div>
        <button onClick={toggle}
          className={`px-4 py-1.5 rounded-xl text-xs font-black border-2 transition-all active:scale-95 ${
            isOpen
              ? 'bg-green-500/15 border-green-400 text-green-400 shadow-[0_0_16px_rgba(34,197,94,0.3)]'
              : 'bg-red-500/10 border-red-400 text-red-400'
          }`}>
          {isOpen ? '✅ مفتوح — إغلاق' : '❌ مغلق — فتح'}
        </button>
      </div>
    </div>
  );
}

// ─── Smart Irrigation Widget ───────────────────────────────────────────────────
function IrrigationWidget({ widget, value, publish }) {
  const moisture = value !== undefined ? parseFloat(value) : null;
  const [threshold, setThreshold] = useState(widget.threshold || 30);
  const [mode, setMode] = useState('manual'); // 'auto' | 'manual'
  const [pumpOn, setPumpOn] = useState(false);

  // Auto mode: trigger when moisture drops below threshold
  useEffect(() => {
    if (mode !== 'auto' || moisture === null) return;
    if (moisture < threshold) {
      setPumpOn(true);
      publish(widget.topic, 'ON');
    } else {
      setPumpOn(false);
      publish(widget.topic, 'OFF');
    }
  }, [moisture, threshold, mode]);

  const moistureColor = moisture !== null
    ? (moisture < threshold ? '#ef4444' : moisture < threshold + 15 ? '#f59e0b' : '#22c55e')
    : '#6b7280';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-green-400">
          <Sprout size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2.5 min-h-0">
        {/* Moisture bar */}
        <div className="bg-muted border border-border rounded-xl p-2.5">
          <div className="flex justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">رطوبة التربة</span>
            <span className="text-[10px] font-mono font-bold" style={{ color: moistureColor }}>
              {moisture !== null ? `${moisture.toFixed(0)}%` : 'N/A'}
            </span>
          </div>
          <div className="h-2 bg-card/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.min(100, moisture || 0)}%`,
              background: moistureColor
            }} />
          </div>
          {/* Threshold marker */}
          <div className="relative mt-1">
            <div className="absolute top-0 w-0.5 h-3 bg-amber-400 -translate-x-1/2" style={{ left: `${threshold}%` }} />
            <p className="text-[9px] text-amber-400/70 text-right">حد الري: {threshold}%</p>
          </div>
        </div>
        {/* Mode + Threshold */}
        <div className="flex gap-2">
          <button onClick={() => setMode('manual')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              mode === 'manual' ? 'bg-green-500/15 border-green-400 text-green-400' : 'bg-muted border-border text-muted-foreground'
            }`}>يدوي</button>
          <button onClick={() => setMode('auto')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              mode === 'auto' ? 'bg-sky-500/15 border-sky-400 text-sky-400' : 'bg-muted border-border text-muted-foreground'
            }`}>ذكي 🤖</button>
        </div>
        {mode === 'auto' && (
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-muted-foreground">حد التشغيل</label>
              <span className="text-[10px] font-mono font-bold text-amber-400">{threshold}%</span>
            </div>
            <input type="range" min="10" max="80" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#f59e0b' }} />
          </div>
        )}
        {mode === 'manual' && (
          <button
            onClick={() => { setPumpOn(v => !v); publish(widget.topic, pumpOn ? 'OFF' : 'ON'); }}
            className={`w-full py-2 rounded-xl text-xs font-black border-2 transition-all active:scale-95 ${
              pumpOn ? 'bg-blue-500/15 border-blue-400 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.3)]' : 'bg-muted border-border text-muted-foreground'
            }`}>
            {pumpOn ? '💧 إيقاف الري' : '💧 تشغيل الري'}
          </button>
        )}
        {mode === 'auto' && (
          <div className={`text-[10px] text-center py-1 rounded-lg font-bold ${
            pumpOn ? 'bg-blue-500/10 text-blue-400 border border-blue-400/30' : 'bg-muted text-muted-foreground'
          }`}>{pumpOn ? '💧 الري يعمل تلقائياً' : '✅ التربة رطبة كافياً'}</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ADVANCED TOOL WIDGETS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── OLED Display Widget ──────────────────────────────────────────────────────
function OLEDWidget({ widget, publish }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    publish(widget.topic, text.trim());
    setSent(text.trim());
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sky-400">
          <Monitor size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3">
        {/* OLED preview */}
        <div className="bg-black rounded-xl border border-green-400/30 p-3 min-h-[52px] flex items-center justify-center" style={{ boxShadow: '0 0 12px rgba(74,222,128,0.1)' }}>
          <p className="font-mono text-green-400 text-sm text-center break-all" style={{ textShadow: '0 0 6px rgba(74,222,128,0.6)' }}>
            {sent || <span className="opacity-30">OLED Display...</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="نص للشاشة..."
            maxLength={widget.maxChars || 32}
            className="flex-1 bg-muted border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-sky-400 text-foreground font-mono"
          />
          <button onClick={handleSend}
            className="px-4 rounded-xl text-xs font-black bg-sky-500/15 border border-sky-400/50 text-sky-400 hover:bg-sky-500/25 transition-all active:scale-95">
            إرسال
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['HELLO', 'READY', 'TEST', 'CLEAR'].map(preset => (
            <button key={preset} onClick={() => { setText(preset); publish(widget.topic, preset); setSent(preset); }}
              className="text-[9px] px-2.5 py-1 rounded-lg bg-muted border border-border text-muted-foreground hover:border-sky-400/40 hover:text-sky-400 transition-all font-mono">
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Numeric Input Widget ─────────────────────────────────────────────────────
function NumericInputWidget({ widget, publish }) {
  const min = widget.minVal ?? 0;
  const max = widget.maxVal ?? 100;
  const step = widget.step ?? 1;
  const [val, setVal] = useState(widget.defaultVal ?? min);

  const send = (v) => {
    const clamped = Math.min(max, Math.max(min, v));
    setVal(clamped);
    publish(widget.topic, String(clamped));
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sky-400">
          <Hash size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        <div className="text-center">
          <span className="text-4xl font-black font-mono text-sky-400" style={{ textShadow: '0 0 12px rgba(56,189,248,0.3)' }}>{val}</span>
          <span className="text-[10px] text-muted-foreground ml-1">{widget.unit || ''}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => send(val - step)}
            className="flex-1 py-2 rounded-xl text-sm font-black bg-muted border border-border text-foreground hover:border-sky-400/40 hover:text-sky-400 transition-all active:scale-95">−</button>
          <input
            type="number" value={val} min={min} max={max} step={step}
            onChange={e => send(Number(e.target.value))}
            className="w-20 text-center bg-muted border border-sky-400/30 rounded-xl py-2 text-sm font-mono font-bold focus:outline-none focus:border-sky-400 text-foreground"
          />
          <button onClick={() => send(val + step)}
            className="flex-1 py-2 rounded-xl text-sm font-black bg-muted border border-border text-foreground hover:border-sky-400/40 hover:text-sky-400 transition-all active:scale-95">+</button>
        </div>
        <input type="range" min={min} max={max} step={step} value={val} onChange={e => send(Number(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#38bdf8' }} />
        <div className="flex justify-between text-[9px] text-muted-foreground/50 font-mono">
          <span>{min}</span><span>{max}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown Widget ──────────────────────────────────────────────────────────
function DropdownWidget({ widget, publish }) {
  const options = widget.options || ['Auto', 'Manual', 'Test', 'Off'];
  const [selected, setSelected] = useState(options[0]);

  const handleSelect = (opt) => {
    setSelected(opt);
    publish(widget.topic, opt);
  };

  const modeColors = {
    'Auto': '#34d399', 'Manual': '#f59e0b', 'Test': '#60a5fa', 'Off': '#6b7280',
    'automatic': '#34d399', 'manual': '#f59e0b', 'test': '#60a5fa', 'off': '#6b7280',
  };
  const color = modeColors[selected] || '#8b5cf6';

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sky-400">
          <AlignJustify size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2">
        <div className="flex items-center justify-between bg-muted border-2 rounded-xl px-3 py-2 transition-all" style={{ borderColor: color }}>
          <span className="text-sm font-black" style={{ color }}>{selected}</span>
          <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        </div>
        <div className="space-y-1.5">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                selected === opt ? 'scale-[0.98]' : 'bg-muted border-border text-muted-foreground hover:border-border/80'
              }`}
              style={selected === opt ? { background: `${modeColors[opt] || color}20`, borderColor: modeColors[opt] || color, color: modeColors[opt] || color } : {}}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Momentary Button Widget ───────────────────────────────────────────────────
function MomentaryWidget({ widget, publish }) {
  const [pressed, setPressed] = useState(false);
  const payload = widget.payload || 'TRIGGER';

  const trigger = () => {
    setPressed(true);
    publish(widget.topic, payload);
    setTimeout(() => setPressed(false), 400);
  };

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-sky-400">
          <Zap size={16} className={pressed ? 'animate-pulse' : ''} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <button
          onClick={trigger}
          className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-150 select-none active:scale-90 font-black text-sm ${
            pressed
              ? 'bg-sky-500/30 border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.6),inset_0_2px_0_rgba(255,255,255,0.1)] scale-95 text-sky-300'
              : 'bg-background dark:bg-card/10 border-border hover:border-sky-400/50 hover:bg-sky-500/5 text-foreground'
          }`}
        >
          {pressed ? '⚡' : <Zap size={24} className="text-current" />}
        </button>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">ترسل: <code className="font-mono text-sky-400 bg-muted px-1.5 py-0.5 rounded text-[9px]">{payload}</code></p>
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

// ─── Robot Arm Widget (3 servo joints) ─────────────────────────────────────
function RobotArmWidget({ widget, publish }) {
  const [joints, setJoints] = useState({ base: 90, shoulder: 90, elbow: 90 });

  const setJoint = (name, val) => {
    const next = { ...joints, [name]: val };
    setJoints(next);
    publish(widget.topic, `${name.toUpperCase()},${val}`);
  };

  const center = () => {
    const c = { base: 90, shoulder: 90, elbow: 90 };
    setJoints(c);
    publish(widget.topic, 'CENTER');
  };

  const arms = [
    { key: 'base',     label: 'قاعدة (Base)',      color: '#06b6d4', range: [0, 180] },
    { key: 'shoulder', label: 'كتف (Shoulder)',     color: '#8b5cf6', range: [0, 180] },
    { key: 'elbow',    label: 'مرفق (Elbow)',       color: '#f59e0b', range: [0, 135] },
  ];

  // Simple 2D arm preview
  const baseAngle = ((joints.base - 90) * Math.PI) / 180;
  const shoulderAngle = ((joints.shoulder - 90) * Math.PI) / 180 + baseAngle;
  const elbowAngle = ((joints.elbow - 90) * Math.PI) / 180 + shoulderAngle;
  const L1 = 36, L2 = 28;
  const x0 = 60, y0 = 78;
  const x1 = x0 + L1 * Math.sin(shoulderAngle);
  const y1 = y0 - L1 * Math.cos(shoulderAngle);
  const x2 = x1 + L2 * Math.sin(elbowAngle);
  const y2 = y1 - L2 * Math.cos(elbowAngle);

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-cyan-400">
          <Bot size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col min-h-0 gap-2">
        {/* SVG arm preview */}
        <div className="flex justify-center">
          <svg width="120" height="90" viewBox="0 0 120 90">
            {/* Base platform */}
            <rect x="44" y="80" width="32" height="6" rx="3" fill="rgba(6,182,212,0.3)" stroke="#06b6d4" strokeWidth="1"/>
            {/* Upper arm */}
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round"/>
            {/* Forearm */}
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
            {/* Joints */}
            <circle cx={x0} cy={y0} r="5" fill="#06b6d4" filter="url(#glow)"/>
            <circle cx={x1} cy={y1} r="4" fill="#8b5cf6"/>
            <circle cx={x2} cy={y2} r="3" fill="#f59e0b"/>
            <defs><filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          </svg>
        </div>
        {/* Joint sliders */}
        <div className="space-y-2 px-1">
          {arms.map(a => (
            <div key={a.key}>
              <div className="flex justify-between mb-0.5">
                <label className="text-[9px] font-bold" style={{ color: a.color }}>{a.label}</label>
                <span className="text-[9px] font-mono" style={{ color: a.color }}>{joints[a.key]}°</span>
              </div>
              <input type="range" min={a.range[0]} max={a.range[1]} value={joints[a.key]}
                onChange={e => setJoint(a.key, Number(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: a.color }}
              />
            </div>
          ))}
        </div>
        <button onClick={center}
          className="w-full py-1.5 rounded-xl text-[10px] font-black bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all active:scale-95">
          ⊙ توسيط الذراع (90°, 90°, 90°)
        </button>
      </div>
    </div>
  );
}

// ─── Gripper Widget ───────────────────────────────────────────────────────────
function GripperWidget({ widget, publish }) {
  const [openPct, setOpenPct] = useState(100);
  const [force, setForce] = useState(50);
  const [grip, setGrip] = useState(false);

  const sendGrip = (open) => {
    setGrip(!open);
    publish(widget.topic, open ? `OPEN,${force}` : `GRIP,${force}`);
  };

  const handleOpen = (v) => {
    setOpenPct(v);
    publish(widget.topic, `POS,${v},${force}`);
  };

  const jawGap = (openPct / 100) * 28;

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-violet-400">
          <Hand size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-3 px-1">
        {/* Gripper SVG */}
        <div className="flex justify-center">
          <svg width="90" height="60" viewBox="0 0 90 60">
            {/* Palm */}
            <rect x="30" y="24" width="30" height="16" rx="4" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="1.5"/>
            {/* Upper jaw */}
            <rect x={45 - jawGap / 2 - 14} y="10" width="14" height="14" rx="3" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" style={{ transition: 'all 0.2s' }}/>
            {/* Lower jaw */}
            <rect x={45 + jawGap / 2} y="10" width="14" height="14" rx="3" fill="rgba(139,92,246,0.3)" stroke="#8b5cf6" strokeWidth="1.5" style={{ transition: 'all 0.2s' }}/>
            <text x="45" y="38" textAnchor="middle" fontSize="8" fill="#a78bfa" fontWeight="bold">{openPct}%</text>
          </svg>
        </div>
        {/* Open % */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">انفتاح القابض</label>
            <span className="text-[10px] font-mono font-bold text-violet-400">{openPct}%</span>
          </div>
          <input type="range" min="0" max="100" value={openPct} onChange={e => handleOpen(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#8b5cf6' }}/>
        </div>
        {/* Force */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">قوة القبضة</label>
            <span className="text-[10px] font-mono font-bold text-pink-400">{force}%</span>
          </div>
          <input type="range" min="10" max="100" value={force} onChange={e => setForce(Number(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#ec4899' }}/>
        </div>
        <div className="flex gap-2">
          <button onClick={() => sendGrip(true)}
            className="flex-1 py-2 rounded-xl text-xs font-black bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-all active:scale-95">
            ✋ فتح
          </button>
          <button onClick={() => sendGrip(false)}
            className="flex-1 py-2 rounded-xl text-xs font-black bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20 transition-all active:scale-95">
            👊 إمساك
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Omni/Mecanum Drive Widget ────────────────────────────────────────────────
function OmniDriveWidget({ widget, publish }) {
  const rootRef = useRef(null);
  const activeRef = useRef(null);
  const [active, setActive] = useState(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0); // -1 CCW, 0 stop, 1 CW

  const setCmd = (cmd) => { activeRef.current = cmd; setActive(cmd); };
  const deadPx = 12, maxStick = 50;

  const dirFromDelta = (dx, dy) => {
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
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = clientX - cx, dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const cmd = dirFromDelta(dx, dy);
    const cap = Math.min(dist, maxStick);
    if (dist > 1e-6) { dx = (dx / dist) * cap; dy = (dy / dist) * cap; } else { dx = 0; dy = 0; }
    setKnob({ x: dx, y: dy });
    const prev = activeRef.current;
    if (cmd !== prev) {
      if (cmd) { setCmd(cmd); publish(widget.topic, `MOVE,${cmd},${rotate}`); }
      else { if (prev) publish(widget.topic, `STOP,0,${rotate}`); setCmd(null); }
    }
  };

  const endPointer = () => {
    setKnob({ x: 0, y: 0 });
    if (activeRef.current) publish(widget.topic, `STOP,0,${rotate}`);
    setCmd(null);
  };

  const setRotateCmd = (r) => { setRotate(r); publish(widget.topic, `ROTATE,${r > 0 ? 'CW' : r < 0 ? 'CCW' : 'STOP'}`); };
  const knobLit = active != null;

  return (
    <div className="flex flex-col h-full gap-2 min-h-0 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-cyan-400">
          <Navigation size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex gap-3 items-center justify-center min-h-0">
        {/* Joystick */}
        <div
          ref={rootRef}
          className="relative w-32 h-32 rounded-full border border-cyan-400/20 bg-gradient-to-b from-cyan-950/10 to-black/40 touch-none select-none cursor-grab active:cursor-grabbing shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)] flex items-center justify-center flex-shrink-0"
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); applyPointer(e.clientX, e.clientY); }}
          onPointerMove={e => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; applyPointer(e.clientX, e.clientY); }}
          onPointerUp={e => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} endPointer(); }}
          onPointerCancel={endPointer}
        >
          <div className="absolute inset-[18%] rounded-full border border-dashed border-cyan-400/15 pointer-events-none" />
          <div
            className={`absolute w-11 h-11 rounded-full border-2 transition-all duration-75 flex items-center justify-center ${
              knobLit ? 'bg-cyan-400/40 border-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.7)] scale-95' : 'bg-card/10 border-border'
            }`}
            style={{ left: `calc(50% + ${knob.x}px)`, top: `calc(50% + ${knob.y}px)`, transform: 'translate(-50%,-50%)' }}
          >
            <div className={`w-3 h-3 rounded-full ${knobLit ? 'bg-cyan-400' : 'bg-muted-foreground/30'}`} />
          </div>
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground font-black pointer-events-none">F</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground font-black pointer-events-none">B</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] text-muted-foreground font-black pointer-events-none">L</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] text-muted-foreground font-black pointer-events-none">R</span>
        </div>
        {/* Rotation controls */}
        <div className="flex flex-col gap-2">
          <button onClick={() => setRotateCmd(1)}
            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black transition-all active:scale-90 ${
              rotate > 0 ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'bg-muted border-border text-muted-foreground hover:border-cyan-400/40'
            }`}>
            ↻
          </button>
          <button onClick={() => setRotateCmd(0)}
            className="w-10 h-10 rounded-xl border-2 bg-muted border-border text-muted-foreground text-[9px] font-black hover:border-red-400/40 transition-all active:scale-90">
            ■
          </button>
          <button onClick={() => setRotateCmd(-1)}
            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black transition-all active:scale-90 ${
              rotate < 0 ? 'bg-cyan-400/20 border-cyan-400 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.4)]' : 'bg-muted border-border text-muted-foreground hover:border-cyan-400/40'
            }`}>
            ↺
          </button>
        </div>
      </div>
      <span className={`text-[8px] font-bold px-2.5 py-0.5 rounded-full text-center ${
        active ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 animate-pulse' : 'bg-muted text-muted-foreground'
      }`}>
        {active || 'IDLE'}{rotate !== 0 ? (rotate > 0 ? ' + ↻CW' : ' + ↺CCW') : ''}
      </span>
    </div>
  );
}

// ─── Dual Motor Speed Widget ──────────────────────────────────────────────────
function RobotSpeedWidget({ widget, publish }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  const send = (l, r) => publish(widget.topic, `L${l},R${r}`);

  const presets = [
    { label: '↑', l: 150, r: 150 },
    { label: '↓', l: -150, r: -150 },
    { label: '↰', l: 80, r: 200 },
    { label: '↱', l: 200, r: 80 },
    { label: '⬛', l: 0, r: 0 },
  ];

  return (
    <div className="flex flex-col h-full gap-2 text-left">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-emerald-400">
          <Gauge size={16} />
          <span className="text-sm font-black tracking-wide truncate">{widget.name}</span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground dark:text-white/30 bg-muted px-2 py-0.5 rounded border border-border truncate max-w-[50%]">
          {widget.topic}
        </span>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-2.5 px-1">
        {/* Left motor */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-emerald-400 font-bold">◀ المحرك الأيسر</label>
            <span className="text-[10px] font-mono text-emerald-400">{left}</span>
          </div>
          <input type="range" min="-255" max="255" value={left}
            onChange={e => { const v = Number(e.target.value); setLeft(v); send(v, right); }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#34d399' }}/>
        </div>
        {/* Right motor */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-[10px] text-cyan-400 font-bold">المحرك الأيمن ▶</label>
            <span className="text-[10px] font-mono text-cyan-400">{right}</span>
          </div>
          <input type="range" min="-255" max="255" value={right}
            onChange={e => { const v = Number(e.target.value); setRight(v); send(left, v); }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#22d3ee' }}/>
        </div>
        {/* Quick presets */}
        <div className="flex gap-1.5">
          {presets.map(p => (
            <button key={p.label}
              onClick={() => { setLeft(p.l); setRight(p.r); send(p.l, p.r); }}
              className="flex-1 py-1.5 rounded-lg text-xs font-black bg-muted border border-border text-muted-foreground hover:border-emerald-400/40 hover:text-emerald-400 transition-all active:scale-95">
              {p.label}
            </button>
          ))}
        </div>
        <div className="text-[9px] text-center text-muted-foreground font-mono bg-muted rounded-lg py-1 border border-border">
          L{left} / R{right}
        </div>
      </div>
    </div>
  );
}

// ─── Widget Card Shell ────────────────────────────────────────────────────────
function WidgetCard({ widget, value, publish, onRemove, onEdit, gaugeHistory }) {
  const renderContent = () => {
    switch (widget.type) {
      // Original widgets
      case 'gauge':    return <GaugeWidget    widget={widget} value={value}  history={gaugeHistory} />;
      case 'switch':   return <SwitchWidget   widget={widget} value={value}  publish={publish} />;
      case 'slider':   return <SliderWidget   widget={widget}                publish={publish} />;
      case 'dpad':     return <DPadWidget     widget={widget}                publish={publish} />;
      case 'joystick': return <JoystickWidget widget={widget}                publish={publish} />;
      case 'speed':    return <SliderWidget   widget={widget}                publish={publish} />;

      // ── Digital Outputs (ON/OFF) ──
      case 'relay':
      case 'mosfet':
      case 'solenoid':
      case 'optocoupler':
      case 'solenoid_valve':
      case 'elec_lock':
      case 'latch':
        return <RelayWidget widget={widget} value={value} publish={publish} />;

      // ── Analog/PWM Outputs (slider 0-100%) ──
      case 'dimmer':
      case 'dcmotor_speed':
      case 'fan_speed':
      case 'dac':
      case 'bldc':
      case 'linear_actuator':
      case 'single_led':
      case 'fluid_pump':
        return <DimmerWidget widget={widget} publish={publish} />;

      // ── RGB/Addressable LEDs ──
      case 'rgb':
      case 'neopixel':
        return <RGBWidget widget={widget} publish={publish} />;

      // ── Motors ──
      case 'servo':           return <ServoWidget   widget={widget}               publish={publish} />;
      case 'dcmotor':         return <DCMotorWidget widget={widget}               publish={publish} />;
      case 'stepper':         return <StepperWidget widget={widget}               publish={publish} />;
      case 'pwmfan':          return <PWMFanWidget  widget={widget} value={value} publish={publish} />;
      case 'curtain':         return <CurtainWidget widget={widget}               publish={publish} />;

      // ── Scene / Scheduler ──
      case 'scene':           return <SceneWidget     widget={widget} publish={publish} />;
      case 'scheduler':       return <SchedulerWidget widget={widget} publish={publish} />;

      // ── Security ──
      case 'doorlock':        return <DoorLockWidget widget={widget} value={value} publish={publish} />;
      case 'buzzer':
      case 'speaker':
        return <BuzzerWidget widget={widget} publish={publish} />;
      case 'pantilt':         return <PanTiltWidget  widget={widget}               publish={publish} />;

      // ── Agriculture ──
      case 'pump':            return <PumpWidget       widget={widget} value={value} publish={publish} />;
      case 'valve':           return <ValveWidget      widget={widget} value={value} publish={publish} />;
      case 'irrigation':      return <IrrigationWidget widget={widget} value={value} publish={publish} />;

      // ── Displays ──
      case 'oled':
      case 'seven_segment':
      case 'led_matrix':
        return <OLEDWidget widget={widget} publish={publish} />;

      // ── Advanced Tools ──
      case 'numericInput':    return <NumericInputWidget widget={widget} publish={publish} />;
      case 'dropdown':        return <DropdownWidget     widget={widget} publish={publish} />;
      case 'momentary':
      case 'ir_sender':
      case 'rf_sender':
        return <MomentaryWidget widget={widget} publish={publish} />;

      // ── Communications ──
      case 'bus_controller':  return <OLEDWidget widget={widget} publish={publish} />;

      // ── Robotics ──
      case 'robot_arm':   return <RobotArmWidget   widget={widget} publish={publish} />;
      case 'gripper':     return <GripperWidget     widget={widget} publish={publish} />;
      case 'omni_drive':  return <OmniDriveWidget   widget={widget} publish={publish} />;
      case 'robot_speed': return <RobotSpeedWidget  widget={widget} publish={publish} />;

      default: return null;
    }
  };

  return (
    <div className="h-full bg-card/[0.01] dark:bg-[#07080b]/75 border border-border rounded-2xl backdrop-blur-md hover:bg-card/[0.025] hover:border-slate-300 dark:hover:border-border transition-all duration-300 group flex flex-col relative overflow-hidden shadow-lg shadow-black/10 hover:shadow-[0_8px_30px_rgba(139,92,246,0.015)] p-3">
      {/* Header row with Drag Handle (Left) and Action Buttons (Right) */}
      <div className="flex justify-between items-center mb-1 flex-shrink-0" dir="ltr">
        {/* Left side: Drag Handle */}
        <div
          className="drag-handle cursor-grab active:cursor-grabbing p-1 rounded-md border border-border bg-muted/40 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center"
          title="اسحب من هنا لتحريك الأداة"
        >
          <Move size={12} />
        </div>

        {/* Right side: Action Buttons */}
        <div className="flex gap-0.5">
          <button
            onClick={() => onEdit(widget)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-cyan-400 transition-all text-muted-foreground dark:text-white/30 p-1"
            title="Edit Tool"
          >
            <SlidersHorizontal size={12} />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-red-400 transition-all text-muted-foreground dark:text-white/30 p-1"
            title="Remove Tool"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Widget content (not draggable) */}
      <div className="no-drag flex-1 min-h-0 overflow-hidden">
        {renderContent()}
      </div>
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
            draggableCancel=".no-drag"
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
