import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Compass, Heart, Activity,
  LogOut, Code, User, Navigation, Navigation2,
  CheckCircle2, Thermometer, Droplets, Wind, Clock, Star,
  ChevronRight, ArrowLeft, Zap, Globe, CloudSun, ShieldAlert,
  Maximize2, Minimize2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TOURIST_SITES, WMO_ARABIC, WMO_ICON } from '../data/jordanData';
import { BUS_ROUTES, getAllRoutes, STATS } from '../data/busRoutes';
import { TRANSLATIONS } from '../data/translations';
import { AdvancedMap } from './AdvancedMap';

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

// Irbid–Amman waypoints (lat/lon) - Traced Highway 35 road coordinates
const BUS_ROUTE = [
  [32.5556, 35.8500], // Yarmouk University (Irbid)
  [32.5450, 35.8520], // Southern Irbid Exit
  [32.5250, 35.8550], // Near Al-Sareeh
  [32.5020, 35.8580], // Near Al-Husn
  [32.4750, 35.8620], // Al-Husn Circle
  [32.4450, 35.8700], // Near Shatana
  [32.4150, 35.8820], // Near Kitim
  [32.3880, 35.8920], // Balila Entrance
  [32.3650, 35.8980], // Balila Center
  [32.3420, 35.9020], // Near Thughrat al-Asfour
  [32.3150, 35.9050], // Jerash Governorate Border
  [32.2980, 35.9050], // Jerash North Entrance
  [32.2850, 35.9030], // Near Hadrian's Arch
  [32.2700, 35.8980], // Jerash South Exit
  [32.2500, 35.8920], // Near Zarqa River Bridge
  [32.2320, 35.8880], // King Talal Dam road junction
  [32.2050, 35.8780], // Mastaba Area
  [32.1800, 35.8650], // Near Qafqafa Junction
  [32.1550, 35.8520], // Near Al-Mastaba
  [32.1320, 35.8450], // Near Al-Alouk Junction
  [32.1100, 35.8380], // Near Ayn al-Basha (North)
  [32.0850, 35.8300], // Ayn al-Basha Center
  [32.0620, 35.8420], // Baq'a Camp Area
  [32.0450, 35.8650], // Abu Nseir Junction
  [32.0300, 35.8880], // Jubaiha area
  [32.0120, 35.9080], // Yajouz Junction (Amman North)
  [31.9950, 35.9180], // Tabarbour North Bus Station
  [31.9810, 35.9060], // Sports City Circle
  [31.9650, 35.9150], // Interior Circle (Gamal Abdel Nasser Square)
  [31.9520, 35.9230], // Abdali Area (Amman Center)
  [31.9454, 35.9284], // Amman Downtown (Al-Balad)
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
      markerRef.current.bindPopup('<b>Bus Tracker</b><br/>Live GPS Feed');
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
        desc: WMO_ARABIC[c.weathercode] || 'Weather Info',
      });
    } catch { setError('Weather error'); }
    finally { setLoading(false); }
  }, [lat, lon]);
  useEffect(() => { fetchWeather(); const id = setInterval(fetchWeather, 600000); return () => clearInterval(id); }, [fetchWeather]);
  return { weather, loading, error };
}

