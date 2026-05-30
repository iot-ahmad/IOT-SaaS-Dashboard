import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Compass, Heart, Activity,
  LogOut, Code, User, Navigation, Navigation2,
  CheckCircle2, Thermometer, Droplets, Wind, Clock, Star,
  ChevronRight, ArrowLeft, Zap, Globe, CloudSun, ShieldAlert
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TOURIST_SITES, WMO_ARABIC, WMO_ICON } from '../data/jordanData';

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom neon markers
function makeNeonIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};
      box-shadow:0 0 10px ${color},0 0 22px ${color}80;
      border:2px solid #fff2;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
  });
}

const PURPLE_ICON = makeNeonIcon('#a855f7');
const YELLOW_ICON = makeNeonIcon('#eab308');
const BUS_ICON = L.divIcon({
  className: '',
  html: `<div style="
    font-size:22px;line-height:1;
    filter:drop-shadow(0 0 8px #a855f7);
  ">🚌</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

// Irbid–Amman waypoints (lat/lon)
const BUS_ROUTE = [
  [32.5568, 35.8469], // Irbid
  [32.3742, 35.8997], // Jerash area
  [32.1500, 36.0100], // Zarqa junction
  [31.9454, 35.9284], // Amman
];

// ─── Moving bus marker ───────────────────────
function MovingBus({ progress }) {
  const map = useMap();
  const markerRef = useRef(null);

  // Interpolate position along route
  const getPos = useCallback((t) => {
    const total = BUS_ROUTE.length - 1;
    const seg = Math.min(Math.floor(t * total), total - 1);
    const segT = (t * total) - seg;
    const a = BUS_ROUTE[seg];
    const b = BUS_ROUTE[seg + 1] || BUS_ROUTE[total];
    return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
  }, []);

  useEffect(() => {
    const pos = getPos(progress);
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
    } else {
      markerRef.current = L.marker(pos, { icon: BUS_ICON }).addTo(map);
      markerRef.current.bindPopup('<b>باص إربد - عمان</b><br/>تتبع حي');
    }
  }, [progress, map, getPos]);

  useEffect(() => () => { if (markerRef.current) map.removeLayer(markerRef.current); }, [map]);
  return null;
}

// ─── Floating Paths Background ────────────────
function FloatingPaths({ position = 1 }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="rgba(168,85,247,1)"
            strokeWidth={path.width}
            strokeOpacity={0.04 + path.id * 0.012}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + (path.id % 5) * 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Premium Metal Button ─────────────────────
function PremiumMetalButton({ children, onClick, className = '', variant = 'default', disabled = false }) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const colors = {
    default: {
      outer: 'bg-gradient-to-b from-[#55565a] to-[#1b1c1e]',
      inner: 'bg-gradient-to-b from-[#2e3035] via-[#1a1b1e] to-[#121315]',
      button: 'bg-gradient-to-b from-[#3a3c41] to-[#1b1c1e]',
      textColor: 'text-slate-100',
      textShadow: '[text-shadow:_0_-1px_0_rgba(0,0,0,0.8)]',
    },
    accent: {
      outer: 'bg-gradient-to-b from-[#9b873f] to-[#3a331a]',
      inner: 'bg-gradient-to-b from-[#cbb15b] via-[#52441a] to-[#251f0b]',
      button: 'bg-gradient-to-b from-[#8f7936] to-[#4c3f19]',
      textColor: 'text-amber-100',
      textShadow: '[text-shadow:_0_-1px_0_rgba(0,0,0,0.9)]',
    },
    purple: {
      outer: 'bg-gradient-to-b from-[#7c3abf] to-[#2a1545]',
      inner: 'bg-gradient-to-b from-[#9f5ed4] via-[#4a1a7a] to-[#1a0a30]',
      button: 'bg-gradient-to-b from-[#7c3abf] to-[#3d1570]',
      textColor: 'text-purple-100',
      textShadow: '[text-shadow:_0_-1px_0_rgba(0,0,0,0.9)]',
    },
  }[variant];

  return (
    <div
      className={`relative inline-flex rounded-xl p-[1px] select-none transition-all duration-200 ${colors.outer} ${className}`}
      style={{
        transform: isPressed ? 'translateY(2px) scale(0.98)' : 'translateY(0) scale(1)',
        boxShadow: isPressed ? '0 1px 2px rgba(0,0,0,0.6)' : isHovered ? '0 8px 16px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.25)',
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
      onMouseEnter={() => setIsHovered(true)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div className={`absolute inset-[1px] rounded-lg transition-all duration-200 ${colors.inner}`}
        style={{ filter: isHovered && !isPressed ? 'brightness(1.08)' : 'none' }} />
      <button onClick={onClick} disabled={disabled} type="button"
        className={`relative z-10 w-full rounded-[10px] inline-flex h-11 items-center justify-center overflow-hidden px-6 py-2 text-xs font-bold leading-none cursor-pointer outline-none transition-all duration-200 ${colors.button} ${colors.textColor} ${colors.textShadow}`}
        style={{ transform: isPressed ? 'scale(0.98)' : 'scale(1)' }}
      >
        <div className={`pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300 ${isPressed ? 'opacity-20' : 'opacity-10'}`}>
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000" />
        </div>
        {children}
      </button>
    </div>
  );
}

// ─── Weather Hook (Open-Meteo) ────────────────
function useWeather(lat, lon) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchWeather = useCallback(async () => {
    if (!lat || !lon) return;
    setLoading(true); setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weathercode,apparent_temperature&wind_speed_unit=kmh&timezone=Asia%2FAmman`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      const c = data.current;
      setWeather({
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        wind: Math.round(c.wind_speed_10m),
        icon: WMO_ICON[c.weathercode] || '🌡️',
        desc: WMO_ARABIC[c.weathercode] || 'غير معروف',
      });
    } catch { setError('تعذّر تحميل الطقس'); }
    finally { setLoading(false); }
  }, [lat, lon]);
  useEffect(() => { fetchWeather(); const id = setInterval(fetchWeather, 600000); return () => clearInterval(id); }, [fetchWeather]);
  return { weather, loading, error };
}

