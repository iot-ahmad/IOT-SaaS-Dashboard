import React, { useState, useMemo } from 'react';
import {
  Zap, Plus, Trash2, ImagePlus, X, Sparkles, Check, ArrowRight,
  HelpCircle, Cpu, Eye, Info, Layers, RefreshCw
} from 'lucide-react';
import { WIRE_COLORS, COMPONENT_DATABASE } from '../../data/componentDatabase';
import { compressImage, uploadToCloudinary } from '../../lib/cloudinaryUpload';

/**
 * Visual SVG Schematic Auto Builder
 * Dynamically computes component coordinates and renders color-coded bezier wires between pins.
 */
function SchematicSvgViewer({ components = [], connections = [] }) {
  // Filter out empty components
  const validComponents = useMemo(() => {
    return components.filter(c => c && c.name && c.name.trim().length > 0);
  }, [components]);

  // Separate MCU from peripherals
  const { mcus, peripherals } = useMemo(() => {
    const m = [];
    const p = [];
    validComponents.forEach(c => {
      if (c.category === 'MCU' || c.name.toLowerCase().includes('esp') || c.name.toLowerCase().includes('arduino') || c.name.toLowerCase().includes('pico')) {
        m.push(c);
      } else {
        p.push(c);
      }
    });
    // Fallback if no MCU detected, make first component the central hub
    if (m.length === 0 && validComponents.length > 0) {
      m.push(validComponents[0]);
      p.push(...validComponents.slice(1));
    }
    return { mcus: m, peripherals: p };
  }, [validComponents]);

  // Canvas bounds
  const svgWidth = 840;
  const svgHeight = Math.max(460, Math.max(mcus.length, peripherals.length) * 120 + 80);

  // Position nodes
  const nodePositions = useMemo(() => {
    const pos = {};
    // MCUs on the right (RTL aesthetic or central left/right)
    mcus.forEach((m, idx) => {
      const spacing = svgHeight / (mcus.length + 1);
      pos[m.name] = {
        x: 580,
        y: (idx + 1) * spacing - 45,
        width: 210,
        height: 90,
        isMcu: true,
        data: m
      };
    });

    // Peripherals on the left
    peripherals.forEach((p, idx) => {
      const spacing = svgHeight / (peripherals.length + 1);
      pos[p.name] = {
        x: 40,
        y: (idx + 1) * spacing - 40,
        width: 190,
        height: 80,
        isMcu: false,
        data: p
      };
    });

    return pos;
  }, [mcus, peripherals, svgHeight]);

  if (validComponents.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-card/[0.02] border border-dashed border-border rounded-2xl">
        <Zap className="w-10 h-10 text-muted-foreground/30 mb-2 animate-bounce" />
        <p className="text-xs text-muted-foreground font-semibold">أضف أجهزة وقطعاً في الخطوة السابقة لتوليد المخطط التلقائي.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto bg-[#07090e] border border-border/70 rounded-2xl p-4 shadow-2xl">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5 text-[11px] text-muted-foreground font-mono">
        <span className="flex items-center gap-1.5 text-sky-400 font-bold">
          <Sparkles size={13} />
          Auto-Generated Circuit Schematic
        </span>
        <span>{connections.length} أسلاك موصولة · {validComponents.length} قطع</span>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto min-w-[680px] select-none"
        style={{ filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))' }}
      >
        <defs>
          <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
          </pattern>
          <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Background */}
        <rect width="100%" height="100%" fill="#07090e" />
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* ─── Render Wire Connections ─── */}
        {connections.map((wire, i) => {
          const fromNode = nodePositions[wire.fromComp];
          const toNode = nodePositions[wire.toComp];

          if (!fromNode || !toNode) return null;

          // Compute connection ports
          const isFromLeft = fromNode.x < toNode.x;
          const startX = isFromLeft ? fromNode.x + fromNode.width : fromNode.x;
          const startY = fromNode.y + fromNode.height / 2 + (i % 3 - 1) * 12;

          const endX = isFromLeft ? toNode.x : toNode.x + toNode.width;
          const endY = toNode.y + toNode.height / 2 + ((i * 7) % 5 - 2) * 10;

          const dx = Math.abs(endX - startX) * 0.5;
          const pathD = `M ${startX} ${startY} C ${startX + (isFromLeft ? dx : -dx)} ${startY}, ${endX - (isFromLeft ? dx : -dx)} ${endY}, ${endX} ${endY}`;
          const wireColor = wire.color || '#38BDF8';

          return (
            <g key={wire.id || i} className="group cursor-pointer">
              {/* Wire Shadow / Glow */}
              <path
                d={pathD}
                fill="none"
                stroke={wireColor}
                strokeWidth="6"
                strokeOpacity="0.25"
                strokeLinecap="round"
              />
              {/* Main Colored Wire */}
              <path
                d={pathD}
                fill="none"
                stroke={wireColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300 group-hover:stroke-width-[4]"
              />
              {/* Terminals (Pin Dots) */}
              <circle cx={startX} cy={startY} r="4" fill={wireColor} stroke="#07090e" strokeWidth="2" />
              <circle cx={endX} cy={endY} r="4" fill={wireColor} stroke="#07090e" strokeWidth="2" />

              {/* Pin Label Tooltip on Wire Center */}
              <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2 - 8})`}>
                <rect
                  x="-55"
                  y="-12"
                  width="110"
                  height="20"
                  rx="6"
                  fill="#0e131f"
                  stroke={wireColor}
                  strokeWidth="1"
                  strokeOpacity="0.6"
                />
                <text
                  textAnchor="middle"
                  y="2"
                  fill="#ffffff"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {wire.fromPin || 'PIN'} → {wire.toPin || 'PIN'}
                </text>
              </g>
            </g>
          );
        })}

        {/* ─── Render Component Blocks ─── */}
        {Object.entries(nodePositions).map(([name, node]) => {
          const comp = node.data;
          const isMcu = node.isMcu;
          const strokeColor = isMcu ? '#38BDF8' : '#22C55E';
          const headerBg = isMcu ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.12)';

          return (
            <g key={name} transform={`translate(${node.x}, ${node.y})`}>
              {/* Outer Card */}
              <rect
                width={node.width}
                height={node.height}
                rx="14"
                fill="#0d111a"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeOpacity="0.8"
                filter="url(#wire-glow)"
              />
              {/* Header Stripe */}
              <path
                d={`M 0 14 Q 0 0 14 0 L ${node.width - 14} 0 Q ${node.width} 0 ${node.width} 14 L ${node.width} 28 L 0 28 Z`}
                fill={headerBg}
              />
              {/* Category Badge */}
              <rect
                x="8"
                y="5"
                width={isMcu ? "38" : "50"}
                height="16"
                rx="4"
                fill={isMcu ? "#0284c7" : "#15803d"}
              />
              <text
                x={isMcu ? "27" : "33"}
                y="16"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                {comp.category || (isMcu ? 'MCU' : 'PART')}
              </text>

              {/* Component Name */}
              <text
                x={node.width - 10}
                y="18"
                textAnchor="end"
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {name.length > 20 ? name.substring(0, 18) + '...' : name}
              </text>

              {/* Sub-info / Role */}
              <text
                x={node.width - 10}
                y="48"
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
                fontFamily="sans-serif"
              >
                {comp.function ? (comp.function.length > 28 ? comp.function.substring(0, 26) + '...' : comp.function) : 'وحدة إلكترونية'}
              </text>

              {/* Visual Ports / Status */}
              <rect x="12" y="62" width="8" height="8" rx="2" fill={strokeColor} opacity="0.8" />
              <rect x="24" y="62" width="8" height="8" rx="2" fill={strokeColor} opacity="0.8" />
              <rect x="36" y="62" width="8" height="8" rx="2" fill={strokeColor} opacity="0.8" />
              <rect x="48" y="62" width="8" height="8" rx="2" fill={strokeColor} opacity="0.8" />

              <text
                x={node.width - 10}
                y="69"
                textAnchor="end"
                fill="#64748b"
                fontSize="8"
                fontFamily="monospace"
              >
                READY · ONLINE
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Main Wiring Builder Component
 */
export default function WiringBuilder({
  components = [],
  connections = [],
  onConnectionsChange,
  wiringImageUrl = '',
  onWiringImageChange,
  wiringDescription = '',
  onWiringDescriptionChange,
}) {
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' | 'upload'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // Row creation state
  const [newFromComp, setNewFromComp] = useState('');
  const [newFromPin, setNewFromPin] = useState('');
  const [newToComp, setNewToComp] = useState('');
  const [newToPin, setNewToPin] = useState('');
  const [newColor, setNewColor] = useState(WIRE_COLORS[0].hex);
  const [newNote, setNewNote] = useState('');

  // Auto pick first components if available
  const validComponents = useMemo(() => {
    return components.filter(c => c && c.name && c.name.trim().length > 0);
  }, [components]);

  // Helper to get pin suggestions for a selected component
  const getPinSuggestions = (compName) => {
    const foundInDb = COMPONENT_DATABASE.find(d => d.name.toLowerCase() === compName.toLowerCase() || compName.toLowerCase().includes(d.name.toLowerCase()));
    if (foundInDb && foundInDb.defaultPins) {
      return foundInDb.defaultPins;
    }
    // Generic fallback pin list
    return ['VCC', 'GND', 'DATA', 'SDA', 'SCL', 'IN', 'OUT', 'GPIO2', 'GPIO4', 'GPIO25', '3.3V', '5V'];
  };

  const handleAddConnection = (e) => {
    e.preventDefault();
    if (!newFromComp || !newToComp || !newFromPin || !newToPin) {
      setError('الرجاء اختيار الطرفين وأسماء المنافذ لتوصيل السلك.');
      return;
    }
    if (newFromComp === newToComp && newFromPin === newToPin) {
      setError('لا يمكن توصيل نفس المنفذ بنفسه.');
      return;
    }
    setError('');

    const newConn = {
      id: `wire-${Date.now()}`,
      fromComp: newFromComp,
      fromPin: newFromPin.trim(),
      toComp: newToComp,
      toPin: newToPin.trim(),
      color: newColor,
      note: newNote.trim()
    };

    onConnectionsChange([...connections, newConn]);
    setNewFromPin('');
    setNewToPin('');
    setNewNote('');
  };

  const handleRemoveConnection = (id) => {
    onConnectionsChange(connections.filter(c => c.id !== id));
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');
    try {
      const compressed = await compressImage(file, 1600, 1600, 0.85);
      const url = await uploadToCloudinary(compressed, p => setUploadProgress(p), 'iot365/wiring');
      onWiringImageChange(url);
    } catch (err) {
      setError('فشل رفع صورة المخطط: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* ─── Mode Tabs ─── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 bg-muted dark:bg-[#0c0e14] border border-border p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('auto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auto'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap size={14} />
            المخطط الذكي التلقائي (Auto Schematic Builder)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImagePlus size={14} />
            رفع مخطط جاهز (Fritzing / Image)
          </button>
        </div>

        <span className="hidden sm:inline-flex text-xs text-muted-foreground items-center gap-1">
          <Sparkles size={13} className="text-primary" />
          توصيل سريع بدون برامج رسم خارجية
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
          <X size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── TAB 1: Auto Schematic Builder ─── */}
      {activeTab === 'auto' && (
        <div className="space-y-6">
          {/* Visual Schematic Render */}
          <SchematicSvgViewer components={components} connections={connections} />

          {/* Connection Rows Form */}
          <div className="bg-card/[0.02] border border-border rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              إضافة توصيلة سلك جديدة (Pin-to-Pin Connection)
            </h4>

            {validComponents.length < 2 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                يجب إضافة قطعتين على الأقل في خطوة "الأجهزة والقطع" لربطهما معاً.
              </p>
            ) : (
              <form onSubmit={handleAddConnection} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* From Component & Pin */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-[11px] font-bold text-muted-foreground">من الجهاز (From Component)</label>
                    <select
                      value={newFromComp}
                      onChange={(e) => {
                        setNewFromComp(e.target.value);
                        setNewFromPin('');
                      }}
                      className="w-full bg-card dark:bg-[#090b10] border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">-- اختر الجهاز --</option>
                      {validComponents.map(c => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        placeholder="المنفذ (مثال: VCC أو DATA)"
                        value={newFromPin}
                        onChange={(e) => setNewFromPin(e.target.value)}
                        className="flex-1 bg-card dark:bg-[#090b10] border border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                      />
                    </div>
                    {newFromComp && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {getPinSuggestions(newFromComp).slice(0, 5).map(pin => (
                          <button
                            key={pin}
                            type="button"
                            onClick={() => setNewFromPin(pin)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors text-slate-400 border border-white/5"
                          >
                            {pin}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden md:flex md:col-span-1 items-center justify-center pb-8">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <ArrowRight size={14} className="rotate-180" />
                    </div>
                  </div>

                  {/* To Component & Pin */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-[11px] font-bold text-muted-foreground">إلى الجهاز (To Component)</label>
                    <select
                      value={newToComp}
                      onChange={(e) => {
                        setNewToComp(e.target.value);
                        setNewToPin('');
                      }}
                      className="w-full bg-card dark:bg-[#090b10] border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">-- اختر الجهاز --</option>
                      {validComponents.map(c => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <div className="flex gap-1 mt-1">
                      <input
                        type="text"
                        placeholder="المنفذ (مثال: GPIO25 أو 3.3V)"
                        value={newToPin}
                        onChange={(e) => setNewToPin(e.target.value)}
                        className="flex-1 bg-card dark:bg-[#090b10] border border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                      />
                    </div>
                    {newToComp && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {getPinSuggestions(newToComp).slice(0, 6).map(pin => (
                          <button
                            key={pin}
                            type="button"
                            onClick={() => setNewToPin(pin)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors text-slate-400 border border-white/5"
                          >
                            {pin}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wire Color & Add Button */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-[11px] font-bold text-muted-foreground">لون السلك (Wire Color)</label>
                    <div className="flex items-center gap-1.5 bg-card dark:bg-[#090b10] border border-border rounded-xl p-1.5">
                      {WIRE_COLORS.map(wc => (
                        <button
                          key={wc.id}
                          type="button"
                          onClick={() => setNewColor(wc.hex)}
                          title={wc.name}
                          style={{ backgroundColor: wc.hex }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                            newColor === wc.hex ? 'scale-125 border-white ring-2 ring-primary/40' : 'border-transparent opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      className="w-full mt-2 font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20"
                    >
                      <Plus size={14} /> إضافة السلك
                    </button>
                  </div>
                </div>

                {/* Optional Note */}
                <input
                  type="text"
                  placeholder="ملاحظة اختيارية (مثال: خط إشارة I2C أو تغذية رئيسية)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-card dark:bg-[#090b10] border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </form>
            )}
          </div>

          {/* Current Connections Table */}
          {connections.length > 0 && (
            <div className="bg-card/[0.02] border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-bold text-foreground">قائمة التوصيلات النشطة ({connections.length} أسلاك)</span>
                <button
                  type="button"
                  onClick={() => onConnectionsChange([])}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  مسح كافة الأسلاك
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {connections.map((wire, idx) => (
                  <div
                    key={wire.id || idx}
                    className="flex items-center justify-between bg-card dark:bg-[#0d1017] border border-border rounded-xl p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: wire.color || '#38BDF8' }}
                      />
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <span>{wire.fromComp}</span>
                          <span className="text-primary font-mono text-[10px]">[{wire.fromPin}]</span>
                          <span className="text-muted-foreground">←</span>
                          <span>{wire.toComp}</span>
                          <span className="text-primary font-mono text-[10px]">[{wire.toPin}]</span>
                        </div>
                        {wire.note && <p className="text-[10px] text-muted-foreground mt-0.5">{wire.note}</p>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveConnection(wire.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Upload Fritzing Image ─── */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <input type="file" id="wiring-upload-input" accept="image/*" className="hidden" onChange={handleImagePick} />

          {wiringImageUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-primary/30 group shadow-xl bg-black/40 text-center p-4">
              <img src={wiringImageUrl} alt="مخطط التوصيل" className="w-full max-h-[360px] object-contain mx-auto rounded-xl" />
              <button
                type="button"
                onClick={() => onWiringImageChange('')}
                className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-red-500 text-white rounded-xl transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
              <label
                htmlFor="wiring-upload-input"
                className="inline-block mt-4 px-4 py-2 text-xs bg-primary text-black rounded-xl font-bold cursor-pointer hover:opacity-90 transition-opacity"
              >
                استبدال الصورة
              </label>
            </div>
          ) : (
            <label
              htmlFor="wiring-upload-input"
              className="w-full border-2 border-dashed border-border rounded-2xl p-12 bg-card/[0.01] hover:bg-card/[0.03] hover:border-primary/40 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-primary font-bold text-sm">{uploadProgress}%</span>
                  <span className="text-xs text-muted-foreground">جاري رفع المخطط إلى Cloudinary...</span>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-12 h-12 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                  <span className="text-sm font-bold text-foreground">اضغط لاختيار صورة المخطط (Fritzing Diagram / Wiring)</span>
                  <span className="text-xs text-muted-foreground mt-1">يدعم PNG, JPG, WebP بحجم يصل إلى 10 ميجابايت</span>
                </>
              )}
            </label>
          )}
        </div>
      )}

      {/* ─── Written Wiring Guide ─── */}
      <div className="space-y-2 pt-2">
        <label className="block text-xs font-bold text-foreground">شرح طريقة التوصيل والخطوات (اختياري)</label>
        <textarea
          rows={4}
          value={wiringDescription}
          onChange={(e) => onWiringDescriptionChange(e.target.value)}
          placeholder="اكتب توجيهات إضافية، مثل: 'تأكد من تركيب مقاومة Pull-up بقيمة 4.7kΩ على خط بيانات الحساس...'"
          className="w-full bg-card dark:bg-[#030406] border border-border rounded-2xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none transition-colors"
        />
      </div>
    </div>
  );
}

export { SchematicSvgViewer };
