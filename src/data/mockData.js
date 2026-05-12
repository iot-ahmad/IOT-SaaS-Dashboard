export const WORKSPACES = [
  { id: 'home', name: 'Home', icon: 'Home' },
  { id: 'farm', name: 'Al-Mazra\'a Smart Farm', icon: 'Tractor' },
  { id: 'office', name: 'Office', icon: 'Briefcase' }
];

export const TOOLS = [
  { id: 'devices', name: 'Devices', icon: 'Cpu' },
  { id: 'automations', name: 'Automations', icon: 'Zap' },
  { id: 'alerts', name: 'Alerts', icon: 'Bell' },
  { id: 'settings', name: 'Settings', icon: 'Settings' }
];

export const SOIL_MOISTURE_DATA = [
  { time: '00:00', value: 45 },
  { time: '04:00', value: 42 },
  { time: '08:00', value: 38 },
  { time: '12:00', value: 35 },
  { time: '16:00', value: 48 }, // Irrigation happened
  { time: '20:00', value: 46 },
  { time: '24:00', value: 44 }
];

export const AUTOMATIONS = [
  { id: 1, rule: 'If Soil Moisture < 20% -> Turn on Irrigation', active: true },
  { id: 2, rule: 'If Temp > 35°C -> Open Greenhouse Vents', active: true },
  { id: 3, rule: 'If Rain Detected -> Disable Scheduled Irrigation', active: false },
];
