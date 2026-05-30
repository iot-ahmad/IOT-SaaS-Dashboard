import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/** @typedef {import('../config/roles').LogSector} LogSector */

const EnterpriseContext = createContext(null);

const INITIAL_BUSES = [
  { id: 'BUS-101', route: 'إربد - عمان', driver: 'سامر الكردي', battery: 84, speed: 72, passengers: '36/40', status: 'On Route' },
  { id: 'BUS-102', route: 'عمان - العقبة', driver: 'ليث المصري', battery: 14, speed: 85, passengers: '38/40', status: 'Charging' },
  { id: 'BUS-103', route: 'إربد - عمان (السريع)', driver: 'طارق علي', battery: 52, speed: 0, passengers: '0/40', status: 'Idle' },
  { id: 'BUS-104', route: 'عمان - الزرقاء', driver: 'مجد فيصل', battery: 91, speed: 64, passengers: '32/40', status: 'On Route' },
];

const INITIAL_FRIDGES = [
  { id: 'FRIDGE-A1', location: 'مستودع اللقاحات الرئيسي', type: 'Pfizer Covid-19', temp: -72.4, status: 'Stable', range: '-80°C to -60°C' },
  { id: 'FRIDGE-B2', location: 'صيدلية الطوارئ', type: 'Insulin Storage', temp: 4.2, status: 'Stable', range: '2°C to 8°C' },
  { id: 'FRIDGE-C3', location: 'قسم الخداج والولادة', type: 'Blood Bank Refrigerator', temp: 12.8, status: 'Critical', range: '2°C to 8°C' },
];

const INITIAL_GEOFENCE = [
  { id: 'GEO-482', time: '14:28:11', location: 'أعالي صخور الخزنة', tourist: 'مجموعة سياحية (إسبانيا)', severity: 'High' },
  { id: 'GEO-481', time: '14:15:02', location: 'منحدرات الدير الأثرية', tourist: 'سائح منفرد (ألمانيا)', severity: 'Medium' },
  { id: 'GEO-480', time: '13:52:44', location: 'منطقة المذبح المغلقة', tourist: 'سائحان (فرنسا)', severity: 'Low' },
];

