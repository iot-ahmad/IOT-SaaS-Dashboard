import { useState, useEffect, useCallback, useRef } from 'react';
import { Responsive as ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Plus, X, Check, Thermometer, ToggleLeft, SlidersHorizontal,
  Gamepad2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Trash2, Activity, Zap, Car, GripVertical, Move, Loader2, Radio,
  Lightbulb, Palette, Calendar, FlaskConical, Wind, Blinds,
  Lock, Bell, Camera, Droplets, Sprout, Monitor, Globe,
  Minus, RotateCcw, RotateCw, AlignJustify, Hash, ChevronRight as ChevronRightIcon,
  Power, Cpu, Gauge, GraduationCap, Shield, Leaf, Wrench, Play, Grid, Send, Terminal,
  Bot, Hand, Navigation, Crosshair, LocateFixed
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, AreaChart, Area } from 'recharts';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const COLS_BY_BP = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const DRAG_CONFIG = {
  enabled: true,
  handle: '.drag-handle',
  cancel: '.no-drag',
};

const RESIZE_CONFIG = {
  enabled: true,
};

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
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'gauge', label: 'Gauge / Chart', desc: 'Display a numeric sensor value with a live bar', icon: Thermometer, w: 3, h: 3 },
    ],
  },
  {
    id: 'actuators',
    label: 'Actuators',
    icon: Zap,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'switch', label: 'LED Switch', desc: 'Toggle an LED or relay ON / OFF', icon: ToggleLeft, w: 2, h: 2 },
      { type: 'slider', label: 'Servo Slider', desc: 'Send a 0–180° value to a servo motor', icon: SlidersHorizontal, w: 3, h: 2 },
    ],
  },
  {
    id: 'robotics',
    label: 'Robotics & Motion Control',
    icon: Gamepad2,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'dpad', label: 'Direction Controller (D-Pad)', desc: 'D-Pad: FORWARD, BACK, LEFT, RIGHT, STOP on one topic', icon: Gamepad2, w: 3, h: 4 },
      { type: 'joystick', label: 'Joystick', desc: 'Analog-style stick: same movement commands on one MQTT topic', icon: Move, w: 4, h: 4 },
      { type: 'speed', label: 'Speed Slider', desc: 'Send speed value (0–255) to your speed topic', icon: Car, w: 3, h: 2 },
      { type: 'robot_arm',   label: 'Robot Arm (3 Joints)', desc: 'Control a 3-axis robotic arm with independent servo joints', icon: Bot,       w: 4, h: 4 },
      { type: 'gripper',     label: 'Gripper / Claw',       desc: 'Control robot gripper (open, close, and grip force)', icon: Hand,      w: 3, h: 3 },
      { type: 'omni_drive',  label: 'Omni/Mecanum Drive',   desc: 'Full omnidirectional wheel control: strafe, forward/back, and rotation', icon: Navigation, w: 4, h: 4 },
      { type: 'robot_speed', label: 'Dual Motor Speed',     desc: 'Independent left and right motor speed control for differential steering', icon: Gauge,    w: 3, h: 3 },
    ],
  },
  {
    id: 'classroom',
    label: 'Classroom & Environment',
    icon: GraduationCap,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'relay',     label: 'Relay — ON/OFF Switch',       desc: 'Control lighting, projectors, or fans via a relay module',          icon: Power,          w: 2, h: 2 },
      { type: 'dimmer',    label: 'Dimmer PWM — Light Dimmer',   desc: 'Smoothly dim lighting levels from 0% to 100%',                      icon: Lightbulb,      w: 3, h: 2 },
      { type: 'rgb',       label: 'RGB Strip — Color Controller', desc: 'Control RGB/RGBW LED strip colors and brightness',                 icon: Palette,        w: 3, h: 3 },
      { type: 'scene',     label: 'Scenes — Preset Modes',       desc: 'Activate Exam, Lecture, or Break presets with one click',            icon: Cpu,            w: 3, h: 3 },
      { type: 'scheduler', label: 'Scheduler — Time Schedule',   desc: 'Automate ON/OFF schedules for bells, lighting, or irrigation',      icon: Calendar,       w: 3, h: 3 },
    ],
  },
  {
    id: 'stem',
    label: 'STEM Lab',
    icon: FlaskConical,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'servo',   label: 'Servo Motor — Angle',        desc: 'Control servo angle (0–180°) for robotics experiments',             icon: Wrench,          w: 3, h: 2 },
      { type: 'dcmotor', label: 'DC Motor — Speed & Dir',     desc: 'Control DC motor speed and direction for physics labs',             icon: RotateCw,        w: 3, h: 3 },
      { type: 'stepper', label: 'Stepper — Precision Steps',  desc: 'Precise step count and RPM control for CNC and 3D printing',        icon: Gauge,           w: 3, h: 2 },
      { type: 'pwmfan',  label: 'PWM Fan — Smart Cooling',    desc: 'PWM fan speed control linked with live temperature reading',        icon: Wind,            w: 3, h: 3 },
      { type: 'curtain', label: 'Smart Curtain — Motorized',  desc: 'Control motorized curtain or blind open percentage',                icon: Blinds,          w: 3, h: 2 },
    ],
  },
  {
    id: 'security',
    label: 'Security & Safety',
    icon: Shield,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'doorlock', label: 'Door Lock — Smart Lock',     desc: 'Control an electronic door lock with an auto-lock timer',           icon: Lock,   w: 2, h: 2 },
      { type: 'buzzer',   label: 'Buzzer / Siren — Alarm',     desc: 'Instant safety alert — momentary button sending a beep pulse',      icon: Bell,   w: 2, h: 2 },
      { type: 'pantilt',  label: 'Pan-Tilt Camera — 2-Axis',   desc: 'Dual-axis pan and tilt control for camera mounts',                  icon: Camera, w: 3, h: 3 },
    ],
  },
  {
    id: 'agriculture',
    label: 'Smart Agriculture',
    icon: Leaf,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'pump',       label: 'Water Pump — Pump Control',   desc: 'Turn water pump ON/OFF manually or with runtime tracking',          icon: Droplets, w: 2, h: 2 },
      { type: 'valve',      label: 'Electric Valve — Flow Valve', desc: 'Open or close an electric solenoid water valve',                    icon: Wrench,   w: 2, h: 2 },
      { type: 'irrigation', label: 'Smart Irrigation — Auto/Man', desc: 'Automated irrigation based on soil moisture threshold',             icon: Sprout,   w: 4, h: 3 },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced Tools',
    icon: Monitor,
    color: 'bg-muted/30 border-border',
    accent: 'text-muted-foreground',
    items: [
      { type: 'oled',         label: 'OLED/LCD Display — Screen',    desc: 'Send text strings directly to an OLED or LCD screen',               icon: Monitor,       w: 3, h: 2 },
      { type: 'numericInput', label: 'Numeric Input — Setpoint',     desc: 'Send a numeric setpoint value with min, max, and step',             icon: Hash,          w: 2, h: 2 },
      { type: 'dropdown',     label: 'Dropdown — Mode Selector',     desc: 'Select operating mode such as Auto, Manual, or Test',               icon: AlignJustify,  w: 3, h: 2 },
      { type: 'momentary',    label: 'Momentary Button — Pulse',     desc: 'Send a custom payload once whenever the button is pressed',         icon: Zap,           w: 2, h: 2 },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
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

  const filteredCategories = CATEGORIES
    .filter(cat => activeCat === 'all' || cat.id === activeCat)
    .map(cat => ({
      ...cat,
      items: cat.items.filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.type.toLowerCase().includes(q);
      }),
    }))
    .filter(cat => cat.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="hw-panel relative bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h2 className="font-bold text-base text-foreground">Add Hardware Instrument</h2>
            {step === 'config' ? (
              <button onClick={() => setStep('category')} className="text-xs text-primary hover:underline mt-0.5 transition-colors cursor-pointer">
                ← Back to hardware catalog
              </button>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Select a sensor, actuator, display, or robotics instrument</p>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Search + Category Pills */}
        {step === 'category' && (
          <div className="px-6 pt-4 pb-3 border-b border-border bg-muted/15 space-y-2.5 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search instruments (e.g. Gauge, Relay, Servo, OLED, Stepper...)"
              className="w-full bg-input border border-border rounded-xl py-2 px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setActiveCat('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                  activeCat === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCat(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    activeCat === cat.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {cat.label.split('&')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {step === 'category' ? (
            <div className="space-y-5">
              {filteredCategories.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">No matching instruments found.</p>
              ) : filteredCategories.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2.5 text-muted-foreground">
                      <CatIcon size={13} className="text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{cat.label}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {cat.items.map(item => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.type}
                            onClick={() => handleSelectItem(item)}
                            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/25 hover:bg-muted/60 hover:border-primary/35 transition-all text-left cursor-pointer group"
                          >
                            <ItemIcon size={17} className="text-primary shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{item.label}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{item.desc}</p>
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
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Front Temperature"
                />
              </div>

              {/* ── Data Key (required) ───────────────────────────────── */}
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
                  <span>Data Key</span>
                  <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-border">Required</span>
                </label>
                <input
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  value={form.dataKey}
                  onChange={e => setForm(f => ({ ...f, dataKey: e.target.value.replace(/\s/g, '_') }))}
                  placeholder="e.g. temperature_1"
                />
                {/* Live Firebase path preview */}
                <div className="mt-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Firebase path:</p>
                  <code className="text-[11px] font-mono text-muted-foreground break-all">
                    users/{userUID ? userUID.slice(0, 8) + '…' : '[UID]'}/widgets/<span className="text-foreground font-semibold">{form.dataKey || '[data_key]'}</span>
                  </code>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
                  Use this key in your Arduino/ESP32 firmware to bind your device to this widget.
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">MQTT Topic</label>
                <input
                  className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="e.g. car/move"
                />
              </div>
              {selectedItem.type === 'gauge' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Unit</label>
                    <input className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="°C" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Max Value</label>
                    <input type="number" className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                      value={form.maxVal} onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))} />
                  </div>
                </div>
              )}
              {selectedItem.type === 'numericInput' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs text-muted-foreground block mb-1">Min</label>
                      <input type="number" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" value={form.minVal} onChange={e => setForm(f => ({ ...f, minVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Max</label>
                      <input type="number" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" value={form.maxVal} onChange={e => setForm(f => ({ ...f, maxVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Step</label>
                      <input type="number" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" value={form.step} onChange={e => setForm(f => ({ ...f, step: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-muted-foreground block mb-1">Default Value</label>
                      <input type="number" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" value={form.defaultVal} onChange={e => setForm(f => ({ ...f, defaultVal: e.target.value }))} /></div>
                    <div><label className="text-xs text-muted-foreground block mb-1">Unit</label>
                      <input className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary/50" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="°C" /></div>
                  </div>
                </div>
              )}
              {selectedItem.type === 'dropdown' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Options (comma separated)</label>
                  <input className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                    value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))} placeholder="Auto,Manual,Test,Off" />
                  <p className="text-[10px] text-muted-foreground mt-1">Enter options separated by commas</p>
                </div>
              )}
              {selectedItem.type === 'momentary' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Payload on Press</label>
                  <input className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                    value={form.payload} onChange={e => setForm(f => ({ ...f, payload: e.target.value }))} placeholder="TRIGGER" />
                </div>
              )}
              {selectedItem.type === 'scheduler' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">ON Time</label>
                    <input type="time" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 font-mono text-foreground" value={form.onTime} onChange={e => setForm(f => ({ ...f, onTime: e.target.value }))} /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">OFF Time</label>
                    <input type="time" className="w-full bg-input border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary/50 font-mono text-foreground" value={form.offTime} onChange={e => setForm(f => ({ ...f, offTime: e.target.value }))} /></div>
                </div>
              )}
              {selectedItem.type === 'oled' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Max Characters</label>
                  <input type="number" className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    value={form.maxChars} onChange={e => setForm(f => ({ ...f, maxChars: e.target.value }))} min={8} max={128} />
                </div>
              )}
              {selectedItem.type === 'irrigation' && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Auto-Irrigation Threshold (Moisture %)</label>
                  <input type="number" className="w-full bg-input border border-border rounded-xl py-2.5 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50"
                    value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} min={10} max={80} />
                </div>
              )}
              <button
                onClick={handleAdd}
                disabled={!form.dataKey.trim()}
                className="w-full bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-sm hover:bg-primary/90 active:scale-[0.99] mt-2 cursor-pointer"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Sibling backdrop overlay to avoid nesting backdrop-filter with overflow-y-scroll child */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl animate-fadeIn max-h-[90vh] flex flex-col overflow-hidden">
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
            <label className="text-xs font-semibold text-foreground block mb-1 flex items-center gap-1">
              <span>Data Key</span>
              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-border">Required</span>
            </label>
            <input
              className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-border transition-colors"
              value={form.dataKey}
              onChange={e => setForm(f => ({ ...f, dataKey: e.target.value.replace(/\s/g, '_') }))}
              placeholder="e.g. temperature_1"
            />
            {/* Live Firebase path preview */}
            <div className="mt-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Firebase path:</p>
              <code className="text-[11px] font-mono text-muted-foreground break-all">
                users/{userUID ? userUID.slice(0, 8) + '…' : '[UID]'}/widgets/<span className="text-foreground font-semibold">{form.dataKey || '[data_key]'}</span>
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
            className="w-full bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-sm hover:bg-primary/90 active:scale-[0.99] mt-2 cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared 16-Segment Hardware LED Bar Meter ─────────────────────────────────