// ─── Weather Widget ───────────────────────────
function WeatherWidget({ site, t }) {
  const { weather, loading, error } = useWeather(site?.lat, site?.lon);
  if (!site) return null;
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Globe size={10} className="text-purple-400" /> {t.weatherNow}
        </span>
        <span className="text-[9px] text-slate-500 font-mono">{site.nameEn}</span>
      </div>
      {loading && <div className="flex items-center gap-2 text-slate-500 text-xs"><div className="w-3 h-3 rounded-full border border-purple-500/50 border-t-purple-400 animate-spin" />{t.loading}</div>}
      {error && <div className="text-xs text-red-400/70">{t.failedWeather}</div>}
      {weather && !loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <div className="text-2xl font-black text-yellow-400">{weather.temp}°C</div>
              <div className="text-[10px] text-slate-400">{weather.desc}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-slate-500">{t.feelsLike}</div>
              <div className="text-sm font-bold text-slate-300">{weather.feelsLike}°C</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Droplets size={12} className="text-blue-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.humidity}%</div>
              <div className="text-[9px] text-slate-500">{t.humidity}</div>
            </div>
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Wind size={12} className="text-slate-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.wind}</div>
              <div className="text-[9px] text-slate-500">{t.windSpeed}</div>
            </div>
            <div className="bg-[#050608]/70 rounded-xl p-2.5 text-center border border-white/5">
              <Thermometer size={12} className="text-orange-400 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-300">{weather.temp}°</div>
              <div className="text-[9px] text-slate-500">{t.temp}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom site marker builder ──────────────────
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

// ─── Site Detail Card ─────────────────────────
function SiteDetailCard({ site, crowdLevel, onBack, t }) {
  const typeColors = { heritage: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', nature: 'text-green-400 bg-green-500/10 border-green-500/20', adventure: 'text-orange-400 bg-orange-500/10 border-orange-500/20', religious: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  const typeLabels = { heritage: t.heritage, nature: t.nature, adventure: t.adventure, religious: t.religious };
  const crowdColor = crowdLevel < 40 ? '#22c55e' : crowdLevel < 70 ? '#eab308' : '#ef4444';
  const crowdLabel = crowdLevel < 40 ? t.calm : crowdLevel < 70 ? t.moderate : t.crowded;

  const siteName = t.sites?.[site.id]?.name || site.name;
  const siteDesc = t.sites?.[site.id]?.desc || site.description;
  const siteHighlights = t.sites?.[site.id]?.highlights || site.highlights;

  const getTranslatedEntryFee = (fee) => {
    if (fee === 'مجاني' || fee === 'Free') return t.freeEntry;
    if (t.dir === 'ltr') {
      return fee.replace('دينار', 'JOD').replace('المنتجعات', 'Resorts');
    } else {
      return fee.replace('JOD', 'دينار').replace('Resorts', 'المنتجعات');
    }
  };

  const getTranslatedOpenHours = (hours) => {
    if (hours === 'طوال الساعة' || hours === '24/7') return t.twentyFourSeven;
    if (t.dir === 'ltr') {
      return hours.replace('طوال الساعة', '24/7');
    }
    return hours;
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer">
          <ArrowLeft size={14} className={t.dir === 'rtl' ? 'rotate-180' : ''} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{site.emoji}</span>
            <h3 className="text-base font-black text-white">{siteName}</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${typeColors[site.type] || ''}`}>{typeLabels[site.type] || site.type}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{site.nameEn}</p>
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
        <p className="text-xs text-slate-300 leading-relaxed text-start">{siteDesc}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          [t.entryFee, getTranslatedEntryFee(site.entryFee), 'text-yellow-400 text-sm font-black'],
          [t.openHours, getTranslatedOpenHours(site.openHours), 'text-[11px] font-bold text-slate-300'],
          [t.avgVisit, `${site.avgVisitHours} ${t.visitHoursUnit}`, 'text-sm font-black text-purple-400'],
          [t.crowdPeak, site.crowdPeakHour, 'text-[11px] font-bold text-slate-300']
        ].map(([label, val, cls], i) => (
          <div key={i} className="bg-white/[0.02] border border-white/10 rounded-xl p-3 backdrop-blur-xl">
            <div className="text-[9px] text-slate-500 mb-1">{label}</div>
            <div className={cls}>{val}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 font-bold">{t.crowdLevelNow}</span>
          <span className="text-[10px] font-bold font-mono" style={{ color: crowdColor }}>{crowdLevel}% · {crowdLabel}</span>
        </div>
        <div className="h-2 w-full bg-[#050608] rounded-full overflow-hidden border border-white/5">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${crowdLevel}%`, background: `linear-gradient(to right, #a855f7, ${crowdColor})`, boxShadow: `0 0 8px ${crowdColor}60` }} />
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3.5 backdrop-blur-xl">
        <div className="text-[10px] text-slate-400 font-bold mb-2.5 flex items-center gap-1.5"><Star size={10} className="text-yellow-400" /> {t.notableLandmarks}</div>
        <div className="flex flex-wrap gap-1.5">
          {siteHighlights.map((h, i) => <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">{h}</span>)}
        </div>
      </div>
      <WeatherWidget site={site} t={t} />
    </motion.div>
  );
}

// ─── Tourism Panel ────────────────────────────
function TourismPanel({ t, lang }) {
  const [selectedSite, setSelectedSite] = useState(TOURIST_SITES[0]);
  const [crowdLevels, setCrowdLevels] = useState(() =>
    Object.fromEntries(TOURIST_SITES.map(s => [s.id, Math.floor(Math.random() * 55) + 15]))
  );
  const [tourismStreetPath, setTourismStreetPath] = useState([]);
  const [loadingTourismPath, setLoadingTourismPath] = useState(false);
  const [tourismMapFullscreen, setTourismMapFullscreen] = useState(false);

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

  useEffect(() => {
    if (!selectedSite) {
      setTourismStreetPath([]);
      return;
    }
    
    let isMounted = true;
    setLoadingTourismPath(true);
    
    const fetchTourismPath = async () => {
      try {
        const startPoint = [31.9454, 35.9284]; // Amman Center
        const url = `https://router.project-osrm.org/route/v1/driving/${startPoint[1]},${startPoint[0]};${selectedSite.lon},${selectedSite.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM tourism route failed');
        
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          const geojsonCoords = data.routes[0].geometry.coordinates;
          const mappedCoords = geojsonCoords.map(c => [c[1], c[0]]);
          setTourismStreetPath(mappedCoords);
        }
      } catch (error) {
        console.error('Error fetching tourism OSRM route:', error);
        if (isMounted) {
          setTourismStreetPath([[31.9454, 35.9284], [selectedSite.lat, selectedSite.lon]]);
        }
      } finally {
        if (isMounted) setLoadingTourismPath(false);
      }
    };
    
    fetchTourismPath();
    
    return () => {
      isMounted = false;
    };
  }, [selectedSite]);

  const selectedSiteName = selectedSite ? (t.sites?.[selectedSite.id]?.name || selectedSite.name) : '';
  const selectedSiteNameEn = selectedSite ? selectedSite.nameEn : '';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
            {t.tourismHeader}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{t.exploreSites}</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2c2d31] to-[#121315] border border-[#3c3e44] flex items-center justify-center shadow-md"><Compass size={20} /></div>
      </div>
      <div className="bg-gradient-to-r from-purple-900/30 to-yellow-600/10 border border-purple-500/30 rounded-2xl p-3.5 flex gap-3.5 items-center backdrop-blur-xl">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0"><CheckCircle2 size={20} className="text-purple-400 animate-pulse" /></div>
        <div className="min-w-0">
          <span className="text-[9px] text-purple-400 font-mono tracking-widest uppercase block">{t.scanSuccess}</span>
          <h4 className="text-sm font-bold text-white">{selectedSite ? `${selectedSiteName} · ${selectedSiteNameEn}` : ''}</h4>
        </div>
        <div className="ml-auto shrink-0 flex items-center gap-1 text-[9px] text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full"><Zap size={9} /> {t.connected}</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-xl relative overflow-hidden">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
            <div className="relative z-10 flex items-center justify-between mb-3 gap-2">
              <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 truncate"><MapPin size={10} className="text-purple-400 shrink-0" /> {t.interactiveMap}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">{TOURIST_SITES.length} {t.sitesCountUnit}</span>
                <button
                  type="button"
                  onClick={() => setTourismMapFullscreen(v => !v)}
                  title={tourismMapFullscreen ? t.exitFullscreen : t.fullscreen}
                  aria-label={tourismMapFullscreen ? t.exitFullscreen : t.fullscreen}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white border border-white/10 hover:border-purple-500/40 bg-white/5 transition-all cursor-pointer"
                >
                  {tourismMapFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  <span className="hidden sm:inline">{tourismMapFullscreen ? t.exitFullscreen : t.fullscreen}</span>
                </button>
              </div>
            </div>
            <div className="relative z-10 h-80 lg:h-[340px] w-full rounded-xl overflow-hidden border border-white/5 shadow-inner" style={{ isolation: 'isolate' }}>
              <AdvancedMap
                center={selectedSite ? [selectedSite.lat, selectedSite.lon] : [31.18, 35.8]}
                zoom={selectedSite ? 10 : 7.5}
                enableClustering={true}
                enableSearch={true}
                isFullscreen={tourismMapFullscreen}
                onFullscreenChange={setTourismMapFullscreen}
                t={t}
                onMarkerClick={(marker) => setSelectedSite(TOURIST_SITES.find(s => s.id === marker.id))}
                markers={TOURIST_SITES.map(site => {
                  const isSel = selectedSite?.id === site.id;
                  const crowd = crowdLevels[site.id] ?? 40;
                  const color = crowd < 40 ? '#22c55e' : crowd < 70 ? '#eab308' : '#ef4444';
                  const crowdStatus = crowd < 40 ? t.calm : crowd < 70 ? t.moderate : t.crowded;
                  return {
                    id: site.id,
                    position: [site.lat, site.lon],
                    icon: makeSiteNeonIcon(site.emoji, color, isSel),
                    popup: {
                      title: `${t.sites?.[site.id]?.name || site.name} ${site.emoji}`,
                      content: `${t.sites?.[site.id]?.desc || site.description} (${t.crowdLevelNow}: ${crowd}% · ${crowdStatus})`
                    }
                  };
                })}
                polylines={selectedSite && tourismStreetPath.length > 0 ? [
                  {
                    id: `tourism-route-${selectedSite.id}`,
                    positions: tourismStreetPath,
                    style: {
                      color: '#a855f7',
                      weight: 4,
                      opacity: 0.9,
                      dashArray: '3 5'
                    },
                    popup: lang === 'ar' ? `مسار السفر إلى ${t.sites?.[selectedSite.id]?.name || selectedSite.name}` : `Travel route to ${selectedSite.nameEn}`
                  }
                ] : []}
              />
            </div>
            <div className="relative z-10 flex items-center justify-center gap-4 mt-3 text-[9px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {t.calm}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> {t.moderate}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {t.crowded}</span>
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 backdrop-blur-xl shadow-lg space-y-1.5 text-start">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block mb-2">{t.availSitesList}</span>
            {TOURIST_SITES.map(site => {
              const crowd = crowdLevels[site.id] ?? 40;
              const cc = crowd < 40 ? '#22c55e' : crowd < 70 ? '#eab308' : '#ef4444';
              const nameTrans = t.sites?.[site.id]?.name || site.name;
              return (
                <button key={site.id} onClick={() => setSelectedSite(site)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-start cursor-pointer transition-all duration-200 border ${selectedSite?.id === site.id ? 'bg-purple-500/10 border-purple-500/30 text-white' : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10 text-slate-400'}`}>
                  <span className="text-base shrink-0">{site.emoji}</span>
                  <span className="text-xs font-semibold flex-1 truncate">{nameTrans}</span>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cc }} />
                  <ChevronRight size={12} className={`${selectedSite?.id === site.id ? 'text-purple-400' : 'text-slate-600'} ${t.dir === 'rtl' ? 'rotate-180' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedSite
              ? <SiteDetailCard key={selectedSite.id} site={selectedSite} crowdLevel={crowdLevels[selectedSite.id] ?? 40} onBack={() => setSelectedSite(null)} t={t} />
              : <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-64 text-slate-600 gap-3"><Compass size={36} className="text-purple-500/30" /><p className="text-sm">{t.chooseSitePrompt}</p></motion.div>
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Bus Route Card ───────────────────────────
function BusRouteCard({ route, cityColor, isSelected, onClick, t }) {
  const statusColor = route.active ? '#22c55e' : '#94a3b8';
  return (
    <button
      onClick={onClick}
      className={`w-full text-start p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/10 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor, boxShadow: route.active ? `0 0 6px ${statusColor}` : 'none' }} />
          <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md`} style={{ color: cityColor, background: `${cityColor}15`, border: `1px solid ${cityColor}30` }}>{route.id}</span>
          {route.brt && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">{t.brtFast}</span>}
          {route.intercity && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">{t.intercityLabel}</span>}
        </div>
        <span className="text-[9px] text-slate-500 shrink-0">{route.fare} {t.fareUnit}</span>
      </div>
      <div className="mt-1.5">
        <p className="text-xs font-semibold text-slate-200 truncate">{route.short}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{route.frequency} · {route.stops.length} {t.stopsLabel}</p>
      </div>
    </button>
  );
}

// ─── Route Detail Panel ───────────────────────
function RouteDetailPanel({ route, cityColor, onBack, t }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-purple-500/40 transition-all cursor-pointer">
          <ArrowLeft size={14} className={t.dir === 'rtl' ? 'rotate-180' : ''} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ color: cityColor, background: `${cityColor}15`, border: `1px solid ${cityColor}30` }}>{route.id}</span>
            {route.brt && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{t.brtFast}</span>}
            {route.intercity && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">{t.intercityLabel}</span>}
            {!route.active && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-400">{t.stoppedLabel}</span>}
          </div>
          <h3 className="text-sm font-black text-white mt-1">{route.name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t.fareLabel, value: `${route.fare} ${t.fareUnit}`, color: 'text-yellow-400' },
          { label: t.freqLabel, value: route.frequency, color: 'text-purple-400' },
          { label: t.stopsLabel, value: `${route.stops.length} ${t.stopsLabel}`, color: 'text-slate-300' },
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-slate-500 mb-1">{item.label}</div>
            <div className={`text-xs font-bold ${item.color}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-2 text-start">
        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><MapPin size={10} className="text-purple-400" /> {t.stopsLabel}</span>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {route.stops.map((stop, i) => (
            <div key={i} className={`flex items-center gap-2.5 text-xs ${stop.main ? 'text-white' : 'text-slate-400'}`}>
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-2 h-2 rounded-full border ${stop.main ? 'border-purple-400 bg-purple-400/30' : 'border-slate-600 bg-slate-700'}`} style={stop.main ? { boxShadow: `0 0 6px ${cityColor}` } : {}} />
                {i < route.stops.length - 1 && <div className="w-px h-4 bg-slate-700/50" />}
              </div>
              <span className={stop.main ? 'font-semibold' : ''}>{stop.name}</span>
              {stop.main && <span className="text-[9px] text-purple-400/70 mr-auto">{t.mainStopLabel}</span>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Transport Panel with Real Leaflet Map + FloatingPaths ────
function TransportPanel({ busSeats, busEta, busProgress, busSpeed, t, lang }) {
  const { weather: ammanWeather } = useWeather(31.9454, 35.9284);
  const [selectedCity, setSelectedCity] = useState('irbid');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [streetPath, setStreetPath] = useState([]);
  const [loadingStreetPath, setLoadingStreetPath] = useState(false);
  const [busMapFullscreen, setBusMapFullscreen] = useState(false);

  const cityData = BUS_ROUTES[selectedCity];
  const cityRoutes = cityData?.routes || [];

  useEffect(() => {
    const activeRoute = selectedRoute || cityRoutes[0];
    if (!activeRoute || !activeRoute.stops || activeRoute.stops.length < 2) {
      setStreetPath([]);
      return;
    }

    let isMounted = true;
    setLoadingStreetPath(true);

    const fetchStreetPath = async () => {
      try {
        const coordsString = activeRoute.stops
          .map(s => `${s.lng},${s.lat}`)
          .join(';');
        
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM route fetch failed');
        
        const data = await response.json();
        if (isMounted && data.routes && data.routes.length > 0) {
          const geojsonCoords = data.routes[0].geometry.coordinates;
          const mappedCoords = geojsonCoords.map(c => [c[1], c[0]]);
          setStreetPath(mappedCoords);
        }
      } catch (error) {
        console.error('Error fetching OSRM road path:', error);
        if (isMounted) {
          setStreetPath(activeRoute.stops.map(s => [s.lat, s.lng]));
        }
      } finally {
        if (isMounted) setLoadingStreetPath(false);
      }
    };

    fetchStreetPath();

    return () => {
      isMounted = false;
    };
  }, [selectedRoute, selectedCity, cityRoutes]);

  return (
    <div className="space-y-6">
      {/* Sector Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            {t.transitHeader}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">{t.busNetwork}</h2>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#2c2d31] to-[#121315] border border-[#3c3e44] flex items-center justify-center shadow-md">
          <Navigation size={20} />
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.totalRoutes, value: STATS.totalRoutes, color: 'text-purple-400' },
          { label: t.brtRoutes, value: STATS.brtRoutes, color: 'text-cyan-400' },
          { label: t.intercityRoutes, value: STATS.intercityRoutes, color: 'text-orange-400' },
          { label: t.avgFare, value: `${STATS.avgFare} ${t.fareUnit}`, color: 'text-yellow-400' },
        ].map((s, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 relative overflow-hidden">
            <FloatingPaths position={i % 2 === 0 ? 0.3 : -0.3} />
            <div className="relative z-10 text-[9px] text-slate-500 mb-1">{s.label}</div>
            <div className={`relative z-10 text-xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Map + City Selector ── */}
        <div className="space-y-4">
          {/* City Tabs */}
          <div className="flex gap-2">
            {Object.entries(BUS_ROUTES).map(([key, city]) => {
              const translatedCityName = key === 'irbid' ? t.cityIrbid : key === 'amman' ? t.cityAmman : t.cityZarqa;
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedCity(key); setSelectedRoute(null); }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedCity === key
                      ? 'text-white border-transparent'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                  style={selectedCity === key ? { background: `${city.color}20`, borderColor: `${city.color}50`, color: city.color, boxShadow: `0 0 12px ${city.color}20` } : {}}
                >
                  {translatedCityName}
                </button>
              );
            })}
          </div>

          {/* Live Map */}
          <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
            <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2 gap-2">
              <span className="text-xs font-bold text-slate-300 truncate">{t.liveRoute}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span className="text-[10px] text-purple-400 font-mono font-bold hidden sm:inline">{t.gpsTracking}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBusMapFullscreen(v => !v)}
                  title={busMapFullscreen ? t.exitFullscreen : t.fullscreen}
                  aria-label={busMapFullscreen ? t.exitFullscreen : t.fullscreen}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white border border-white/10 hover:border-purple-500/40 bg-white/5 transition-all cursor-pointer"
                >
                  {busMapFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  <span className="hidden sm:inline">{busMapFullscreen ? t.exitFullscreen : t.fullscreen}</span>
                </button>
              </div>
            </div>
            <div className="relative z-10 h-64 sm:h-72 w-full" style={{ isolation: 'isolate' }}>
              <AdvancedMap
                center={cityData?.center || [31.9454, 35.9284]}
                zoom={selectedCity === 'irbid' ? 11 : selectedCity === 'zarqa' ? 11 : 10}
                enableClustering={false}
                enableSearch={false}
                isFullscreen={busMapFullscreen}
                onFullscreenChange={setBusMapFullscreen}
                t={t}
                polylines={[
                  // Draw all background routes as semi-transparent thin dashed lines
                  ...cityRoutes
                    .filter(r => !selectedRoute || r.id !== selectedRoute.id)
                    .map(r => ({
                      id: r.id,
                      positions: r.stops.map(s => [s.lat, s.lng]),
                      style: {
                        color: `${cityData.color}50`,
                        weight: 2,
                        opacity: 0.45,
                        dashArray: '3 5'
                      },
                      popup: r.name
                    })),
                  // Draw the active selected route as a thick, glowing, snapped-to-streets polyline!
                  {
                    id: selectedRoute?.id || 'active-transit-route',
                    positions: streetPath.length > 0 ? streetPath : (selectedRoute || cityRoutes[0]).stops.map(s => [s.lat, s.lng]),
                    style: {
                      color: cityData.color,
                      weight: 5,
                      opacity: 0.95
                    },
                    popup: (selectedRoute || cityRoutes[0]).name
                  },
                  // Our Amman-Irbid tracker highway route
                  {
                    id: 'live-tracker-highway',
                    positions: BUS_ROUTE,
                    style: {
                      color: '#06b6d4',
                      weight: 3.5,
                      opacity: 0.8,
                      dashArray: '6 6'
                    },
                    popup: lang === 'ar' ? 'مسار تتبع باص عمان - إربد الحي' : 'Amman - Irbid Live Tracking Route'
                  }
                ]}
                markers={((selectedRoute || cityRoutes[0])?.stops || []).map((stop, i) => ({
                  position: [stop.lat, stop.lng],
                  icon: stop.main ? makeNeonIcon(cityData.color) : makeNeonIcon('#475569'),
                  popup: {
                    title: stop.name,
                    content: stop.main ? t.mainStopLabel : ''
                  }
                }))}
              >
                {/* Moving bus on selected/first route */}
                <MovingBus progress={busProgress} />
              </AdvancedMap>
            </div>
            <div className="relative z-10 flex justify-between items-center px-4 py-2.5 border-t border-white/5">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <MapPin size={10} className="text-slate-600" />
                <span>{selectedCity === 'irbid' ? t.cityIrbid : selectedCity === 'amman' ? t.cityAmman : selectedCity === 'zarqa' ? t.cityZarqa : ''} · {cityRoutes.filter(r => r.active).length} {t.activeRoutesCount}</span>
              </div>
              {ammanWeather && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>{ammanWeather.icon}</span>
                  <span className="font-bold text-yellow-400">{ammanWeather.temp}°C</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Bus Tracker */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <FloatingPaths position={-0.3} />
            <div className="relative z-10 grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-[9px] text-slate-500">{t.availSeats}</span>
                <div className="flex items-end gap-1 mt-0.5">
                  <span className="text-2xl font-black text-purple-400">{busSeats}</span>
                  <span className="text-[10px] text-slate-500 mb-0.5">{t.seatsUnit}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] text-slate-500">{t.eta}</span>
                <div className="flex items-end gap-1 mt-0.5">
                  <span className="text-2xl font-black text-yellow-400">{busEta}</span>
                  <span className="text-[10px] text-slate-500 mb-0.5">{t.minutesUnit}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10">
              <div className="flex justify-between text-[9px] text-slate-500 mb-1 font-mono">
                <span>🏁 {t.cityIrbid}</span><span>🏟️ {t.sites?.jerash?.name || 'Jerash'}</span><span>🏁 {t.cityAmman}</span>
              </div>
              <div className="h-2.5 w-full bg-[#050608] rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-yellow-400 rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(168,85,247,0.5)' }}
                  animate={{ width: `${busProgress * 100}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>{t.departure}</span>
                <span className="text-purple-400 font-bold">{Math.round(busProgress * 100)}% {t.completed} · {busSpeed} {t.windSpeed}</span>
                <span>{t.arrival}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Routes List / Detail ── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 backdrop-blur-xl shadow-xl min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {selectedRoute ? (
              <RouteDetailPanel key="detail" route={selectedRoute} cityColor={cityData.color} onBack={() => setSelectedRoute(null)} t={t} />
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.routesOfCity} {selectedCity === 'irbid' ? t.cityIrbid : selectedCity === 'amman' ? t.cityAmman : selectedCity === 'zarqa' ? t.cityZarqa : ''}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{cityRoutes.length} {t.routeCountUnit}</span>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 pr-0.5">
                  {cityRoutes.map(route => (
                    <BusRouteCard
                      key={route.id}
                      route={route}
                      cityColor={cityData.color}
                      isSelected={selectedRoute?.id === route.id}
                      onClick={() => setSelectedRoute(route)}
                      t={t}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
  const [lang, setLang] = useState('ar');

  const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;

  useEffect(() => {
    const interval = setInterval(() => {
      setBusProgress(p => { const n = p + 0.007; return n > 1 ? 0 : n; });
      setBusEta(p => { if (p <= 1) return 45; return Math.random() > 0.6 ? p - 1 : p; });
      setBusSeats(p => { const n = p + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0); return n < 1 ? 1 : n > 8 ? 8 : n; });
      setBusSpeed(p => { const n = p + Math.floor((Math.random() - 0.5) * 6); return n < 40 ? 40 : n > 100 ? 100 : n; });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col items-center justify-start p-0 sm:p-6 md:p-10 font-sans selection:bg-purple-500/30">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/3 w-[600px] h-[600px] bg-yellow-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div dir={t.dir} className="w-full max-w-6xl bg-gradient-to-b from-[#121316] to-[#08090b] border border-[#212328] sm:rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative min-h-[750px] transition-all duration-300">

        {/* Header */}
        <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-[#1f2126] bg-[#0c0d10]/95 backdrop-blur-md sticky top-0 z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#2e3035] to-[#121315] border border-[#3e4148] flex items-center justify-center text-slate-300 overflow-hidden shrink-0 shadow-inner">
              {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <User size={18} />}
            </div>
            <div className="min-w-0 text-start">
              <h1 className="text-sm font-bold text-slate-200 tracking-tight truncate">{user?.displayName || t.clientAccount}</h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider">{t.secLevel}</p>
            </div>
          </div>
          <div className="hidden md:flex bg-gradient-to-b from-[#090a0c] to-[#131417] p-1.5 rounded-2xl border border-[#212328] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] shrink-0">
            {[
              { id: 'transport', label: t.transportTab, icon: <Navigation2 size={11} className={activeTab==='transport'?'rotate-45 text-purple-400':''} /> },
              { id: 'tourism', label: t.tourismTab, icon: <Compass size={11} className={activeTab==='tourism'?'text-yellow-400':''} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${activeTab===tab.id ? 'bg-gradient-to-b from-[#3a3c41] via-[#24262a] to-[#151619] border-t border-white/10 border-b border-black/80 text-white shadow-[0_2px_6px_rgba(0,0,0,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}>
                {tab.icon}<span>{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-[#121316] text-xs font-bold text-slate-300 border border-[#212328] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer focus:border-purple-500/50 transition-all hover:bg-white/[0.02]"
              dir="ltr"
            >
              <option value="ar">🇸🇦 العربية</option>
              <option value="en">🇺🇸 English</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="es">🇪🇸 Español</option>
              <option value="it">🇮🇹 Italiano</option>
            </select>

            <PremiumMetalButton onClick={() => setPortalMode('student')} className="h-9 px-3 rounded-xl">
              <Code size={12} className="mr-1 text-slate-400" /><span>{t.sandboxBtn}</span>
            </PremiumMetalButton>
            <button onClick={logout} className="p-2.5 bg-gradient-to-b from-[#2e3035] to-[#121315] hover:bg-red-500/10 border border-[#3e4148] hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer shadow-md" title={t.signOut}>
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
                <TransportPanel busSeats={busSeats} busEta={busEta} busProgress={busProgress} busSpeed={busSpeed} t={t} lang={lang} />
              </motion.div>
            )}

            {/* ══ TOURISM ══ */}
            {activeTab === 'tourism' && (
              <motion.div key="tourism" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.25 }}>
                <TourismPanel t={t} lang={lang} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-20 bg-[#0c0d10] border-t border-[#1b1c1f] flex justify-around items-center px-4 z-20 shadow-inner">
          {[
            { id: 'transport', icon: <Navigation2 size={18} className={activeTab==='transport'?'rotate-45 text-purple-400':''} />, label: t.transportTab },
            { id: 'tourism', icon: <Compass size={18} className={activeTab==='tourism'?'text-yellow-400':''} />, label: t.tourismTab },
          ].map(tab => {
            const cleanLabel = tab.label.replace('🚌', '').replace('🗺️', '').trim();
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 cursor-pointer transition-colors ${activeTab===tab.id?(tab.id==='tourism'?'text-yellow-400 font-bold':'text-purple-400 font-bold'):'text-slate-500'}`}>
                {tab.icon}
                <span className="text-[9px] font-bold">{cleanLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