export function EnterpriseProvider({ children }) {
  const [buses, setBuses] = useState(INITIAL_BUSES);
  const [fridges, setFridges] = useState(INITIAL_FRIDGES);
  const [fridgeAlertActive, setFridgeAlertActive] = useState(true);
  const [geofenceAlerts, setGeofenceAlerts] = useState(INITIAL_GEOFENCE);
  const [museumFire, setMuseumFire] = useState(false);
  const [museumTemp, setMuseumTemp] = useState(23.5);
  const [oxygenLevel, setOxygenLevel] = useState(20.9);
  const [oxygenAlertActive, setOxygenAlertActive] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [sysTime, setSysTime] = useState(() => new Date().toLocaleTimeString());
  const [logs, setLogs] = useState([
    { id: 1, sector: 'system', text: 'System: Enterprise Command Center initialized.' },
    { id: 2, sector: 'system', text: 'MQTT: Connected to broker-eu.iot365.net:8883' },
    { id: 3, sector: 'transport', text: 'Fleet: All 4 active transit nodes reporting GPS data.' },
    { id: 4, sector: 'tourism', text: 'Alerts: Geofence surveillance active in Petra sector.' },
  ]);
  const [fireWorkflow, setFireWorkflow] = useState({
    detected: false,
    sprinklersActive: false,
    civilDefenseConfirmed: false,
  });

  const appendLog = useCallback((sector, text) => {
    setLogs((prev) => [
      { id: Date.now() + Math.random(), sector, text },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const getLogsForSector = useCallback(
    (sector) => {
      if (sector === 'all') return logs;
      return logs.filter((l) => l.sector === sector || l.sector === 'system');
    },
    [logs],
  );

  useEffect(() => {
    const timer = setInterval(() => setSysTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const dataSim = setInterval(() => {
      setBuses((prev) =>
        prev.map((bus) => {
          if (bus.status === 'On Route') {
            const deltaSpeed = Math.floor((Math.random() - 0.5) * 8);
            const nextSpeed = Math.max(40, Math.min(100, bus.speed + deltaSpeed));
            const nextBattery = Math.max(5, bus.battery - 1);
            if (nextSpeed > 95 && Math.random() > 0.7) {
              appendLog('transport', `${bus.id}: Speed limit exceeded (${nextSpeed} km/h) on ${bus.route}.`);
            }
            return { ...bus, speed: nextSpeed, battery: nextBattery };
          }
          if (bus.status === 'Charging') {
            const nextBattery = Math.min(100, bus.battery + 2);
            return { ...bus, battery: nextBattery, status: nextBattery >= 95 ? 'Idle' : 'Charging' };
          }
          return bus;
        }),
      );

      setFridges((prev) =>
        prev.map((f) => {
          if (f.id === 'FRIDGE-C3' && fridgeAlertActive) {
            const delta = (Math.random() - 0.3) * 0.4;
            return { ...f, temp: parseFloat((f.temp + delta).toFixed(1)) };
          }
          if (f.id === 'FRIDGE-C3' && !fridgeAlertActive) {
            const nextTemp = Math.max(4.5, parseFloat((f.temp - 0.8).toFixed(1)));
            return { ...f, temp: nextTemp, status: nextTemp < 8 ? 'Stable' : 'Critical' };
          }
          const delta = (Math.random() - 0.5) * 0.2;
          return { ...f, temp: parseFloat((f.temp + delta).toFixed(1)) };
        }),
      );

      if (Math.random() > 0.85) {
        const locations = ['المحكمة الأثرية', 'أعالي مسرح البترا', 'منطقة قصر البنت', 'منحدرات السيق'];
        const tourists = ['وفد سياحي (إيطاليا)', 'عائلة (بريطانيا)', 'سائح منفرد (الولايات المتحدة)', 'مجموعة (الأردن)'];
        const severities = ['Medium', 'High', 'Low'];
        const randomLoc = locations[Math.floor(Math.random() * locations.length)];
        const randomTour = tourists[Math.floor(Math.random() * tourists.length)];
        const randomSev = severities[Math.floor(Math.random() * severities.length)];
        const newId = `GEO-${Math.floor(Math.random() * 900) + 100}`;
        const newTime = new Date().toLocaleTimeString();

        setGeofenceAlerts((prev) => [
          { id: newId, time: newTime, location: randomLoc, tourist: randomTour, severity: randomSev },
          ...prev.slice(0, 4),
        ]);
        appendLog('tourism', `Geofence violation at ${randomLoc} — ${randomTour} (${randomSev} risk).`);
      }

      setMuseumTemp((prev) => {
        if (museumFire) return Math.min(115, parseFloat((prev + Math.random() * 6 + 3).toFixed(1)));
        return parseFloat((23.0 + (Math.random() - 0.5) * 0.6).toFixed(1));
      });

      if (!museumFire && Math.random() > 0.95) {
        setMuseumFire(true);
        setFireWorkflow({ detected: true, sprinklersActive: true, civilDefenseConfirmed: false });
        appendLog('safety', '⚠️ FIRE ALARM: Temperature spike at Amman Archaeological Museum!');
        appendLog('safety', 'Auto-response: Sprinkler system activated in main hall.');
      }

      setOxygenLevel((prev) => {
        if (oxygenAlertActive) {
          const next = parseFloat((prev + 0.9).toFixed(1));
          if (next >= 20.9) {
            setOxygenAlertActive(false);
            return 20.9;
          }
          return next;
        }
        const delta = (Math.random() - 0.54) * 0.2;
        const next = parseFloat((prev + delta).toFixed(1));
        if (next < 19.5 && prev >= 19.5) {
          appendLog('safety', `⚠️ Critical oxygen depletion in Warehouse B: ${next}% O2`);
        }
        return Math.max(16.0, next);
      });
    }, 5000);

    return () => clearInterval(dataSim);
  }, [fridgeAlertActive, museumFire, oxygenAlertActive, appendLog]);

  const kpis = useMemo(() => {
    const onRoute = buses.filter((b) => b.status === 'On Route').length;
    const fleetEfficiency = Math.round((onRoute / buses.length) * 70 + buses.reduce((s, b) => s + b.battery, 0) / buses.length * 0.3);
    const stableFridges = fridges.filter((f) => f.status === 'Stable' || (f.id === 'FRIDGE-C3' && !fridgeAlertActive)).length;
    const coolingStability = Math.round((stableFridges / fridges.length) * 100);
    const geofenceCompliance = Math.max(72, 100 - geofenceAlerts.filter((a) => a.severity === 'High').length * 8);
    const safetyScore = museumFire || oxygenLevel < 19.5 ? 34 : 98;

    return {
      transport: { value: fleetEfficiency, label: 'كفاءة الأسطول', sub: `${onRoute}/${buses.length} حافلات على المسار`, warn: fleetEfficiency < 80 },
      healthcare: { value: coolingStability, label: 'استقرار التبريد', sub: fridgeAlertActive ? '1 وحدة تحت السيطرة' : 'جميع الوحدات مستقرة', warn: coolingStability < 80 },
      tourism: { value: geofenceCompliance, label: 'امتثال الأسوار', sub: `${geofenceAlerts.length} اختراقات اليوم`, warn: geofenceCompliance < 85 },
      safety: { value: safetyScore, label: 'جاهزية الطوارئ', sub: museumFire ? 'إنذار حريق نشط' : oxygenLevel < 19.5 ? 'انخفاض O2' : 'أنظمة مستقرة', warn: safetyScore < 70 },
      mqtt: { value: 100, label: 'MQTT SSL', sub: 'Broker: Connected', warn: false },
    };
  }, [buses, fridges, fridgeAlertActive, geofenceAlerts, museumFire, oxygenLevel]);

  const fridgeHistoryData = useMemo(
    () => [
      { time: '14:00', temp: 4.8 },
      { time: '14:05', temp: 5.6 },
      { time: '14:10', temp: 6.9 },
      { time: '14:15', temp: 8.5 },
      { time: '14:20', temp: 11.2 },
      { time: '14:25', temp: fridges[2]?.temp ?? 12 },
    ],
    [fridges],
  );

  const muteFridgeAlert = useCallback(() => {
    setFridgeAlertActive(false);
    appendLog('healthcare', 'Admin: Acknowledged FRIDGE-C3 alarm. Coolant override initiated.');
  }, [appendLog]);

  const triggerSirenBroadcast = useCallback(() => {
    setSirenActive((prev) => {
      const next = !prev;
      appendLog('tourism', next ? 'Virtual siren broadcast triggered for Petra cliff zones.' : 'Virtual siren silenced.');
      return next;
    });
  }, [appendLog]);

  const confirmCivilDefense = useCallback(() => {
    setFireWorkflow((w) => ({ ...w, civilDefenseConfirmed: true }));
    appendLog('safety', 'Admin: Civil Defense dispatch confirmed manually.');
  }, [appendLog]);

  const extinguishFire = useCallback(() => {
    setMuseumFire(false);
    setMuseumTemp(23.5);
    setFireWorkflow({ detected: false, sprinklersActive: false, civilDefenseConfirmed: false });
    appendLog('safety', 'Museum sprinkler system completed. Fire extinguished. Sensors NORMAL.');
  }, [appendLog]);

  const activateVentilation = useCallback(() => {
    setOxygenAlertActive(true);
    appendLog('safety', 'Force ventilation activated in Warehouse B. Oxygen recovery protocol running.');
  }, [appendLog]);

  const simulateFire = useCallback(() => {
    setMuseumFire(true);
    setFireWorkflow({ detected: true, sprinklersActive: true, civilDefenseConfirmed: false });
    appendLog('safety', 'Simulation: Fire detected at Amman Archaeological Museum.');
    appendLog('safety', 'Auto-response: Sprinklers activated.');
  }, [appendLog]);

  const value = {
    buses,
    fridges,
    fridgeAlertActive,
    geofenceAlerts,
    museumFire,
    museumTemp,
    oxygenLevel,
    oxygenAlertActive,
    sirenActive,
    sysTime,
    logs,
    fireWorkflow,
    kpis,
    fridgeHistoryData,
    appendLog,
    getLogsForSector,
    muteFridgeAlert,
    triggerSirenBroadcast,
    confirmCivilDefense,
    extinguishFire,
    activateVentilation,
    simulateFire,
    setMuseumFire,
    setOxygenLevel,
  };

  return <EnterpriseContext.Provider value={value}>{children}</EnterpriseContext.Provider>;
}

export function useEnterprise() {
  const ctx = useContext(EnterpriseContext);
  if (!ctx) throw new Error('useEnterprise must be used within EnterpriseProvider');
  return ctx;
}