// ─── Weather Widget ───────────────────────────
function WeatherWidget({ site }) {
  const { weather, loading, error } = useWeather(site?.lat, site?.lon);
  if (!site) return null;
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Globe size={10} className="text-purple-400" /> الطقس الآن · Live Weather
        </span>
        <span className="text-[9px] text-slate-500 font-mono">{site.nameEn}</span>
      </div>
      {loading && <div className="flex items-center gap-2 text-slate-500 text-xs"><div className="w-3 h-3 rounded-full border border-purple-500/50 border-t-purple-400 animate-spin" />جاري التحميل...</div>}
      {error && <div className="text-xs text-red-400/70">{error}</div>}
      {weather && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <div className="text-2xl font-black text-yellow-400">{weather.temp}°C</div>
              <div className="text-[10px] text-slate-400">{weather.desc}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-slate-500">يبدو كـ</div>
              <div className="text-sm font-bold text-slate-300">{weather.feelsLike}°C</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Droplets size={12} className="text-blue-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.humidity}%</div>
              <div className="text-[9px] text-slate-500">الرطوبة</div>
            </div>
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Wind size={12} className="text-slate-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.wind}</div>
              <div className="text-[9px] text-slate-500">كم/س</div>
            </div>
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Thermometer size={12} className="text-orange-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.temp}°</div>
              <div className="text-[9px] text-slate-500">حرارة</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Jordan Real Leaflet Map ──────────────────
function makeSiteNeonIcon(emoji, color, isSelected) {
  const size = isSelected ? 32 : 24;
  const innerSize = isSelected ? 18 : 13;
  return L.divIcon({
    className: '',
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(15, 23, 42, 0.7)'};
      border: 2px solid ${isSelected ? '#a855f7' : color};
      box-shadow: 0 0 10px ${isSelected ? '#a855f7' : color}, 0 0 20px ${isSelected ? '#a855f7' : color}80;
      transition: all 0.2s ease-in-out;
    ">
      <span style="font-size: ${innerSize}px; line-height: 1;">${emoji}</span>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapRecenter({ site }) {
  const map = useMap();
  useEffect(() => {
    if (site) {
      map.setView([site.lat, site.lon], 9, { animate: true, duration: 1.2 });
    }
  }, [site, map]);
  return null;
}

function JordanRealMap({ selectedSite, onSelectSite, crowdLevels }) {
  return (
    <MapContainer
      center={[31.18, 35.8]}
      zoom={7.5}
      style={{ height: '100%', width: '100%', background: '#07080a' }}
      zoomControl={false}
      scrollWheelZoom={true}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CartoDB"
      />
      <MapRecenter site={selectedSite} />
      {TOURIST_SITES.map(site => {
        const isSel = selectedSite?.id === site.id;
        const crowd = crowdLevels[site.id] ?? 40;
        const color = crowd < 40 ? '#22c55e' : crowd < 70 ? '#eab308' : '#ef4444';
        const siteIcon = makeSiteNeonIcon(site.emoji, color, isSel);
        
        return (
          <Marker
            key={site.id}
            position={[site.lat, site.lon]}
            icon={siteIcon}
            eventHandlers={{
              click: () => onSelectSite(site),
            }}
          >
            <Popup>
              <div className="text-right font-sans">
                <div className="flex items-center gap-1.5 justify-end font-bold">
                  <span className="text-xs text-white">{site.name}</span>
                  <span>{site.emoji}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">{site.nameEn}</div>
                <div className="text-[9px] mt-1.5 flex items-center gap-1 justify-end" style={{ color }}>
                  <span>% {crowd} · {crowd < 40 ? 'هادئ' : crowd < 70 ? 'متوسط' : 'مزدحم'}</span>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}


// ─── Site Detail Card ─────────────────────────
function SiteDetailCard({ site, crowdLevel, onBack }) {
  const typeColors = { heritage: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', nature: 'text-green-400 bg-green-500/10 border-green-500/20', adventure: 'text-orange-400 bg-orange-500/10 border-orange-500/20', religious: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  const typeLabels = { heritage: 'تراث', nature: 'طبيعة', adventure: 'مغامرة', religious: 'ديني' };
  const crowdColor = crowdLevel < 40 ? '#22c55e' : crowdLevel < 70 ? '#eab308' : '#ef4444';
  const crowdLabel = crowdLevel < 40 ? 'هادئ' : crowdLevel < 70 ? 'متوسط' : 'مزدحم';
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer"><ArrowLeft size={14} /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{site.emoji}</span>
            <h3 className="text-base font-black text-white">{site.name}</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeColors[site.type] || ''}`}>{typeLabels[site.type] || site.type}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{site.nameEn}</p>
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <p className="text-xs text-slate-300 leading-relaxed text-right">{site.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[['سعر الدخول', site.entryFee, 'text-yellow-400 text-sm font-black'], ['أوقات العمل', site.openHours, 'text-[11px] font-bold text-slate-300'], ['متوسط الزيارة', `${site.avgVisitHours} ساعة`, 'text-sm font-black text-purple-400'], ['ذروة الازدحام', site.crowdPeakHour, 'text-[11px] font-bold text-slate-300']].map(([label, val, cls], i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="text-[9px] text-slate-500 mb-1">{label}</div>
            <div className={cls}>{val}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 font-bold">مستوى الازدحام الآن</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: crowdColor }}>{crowdLevel}% · {crowdLabel}</span>
        </div>
        <div className="h-2 w-full bg-[#050608] rounded-full overflow-hidden border border-white/5">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${crowdLevel}%`, background: `linear-gradient(to right, #a855f7, ${crowdColor})`, boxShadow: `0 0 8px ${crowdColor}60` }} />
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5 backdrop-blur-xl">
        <div className="text-[10px] text-slate-400 font-bold mb-2.5 flex items-center gap-1.5"><Star size={10} className="text-yellow-400" /> أبرز المعالم</div>
        <div className="flex flex-wrap gap-1.5">
          {site.highlights.map((h, i) => <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">{h}</span>)}
        </div>
      </div>
      <WeatherWidget site={site} />
    </motion.div>
  );
}

// ─── Tourism Panel ────────────────────────────
function TourismPanel() {
  const [selectedSite, setSelectedSite] = useState(TOURIST_SITES[0]);
  const [crowdLevels, setCrowdLevels] = useState(() =>
    Object.fromEntries(TOURIST_SITES.map(s => [s.id, Math.floor(Math.random() * 55) + 15]))
  );
  useEffect(() => {
    const id = setInterval(() => {
      setCrowdLevels(prev => {
        const next = { ...prev };
        TOURIST_SITES.forEach(s => { next[s.id] = Math.min(95, Math.max(5, (prev[s.id] ?? 40) + (Math.random() > 0.5 ? 1 : -1))); });
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]">قطاع السياحة · Jordan Tourism Portal</span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">استكشف المواقع السياحية الأردنية</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2c2d31] to-[#121315] border border-[#3c3e44] flex items-center justify-center shadow-md"><Compass size={20} /></div>
      </div>
      <div className="bg-gradient-to-r from-purple-900/30 to-yellow-600/10 border border-purple-500/30 rounded-2xl p-3.5 flex gap-3.5 items-center backdrop-blur-xl">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0"><CheckCircle2 size={20} className="text-purple-400 animate-pulse" /></div>
        <div className="min-w-0">
          <span className="text-[9px] text-purple-400 font-mono tracking-widest uppercase block">QR Code Scan Successful · IOT Smart Tourism</span>
          <h4 className="text-sm font-bold text-white">{selectedSite ? `${selectedSite.name} · ${selectedSite.nameEn}` : 'البترا · مسار السيق الأثري'}</h4>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-1 text-[9px] text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full"><Zap size={9} /> متصل</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl relative overflow-hidden">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5"><MapPin size={10} className="text-purple-400" /> خريطة الأردن التفاعلية</span>
              <span className="text-[9px] text-slate-500 font-mono">{TOURIST_SITES.length} موقع</span>
            </div>
            <div className="relative z-10 h-80 lg:h-[340px] w-full rounded-xl overflow-hidden border border-white/5 shadow-inner" style={{ isolation: 'isolate' }}>
              <JordanRealMap selectedSite={selectedSite} onSelectSite={setSelectedSite} crowdLevels={crowdLevels} />
            </div>
            <div className="relative z-10 flex items-center justify-center gap-4 mt-3 text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> هادئ</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> متوسط</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> مزدحم</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg space-y-1.5">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">المواقع المتاحة</span>
            {TOURIST_SITES.map(site => {
              const crowd = crowdLevels[site.id] ?? 40;
              const cc = crowd < 40 ? '#22c55e' : crowd < 70 ? '#eab308' : '#ef4444';
              return (
                <button key={site.id} onClick={() => setSelectedSite(site)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left cursor-pointer transition-all duration-200 border ${selectedSite?.id === site.id ? 'bg-purple-500/10 border-purple-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10 text-slate-400'}`}>
                  <span className="text-base shrink-0">{site.emoji}</span>
                  <span className="text-xs font-semibold flex-1 truncate">{site.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cc }} />
                  <ChevronRight size={12} className={selectedSite?.id === site.id ? 'text-purple-400' : 'text-slate-600'} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedSite
              ? <SiteDetailCard key={selectedSite.id} site={selectedSite} crowdLevel={crowdLevels[selectedSite.id] ?? 40} onBack={() => setSelectedSite(null)} />
              : <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3"><Compass size={36} className="text-purple-500/30" /><p className="text-sm">اختر موقعاً من الخريطة أو القائمة</p></motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Transport Panel with Real Leaflet Map + FloatingPaths ────
function TransportPanel({ busSeats, busEta, busProgress, busSpeed }) {
  // Amman weather for transport panel
  const { weather: ammanWeather } = useWeather(31.9454, 35.9284);

  const getPos = (t) => {
    const total = BUS_ROUTE.length - 1;
    const seg = Math.min(Math.floor(t * total), total - 1);
    const segT = (t * total) - seg;
    const a = BUS_ROUTE[seg];
    const b = BUS_ROUTE[seg + 1] || BUS_ROUTE[total];
    return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
  };
  const busPos = getPos(busProgress);

  return (
    <div className="space-y-6">
      {/* Sector Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            قطاع النقل · Public Transit
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">تتبع باص إربد - عمان</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2c2d31] to-[#121315] border border-[#3c3e44] flex items-center justify-center shadow-md">
          <Navigation size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Real Leaflet Map with FloatingPaths ── */}
        <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          {/* Animated paths overlay */}
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-3">
            <span className="text-xs font-bold text-slate-300">مسار الحافلة الحي · Live Route</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[10px] text-purple-400 font-mono font-bold tracking-wide">GPS · تتبع حي</span>
            </div>
          </div>

          {/* Map */}
          <div className="relative z-10 h-64 sm:h-80 w-full" style={{ isolation: 'isolate' }}>
            <MapContainer
              center={[32.25, 35.9]}
              zoom={9}
              style={{ height: '100%', width: '100%', background: '#07080a' }}
              zoomControl={false}
              scrollWheelZoom={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; CartoDB"
              />
              {/* Route polyline */}
              <Polyline
                positions={BUS_ROUTE}
                color="#a855f7"
                weight={4}
                opacity={0.7}
                dashArray="8 4"
              />
              {/* Irbid marker */}
              <Marker position={BUS_ROUTE[0]} icon={PURPLE_ICON}>
                <Popup className="leaflet-dark-popup">
                  <span style={{ color: '#a855f7', fontWeight: 'bold' }}>🏁 إربد (نقطة الانطلاق)</span>
                </Popup>
              </Marker>
              {/* Jerash stop */}
              <Marker position={BUS_ROUTE[1]} icon={YELLOW_ICON}>
                <Popup><span style={{ color: '#eab308', fontWeight: 'bold' }}>🏟️ توقف جرش</span></Popup>
              </Marker>
              {/* Amman marker */}
              <Marker position={BUS_ROUTE[3]} icon={PURPLE_ICON}>
                <Popup><span style={{ color: '#a855f7', fontWeight: 'bold' }}>🏁 عمان (الوجهة)</span></Popup>
              </Marker>
              {/* Live bus */}
              <MovingBus progress={busProgress} />
            </MapContainer>
          </div>

          {/* Footer info */}
          <div className="relative z-10 flex justify-between items-center px-5 py-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <MapPin size={10} className="text-slate-600" />
              <span>
                {busProgress < 0.33 ? 'قرب إربد' : busProgress < 0.66 ? 'منطقة جرش' : 'قرب عمان'}
              </span>
            </div>
            {ammanWeather && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>{ammanWeather.icon}</span>
                <span className="font-bold text-yellow-400">{ammanWeather.temp}°C</span>
                <span className="text-slate-500">عمان</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Column ── */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-purple-500/30 transition-all shadow-lg backdrop-blur-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] relative overflow-hidden">
              <FloatingPaths position={0.5} />
              <span className="relative z-10 text-xs text-slate-400 font-bold">المقاعد المتاحة</span>
              <div className="relative z-10 flex items-end gap-2 mt-2">
                <span className="text-3xl font-extrabold text-purple-400">{busSeats}</span>
                <span className="text-xs text-slate-400 font-semibold mb-1">مقاعد شاغرة</span>
              </div>
              <div className="relative z-10 h-1.5 w-full bg-[#050608] rounded-full mt-3 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-purple-500 to-yellow-400 transition-all duration-500" style={{ width: `${(busSeats / 8) * 100}%` }} />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-500/30 transition-all shadow-lg backdrop-blur-xl hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] relative overflow-hidden">
              <FloatingPaths position={-0.5} />
              <span className="relative z-10 text-xs text-slate-400 font-bold">وقت الوصول المقدر</span>
              <div className="relative z-10 flex items-end gap-1.5 mt-2">
                <span className="text-3xl font-extrabold text-yellow-400">{busEta}</span>
                <span className="text-xs text-slate-400 font-medium mb-1">دقائق</span>
              </div>
              <span className="relative z-10 text-[10px] text-slate-500 mt-2 block">المسافة: 82 كم · {busSpeed} كم/س</span>
            </div>
          </div>

          {/* Trip details */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3.5 shadow-lg backdrop-blur-xl relative overflow-hidden flex-1">
            <FloatingPaths position={0.3} />
            <h3 className="relative z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">تفاصيل الرحلة · Trip Details</h3>
            {[
              { label: 'رقم الحافلة', value: 'IRBID-BUS-82X', color: 'text-purple-400 font-mono' },
              { label: 'سعر التذكرة', value: '1.85 JOD', color: 'text-yellow-400' },
              { label: 'المحطة القادمة', value: busProgress < 0.35 ? 'جرش (توقف 5 د)' : busProgress < 0.7 ? 'الزرقاء' : 'محطة عبدلي', color: 'text-slate-300' },
              { label: 'حالة الحافلة', value: '🟢 تسير بشكل طبيعي', color: 'text-green-400 text-xs' },
            ].map((r, i) => (
              <div key={i} className={`relative z-10 flex justify-between items-center text-sm ${i < 3 ? 'border-b border-white/5 pb-2' : ''}`}>
                <span className="text-slate-400">{r.label}</span>
                <span className={`font-medium ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <FloatingPaths position={-0.3} />
            <div className="relative z-10 flex justify-between text-[10px] text-slate-500 mb-2 font-mono">
              <span>🏁 إربد</span>
              <span>🏟️ جرش</span>
              <span>🏁 عمان</span>
            </div>
            <div className="relative z-10 h-3 w-full bg-[#050608] rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-yellow-400 rounded-full"
                style={{ boxShadow: '0 0 10px rgba(168,85,247,0.5)' }}
                animate={{ width: `${busProgress * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
            <div className="relative z-10 flex justify-between text-[9px] text-slate-600 mt-1">
              <span>الانطلاق</span>
              <span className="text-purple-400 font-bold">{Math.round(busProgress * 100)}% مكتمل</span>
              <span>الوصول</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Customer App View ───────────────────
export default function CustomerAppView({ user, logout, setPortalMode }) {
  const [activeTab, setActiveTab] = useState('transport');
  const [busSeats, setBusSeats] = useState(4);
  const [busEta, setBusEta] = useState(10);
  const [busProgress, setBusProgress] = useState(0.4);
  const [busSpeed, setBusSpeed] = useState(72);
  const [queueNo] = useState(7);
  const [currentServing, setCurrentServing] = useState(5);
  const [waitTime, setWaitTime] = useState(14);
  const [glucose, setGlucose] = useState(96);
  const [bloodPressure, setBloodPressure] = useState({ sys: 121, dia: 81 });
  const [heartRate, setHeartRate] = useState(74);

  useEffect(() => {
    const interval = setInterval(() => {
      setBusProgress(p => { const n = p + 0.007; return n > 1 ? 0 : n; });
      setBusEta(p => { if (p <= 1) return 45; return Math.random() > 0.6 ? p - 1 : p; });
      setBusSeats(p => { const n = p + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0); return n < 1 ? 1 : n > 8 ? 8 : n; });
      setBusSpeed(p => { const n = p + Math.floor((Math.random() - 0.5) * 6); return n < 40 ? 40 : n > 100 ? 100 : n; });
      setCurrentServing(p => { if (p >= 6) return 1; return Math.random() > 0.85 ? p + 1 : p; });
      setGlucose(p => p + (Math.random() > 0.5 ? 1 : -1));
      setBloodPressure(p => ({ sys: p.sys + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0), dia: p.dia + (Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0) }));
      setHeartRate(p => p + Math.floor((Math.random() - 0.5) * 4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const diff = queueNo - currentServing;
    setWaitTime(diff > 0 ? diff * 6 + Math.floor(Math.random() * 3) : 0);
  }, [currentServing, queueNo]);

  const healthHistory = [
    { name: '08:00', glucose: 92, bp: 118 },
    { name: '10:00', glucose: 105, bp: 122 },
    { name: '12:00', glucose: 98, bp: 120 },
    { name: '14:00', glucose, bp: bloodPressure.sys },
  ];

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col items-center justify-start p-0 sm:p-6 md:p-10 font-sans selection:bg-purple-500/30">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-[600px] h-[600px] bg-yellow-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-6xl bg-gradient-to-b from-[#121316] to-[#08090b] border border-[#212328] sm:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative min-h-[750px]">

        {/* Header */}
        <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#1f2126] bg-[#0c0d10]/95 backdrop-blur-md sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#2e3035] to-[#121315] border border-[#3e4148] flex items-center justify-center text-slate-300 overflow-hidden shrink-0 shadow-inner">
              {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={18} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-200 tracking-tight truncate">{user?.displayName || 'Client Account'}</h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider">GATEWAY · SECURITY LEVEL 1</p>
            </div>
          </div>
          <div className="hidden md:flex bg-gradient-to-b from-[#090a0c] to-[#131417] p-1.5 rounded-2xl border border-[#212328] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] shrink-0">
            {[
              { id: 'transport', label: '🚌 النقل', icon: <Navigation2 size={11} className={activeTab==='transport'?'rotate-45 text-purple-400':''} /> },
              { id: 'health', label: '🏥 الصحة', icon: <CloudSun size={11} className={activeTab==='health'?'text-purple-400':''} /> },
              { id: 'tourism', label: '🗺️ السياحة', icon: <Compass size={11} className={activeTab==='tourism'?'text-yellow-400':''} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab===tab.id ? 'bg-gradient-to-b from-[#3a3c41] via-[#24262a] to-[#151619] border-t border-white/10 border-b border-black/80 text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PremiumMetalButton onClick={() => setPortalMode('student')} className="h-9 px-3 rounded-xl">
              <Code size={12} className="mr-1 text-slate-400" /><span>Sandbox</span>
            </PremiumMetalButton>
            <button onClick={logout} className="p-2.5 bg-gradient-to-b from-[#2e3035] to-[#121315] hover:bg-red-500/10 border border-[#3e4148] hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer shadow-md" title="Sign Out">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8 space-y-6">
          <AnimatePresence mode="wait">

            {/* ══ TRANSPORT ══ */}
            {activeTab === 'transport' && (
              <motion.div key="transport" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                <TransportPanel busSeats={busSeats} busEta={busEta} busProgress={busProgress} busSpeed={busSpeed} />
              </motion.div>
            )}

            {/* ══ HEALTH ══ */}
            {activeTab === 'health' && (
              <motion.div key="health" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]">قطاع الصحة · Healthcare</span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">الرعاية الصحية والمراقبة المنزلية</h2>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2c2d31] to-[#121315] border border-[#3c3e44] flex items-center justify-center shadow-md"><Heart size={20} /></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-xl backdrop-blur-xl flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div><span className="text-xs text-purple-400 font-bold">المركز الصحي الحالي</span><h3 className="text-base font-bold text-white mt-1">عيادات إربد التخصصية</h3></div>
                      <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full">مفتوح</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 border-t border-b border-white/5 py-6">
                      <div className="text-center"><span className="text-[11px] text-slate-400">رقم دورك</span><div className="text-5xl font-black text-white mt-1.5 relative inline-block">{queueNo}<span className="absolute -top-1 -right-2.5 w-1.5 h-1.5 rounded-full bg-purple-500" /></div></div>
                      <div className="text-center border-l border-white/5"><span className="text-[11px] text-slate-400">الرقم المستدعى</span><div className="text-5xl font-black text-yellow-400 mt-1.5 animate-pulse">{currentServing}</div></div>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock size={14} className="text-slate-500" /><span>وقت الانتظار:</span></div>
                      <span className="text-xs font-bold text-yellow-400 bg-[#050608] border border-white/5 px-3 py-1.5 rounded-xl shadow-inner font-mono">{waitTime > 0 ? `${waitTime} دقيقة` : 'دورك الآن!'}</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl backdrop-blur-xl">
                    <div className="flex justify-between items-center">
                      <div><h3 className="text-sm font-bold text-slate-200">المراقبة الصحية المنزلية</h3><p className="text-[10px] text-slate-500">البث الحي لحساسات IoT المنزلية</p></div>
                      <div className="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20"><Activity size={10} /><span>بث متصل</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[{label:'مستوى السكر',value:glucose,unit:'mg/dL',status:'طبيعي',color:'text-purple-400'},{label:'ضغط الدم',value:`${bloodPressure.sys}/${bloodPressure.dia}`,unit:'mmHg',status:'طبيعي',color:'text-yellow-400'},{label:'نبضات القلب',value:heartRate,unit:'BPM',status:'مستقر',color:'text-purple-400'}].map((v,i)=>(
                        <div key={i} className="bg-[#050608]/70 border border-white/5 rounded-2xl p-4 text-center shadow-inner">
                          <span className="text-[10px] text-slate-400 block mb-1">{v.label}</span>
                          <span className={`text-xl font-bold ${v.color}`}>{v.value}</span>
                          <span className="text-[9px] text-slate-500 block font-mono">{v.unit}</span>
                          <span className="mt-1.5 text-[8px] font-bold text-slate-400 bg-slate-900 py-0.5 rounded block">{v.status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-semibold text-slate-400 block">المخطط البياني (السكر والضغط)</span>
                      <div className="h-32 bg-[#050608]/90 border border-white/5 rounded-2xl p-3 shadow-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={healthHistory} margin={{ top: 2, right: 2, left: -25, bottom: 2 }}>
                            <XAxis dataKey="name" fontSize={8} stroke="#ffffff20" tickLine={false} />
                            <YAxis fontSize={8} stroke="#ffffff20" tickLine={false} domain={[60, 150]} />
                            <Line type="monotone" dataKey="glucose" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="bp" stroke="#eab308" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ TOURISM ══ */}
            {activeTab === 'tourism' && (
              <motion.div key="tourism" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                <TourismPanel />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-20 bg-[#0c0d10] border-t border-[#1b1c1f] flex justify-around items-center px-4 z-20 shadow-inner">
          {[
            { id: 'transport', icon: <Navigation2 size={18} className={activeTab==='transport'?'rotate-45 text-purple-400':''} />, label: 'النقل' },
            { id: 'health', icon: <Heart size={18} className={activeTab==='health'?'text-purple-400':''} />, label: 'الصحة' },
            { id: 'tourism', icon: <Compass size={18} className={activeTab==='tourism'?'text-yellow-400':''} />, label: 'السياحة' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 cursor-pointer transition-colors ${activeTab===tab.id?(tab.id==='tourism'?'text-yellow-400 font-bold':'text-purple-400 font-bold'):'text-slate-500'}`}>
              {tab.icon}
              <span className="text-[9px] font-bold">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