function LedBarGraph({ pct }) {
  const clamped = Math.min(100, Math.max(0, pct || 0));
  const activeCount = Math.round((clamped / 100) * 16);
  return (
    <div className="hw-well p-1 rounded-md grid grid-cols-16 gap-0.5 w-full">
      {Array.from({ length: 16 }).map((_, idx) => {
        const lit = idx < activeCount;
        let bgClass = 'bg-card/80 border-border/50';
        if (lit) {
          if (idx >= 14) bgClass = 'bg-red-500 border-red-400 shadow-[0_0_6px_rgba(239,68,68,0.55)]';
          else if (idx >= 12) bgClass = 'bg-amber-400 border-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.45)]';
          else bgClass = 'bg-primary border-primary/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]';
        }
        return (
          <div
            key={idx}
            className={`h-2 rounded-[2px] border transition-colors duration-150 ${bgClass}`}
          />
        );
      })}
    </div>
  );
}

// ─── Gauge Widget (240° Calibrated Analog + Digital Telemetry Meter) ─────────
function GaugeWidget({ widget, value, history = [] }) {
  const num = value !== undefined ? parseFloat(value) : NaN;
  const hasData = Number.isFinite(num);
  const maxVal = Number(widget.maxVal) || 100;
  const pct = hasData
    ? Math.min(100, Math.max(0, (num / maxVal) * 100))
    : 0;
  const ringColor = pct > 85 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#a3e635';
  const chartData = history.map((y, i) => ({ i, v: y }));

  const cx = 80;
  const cy = 72;
  const arcLen = 217.817; // 2 * PI * 52 * (240 / 360)
  const needleDeg = -120 + (pct / 100) * 240;
  const midVal = Math.round(maxVal / 2);

  return (
    <div className="flex flex-col h-full justify-center items-center gap-1.5 min-h-0 text-left">
      {hasData ? (
        <>
          {/* 240° Recessed Instrument Dial + Rotating Needle */}
          <div className="hw-well rounded-xl px-2.5 pt-2 pb-1.5 w-full flex flex-col items-center justify-center shrink-0">
            <div className="relative w-40 h-[102px] flex items-center justify-center">
              <svg viewBox="0 0 160 112" className="w-full h-full overflow-visible">
                {/* 25 graduated scale ticks (-120° to +120°) */}
                {Array.from({ length: 25 }).map((_, i) => {
                  const deg = -120 + i * 10;
                  const rad = (deg * Math.PI) / 180;
                  const isMajor = i % 3 === 0;
                  const r1 = isMajor ? 57 : 60;
                  const r2 = 64;
                  return (
                    <line
                      key={i}
                      x1={cx + r1 * Math.sin(rad)}
                      y1={cy - r1 * Math.cos(rad)}
                      x2={cx + r2 * Math.sin(rad)}
                      y2={cy - r2 * Math.cos(rad)}
                      stroke={isMajor ? 'rgba(240,240,232,0.5)' : 'rgba(240,240,232,0.18)'}
                      strokeWidth={isMajor ? 1.5 : 0.9}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Recessed track arc */}
                <path
                  d="M 34.97 98 A 52 52 0 1 1 125.03 98"
                  fill="none"
                  stroke="rgba(240,240,232,0.1)"
                  strokeWidth="7"
                  strokeLinecap="round"
                />

                {/* Active luminous value arc */}
                <path
                  d="M 34.97 98 A 52 52 0 1 1 125.03 98"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={arcLen}
                  strokeDashoffset={arcLen - (arcLen * pct) / 100}
                  style={{ transition: 'stroke-dashoffset 0.55s ease-out, stroke 0.3s ease' }}
                />

                {/* Scale Min / Mid / Max Micro-Labels */}
                <text x="26" y="109" textAnchor="middle" fontSize="8" fill="#a3e635" fontFamily="var(--font-mono)">0</text>
                <text x="80" y="12" textAnchor="middle" fontSize="7.5" fill="rgba(240,240,232,0.55)" fontFamily="var(--font-mono)">{midVal}</text>
                <text x="134" y="109" textAnchor="middle" fontSize="8" fill="#a3e635" fontFamily="var(--font-mono)">{maxVal}</text>

                {/* Rotating Calibrated Needle */}
                <g transform={`rotate(${needleDeg} 80 72)`} style={{ transition: 'transform 0.55s ease-out' }}>
                  <polygon points="78.2,72 80,26 81.8,72 81,82 79,82" fill={ringColor} />
                </g>
                <circle cx="80" cy="72" r="6" fill="#1a1b18" stroke="#8b8d83" strokeWidth="1.5" />
                <circle cx="80" cy="72" r="2.2" fill={ringColor} />
              </svg>
            </div>

            {/* Digital LCD Telemetry Pill */}
            <div className="hw-lcd rounded-lg px-3 py-1 flex items-baseline justify-center gap-1.5 w-full max-w-[155px]">
              <span className="text-xl font-black font-mono tabular-nums tracking-tight text-primary leading-none">
                {num.toFixed(1)}
              </span>
              {widget.unit && (
                <span className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                  {widget.unit}
                </span>
              )}
            </div>
          </div>

          {/* Oscilloscope Gridded Sparkline */}
          {chartData.length > 1 && (
            <div
              className="hw-well rounded-lg h-11 flex-1 min-h-[28px] w-full overflow-hidden px-1 pt-1"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(240,240,232,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(240,240,232,0.04) 1px, transparent 1px)',
                backgroundSize: '14px 10px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad_${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ringColor} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={ringColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} hide width={0} />
                  <Area type="monotone" dataKey="v" stroke={ringColor} strokeWidth={1.75} fill={`url(#grad_${widget.id})`} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="hw-lcd rounded-xl px-4 py-3.5 w-full flex flex-col items-center justify-center gap-1.5 my-auto">
          <Radio className="text-primary" size={18} />
          <span className="text-lg font-mono font-bold tracking-widest text-primary/40">---.-</span>
          <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">No Signal · Standby</span>
        </div>
      )}
    </div>
  );
}

// ─── Switch Widget (3D Illuminated Industrial Rocker Switch) ───────────────────
function SwitchWidget({ widget, value, publish }) {
  const isOn = value === '1' || value === 'ON' || value === 'true';
  const toggle = () => publish(widget.topic, isOn ? 'OFF' : 'ON');

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2.5 text-left">
      <button
        type="button"
        onClick={toggle}
        title={isOn ? 'Click to turn OFF' : 'Click to turn ON'}
        className="hw-well w-28 h-16 rounded-xl p-2 cursor-pointer transition-all active:scale-[0.98]"
      >
        <div
          className={`w-full h-full rounded-lg border flex flex-col items-center justify-between py-1.5 px-2.5 transition-all duration-200 ${
            isOn
              ? 'bg-gradient-to-b from-primary/30 via-primary/15 to-card border-primary/50 shadow-[inset_0_2px_4px_rgba(163,230,53,0.25),0_2px_6px_rgba(0,0,0,0.6)]'
              : 'bg-gradient-to-b from-secondary via-muted to-background border-border shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_2px_6px_rgba(0,0,0,0.6)]'
          }`}
        >
          <span className={`text-[9px] font-mono font-black leading-none ${isOn ? 'text-primary' : 'text-muted-foreground/45'}`}>I</span>
          <div className="w-10 flex flex-col gap-0.5 items-center">
            <div className={`w-full h-0.5 rounded-full ${isOn ? 'bg-primary shadow-[0_0_6px_rgba(163,230,53,0.75)]' : 'bg-muted-foreground/30'}`} />
            <div className="w-8 h-[1px] bg-white/[0.08]" />
          </div>
          <span className={`text-[9px] font-mono font-black leading-none ${!isOn ? 'text-foreground/75' : 'text-muted-foreground/35'}`}>O</span>
        </div>
      </button>

      <span className={`hw-lcd inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-0.5 rounded-md ${
        isOn
          ? 'text-primary border-primary/40'
          : 'text-muted-foreground'
      }`}>
        {isOn ? 'ENERGIZED' : 'STANDBY'}
      </span>
    </div>
  );
}

// ─── Slider Widget (Machined Console Fader & VU Meter) ────────────────────────
function SliderWidget({ widget, publish }) {
  const max = widget.type === 'speed' ? 255 : 180;
  const [val, setVal] = useState(0);

  const updateVal = (v) => {
    setVal(v);
    publish(widget.topic, String(v));
  };

  const label = widget.type === 'speed' ? 'SPEED' : 'ANGLE';
  const pct = (val / max) * 100;
  const presets = widget.type === 'speed' ? [0, 64, 128, 192, 255] : [0, 45, 90, 135, 180];

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-lcd rounded-xl px-3 py-1.5 flex justify-between items-baseline">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono tabular-nums tracking-tight text-primary leading-none">
            {val}
            {widget.type !== 'speed' && <span className="text-sm text-primary/80 ml-0.5">°</span>}
          </span>
          <span className="text-[10px] font-mono text-primary/70 tabular-nums">{Math.round(pct)}%</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
          {label} / <span className="text-primary">{max}</span>
        </span>
      </div>

      <LedBarGraph pct={pct} />

      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={max}
          value={val}
          onChange={e => updateVal(Number(e.target.value))}
          className="w-full hw-slider"
        />
        <div className="flex justify-between px-1 pointer-events-none">
          {Array.from({ length: 9 }).map((_, idx) => (
            <span key={idx} className={`w-px ${idx % 2 === 0 ? 'h-1.5 bg-foreground/30' : 'h-1 bg-foreground/15'}`} />
          ))}
        </div>
      </div>

      <div className="flex gap-1">
        {presets.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => updateVal(p)}
            className={`hw-keycap flex-1 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
              val === p
                ? 'hw-keycap-active'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CLASSROOM & INDUSTRIAL OUTPUT WIDGETS ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Relay Widget (DIN-Rail Coil + SPDT Contact Schematic) ────────────────────
function RelayWidget({ widget, value, publish }) {
  const isOn = value === '1' || value === 'ON' || value === 'true';
  const toggle = () => publish(widget.topic, isOn ? 'OFF' : 'ON');

  const config = {
    relay:          { label: 'Relay' },
    mosfet:         { label: 'MOSFET' },
    solenoid:       { label: 'Solenoid' },
    optocoupler:    { label: 'Optocoupler' },
    solenoid_valve: { label: 'Valve' },
    latch:          { label: 'Latch' },
    elec_lock:      { label: 'Lock' },
  }[widget.type] || { label: 'Relay' };

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2.5 text-left">
      {/* DIN-Rail Electromagnetic Coil + SPDT Contact Schematic */}
      <button
        type="button"
        onClick={toggle}
        className="hw-well w-full max-w-[190px] h-16 rounded-xl hover:border-primary/40 px-2 py-1 flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
        title={isOn ? 'Click to open NO contact' : 'Click to energize coil & close NO'}
      >
        <svg viewBox="0 0 180 56" className="w-full h-full">
          {/* Coil A1-A2 */}
          <line x1="8" y1="28" x2="20" y2="28" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.5" />
          <rect x="20" y="16" width="24" height="24" rx="2" fill="rgba(240,240,232,0.05)" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.5" />
          <line x1="20" y1="36" x2="44" y2="20" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.5" />
          <text x="12" y="13" fontSize="7" fontFamily="var(--font-mono)" fill="#b5b6ad">A1</text>
          <text x="12" y="50" fontSize="7" fontFamily="var(--font-mono)" fill="#b5b6ad">A2</text>

          {/* Magnetic Coupling Line */}
          <line x1="46" y1="28" x2="72" y2="28" stroke={isOn ? '#a3e635' : 'rgba(240,240,232,0.2)'} strokeWidth="1" strokeDasharray="3 2" />

          {/* COM Common Lug */}
          <line x1="60" y1="28" x2="78" y2="28" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="78" cy="28" r="3.5" fill={isOn ? '#a3e635' : '#8b8d83'} />
          <text x="64" y="42" fontSize="7" fontFamily="var(--font-mono)" fill="#b5b6ad">COM</text>

          {/* NC Top Contact (closed when idle) */}
          <circle cx="136" cy="14" r="3.2" fill={!isOn ? '#f59e0b' : '#585a53'} />
          <line x1="136" y1="14" x2="170" y2="14" stroke={!isOn ? '#f59e0b' : '#585a53'} strokeWidth="1.8" strokeLinecap="round" />
          <text x="150" y="10" fontSize="7" fontFamily="var(--font-mono)" fill="#b5b6ad">NC</text>

          {/* NO Bottom Contact (closed when energized) */}
          <circle cx="136" cy="42" r="3.2" fill={isOn ? '#a3e635' : '#585a53'} />
          <line x1="136" y1="42" x2="170" y2="42" stroke={isOn ? '#a3e635' : '#585a53'} strokeWidth="1.8" strokeLinecap="round" />
          <text x="150" y="52" fontSize="7" fontFamily="var(--font-mono)" fill="#b5b6ad">NO</text>

          {/* SPDT Moving Armature Blade */}
          <line
            x1="78" y1="28"
            x2="136" y2={isOn ? 42 : 14}
            stroke={isOn ? '#a3e635' : '#f59e0b'}
            strokeWidth="2.8"
            strokeLinecap="round"
            style={{ transition: 'all 0.2s ease' }}
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={toggle}
        className={`hw-keycap px-3.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
          isOn ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {isOn ? `${config.label.toUpperCase()} CLOSED` : `${config.label.toUpperCase()} OPEN`}
      </button>
    </div>
  );
}

// ─── Dimmer Widget (LCD + Live PWM Square Wave + Console Fader) ──────────────
function DimmerWidget({ widget, publish }) {
  const [pct, setPct] = useState(0);
  const updatePct = (v) => {
    setPct(v);
    publish(widget.topic, String(v));
  };

  const config = {
    dimmer:          { icon: Lightbulb, label: 'Brightness' },
    dcmotor_speed:   { icon: RotateCw,  label: 'Motor Speed' },
    fan_speed:       { icon: Wind,      label: 'Fan Speed' },
    dac:             { icon: Activity,  label: 'DAC Output' },
    bldc:            { icon: Play,      label: 'BLDC Speed' },
    linear_actuator: { icon: Blinds,    label: 'Extension' },
    single_led:      { icon: Lightbulb, label: 'LED Dimmer' },
    fluid_pump:      { icon: Droplets,  label: 'Pump Speed' },
  }[widget.type] || { icon: Lightbulb, label: 'Level' };

  const IconComponent = config.icon;
  const hiW = (pct / 100) * 24;
  const pwmPath = pct <= 0
    ? 'M 2,14 L 58,14'
    : pct >= 100
      ? 'M 2,4 L 58,4'
      : `M 2,14 L 4,14 L 4,4 L ${(4 + hiW).toFixed(1)},4 L ${(4 + hiW).toFixed(1)},14 L 30,14 L 30,4 L ${(30 + hiW).toFixed(1)},4 L ${(30 + hiW).toFixed(1)},14 L 58,14`;

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-lcd rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent size={16} className="text-primary shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block truncate">{config.label}</span>
            <span className="text-xl font-black font-mono tabular-nums text-primary leading-none">{pct}%</span>
          </div>
        </div>
        {/* Live PWM Duty Waveform */}
        <svg viewBox="0 0 60 18" className="w-14 h-5 shrink-0">
          <line x1="2" y1="9" x2="58" y2="9" stroke="rgba(240,240,232,0.12)" strokeWidth="0.75" strokeDasharray="2 2" />
          <path d={pwmPath} fill="none" stroke="#a3e635" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>

      <LedBarGraph pct={pct} />

      <input type="range" min="0" max="100" value={pct} onChange={e => updatePct(Number(e.target.value))}
        className="w-full hw-slider" />

      <div className="flex gap-1">
        {[0, 25, 50, 75, 100].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => updatePct(v)}
            className={`hw-keycap flex-1 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
              pct === v
                ? 'hw-keycap-active'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v}%
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── RGB Strip Widget (8-SMD 5050 NeoPixel PCB Carrier) ────────────────────────
function RGBWidget({ widget, publish }) {
  const [color, setColor] = useState('#a3e635');
  const [brightness, setBrightness] = useState(100);

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3), 16) || 0;
    const g = parseInt(hex.slice(3,5), 16) || 0;
    const b = parseInt(hex.slice(5,7), 16) || 0;
    return { r, g, b };
  };

  const emit = (hexVal, brightVal) => {
    const { r, g, b } = hexToRgb(hexVal);
    const scale = brightVal / 100;
    publish(widget.topic, `${Math.round(r*scale)},${Math.round(g*scale)},${Math.round(b*scale)}`);
  };

  const handleColorChange = (e) => {
    const c = e.target.value;
    setColor(c);
    emit(c, brightness);
  };

  const handleBrightness = (e) => {
    const v = Number(e.target.value);
    setBrightness(v);
    emit(color, v);
  };

  const { r, g, b } = hexToRgb(color);
  const scale = brightness / 100;
  const presets = ['#a3e635','#38BDF8','#F59E0B','#EF4444','#A855F7','#EC4899','#06B6D4','#F8FAFC'];

  return (
    <div className="flex flex-col h-full justify-center gap-2 min-h-0 text-left">
      {/* Matte PCB Carrier with SMD 5050 LED Packages */}
      <div className="hw-well rounded-xl px-2 py-2 flex items-center justify-between gap-1">
        <div className="flex flex-col text-[6px] font-mono leading-tight text-muted-foreground/70 pr-1 border-r border-border shrink-0">
          <span>5V</span>
          <span>DI</span>
          <span>GND</span>
        </div>
        <div className="flex-1 flex items-center justify-between gap-1 pl-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-[3px] bg-card border border-border/90 flex items-center justify-center shrink-0"
            >
              <div
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  backgroundColor: color,
                  opacity: Math.max(0.18, scale),
                  boxShadow: brightness > 10 ? `0 0 ${Math.round(4 + 6 * scale)}px ${color}` : 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-border overflow-hidden flex-shrink-0 shadow-inner cursor-pointer"
          style={{ background: color }} title="Click to pick custom color">
          <input type="color" value={color} onChange={handleColorChange}
            className="w-full h-full opacity-0 cursor-pointer" />
        </div>
        <div className="hw-lcd flex-1 flex items-center justify-between text-[10px] font-mono tabular-nums rounded-lg px-2 py-1.5">
          <span className="text-red-400">R:{Math.round(r * scale)}</span>
          <span className="text-primary">G:{Math.round(g * scale)}</span>
          <span className="text-sky-400">B:{Math.round(b * scale)}</span>
          <span className="text-muted-foreground hidden sm:inline">{color.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {presets.map(c => (
          <button key={c} type="button" onClick={() => { setColor(c); emit(c, brightness); }}
            className={`w-5 h-5 rounded-md border transition-all cursor-pointer ${color === c ? 'border-foreground scale-110 ring-1 ring-primary' : 'border-border hover:scale-105'}`}
            style={{ background: c }} />
        ))}
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Intensity</span>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{brightness}%</span>
        </div>
        <input type="range" min="0" max="100" value={brightness} onChange={handleBrightness}
          className="w-full hw-slider" />
      </div>
    </div>
  );
}

// ─── Scene Widget (Tactile Hardware Mode Keys) ────────────────────────────────
function SceneWidget({ widget, publish }) {
  const [active, setActive] = useState(null);
  const scenes = widget.scenes || [
    { key: 'exam',    label: 'Exam Mode',    payload: 'EXAM' },
    { key: 'lecture', label: 'Lecture Mode', payload: 'LECTURE' },
    { key: 'break',   label: 'Break Mode',   payload: 'BREAK' },
  ];

  const handleScene = (scene) => {
    setActive(scene.key);
    publish(widget.topic, scene.payload);
  };

  return (
    <div className="flex flex-col h-full justify-center gap-2 text-left">
      {scenes.map((scene, idx) => {
        const isActive = active === scene.key;
        return (
          <button
            key={scene.key}
            type="button"
            onClick={() => handleScene(scene)}
            className={`hw-keycap w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
              isActive
                ? 'hw-keycap-active'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-primary/70 font-bold">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span>{scene.label}</span>
            </div>
            {isActive && <Check size={13} className="text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Scheduler Widget (Digital Timer Relay) ────────────────────────────────────
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
    <div className="flex flex-col h-full justify-center gap-2 text-left">
      <div className="hw-lcd rounded-xl px-2.5 py-1.5 flex items-center justify-between">
        <div>
          <span className={`text-[10px] font-mono font-bold uppercase block ${enabled ? 'text-primary' : 'text-muted-foreground'}`}>
            {enabled ? 'Schedule Active' : 'Schedule Paused'}
          </span>
          <span className="text-[10px] font-mono text-foreground/80 tabular-nums">
            {onTime} → {offTime}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEnabled(v => !v)}
          className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${enabled ? 'bg-primary' : 'bg-muted border border-border'}`}
        >
          <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-foreground/80'}`} />
        </button>
      </div>

      <div className="hw-well rounded-xl p-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-8 text-primary font-bold">ON</span>
          <input type="time" value={onTime} onChange={e => setOnTime(e.target.value)}
            className="flex-1 bg-input border border-border rounded-lg px-2.5 py-1 text-xs font-mono tabular-nums focus:outline-none focus:border-primary/50 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-8 text-red-400 font-bold">OFF</span>
          <input type="time" value={offTime} onChange={e => setOffTime(e.target.value)}
            className="flex-1 bg-input border border-border rounded-lg px-2.5 py-1 text-xs font-mono tabular-nums focus:outline-none focus:border-primary/50 text-primary" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── STEM LAB WIDGETS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Servo Widget (180° Calibrated Protractor Dial + Pulse Readout) ────────────
function ServoWidget({ widget, publish }) {
  const [angle, setAngle] = useState(90);
  const updateAngle = (v) => {
    setAngle(v);
    publish(widget.topic, String(v));
  };

  const rad = (angle - 90) * (Math.PI / 180);
  const armX = 80 + 44 * Math.sin(rad);
  const armY = 76 - 44 * Math.cos(rad);
  const semiArcLen = 169.65; // Math.PI * 54
  const pulseUs = Math.round(500 + (angle / 180) * 2000);

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-well rounded-xl p-2 flex items-center justify-between gap-2">
        <div className="relative w-36 h-[86px] shrink-0">
          <svg viewBox="0 0 160 98" className="w-full h-full">
            {/* 25 graduated protractor ticks every 7.5° */}
            {Array.from({ length: 25 }).map((_, i) => {
              const deg = i * 7.5 - 90;
              const tRad = (deg * Math.PI) / 180;
              const isMajor = i % 6 === 0;
              const r1 = isMajor ? 56 : i % 3 === 0 ? 59 : 61;
              const r2 = 64;
              return (
                <line
                  key={i}
                  x1={80 + r1 * Math.sin(tRad)} y1={76 - r1 * Math.cos(tRad)}
                  x2={80 + r2 * Math.sin(tRad)} y2={76 - r2 * Math.cos(tRad)}
                  stroke={isMajor ? 'rgba(240,240,232,0.5)' : 'rgba(240,240,232,0.18)'}
                  strokeWidth={isMajor ? 1.5 : 0.9}
                />
              );
            })}
            {/* Metal-gear servo body silhouette */}
            <rect x="64" y="74" width="32" height="18" rx="3" fill="rgba(240,240,232,0.06)" stroke="rgba(240,240,232,0.2)" strokeWidth="1" />
            <circle cx="68" cy="83" r="1.5" fill="rgba(240,240,232,0.35)" />
            <circle cx="92" cy="83" r="1.5" fill="rgba(240,240,232,0.35)" />

            <path d="M 26 76 A 54 54 0 0 1 134 76" fill="none" stroke="rgba(240,240,232,0.1)" strokeWidth="6" strokeLinecap="round" />
            <path
              d="M 26 76 A 54 54 0 0 1 134 76"
              fill="none"
              stroke="#a3e635"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={semiArcLen}
              strokeDashoffset={semiArcLen * (1 - angle / 180)}
              style={{ transition: 'stroke-dashoffset 0.15s ease' }}
            />
            {/* Machined Servo Horn */}
            <line x1="80" y1="76" x2={armX} y2={armY} stroke="#d5d8ca" strokeWidth="5.5" strokeLinecap="round" />
            <line x1="80" y1="76" x2={armX} y2={armY} stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
            <circle cx={armX} cy={armY} r="3.2" fill="#1a1b18" stroke="#a3e635" strokeWidth="1.5" />
            <circle cx="80" cy="76" r="7.5" fill="#1a1b18" stroke="#8b8d83" strokeWidth="1.75" />
            <circle cx="80" cy="76" r="2.5" fill="#a3e635" />
            <text x="15" y="86" fontSize="8" fontFamily="var(--font-mono)" fill="#a3e635">0°</text>
            <text x="80" y="10" textAnchor="middle" fontSize="8" fontFamily="var(--font-mono)" fill="#a3e635">90°</text>
            <text x="143" y="86" fontSize="8" fontFamily="var(--font-mono)" fill="#a3e635">180°</text>
          </svg>
        </div>
        <div className="hw-lcd rounded-lg px-2.5 py-2 text-right flex-1 min-w-0">
          <span className="text-xl font-black font-mono tabular-nums text-primary block leading-none">{angle}°</span>
          <span className="text-[10px] font-mono tabular-nums text-muted-foreground block mt-1">{pulseUs} µs</span>
          <span className="text-[8px] font-mono text-primary/70 uppercase tracking-wider block mt-0.5">PWM SERVO</span>
        </div>
      </div>

      <input type="range" min="0" max="180" value={angle} onChange={e => updateAngle(Number(e.target.value))}
        className="w-full hw-slider" />

      <div className="flex gap-1">
        {[0, 45, 90, 135, 180].map(a => (
          <button
            key={a}
            type="button"
            onClick={() => updateAngle(a)}
            className={`hw-keycap flex-1 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
              angle === a
                ? 'hw-keycap-active'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {a}°
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── DC Motor Widget (4-Pole Commutator Rotor + Direction Bridge) ─────────────
function DCMotorWidget({ widget, publish }) {
  const [speed, setSpeed] = useState(0);
  const [forward, setForward] = useState(true);

  const handleSpeed = (e) => {
    const v = Number(e.target.value);
    setSpeed(v);
    publish(widget.topic, `${forward ? 'F' : 'R'},${v}`);
  };

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Spinning 4-Pole Commutator Rotor */}
          <div className="hw-well w-11 h-11 rounded-full flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 40 40"
              className={`w-9 h-9 ${speed > 0 ? 'animate-spin' : ''}`}
              style={{
                animationDuration: speed > 0 ? `${Math.max(0.22, 1.25 - speed / 235)}s` : '1s',
                animationDirection: forward ? 'normal' : 'reverse',
              }}
            >
              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(240,240,232,0.16)" strokeWidth="1.5" />
              <line x1="20" y1="6" x2="20" y2="34" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" />
              <line x1="6" y1="20" x2="34" y2="20" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" />
              <circle cx="20" cy="20" r="5" fill="#1a1b18" stroke="#a3e635" strokeWidth="1.75" />
              <circle cx="20" cy="20" r="2" fill="#f0f0e8" />
            </svg>
          </div>
          <div className="hw-lcd rounded-lg px-2.5 py-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono tabular-nums text-primary leading-none">{speed}</span>
              <span className="text-[9px] font-mono text-primary/70 tabular-nums">{Math.round((speed / 255) * 100)}%</span>
            </div>
            <p className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5">PWM / <span className="text-primary">255</span></p>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={() => { setForward(true); publish(widget.topic, `F,${speed}`); }}
            className={`hw-keycap px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
              forward ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}>
            FWD
          </button>
          <button type="button" onClick={() => { setForward(false); publish(widget.topic, `R,${speed}`); }}
            className={`hw-keycap px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
              !forward ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}>
            REV
          </button>
        </div>
      </div>

      <input type="range" min="0" max="255" value={speed} onChange={handleSpeed}
        className="w-full hw-slider" />

      <button type="button" onClick={() => { setSpeed(0); publish(widget.topic, 'STOP'); }}
        className="hw-keycap w-full py-1.5 rounded-lg text-[10px] font-mono font-bold border-red-500/35 text-red-400 hover:bg-red-500/15 hover:border-red-400 cursor-pointer">
        EMERGENCY STOP
      </button>
    </div>
  );
}

// ─── Stepper Widget (Step Pulse Generator & Revolution LCD) ────────────────────
function StepperWidget({ widget, publish }) {
  const [steps, setSteps] = useState(200);
  const [speed, setSpeed] = useState(50);

  const sendCmd = (dir) => {
    publish(widget.topic, `${dir},${steps},${speed}`);
  };

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-lcd rounded-xl px-2.5 py-1 flex items-center justify-between text-[10px] font-mono">
        <span className="text-primary font-bold tabular-nums">{steps} STEPS</span>
        <span className="text-muted-foreground tabular-nums">{(steps / 200).toFixed(2)} REV</span>
        <span className="text-primary font-bold tabular-nums">{speed} RPM</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => setSteps(v => Math.max(1, v - 10))}
          className="hw-keycap w-9 h-8 rounded-lg text-primary font-mono font-bold text-xs cursor-pointer">-10</button>
        <input type="number" value={steps} onChange={e => setSteps(Number(e.target.value))}
          className="flex-1 bg-input border border-border rounded-lg py-1 text-center text-sm font-mono tabular-nums font-bold focus:outline-none focus:border-primary/50 text-primary" />
        <button type="button" onClick={() => setSteps(v => v + 10)}
          className="hw-keycap w-9 h-8 rounded-lg text-primary font-mono font-bold text-xs cursor-pointer">+10</button>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] font-mono text-muted-foreground uppercase">Pulse Rate</label>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{speed} RPM</span>
        </div>
        <input type="range" min="1" max="200" value={speed} onChange={e => setSpeed(Number(e.target.value))}
          className="w-full hw-slider" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => sendCmd('CCW')}
          className="hw-keycap flex-1 py-1.5 rounded-lg text-xs font-mono font-bold text-foreground cursor-pointer">
          ↺ CCW
        </button>
        <button type="button" onClick={() => sendCmd('CW')}
          className="hw-keycap hw-keycap-active flex-1 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer">
          ↻ CW
        </button>
      </div>
    </div>
  );
}

// ─── PWM Fan Widget (5-Blade Axial Fan Shroud) ───────────────────────────────
function PWMFanWidget({ widget, value, publish }) {
  const [fanSpeed, setFanSpeed] = useState(0);
  const temp = value !== undefined ? parseFloat(value) : null;

  const updateFan = (v) => {
    setFanSpeed(v);
    publish(widget.topic, String(v));
  };

  const tempColor = temp !== null ? (temp > 40 ? '#ef4444' : '#a3e635') : '#b5b6ad';
  const estRpm = Math.round((fanSpeed / 255) * 3200);

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* 5-Blade Axial Fan Shroud */}
          <div className="hw-well w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative">
            <svg
              viewBox="0 0 44 44"
              className={`w-9 h-9 ${fanSpeed > 0 ? 'animate-spin' : ''}`}
              style={{ animationDuration: fanSpeed > 0 ? `${Math.max(0.2, 1.5 - fanSpeed / 180)}s` : '2s' }}
            >
              {[0, 72, 144, 216, 288].map(deg => (
                <path
                  key={deg}
                  d="M22,22 C25,13 31,9 30,5 C26,4 20,9 22,22 Z"
                  fill="rgba(163,230,53,0.75)"
                  stroke="#a3e635"
                  strokeWidth="0.7"
                  transform={`rotate(${deg} 22 22)`}
                />
              ))}
              <circle cx="22" cy="22" r="5.5" fill="#1a1b18" stroke="#a3e635" strokeWidth="1.5" />
              <circle cx="22" cy="22" r="2" fill="#a3e635" />
            </svg>
          </div>
          <div className="hw-lcd rounded-lg px-2.5 py-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono tabular-nums text-primary leading-none">{fanSpeed}</span>
              <span className="text-[9px] font-mono text-primary/80 tabular-nums">{estRpm} RPM</span>
            </div>
            <p className="text-[8px] font-mono text-muted-foreground uppercase mt-0.5">PWM / <span className="text-primary">255</span></p>
          </div>
        </div>

        {temp !== null && (
          <div className="hw-lcd flex items-center gap-1.5 rounded-lg px-2 py-1 shrink-0">
            <Thermometer size={12} style={{ color: tempColor }} />
            <span className="text-xs font-black font-mono tabular-nums" style={{ color: tempColor }}>{temp.toFixed(1)}°C</span>
          </div>
        )}
      </div>

      <input type="range" min="0" max="255" value={fanSpeed} onChange={e => updateFan(Number(e.target.value))}
        className="w-full hw-slider" />

      <div className="flex gap-1">
        {[0, 64, 128, 192, 255].map(v => (
          <button key={v} type="button" onClick={() => updateFan(v)}
            className={`hw-keycap flex-1 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer ${
              fanSpeed === v ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}>{v === 0 ? 'OFF' : v === 255 ? 'MAX' : `${Math.round(v / 255 * 100)}%`}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Curtain Widget (Calibrated Track & Pleated Drape Actuator) ──────────────
function CurtainWidget({ widget, publish }) {
  const [openPct, setOpenPct] = useState(0);

  const goTo = (v) => { setOpenPct(v); publish(widget.topic, String(v)); };

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-well relative w-full h-12 rounded-xl overflow-hidden">
        <div className="absolute top-1.5 left-1.5 right-1.5 h-1 rounded-full bg-muted-foreground/30" />
        {/* Left pleated drape */}
        <div
          className="absolute top-0 left-0 h-full border-r border-primary/45 transition-all duration-300"
          style={{
            width: `${(100 - openPct) / 2}%`,
            background: 'repeating-linear-gradient(90deg, rgba(163,230,53,0.22) 0px, rgba(163,230,53,0.22) 4px, rgba(20,22,19,0.65) 4px, rgba(20,22,19,0.65) 8px)',
          }}
        />
        {/* Right pleated drape */}
        <div
          className="absolute top-0 right-0 h-full border-l border-primary/45 transition-all duration-300"
          style={{
            width: `${(100 - openPct) / 2}%`,
            background: 'repeating-linear-gradient(90deg, rgba(163,230,53,0.22) 0px, rgba(163,230,53,0.22) 4px, rgba(20,22,19,0.65) 4px, rgba(20,22,19,0.65) 8px)',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="hw-lcd text-[10px] font-mono font-bold tabular-nums px-2.5 py-0.5 rounded-md text-primary">
            {openPct}% OPEN
          </span>
        </div>
      </div>

      <input type="range" min="0" max="100" value={openPct} onChange={e => goTo(Number(e.target.value))}
        className="w-full hw-slider" />

      <div className="flex gap-1.5">
        <button type="button" onClick={() => goTo(0)} className={`hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${openPct === 0 ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'}`}>Closed</button>
        <button type="button" onClick={() => goTo(50)} className={`hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${openPct === 50 ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'}`}>Half</button>
        <button type="button" onClick={() => goTo(100)} className={`hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${openPct === 100 ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'}`}>Open</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SECURITY WIDGETS ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Door Lock Widget (Heavy Solenoid Deadbolt Assembly) ──────────────────────
function DoorLockWidget({ widget, value, publish }) {
  const isLocked = value !== 'OPEN' && value !== '0';
  const [countdown, setCountdown] = useState(null);
  const timerRef = useRef(null);

  const toggle = () => {
    if (!isLocked) {
      publish(widget.topic, 'OPEN');
    } else {
      publish(widget.topic, 'OPEN');
      clearInterval(timerRef.current);
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
    <div className="flex flex-col h-full items-center justify-center gap-2 text-left">
      <button
        type="button"
        onClick={toggle}
        className="hw-well w-32 h-14 rounded-xl hover:border-primary/40 p-1.5 flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
        title={isLocked ? 'Click to unlock (10s auto-lock)' : 'Locked / Open'}
      >
        <svg viewBox="0 0 124 48" className="w-full h-full">
          {/* Solenoid Deadbolt Housing */}
          <rect x="6" y="7" width="54" height="34" rx="4" fill="rgba(240,240,232,0.06)" stroke="rgba(240,240,232,0.28)" strokeWidth="1.5" />
          <circle cx="12" cy="13" r="1.5" fill="rgba(240,240,232,0.35)" />
          <circle cx="12" cy="35" r="1.5" fill="rgba(240,240,232,0.35)" />
          {/* Return spring coils */}
          <path d="M18,24 L22,19 L26,29 L30,19 L34,29 L38,24" fill="none" stroke="rgba(240,240,232,0.3)" strokeWidth="1.2" />
          {/* Hardened steel deadbolt */}
          <rect
            x={isLocked ? 56 : 36} y="16" width="38" height="16" rx="2"
            fill={isLocked ? '#ef4444' : '#a3e635'}
            style={{ transition: 'x 0.25s ease, fill 0.2s ease' }}
          />
          {/* Door strike pocket */}
          <rect x="90" y="7" width="26" height="34" rx="3" fill="rgba(240,240,232,0.04)" stroke="rgba(240,240,232,0.22)" strokeWidth="1.5" />
          <rect x="92" y="14" width="14" height="20" rx="2" fill="rgba(0,0,0,0.55)" />
        </svg>
      </button>

      <span className={`hw-lcd inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-0.5 rounded-md ${
        isLocked
          ? 'border-red-500/35 text-red-400'
          : 'border-primary/40 text-primary'
      }`}>
        <Lock size={10} className={isLocked ? 'text-red-400' : 'text-primary'} />
        {isLocked ? 'LOCKED' : 'UNLOCKED'}
      </span>

      {countdown !== null && (
        <div className="w-full max-w-[140px] space-y-1">
          <div className="hw-well h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 transition-all duration-1000" style={{ width: `${(countdown / 10) * 100}%` }} />
          </div>
          <p className="text-[9px] text-center text-muted-foreground font-mono">Auto-lock in <span className="text-primary font-bold tabular-nums">{countdown}s</span></p>
        </div>
      )}
    </div>
  );
}

// ─── Buzzer Widget (Piezo Acoustic Capsule + Wave Radiators) ───────────────────
function BuzzerWidget({ widget, publish }) {
  const [active, setActive] = useState(false);

  const trigger = () => {
    setActive(true);
    publish(widget.topic, 'BEEP');
    setTimeout(() => setActive(false), 600);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2 text-left">
      <button
        type="button"
        onClick={trigger}
        className={`hw-well relative w-24 h-14 rounded-xl flex items-center justify-center transition-all duration-150 select-none active:scale-95 cursor-pointer ${
          active ? 'border-red-400/60 shadow-[0_0_16px_rgba(239,68,68,0.3)]' : 'hover:border-primary/40'
        }`}
        title="Click to sound piezo buzzer"
      >
        <svg viewBox="0 0 88 48" className="w-full h-full">
          {/* Piezo Capsule */}
          <circle cx="44" cy="24" r="15" fill="rgba(240,240,232,0.06)" stroke={active ? '#ef4444' : '#a3e635'} strokeWidth="1.8" />
          <circle cx="44" cy="24" r="9" fill="#141512" stroke="rgba(240,240,232,0.22)" strokeWidth="1" />
          <circle cx="44" cy="24" r="3.5" fill={active ? '#ef4444' : '#a3e635'} />
          {/* Acoustic wave arcs */}
          <path d="M23 16 A 12 12 0 0 0 23 32" fill="none" stroke={active ? '#ef4444' : 'rgba(163,230,53,0.4)'} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M18 11 A 19 19 0 0 0 18 37" fill="none" stroke={active ? '#ef4444' : 'rgba(163,230,53,0.2)'} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M65 16 A 12 12 0 0 1 65 32" fill="none" stroke={active ? '#ef4444' : 'rgba(163,230,53,0.4)'} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M70 11 A 19 19 0 0 1 70 37" fill="none" stroke={active ? '#ef4444' : 'rgba(163,230,53,0.2)'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={trigger}
        className={`hw-keycap px-3 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
          active ? 'border-red-400 text-red-400' : 'text-primary'
        }`}
      >
        PULSE BEEP
      </button>
    </div>
  );
}

// ─── Pan-Tilt Widget (Optical Gimbal Reticle Viewfinder) ──────────────────────
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
  const retLeft = `${(pan / 180) * 80 + 10}%`;
  const retTop = `${(tilt / 180) * 76 + 12}%`;

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      {/* Optical Tracking Gimbal Viewfinder */}
      <div className="hw-well relative w-full h-[68px] rounded-xl overflow-hidden flex items-center justify-center">
        {/* Corner brackets */}
        <span className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-primary/45 pointer-events-none" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-primary/45 pointer-events-none" />
        <span className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-primary/45 pointer-events-none" />
        <span className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-primary/45 pointer-events-none" />

        {/* Dynamic X/Y tracking crosshairs */}
        <div className="absolute inset-x-0 h-px bg-primary/25 transition-all duration-100 pointer-events-none" style={{ top: retTop }} />
        <div className="absolute inset-y-0 w-px bg-primary/25 transition-all duration-100 pointer-events-none" style={{ left: retLeft }} />

        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-primary/25 border border-primary flex items-center justify-center transition-all duration-100 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: retLeft, top: retTop }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>

        <span className="hw-lcd absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums text-primary font-bold">
          {pan}°, {tilt}°
        </span>
      </div>

      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px] font-mono text-muted-foreground uppercase">Pan X</label>
            <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{pan}°</span>
          </div>
          <input type="range" min="0" max="180" value={pan} onChange={handlePan} className="w-full hw-slider" />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px] font-mono text-muted-foreground uppercase">Tilt Y</label>
            <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{tilt}°</span>
          </div>
          <input type="range" min="0" max="180" value={tilt} onChange={handleTilt} className="w-full hw-slider" />
        </div>
      </div>

      <button type="button" onClick={center} className="hw-keycap w-full py-1 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-foreground cursor-pointer">
        Center Camera (<span className="text-primary">90°, 90°</span>)
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AGRICULTURE WIDGETS ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Pump Widget (Centrifugal Volute Impeller + Chronograph) ─────────────────
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
    <div className="flex flex-col h-full items-center justify-center gap-2 text-left">
      <button
        type="button"
        onClick={toggle}
        className="hw-well w-16 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 hover:border-primary/40"
        title={isOn ? 'Click to stop pump' : 'Click to start pump'}
      >
        <svg viewBox="0 0 56 48" className="w-14 h-12">
          {/* Inlet & discharge nozzles */}
          <rect x="24" y="2" width="8" height="8" rx="1.5" fill="rgba(240,240,232,0.1)" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.2" />
          <circle cx="28" cy="26" r="17" fill="#141512" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.75" />
          {/* 4-Vane Impeller */}
          <g className={isOn ? 'animate-spin' : ''} style={{ transformOrigin: '28px 26px', animationDuration: '0.7s' }}>
            {[0, 90, 180, 270].map(deg => (
              <path
                key={deg}
                d="M28,26 Q34,17 28,12"
                fill="none"
                stroke={isOn ? '#a3e635' : '#8b8d83'}
                strokeWidth="2.8"
                strokeLinecap="round"
                transform={`rotate(${deg} 28 26)`}
              />
            ))}
          </g>
          <circle cx="28" cy="26" r="4" fill="#1a1b18" stroke={isOn ? '#a3e635' : '#8b8d83'} strokeWidth="1.5" />
        </svg>
      </button>

      <div className="flex items-center gap-1.5">
        <span className={`hw-lcd inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
          isOn ? 'border-primary/40 text-primary' : 'text-muted-foreground'
        }`}>
          {isOn ? 'PUMPING' : 'STOPPED'}
        </span>
        <span className="hw-lcd text-[10px] font-mono tabular-nums font-bold text-primary px-2 py-0.5 rounded-md">
          {fmt(runtime)}
        </span>
      </div>

      <button
        type="button"
        onClick={toggle}
        className={`hw-keycap px-3.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
          isOn
            ? 'border-red-500/40 text-red-400 hover:bg-red-500/15'
            : 'hw-keycap-active'
        }`}
      >
        {isOn ? 'STOP PUMP' : 'START PUMP'}
      </button>
    </div>
  );
}

// ─── Valve Widget (Industrial Flanged Solenoid Pipe Schematic) ────────────────
function ValveWidget({ widget, value, publish }) {
  const isOpen = value === '1' || value === 'OPEN';
  const toggle = () => publish(widget.topic, isOpen ? 'CLOSE' : 'OPEN');

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2.5 text-left">
      <button
        type="button"
        onClick={toggle}
        className="hw-well w-32 h-14 rounded-xl hover:border-primary/40 p-1 flex items-center justify-center cursor-pointer transition-all active:scale-[0.98]"
        title={isOpen ? 'Click to close valve' : 'Click to open valve'}
      >
        <svg viewBox="0 0 116 52" className="w-full h-full">
          {/* Pipe flanges */}
          <rect x="4" y="21" width="5" height="18" rx="1.5" fill="rgba(240,240,232,0.14)" stroke="rgba(240,240,232,0.3)" strokeWidth="1" />
          <rect x="107" y="21" width="5" height="18" rx="1.5" fill="rgba(240,240,232,0.14)" stroke="rgba(240,240,232,0.3)" strokeWidth="1" />
          {/* Pipe body */}
          <rect x="9" y="24.5" width="98" height="11" rx="2" fill="rgba(240,240,232,0.06)" stroke={isOpen ? '#a3e635' : '#8b8d83'} strokeWidth="1.5" />
          {/* Live animated flow stream when open */}
          {isOpen && (
            <line x1="12" y1="30" x2="104" y2="30" stroke="#a3e635" strokeWidth="2.4" strokeDasharray="6 4" className="hw-flow" />
          )}
          {/* Valve body */}
          <circle cx="58" cy="30" r="10" fill="#141512" stroke={isOpen ? '#a3e635' : '#ef4444'} strokeWidth="2" />
          <line x1="58" y1="20" x2="58" y2="11" stroke={isOpen ? '#a3e635' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" />
          {/* Quarter-turn handle */}
          <rect
            x="47" y="7" width="22" height="5" rx="2.5"
            fill={isOpen ? '#a3e635' : '#ef4444'}
            transform={isOpen ? '' : 'rotate(90 58 9.5)'}
            style={{ transition: 'transform 0.25s ease, fill 0.2s ease' }}
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={toggle}
        className={`hw-keycap px-3.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
          isOpen
            ? 'hw-keycap-active'
            : 'border-red-500/40 text-red-400 hover:border-red-400'
        }`}
      >
        {isOpen ? 'OPEN — CLOSE' : 'CLOSED — OPEN'}
      </button>
    </div>
  );
}

// ─── Smart Irrigation Widget (Soil Telemetry + Auto Threshold Controller) ─────
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
    ? (moisture < threshold ? '#ef4444' : '#a3e635')
    : '#a3e635';

  return (
    <div className="flex flex-col h-full justify-center gap-2 min-h-0 px-0.5 text-left">
      <div className="hw-well rounded-xl p-2.5">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Soil Moisture</span>
          <span className="hw-lcd px-2 py-0.5 rounded text-[11px] font-mono tabular-nums font-bold" style={{ color: moistureColor }}>
            {moisture !== null ? `${moisture.toFixed(0)}%` : 'N/A'}
          </span>
        </div>
        <div className="relative h-2.5 bg-background border border-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${Math.min(100, moisture || 0)}%`,
            background: moistureColor
          }} />
          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground" style={{ left: `${threshold}%` }} />
        </div>
        <p className="text-[9px] font-mono text-muted-foreground text-right mt-1">Trigger &lt; <span className="text-primary font-bold tabular-nums">{threshold}%</span></p>
      </div>

      <div className="flex gap-1.5">
        <button type="button" onClick={() => setMode('manual')}
          className={`hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
            mode === 'manual' ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
          }`}>Manual</button>
        <button type="button" onClick={() => setMode('auto')}
          className={`hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer ${
            mode === 'auto' ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
          }`}>Auto</button>
      </div>

      {mode === 'auto' ? (
        <>
          <div>
            <div className="flex justify-between mb-0.5">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">Threshold</label>
              <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{threshold}%</span>
            </div>
            <input type="range" min="10" max="80" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              className="w-full hw-slider" />
          </div>
          <div className={`hw-lcd text-[10px] text-center py-1 rounded-lg font-mono font-bold ${
            pumpOn ? 'border-primary/40 text-primary' : 'text-muted-foreground'
          }`}>{pumpOn ? 'AUTO-IRRIGATING' : 'MOISTURE SUFFICIENT'}</div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => { setPumpOn(v => !v); publish(widget.topic, pumpOn ? 'OFF' : 'ON'); }}
          className={`hw-keycap w-full py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer ${
            pumpOn ? 'hw-keycap-active' : 'text-foreground'
          }`}>
          {pumpOn ? 'Stop Irrigation' : 'Start Irrigation'}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ADVANCED TOOL WIDGETS ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── OLED Display Widget (Authentic 0.96" SSD1306 PCB Module + Pin Header) ───
function OLEDWidget({ widget, publish }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    publish(widget.topic, text.trim());
    setSent(text.trim());
  };

  return (
    <div className="flex flex-col h-full justify-center gap-2 text-left">
      {/* SSD1306 PCB Module Bezel */}
      <div className="hw-well relative rounded-xl p-2">
        {/* 4 Corner Brass Mounting Pads */}
        <span className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/75 border border-amber-200/30" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/75 border border-amber-200/30" />
        <span className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/75 border border-amber-200/30" />
        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400/75 border border-amber-200/30" />

        {/* 4-Pin I2C Header Silkscreen */}
        <div className="flex items-center justify-center gap-2.5 mb-1">
          {['GND', 'VCC', 'SCL', 'SDA'].map(pin => (
            <span key={pin} className="inline-flex items-center gap-0.5 text-[7px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300/80 inline-block" />
              {pin}
            </span>
          ))}
        </div>

        <div className="hw-oled-screen rounded-lg px-3 py-2 min-h-[42px] flex flex-col items-center justify-center">
          <span className="text-[7px] font-mono tracking-[0.2em] text-primary/50 uppercase mb-0.5">
            SSD1306 · 128×64
          </span>
          <p className="font-mono text-primary text-xs sm:text-sm text-center break-all tracking-wider">
            {sent || <span className="opacity-45">READY_</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Text to display..."
          maxLength={widget.maxChars || 32}
          className="flex-1 bg-input border border-border rounded-lg py-1.5 px-2.5 text-xs focus:outline-none focus:border-primary/50 text-foreground font-mono"
        />
        <button type="button" onClick={handleSend}
          className="px-3 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 cursor-pointer">
          Send
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {['HELLO', 'READY', 'TEST', 'CLEAR'].map(preset => (
          <button key={preset} type="button" onClick={() => { setText(preset); publish(widget.topic, preset); setSent(preset); }}
            className="hw-keycap flex-1 text-[9px] px-2 py-1 rounded-md text-muted-foreground hover:text-primary font-mono cursor-pointer">
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Numeric Input Widget (Precision Setpoint Encoder) ───────────────────────
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
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-lcd rounded-xl py-1.5 px-3 flex items-center justify-between gap-2">
        <span className="text-[8px] font-mono text-muted-foreground uppercase">MIN <span className="text-primary">{min}</span></span>
        <div className="text-center">
          <span className="text-2xl font-black font-mono tabular-nums text-primary leading-none">{val}</span>
          {widget.unit && <span className="text-[10px] font-mono text-muted-foreground ml-1">{widget.unit}</span>}
        </div>
        <span className="text-[8px] font-mono text-muted-foreground uppercase">MAX <span className="text-primary">{max}</span></span>
      </div>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => send(val - step)}
          className="hw-keycap flex-1 py-1.5 rounded-lg text-sm font-mono font-black text-foreground cursor-pointer">−</button>
        <input
          type="number" value={val} min={min} max={max} step={step}
          onChange={e => send(Number(e.target.value))}
          className="w-20 text-center bg-input border border-border rounded-lg py-1.5 text-sm font-mono tabular-nums font-bold focus:outline-none focus:border-primary/50 text-primary"
        />
        <button type="button" onClick={() => send(val + step)}
          className="hw-keycap flex-1 py-1.5 rounded-lg text-sm font-mono font-black text-foreground cursor-pointer">+</button>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={e => send(Number(e.target.value))}
        className="w-full hw-slider" />
    </div>
  );
}

// ─── Dropdown Widget (Bank Selector Keys) ──────────────────────────────────────
function DropdownWidget({ widget, publish }) {
  const options = widget.options || ['Auto', 'Manual', 'Test', 'Off'];
  const [selected, setSelected] = useState(options[0]);

  const handleSelect = (opt) => {
    setSelected(opt);
    publish(widget.topic, opt);
  };

  return (
    <div className="flex flex-col h-full justify-center gap-1.5 overflow-y-auto scrollbar-thin text-left">
      {options.map((opt, idx) => {
        const isSel = selected === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => handleSelect(opt)}
            className={`hw-keycap w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
              isSel ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-primary/70 font-bold">{String(idx + 1).padStart(2, '0')}</span>
              <span>{opt}</span>
            </div>
            {isSel && <Check size={13} className="text-primary" />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Momentary Button Widget (Recessed Collar Pushbutton) ──────────────────────
function MomentaryWidget({ widget, publish }) {
  const [pressed, setPressed] = useState(false);
  const payload = widget.payload || 'TRIGGER';

  const trigger = () => {
    setPressed(true);
    publish(widget.topic, payload);
    setTimeout(() => setPressed(false), 400);
  };

  return (
    <div className="flex flex-col h-full items-center justify-center gap-2.5 text-left">
      <div className="hw-well w-16 h-16 rounded-full p-1.5 flex items-center justify-center">
        <button
          type="button"
          onClick={trigger}
          className={`hw-keycap w-full h-full rounded-full flex items-center justify-center select-none cursor-pointer ${
            pressed ? 'hw-keycap-active scale-95' : 'text-primary'
          }`}
          title={`Send ${payload}`}
        >
          <Zap size={22} />
        </button>
      </div>
      <p className="hw-lcd px-2.5 py-0.5 rounded-md text-[10px] font-mono text-muted-foreground">
        TX: <span className="text-primary font-bold">{payload}</span>
      </p>
    </div>
  );
}

const DP_BTN_BASE =
  'hw-keycap flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer select-none';

function DPadDirButton({ cmd, icon: Icon, activeCmd, onPress, onRelease }) {
  const lit = activeCmd === cmd;
  return (
    <button
      type="button"
      className={`${DP_BTN_BASE} ${lit ? 'hw-keycap-active' : 'text-primary'}`}
      onMouseDown={() => onPress(cmd)}
      onMouseUp={onRelease}
      onMouseLeave={() => activeCmd === cmd && onRelease()}
      onTouchStart={(e) => { e.preventDefault(); onPress(cmd); }}
      onTouchEnd={onRelease}
    >
      <Icon size={19} />
    </button>
  );
}

// ─── D-Pad Widget (Industrial Tactile Jog Deck) ───────────────────────────────
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
    <div className="flex flex-col h-full items-center justify-center gap-2 text-left">
      <div className="hw-well p-2.5 rounded-2xl flex flex-col items-center gap-1.5">
        <DPadDirButton cmd="FORWARD" icon={ChevronUp} activeCmd={active} onPress={press} onRelease={release} />
        <div className="flex gap-1.5">
          <DPadDirButton cmd="LEFT" icon={ChevronLeft} activeCmd={active} onPress={press} onRelease={release} />
          <button
            type="button"
            onClick={sendStop}
            className={`hw-keycap w-11 h-11 rounded-full flex items-center justify-center cursor-pointer select-none ${
              active === 'STOP'
                ? 'border-red-400 bg-red-500/25 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'border-red-500/35 text-red-400 hover:border-red-400'
            }`}
            title="Send STOP"
          >
            <span className="text-[9px] font-mono font-black tracking-tighter">STOP</span>
          </button>
          <DPadDirButton cmd="RIGHT" icon={ChevronRight} activeCmd={active} onPress={press} onRelease={release} />
        </div>
        <DPadDirButton cmd="BACK" icon={ChevronDown} activeCmd={active} onPress={press} onRelease={release} />
      </div>

      <span className={`hw-lcd text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
        active ? 'border-primary/40 text-primary' : 'text-muted-foreground'
      }`}>
        CMD: {active || 'IDLE'}
      </span>
    </div>
  );
}

// ─── Joystick Widget (Recessed Anodized Gimbal + Vector Trace) ─────────────────
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
    <div className="flex flex-col h-full items-center justify-center min-h-0 gap-2 text-left">
      <div
        ref={rootRef}
        className="hw-well relative w-36 h-36 rounded-full touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-center"
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
        <div className="absolute inset-x-3 top-1/2 h-px bg-white/[0.06] pointer-events-none" />
        <div className="absolute inset-y-3 left-1/2 w-px bg-white/[0.06] pointer-events-none" />
        <div className="absolute inset-[20%] rounded-full border border-dashed border-primary/35 pointer-events-none" />
        <div className="absolute inset-[36%] rounded-full border border-white/[0.06] pointer-events-none" />

        {/* Live Vector Force Trace */}
        <svg viewBox="0 0 144 144" className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="72" y1="72" x2={72 + knob.x} y2={72 + knob.y}
            stroke="#a3e635" strokeWidth="2" strokeLinecap="round"
            opacity={knobLit ? 0.85 : 0.2}
          />
        </svg>

        {/* Machined Knurled Thumbstick Dome */}
        <div
          className={`absolute w-12 h-12 rounded-full border transition-all duration-75 flex items-center justify-center ${
            knobLit
              ? 'bg-primary/25 border-primary scale-95 shadow-[0_0_16px_rgba(163,230,53,0.4)]'
              : 'bg-gradient-to-b from-secondary via-muted to-background border-border shadow-lg'
          }`}
          style={{
            left: `calc(50% + ${knob.x}px)`,
            top: `calc(50% + ${knob.y}px)`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center">
            <div className={`w-2.5 h-2.5 rounded-full ${knobLit ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
          </div>
        </div>

        <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-muted-foreground font-bold pointer-events-none">F</span>
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono text-muted-foreground font-bold pointer-events-none">B</span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-muted-foreground font-bold pointer-events-none">L</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-muted-foreground font-bold pointer-events-none">R</span>
      </div>

      <span className={`hw-lcd text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-md ${
        active ? 'border-primary/40 text-primary' : 'text-muted-foreground'
      }`}>
        DIR: {active || 'IDLE'}
      </span>
    </div>
  );
}

// ─── Robot Arm Widget (CAD 2D Kinematics Bay + Live XY Telemetry) ──────────────
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
    { key: 'base',     label: 'Base',      range: [0, 180] },
    { key: 'shoulder', label: 'Shoulder',  range: [0, 180] },
    { key: 'elbow',    label: 'Elbow',     range: [0, 135] },
  ];

  const baseAngle = ((joints.base - 90) * Math.PI) / 180;
  const shoulderAngle = ((joints.shoulder - 90) * Math.PI) / 180 + baseAngle;
  const elbowAngle = ((joints.elbow - 90) * Math.PI) / 180 + shoulderAngle;
  const L1 = 36, L2 = 28;
  const x0 = 65, y0 = 78;
  const x1 = x0 + L1 * Math.sin(shoulderAngle);
  const y1 = y0 - L1 * Math.cos(shoulderAngle);
  const x2 = x1 + L2 * Math.sin(elbowAngle);
  const y2 = y1 - L2 * Math.cos(elbowAngle);
  const relX = Math.round(x2 - x0);
  const relY = Math.round(y0 - y2);

  return (
    <div className="flex flex-col h-full min-h-0 justify-center gap-2 text-left">
      <div
        className="hw-well relative flex justify-center rounded-xl py-1 px-2 overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(240,240,232,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(240,240,232,0.03) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      >
        <svg width="130" height="86" viewBox="0 0 130 90">
          {/* Maximum reach arc guide */}
          <path d="M 8 78 A 57 57 0 0 1 122 78" fill="none" stroke="rgba(163,230,53,0.14)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="8" y1="84" x2="122" y2="84" stroke="rgba(240,240,232,0.2)" strokeWidth="1" />
          <rect x="49" y="79" width="32" height="6" rx="3" fill="rgba(240,240,232,0.1)" stroke="rgba(240,240,232,0.3)" strokeWidth="1" />
          {/* Link 1 */}
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#d5d8ca" strokeWidth="5.5" strokeLinecap="round" />
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
          {/* Link 2 */}
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d5d8ca" strokeWidth="4.5" strokeLinecap="round" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a3e635" strokeWidth="1.75" strokeLinecap="round" />
          {/* Bolted rotary joints */}
          <circle cx={x0} cy={y0} r="5.5" fill="#1a1b18" stroke="#a3e635" strokeWidth="2" />
          <circle cx={x1} cy={y1} r="4.8" fill="#1a1b18" stroke="#a3e635" strokeWidth="2" />
          <circle cx={x2} cy={y2} r="3.5" fill="#a3e635" />
        </svg>
        <span className="hw-lcd absolute top-1 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono tabular-nums text-primary">
          X:{relX} Y:{relY}
        </span>
      </div>
      <div className="space-y-1.5 px-0.5">
        {arms.map(a => (
          <div key={a.key}>
            <div className="flex justify-between mb-0.5">
              <label className="text-[9px] font-mono uppercase text-muted-foreground">{a.label}</label>
              <span className="text-[9px] font-mono tabular-nums font-bold text-primary">{joints[a.key]}°</span>
            </div>
            <input type="range" min={a.range[0]} max={a.range[1]} value={joints[a.key]}
              onChange={e => setJoint(a.key, Number(e.target.value))}
              className="w-full hw-slider"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={center}
        className="hw-keycap w-full py-1.5 rounded-lg text-[10px] font-mono font-bold text-foreground cursor-pointer">
        Center Arm (<span className="text-primary">90°, 90°, 90°</span>)
      </button>
    </div>
  );
}

// ─── Gripper Widget (Rack & Pinion Parallel Jaw Actuator) ──────────────────────
function GripperWidget({ widget, publish }) {
  const [openPct, setOpenPct] = useState(100);
  const [force, setForce] = useState(50);
  const [, setGrip] = useState(false);

  const sendGrip = (open) => {
    setGrip(!open);
    publish(widget.topic, open ? `OPEN,${force}` : `GRIP,${force}`);
  };

  const handleOpen = (v) => {
    setOpenPct(v);
    publish(widget.topic, `POS,${v},${force}`);
  };

  const jawGap = (openPct / 100) * 30;
  const lx = 50 - jawGap / 2 - 12;
  const rx = 50 + jawGap / 2;

  return (
    <div className="flex flex-col h-full justify-center gap-2 px-0.5 text-left">
      <div className="hw-well flex justify-center rounded-xl py-1.5">
        <svg width="100" height="54" viewBox="0 0 100 60">
          {/* Linear guide rail */}
          <rect x="14" y="29" width="72" height="4" rx="2" fill="rgba(240,240,232,0.12)" />
          {/* Left serrated jaw */}
          <rect x={lx} y="9" width="12" height="20" rx="2" fill="rgba(163,230,53,0.2)" stroke="#a3e635" strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
          {/* Right serrated jaw */}
          <rect x={rx} y="9" width="12" height="20" rx="2" fill="rgba(163,230,53,0.2)" stroke="#a3e635" strokeWidth="1.5" style={{ transition: 'all 0.2s' }} />
          {/* Actuator housing */}
          <rect x="33" y="26" width="34" height="20" rx="4" fill="#141512" stroke="rgba(240,240,232,0.28)" strokeWidth="1.5" />
          <text x="50" y="39" textAnchor="middle" fontSize="8" fill="#a3e635" fontFamily="var(--font-mono)" fontWeight="bold">{openPct}%</text>
        </svg>
      </div>
      <div>
        <div className="flex justify-between mb-0.5">
          <label className="text-[10px] font-mono uppercase text-muted-foreground">Jaw Stroke</label>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{openPct}%</span>
        </div>
        <input type="range" min="0" max="100" value={openPct} onChange={e => handleOpen(Number(e.target.value))}
          className="w-full hw-slider" />
      </div>
      <div>
        <div className="flex justify-between mb-0.5">
          <label className="text-[10px] font-mono uppercase text-muted-foreground">Clamp Force</label>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{force}%</span>
        </div>
        <input type="range" min="10" max="100" value={force} onChange={e => setForce(Number(e.target.value))}
          className="w-full hw-slider" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => sendGrip(true)}
          className="hw-keycap flex-1 py-1.5 rounded-lg text-xs font-mono font-bold text-foreground cursor-pointer">
          Release
        </button>
        <button type="button" onClick={() => sendGrip(false)}
          className="hw-keycap hw-keycap-active flex-1 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer">
          Grip
        </button>
      </div>
    </div>
  );
}

// ─── Omni/Mecanum Drive Widget (Vector Gimbal + Yaw Keys) ────────────────────
function OmniDriveWidget({ widget, publish }) {
  const rootRef = useRef(null);
  const activeRef = useRef(null);
  const [active, setActive] = useState(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);

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
    <div className="flex flex-col h-full items-center justify-center gap-2 min-h-0 text-left">
      <div className="flex gap-3 items-center justify-center min-h-0">
        <div
          ref={rootRef}
          className="hw-well relative w-32 h-32 rounded-full touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-center flex-shrink-0"
          onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); applyPointer(e.clientX, e.clientY); }}
          onPointerMove={e => { if (!e.currentTarget.hasPointerCapture(e.pointerId)) return; applyPointer(e.clientX, e.clientY); }}
          onPointerUp={e => { try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {} endPointer(); }}
          onPointerCancel={endPointer}
        >
          <div className="absolute inset-x-3 top-1/2 h-px bg-white/[0.06] pointer-events-none" />
          <div className="absolute inset-y-3 left-1/2 w-px bg-white/[0.06] pointer-events-none" />
          <div className="absolute inset-[18%] rounded-full border border-dashed border-primary/35 pointer-events-none" />
          <svg viewBox="0 0 128 128" className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="64" y1="64" x2={64 + knob.x} y2={64 + knob.y}
              stroke="#a3e635" strokeWidth="2" strokeLinecap="round"
              opacity={knobLit ? 0.85 : 0.2}
            />
          </svg>
          <div
            className={`absolute w-11 h-11 rounded-full border transition-all duration-75 flex items-center justify-center ${
              knobLit ? 'bg-primary/25 border-primary scale-95 shadow-[0_0_16px_rgba(163,230,53,0.4)]' : 'bg-gradient-to-b from-secondary via-muted to-background border-border shadow-md'
            }`}
            style={{ left: `calc(50% + ${knob.x}px)`, top: `calc(50% + ${knob.y}px)`, transform: 'translate(-50%,-50%)' }}
          >
            <div className={`w-3 h-3 rounded-full ${knobLit ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
          </div>
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-muted-foreground font-black pointer-events-none">F</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-muted-foreground font-black pointer-events-none">B</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground font-black pointer-events-none">L</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground font-black pointer-events-none">R</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => setRotateCmd(1)}
            className={`hw-keycap w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
              rotate > 0 ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}>
            ↻
          </button>
          <button type="button" onClick={() => setRotateCmd(0)}
            className="hw-keycap w-9 h-9 rounded-lg text-muted-foreground text-[9px] font-black hover:text-foreground cursor-pointer">
            ■
          </button>
          <button type="button" onClick={() => setRotateCmd(-1)}
            className={`hw-keycap w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer ${
              rotate < 0 ? 'hw-keycap-active' : 'text-muted-foreground hover:text-foreground'
            }`}>
            ↺
          </button>
        </div>
      </div>
      <span className={`hw-lcd text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-md text-center ${
        active ? 'border-primary/40 text-primary' : 'text-muted-foreground'
      }`}>
        {active || 'IDLE'}{rotate !== 0 ? (rotate > 0 ? ' + CW' : ' + CCW') : ''}
      </span>
    </div>
  );
}

// ─── Dual Motor Speed Widget (Differential Telemetry + Center-Zero Bars) ──────
function RobotSpeedWidget({ widget, publish }) {
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);

  const send = (l, r) => publish(widget.topic, `L${l},R${r}`);

  const presets = [
    { label: '↑', l: 150, r: 150 },
    { label: '↓', l: -150, r: -150 },
    { label: '↰', l: 80, r: 200 },
    { label: '↱', l: 200, r: 80 },
    { label: 'STOP', l: 0, r: 0 },
  ];

  const renderBiBar = (val) => {
    const halfPct = (Math.abs(val) / 255) * 50;
    const isRev = val < 0;
    return (
      <div className="hw-well relative h-1.5 rounded-full overflow-hidden my-1">
        <span className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/30 z-10" />
        <div
          className="absolute top-0 bottom-0 transition-all duration-100"
          style={{
            left: isRev ? `${50 - halfPct}%` : '50%',
            width: `${halfPct}%`,
            backgroundColor: isRev ? '#f59e0b' : '#a3e635',
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full justify-center gap-1.5 px-0.5 text-left">
      <div>
        <div className="flex justify-between">
          <label className="text-[10px] font-mono text-muted-foreground font-bold uppercase">◀ Left Drive</label>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{left}</span>
        </div>
        {renderBiBar(left)}
        <input type="range" min="-255" max="255" value={left}
          onChange={e => { const v = Number(e.target.value); setLeft(v); send(v, right); }}
          className="w-full hw-slider" />
      </div>
      <div>
        <div className="flex justify-between">
          <label className="text-[10px] font-mono text-muted-foreground font-bold uppercase">Right Drive ▶</label>
          <span className="text-[10px] font-mono tabular-nums font-bold text-primary">{right}</span>
        </div>
        {renderBiBar(right)}
        <input type="range" min="-255" max="255" value={right}
          onChange={e => { const v = Number(e.target.value); setRight(v); send(left, v); }}
          className="w-full hw-slider" />
      </div>
      <div className="flex gap-1 pt-0.5">
        {presets.map(p => (
          <button key={p.label} type="button"
            onClick={() => { setLeft(p.l); setRight(p.r); send(p.l, p.r); }}
            className="hw-keycap flex-1 py-1 rounded-lg text-[10px] font-mono font-bold text-muted-foreground hover:text-primary cursor-pointer">
            {p.label}
          </button>
        ))}
      </div>
      <div className="hw-lcd text-[10px] text-center text-primary font-mono tabular-nums rounded-lg py-0.5 font-bold">
        L{left} / R{right}
      </div>
    </div>
  );
}

// ─── Unified Instrument Metadata for WidgetCard Top Bezel ─────────────────────
const WIDGET_META_MAP = {
  gauge:           { icon: Activity,          accent: 'text-primary' },
  switch:          { icon: Zap,               accent: 'text-primary' },
  slider:          { icon: SlidersHorizontal, accent: 'text-primary' },
  speed:           { icon: Car,               accent: 'text-primary' },
  dpad:            { icon: Gamepad2,          accent: 'text-primary' },
  joystick:        { icon: Move,              accent: 'text-primary' },
  robot_arm:       { icon: Bot,               accent: 'text-primary' },
  gripper:         { icon: Hand,              accent: 'text-primary' },
  omni_drive:      { icon: Navigation,        accent: 'text-primary' },
  robot_speed:     { icon: Gauge,             accent: 'text-primary' },
  relay:           { icon: Power,             accent: 'text-primary' },
  mosfet:          { icon: Cpu,               accent: 'text-primary' },
  solenoid:        { icon: Zap,               accent: 'text-primary' },
  optocoupler:     { icon: Shield,            accent: 'text-primary' },
  solenoid_valve:  { icon: Droplets,          accent: 'text-primary' },
  elec_lock:       { icon: Lock,              accent: 'text-primary' },
  latch:           { icon: Lock,              accent: 'text-primary' },
  dimmer:          { icon: Lightbulb,         accent: 'text-primary' },
  dcmotor_speed:   { icon: RotateCw,          accent: 'text-primary' },
  fan_speed:       { icon: Wind,              accent: 'text-primary' },
  dac:             { icon: Activity,          accent: 'text-primary' },
  bldc:            { icon: Play,              accent: 'text-primary' },
  linear_actuator: { icon: Blinds,            accent: 'text-primary' },
  single_led:      { icon: Lightbulb,         accent: 'text-primary' },
  fluid_pump:      { icon: Droplets,          accent: 'text-primary' },
  rgb:             { icon: Palette,           accent: 'text-primary' },
  neopixel:        { icon: Palette,           accent: 'text-primary' },
  scene:           { icon: Cpu,               accent: 'text-primary' },
  scheduler:       { icon: Calendar,          accent: 'text-primary' },
  servo:           { icon: Wrench,            accent: 'text-primary' },
  dcmotor:         { icon: RotateCw,          accent: 'text-primary' },
  stepper:         { icon: Gauge,             accent: 'text-primary' },
  pwmfan:          { icon: Wind,              accent: 'text-primary' },
  curtain:         { icon: Blinds,            accent: 'text-primary' },
  doorlock:        { icon: Lock,              accent: 'text-primary' },
  buzzer:          { icon: Bell,              accent: 'text-primary' },
  speaker:         { icon: Bell,              accent: 'text-primary' },
  pantilt:         { icon: Camera,            accent: 'text-primary' },
  pump:            { icon: Droplets,          accent: 'text-primary' },
  valve:           { icon: Wrench,            accent: 'text-primary' },
  irrigation:      { icon: Sprout,            accent: 'text-primary' },
  oled:            { icon: Monitor,           accent: 'text-primary' },
  seven_segment:   { icon: Monitor,           accent: 'text-primary' },
  led_matrix:      { icon: Monitor,           accent: 'text-primary' },
  bus_controller:  { icon: Monitor,           accent: 'text-primary' },
  numericInput:    { icon: Hash,              accent: 'text-primary' },
  dropdown:        { icon: AlignJustify,      accent: 'text-primary' },
  momentary:       { icon: Zap,               accent: 'text-primary' },
  ir_sender:       { icon: Zap,               accent: 'text-primary' },
  rf_sender:       { icon: Zap,               accent: 'text-primary' },
};

// ─── Unified Hardware Instrument Card Shell ───────────────────────────────────
function WidgetCard({ widget, value, publish, onRemove, onEdit, gaugeHistory }) {
  const renderContent = () => {
    switch (widget.type) {
      case 'gauge':    return <GaugeWidget    widget={widget} value={value}  history={gaugeHistory} />;
      case 'switch':   return <SwitchWidget   widget={widget} value={value}  publish={publish} />;
      case 'slider':   return <SliderWidget   widget={widget}                publish={publish} />;
      case 'dpad':     return <DPadWidget     widget={widget}                publish={publish} />;
      case 'joystick': return <JoystickWidget widget={widget}                publish={publish} />;
      case 'speed':    return <SliderWidget   widget={widget}                publish={publish} />;

      case 'relay':
      case 'mosfet':
      case 'solenoid':
      case 'optocoupler':
      case 'solenoid_valve':
      case 'elec_lock':
      case 'latch':
        return <RelayWidget widget={widget} value={value} publish={publish} />;

      case 'dimmer':
      case 'dcmotor_speed':
      case 'fan_speed':
      case 'dac':
      case 'bldc':
      case 'linear_actuator':
      case 'single_led':
      case 'fluid_pump':
        return <DimmerWidget widget={widget} publish={publish} />;

      case 'rgb':
      case 'neopixel':
        return <RGBWidget widget={widget} publish={publish} />;

      case 'servo':           return <ServoWidget   widget={widget}               publish={publish} />;
      case 'dcmotor':         return <DCMotorWidget widget={widget}               publish={publish} />;
      case 'stepper':         return <StepperWidget widget={widget}               publish={publish} />;
      case 'pwmfan':          return <PWMFanWidget  widget={widget} value={value} publish={publish} />;
      case 'curtain':         return <CurtainWidget widget={widget}               publish={publish} />;

      case 'scene':           return <SceneWidget     widget={widget} publish={publish} />;
      case 'scheduler':       return <SchedulerWidget widget={widget} publish={publish} />;

      case 'doorlock':        return <DoorLockWidget widget={widget} value={value} publish={publish} />;
      case 'buzzer':
      case 'speaker':
        return <BuzzerWidget widget={widget} publish={publish} />;
      case 'pantilt':         return <PanTiltWidget  widget={widget}               publish={publish} />;

      case 'pump':            return <PumpWidget       widget={widget} value={value} publish={publish} />;
      case 'valve':           return <ValveWidget      widget={widget} value={value} publish={publish} />;
      case 'irrigation':      return <IrrigationWidget widget={widget} value={value} publish={publish} />;

      case 'oled':
      case 'seven_segment':
      case 'led_matrix':
        return <OLEDWidget widget={widget} publish={publish} />;

      case 'numericInput':    return <NumericInputWidget widget={widget} publish={publish} />;
      case 'dropdown':        return <DropdownWidget     widget={widget} publish={publish} />;
      case 'momentary':
      case 'ir_sender':
      case 'rf_sender':
        return <MomentaryWidget widget={widget} publish={publish} />;

      case 'bus_controller':  return <OLEDWidget widget={widget} publish={publish} />;

      case 'robot_arm':   return <RobotArmWidget   widget={widget} publish={publish} />;
      case 'gripper':     return <GripperWidget     widget={widget} publish={publish} />;
      case 'omni_drive':  return <OmniDriveWidget   widget={widget} publish={publish} />;
      case 'robot_speed': return <RobotSpeedWidget  widget={widget} publish={publish} />;

      default: return null;
    }
  };

  const meta = WIDGET_META_MAP[widget.type] || { icon: Cpu, accent: 'text-muted-foreground' };
  const MetaIcon = meta.icon;
  const hasTelemetry = value !== undefined && value !== null && value !== '';

  return (
    <div className="hw-panel h-full border border-border hover:border-primary/25 rounded-xl transition-all duration-200 group flex flex-col relative overflow-hidden">
      {/* 4 Corner Machined Chassis Screws */}
      <span className="hw-screw absolute top-1.5 left-1.5 z-10 opacity-75" />
      <span className="hw-screw absolute top-1.5 right-1.5 z-10 opacity-75" />
      <span className="hw-screw absolute bottom-1.5 left-1.5 z-10 opacity-75" />
      <span className="hw-screw absolute bottom-1.5 right-1.5 z-10 opacity-75" />

      {/* Anodized Instrument Faceplate Header */}
      <div className="px-3.5 py-2 border-b border-border/90 bg-black/20 flex items-center justify-between gap-2 shrink-0" dir="ltr">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="drag-handle cursor-grab active:cursor-grabbing p-1 -ml-0.5 text-primary/80 hover:text-primary transition-colors flex items-center justify-center shrink-0 touch-none select-none"
            title="Drag to move instrument"
          >
            <GripVertical size={13} className="text-primary pointer-events-none" />
          </div>
          <MetaIcon size={13} className="text-primary shrink-0" />
          <span className="text-xs font-bold tracking-tight text-foreground truncate">{widget.name}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className="hw-lcd text-[9.5px] font-mono text-muted-foreground px-1.5 py-0.5 rounded truncate max-w-[105px]"
            title={widget.topic}
          >
            {widget.topic}
          </span>
          <button
            onClick={() => onEdit(widget)}
            className="opacity-0 group-hover:opacity-85 hover:!opacity-100 hover:text-primary transition-all text-primary p-1 rounded cursor-pointer"
            title="Edit Tool"
          >
            <SlidersHorizontal size={12} className="text-primary" />
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="opacity-0 group-hover:opacity-85 hover:!opacity-100 hover:text-red-400 transition-all text-muted-foreground p-1 rounded cursor-pointer"
            title="Remove Tool"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Tactile Instrument Canvas */}
      <div className="no-drag flex-1 min-h-0 p-3 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

// ─── Main Controller View ─────────────────────────────────────────────────────
export default function UniversalController({ deviceStates, publish, storageScopeId, esp32Prefix, userUID, initialWidgets, initialLayouts, customTitle }) {
  const { width, containerRef, mounted } = useContainerWidth();
  const { loaded, savedWidgets, savedLayouts, save } = useControllerFirestore(userUID, storageScopeId);

  const [showModal, setShowModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);

  const defaultWidgets = [];

  const defaultLayouts = layoutsFromLg([]);

  const effectiveDefaultWidgets = (initialWidgets && initialWidgets.length > 0) ? initialWidgets : defaultWidgets;
  const effectiveDefaultLayouts = initialLayouts || layoutsFromLg(effectiveDefaultWidgets.map((w, idx) => ({
    i: w.id,
    x: (idx * 3) % 12,
    y: Math.floor((idx * 3) / 12) * 3,
    w: w.w || 3,
    h: w.h || 3,
  })));

  // Initialize state from Firestore data once loaded
  const [widgets, setWidgets] = useState(null);
  const [layouts, setLayouts] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    if (savedWidgets && savedWidgets.length > 0) {
      setWidgets(savedWidgets);
    } else {
      setWidgets(effectiveDefaultWidgets);
      setLayouts(effectiveDefaultLayouts);
    }

    if (savedLayouts?.lg && savedLayouts.lg.length > 0) {
      if (!savedLayouts.md || !savedLayouts.sm) {
        setLayouts(layoutsFromLg(savedLayouts.lg));
      } else {
        setLayouts(savedLayouts);
      }
    } else {
      setLayouts(effectiveDefaultLayouts);
    }
  }, [loaded, savedWidgets, savedLayouts, storageScopeId]);

  const resetToProjectPreset = useCallback(() => {
    setWidgets(effectiveDefaultWidgets);
    setLayouts(effectiveDefaultLayouts);
    save(effectiveDefaultWidgets, effectiveDefaultLayouts);
  }, [effectiveDefaultWidgets, effectiveDefaultLayouts, save]);

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
      {/* Workbench Header Toolbar */}
      <div className="flex justify-between items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border text-[11px] font-mono font-semibold text-foreground">
            <Cpu size={13} className="text-primary" />
            <span className="text-primary font-bold">{widgets.length}</span> Instrument{widgets.length !== 1 ? 's' : ''}
          </span>
          {esp32Prefix && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-[11px] font-mono font-semibold text-primary">
              Target: {esp32Prefix}
            </div>
          )}
          {customTitle && (
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              {customTitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {initialWidgets && initialWidgets.length > 0 && (
            <button
              type="button"
              onClick={resetToProjectPreset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/70 hover:bg-muted text-foreground font-semibold text-xs transition-all active:scale-95 cursor-pointer"
              title="Restore or load all preset widgets and sensors for this project"
            >
              <RotateCcw size={13} className="text-primary" />
              <span>Project Preset Tools (<span className="text-primary">{initialWidgets.length}</span>)</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            Add Tool
          </button>
        </div>
      </div>

      {/* Engineering Dot-Grid Workbench Surface */}
      <div className="workbench-grid rounded-2xl border border-border/80 bg-background/40 p-2 sm:p-3 min-h-[380px]">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Gamepad2 size={32} className="text-primary mb-3" />
            <p className="text-foreground text-base font-bold">No instruments placed yet</p>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm">
              Add tactile gauges, switches, relays, OLED screens, or robotics controls to your IoT workbench.
            </p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              Add First Instrument
            </button>
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
              dragConfig={DRAG_CONFIG}
              resizeConfig={RESIZE_CONFIG}
              compactor={verticalCompactor}
              onLayoutChange={onLayoutChange}
              margin={[14, 14]}
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
      </div>

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
