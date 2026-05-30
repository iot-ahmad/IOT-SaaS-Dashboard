import React, { useState, useEffect } from 'react';
import { 
  Bus, Thermometer, ShieldAlert, AlertCircle, LogOut, Radio, 
  MapPin, BellRing, RefreshCw, Volume2, Shield, Activity,
  Database, Battery, Users, ArrowUpRight, CheckCircle, Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function EnterpriseDashboard({ user, logout }) {
  // Simulator States
  const [buses, setBuses] = useState([
    { id: 'BUS-101', route: 'إربد - عمان', driver: 'سامر الكردي', battery: 84, speed: 72, passengers: '36/40', status: 'On Route' },
    { id: 'BUS-102', route: 'عمان - العقبة', driver: 'ليث المصري', battery: 14, speed: 85, passengers: '38/40', status: 'Charging' },
    { id: 'BUS-103', route: 'إربد - عمان (السريع)', driver: 'طارق علي', battery: 52, speed: 0, passengers: '0/40', status: 'Idle' },
    { id: 'BUS-104', route: 'عمان - الزرقاء', driver: 'مجد فيصل', battery: 91, speed: 64, passengers: '32/40', status: 'On Route' },
  ]);

  const [fridges, setFridges] = useState([
    { id: 'FRIDGE-A1', location: 'مستودع اللقاحات الرئيسي', type: 'Pfizer Covid-19', temp: -72.4, status: 'Stable', range: '-80°C to -60°C' },
    { id: 'FRIDGE-B2', location: 'صيدلية الطوارئ', type: 'Insulin Storage', temp: 4.2, status: 'Stable', range: '2°C to 8°C' },
    { id: 'FRIDGE-C3', location: 'قسم الخداج والولادة', type: 'Blood Bank Refrigerator', temp: 12.8, status: 'Critical', range: '2°C to 8°C' },
  ]);

  const [fridgeAlertActive, setFridgeAlertActive] = useState(true);
  const [geofenceAlerts, setGeofenceAlerts] = useState([
    { id: 'GEO-482', time: '14:28:11', location: 'أعالي صخور الخزنة', tourist: 'مجموعة سياحية (إسبانيا)', severity: 'High' },
    { id: 'GEO-481', time: '14:15:02', location: 'منحدرات الدير الأثرية', tourist: 'سائح منفرد (ألمانيا)', severity: 'Medium' },
    { id: 'GEO-480', time: '13:52:44', location: 'منطقة المذبح المغلقة', tourist: 'سائحان (فرنسا)', severity: 'Low' },
  ]);

  const [activeSection, setActiveSection] = useState('all'); // 'all', 'transport', 'health', 'tourism'
  const [sysTime, setSysTime] = useState(new Date().toLocaleTimeString());
  const [sirenActive, setSirenActive] = useState(false);
  const [logs, setLogs] = useState([
    'System: Enterprise Command Center initialized.',
    'MQTT: Connected to broker-eu.iot365.net:8883',
    'Fleet: All 4 active transit nodes reporting GPS data.',
    'Alerts: Geofence surveillance active in Petra sector.'
  ]);

  // Interval-based live changes
  useEffect(() => {
    const timer = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString());
    }, 1000);

    const dataSim = setInterval(() => {
      // 1. Randomly update bus details
      setBuses(prev => prev.map(bus => {
        if (bus.status === 'On Route') {
          const deltaSpeed = Math.floor((Math.random() - 0.5) * 8);
          const nextSpeed = Math.max(40, Math.min(100, bus.speed + deltaSpeed));
          const nextBattery = Math.max(5, bus.battery - 1);
          return { ...bus, speed: nextSpeed, battery: nextBattery };
        } else if (bus.status === 'Charging') {
          const nextBattery = Math.min(100, bus.battery + 2);
          const nextStatus = nextBattery >= 95 ? 'Idle' : 'Charging';
          return { ...bus, battery: nextBattery, status: nextStatus };
        }
        return bus;
      }));

      // 2. Fridge C3 temperature fluctuates
      setFridges(prev => prev.map(f => {
        if (f.id === 'FRIDGE-C3' && fridgeAlertActive) {
          const delta = (Math.random() - 0.3) * 0.4;
          return { ...f, temp: parseFloat((f.temp + delta).toFixed(1)) };
        } else if (f.id === 'FRIDGE-C3' && !fridgeAlertActive) {
          // If alert is muted/resolved, cool it back down to stable limits
          const nextTemp = Math.max(4.5, parseFloat((f.temp - 0.8).toFixed(1)));
          return { ...f, temp: nextTemp, status: nextTemp < 8 ? 'Stable' : 'Critical' };
        }
        // Small fluctuation for healthy fridges
        const delta = (Math.random() - 0.5) * 0.2;
        return { ...f, temp: parseFloat((f.temp + delta).toFixed(1)) };
      }));

      // 3. Geofence violation occasionally pops up
      if (Math.random() > 0.85) {
        const locations = ['المحكمة الأثرية', 'أعالي مسرح البترا', 'منطقة قصر البنت', 'منحدرات السيق'];
        const tourists = ['وفد سياحي (إيطاليا)', 'عائلة (بريطانيا)', 'سائح منفرد (الولايات المتحدة)', 'مجموعة (الأردن)'];
        const severities = ['Medium', 'High', 'Low'];
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        const randomTour = tourists[Math.floor(Math.random() * tourists.length)];
        const randomSev = severities[Math.floor(Math.random() * severities.length)];
        const newId = `GEO-${Math.floor(Math.random() * 900) + 100}`;
        const newTime = new Date().toLocaleTimeString();

        setGeofenceAlerts(prev => [
          { id: newId, time: newTime, location: randomLoc, tourist: randomTour, severity: randomSev },
          ...prev.slice(0, 4) // keep last 5
        ]);

        setLogs(prev => [
          `Surveillance: Geofence violation detected at ${randomLoc} by ${randomTour}.`,
          ...prev.slice(0, 9)
        ]);
      }

    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(dataSim);
    };
  }, [fridgeAlertActive]);

  // Recharts vaccine temperature history chart data
  const fridgeHistoryData = [
    { time: '14:00', temp: 4.8 },
    { time: '14:05', temp: 5.6 },
    { time: '14:10', temp: 6.9 },
    { time: '14:15', temp: 8.5 },
    { time: '14:20', temp: 11.2 },
    { time: '14:25', temp: fridges[2].temp },
  ];

  // Acknowledge fridge alert
  const muteFridgeAlert = () => {
    setFridgeAlertActive(false);
    setLogs(prev => [
      'Admin: Acknowledged FRIDGE-C3 temperature alarm. Initiating coolant override.',
      ...prev.slice(0, 9)
    ]);
  };

  const triggerSirenBroadcast = () => {
    setSirenActive(prev => !prev);
    const text = !sirenActive 
      ? 'Surveillance: Virtual siren broadcast triggered for all Petra cliff zones.'
      : 'Surveillance: Virtual siren silenced.';
    setLogs(prev => [text, ...prev.slice(0, 9)]);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 p-6 md:p-10 font-sans relative overflow-hidden">
      
      {/* High-tech grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Command Wrapper */}
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Top Control Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Database size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Command Center
                </h1>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded uppercase tracking-wider">
                  Enterprise Admin
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1">مركز التحكم والتحليل الموحد للمؤسسات والشركات العامة</p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t border-slate-800 md:border-none pt-4 md:pt-0">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-300 font-mono">{sysTime}</div>
              <div className="text-[10px] text-slate-500 font-mono">Date: 2026-05-30</div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>خروج النظام</span>
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>أسطول باصات النقل</span>
              <Bus size={14} className="text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">12 مركبة</div>
            <div className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1">
              <Activity size={10} />
              <span>100% نشط وجاهز للتشغيل</span>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>ثلاجات اللقاحات والأدوية</span>
              <Thermometer size={14} className="text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">3 وحدات تبريد</div>
            <div className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-semibold">
              <AlertCircle size={10} />
              <span>{fridgeAlertActive ? '1 وحدة حرارة حرجة!' : 'وحدة 1 تحت السيطرة'}</span>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>الأسوار السياحية بالبترا</span>
              <ShieldAlert size={14} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{geofenceAlerts.length} اختراقات</div>
            <div className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
              <BellRing size={10} />
              <span>آخر رصد: منذ دقائق قليلة</span>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-800 transition-colors">
            <div className="flex justify-between items-center text-slate-400 text-xs font-medium">
              <span>بروتوكول البث والاتصال</span>
              <Radio size={14} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">Active SSL</div>
            <div className="text-[10px] text-emerald-400 mt-1.5 flex items-center gap-1 font-mono">
              <span>Broker: Connected</span>
            </div>
          </div>
        </section>

        {/* Sector filtering tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeSection === 'all' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800'}`}
          >
            جميع القطاعات
          </button>
          <button
            onClick={() => setActiveSection('transport')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeSection === 'transport' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800'}`}
          >
            🚌 النقل والمواصلات
          </button>
          <button
            onClick={() => setActiveSection('health')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeSection === 'health' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800'}`}
          >
            🏥 الرعاية الصحية
          </button>
          <button
            onClick={() => setActiveSection('tourism')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${activeSection === 'tourism' ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-slate-800'}`}
          >
            🗺️ السياحة والأسوار
          </button>
        </div>

        {/* Dashboard Modules */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ================= 1. FLEET MANAGEMENT SYSTEM ================= */}
          {(activeSection === 'all' || activeSection === 'transport') && (
            <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Bus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">إدارة حركة الحافلات (أسطول إربد - عمان)</h3>
                    <p className="text-[11px] text-slate-500">مراقبة السرعة، شحنات البطاريات، ونسبة إشغال الركاب</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/10">
                  Live Feed
                </span>
              </div>

              {/* Fleet Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="pb-3 text-right">الحافلة</th>
                      <th className="pb-3">المسار الحالي</th>
                      <th className="pb-3">السائق</th>
                      <th className="pb-3">البطارية</th>
                      <th className="pb-3">السرعة</th>
                      <th className="pb-3">الركاب</th>
                      <th className="pb-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {buses.map((bus) => (
                      <tr key={bus.id} className="text-slate-300 hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 text-right font-bold text-white">{bus.id}</td>
                        <td className="py-3 font-sans text-right">{bus.route}</td>
                        <td className="py-3 font-sans text-right">{bus.driver}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Battery size={13} className={bus.battery < 20 ? 'text-red-400' : 'text-emerald-400'} />
                            <span className={bus.battery < 20 ? 'text-red-400 font-bold' : ''}>{bus.battery}%</span>
                          </div>
                        </td>
                        <td className="py-3">{bus.speed} km/h</td>
                        <td className="py-3 flex items-center gap-1">
                          <Users size={12} className="text-slate-500" />
                          <span>{bus.passengers}</span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            bus.status === 'On Route' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                            bus.status === 'Charging' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {bus.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert('تم إرسال تنبيه الالتزام بالجدول الزمني لجميع سائقي أسطول إربد - عمان.')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2.5 rounded-xl font-bold text-xs transition-colors"
                >
                  📣 بث تنبيه عام للسائقين
                </button>
              </div>
            </div>
          )}

          {/* ================= 2. COLD CHAIN REFRIGERATOR MONITORING ================= */}
          {(activeSection === 'all' || activeSection === 'health') && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <Thermometer size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">تبريد اللقاحات والأدوية</h3>
                    <p className="text-[11px] text-slate-500">حساسات مراقبة حرارة المخازن الدوائية</p>
                  </div>
                </div>
              </div>

              {/* Fridges List */}
              <div className="space-y-3.5">
                {fridges.map((f) => {
                  const isC3 = f.id === 'FRIDGE-C3';
                  const isCritical = f.status === 'Critical' && fridgeAlertActive;
                  return (
                    <div 
                      key={f.id} 
                      className={`border rounded-2xl p-4 transition-all duration-300 ${
                        isCritical 
                          ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200">{f.id}</span>
                            <span className="text-[10px] text-slate-500">({f.type})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans text-right">{f.location}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          isCritical ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isCritical ? 'ALARM' : 'STABLE'}
                        </span>
                      </div>

                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <span className="text-[9px] text-slate-500 font-mono block">Target Range</span>
                          <span className="text-[10px] text-slate-300 font-mono">{f.range}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 font-mono block">Temp</span>
                          <span className={`text-2xl font-black font-mono ${
                            isCritical ? 'text-rose-400' : 'text-slate-100'
                          }`}>{f.temp}°C</span>
                        </div>
                      </div>

                      {/* Action for alerting fridge */}
                      {isC3 && isCritical && (
                        <button
                          onClick={muteFridgeAlert}
                          className="w-full mt-3 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          <span>تأكيد وكتم إنذار الحرارة (Mute Alarm)</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Temperature History Chart */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">منحنى حرارة ثلاجة العناية الخداج (FRIDGE-C3)</span>
                <div className="h-32 w-full bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fridgeHistoryData} margin={{ top: 2, right: 2, left: -25, bottom: 2 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis dataKey="time" fontSize={8} stroke="#ffffff30" />
                      <YAxis fontSize={8} stroke="#ffffff30" domain={[2, 16]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                      <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={2} dot={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. PETRA SURVEILLANCE & GEOFENCING ================= */}
          {(activeSection === 'all' || activeSection === 'tourism') && (
            <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">مراقبة الأسوار الافتراضية الأثرية (البترا)</h3>
                    <p className="text-[11px] text-slate-500">حماية المعالم الجبلية والمقاطع الخطرة عبر الـ Geofencing</p>
                  </div>
                </div>
                
                <button
                  onClick={triggerSirenBroadcast}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    sirenActive 
                      ? 'bg-red-500 text-black border-red-400 animate-pulse' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Volume2 size={12} />
                  <span>{sirenActive ? 'سارينة الإنذار مشتعلة' : 'بث سارينة المنطقة'}</span>
                </button>
              </div>

              {/* Geofence Alerts list */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">سجل الاختراقات المسجلة مؤخراً</h4>
                
                <div className="space-y-2.5">
                  {geofenceAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border bg-slate-950/60 p-4 rounded-2xl flex justify-between items-center transition-colors ${
                        alert.severity === 'High' 
                          ? 'border-red-500/30 hover:border-red-500/50' 
                          : alert.severity === 'Medium' 
                            ? 'border-amber-500/30 hover:border-amber-500/50' 
                            : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 text-right">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          alert.severity === 'High' ? 'bg-red-500/10 text-red-400' :
                          alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          <Shield size={16} />
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block">{alert.time} · ID: {alert.id}</span>
                          <span className="text-xs font-bold text-slate-200 block mt-0.5">{alert.location}</span>
                          <p className="text-[10px] text-slate-400 mt-1 font-sans">{alert.tourist}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        alert.severity === 'High' ? 'bg-red-500/10 text-red-400' :
                        alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {alert.severity} Risk
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. SECURITY LOGS & COMMAND FEEDBACK ================= */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-200">سجل عمليات النظام الموحد</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="h-72 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-[11px] text-slate-400 space-y-2 overflow-y-auto leading-relaxed text-left">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-1.5">
                  <span className="text-slate-600 select-none">[{index}]</span>
                  <span className={log.includes('Alarm') || log.includes('violation') ? 'text-rose-400' : log.includes('Admin') ? 'text-blue-400' : 'text-slate-400'}>
                    {log}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <span>قناة الاتصال MQTT</span>
              <span className="text-emerald-400 font-bold font-mono">active_broker_ssl_secure</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
