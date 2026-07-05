export const WORKSPACES = [
  { id: 'home', name: 'Home', icon: 'Home' },
  { id: 'hub', name: '🇯🇴 مجتمع الأردن', icon: 'Globe' },
  { id: 'controller', name: 'Universal Controller', icon: 'Gamepad2' }
];

export const TOOLS = [
  { id: 'devices', name: 'Devices', icon: 'Cpu' },
  { id: 'automations', name: 'Automations', icon: 'Zap' },
  { id: 'alerts', name: 'Alerts', icon: 'Bell' },
  { id: 'settings', name: 'Settings', icon: 'Settings' },
  { id: 'developer', name: 'Developer Guide', icon: 'BookOpen' },
];

export const SOIL_MOISTURE_DATA = [
  { time: '00:00', value: 45 },
  { time: '04:00', value: 42 },
  { time: '08:00', value: 38 },
  { time: '12:00', value: 35 },
  { time: '16:00', value: 48 },
  { time: '20:00', value: 46 },
  { time: '24:00', value: 44 }
];

export const AUTOMATIONS = [
  { id: 1, rule: 'If Soil Moisture < 20% → Turn on Irrigation', active: true, trigger: 'farm/soil_moisture', action: 'farm/irrigation', threshold: 20, payload: '1' },
  { id: 2, rule: 'If Temp > 35°C → Open Greenhouse Vents', active: true, trigger: 'farm/greenhouse_temp', action: 'farm/vents', threshold: 35, payload: '1' },
  { id: 3, rule: 'If Rain Detected → Disable Irrigation', active: false, trigger: 'farm/rain_sensor', action: 'farm/irrigation', threshold: 1, payload: '0' },
];

/**
 * @deprecated Static device list used only by the legacy DevicesView in ToolViews.jsx.
 * Real device data is persisted in Firestore and managed by DevicesView.jsx.
 * Do not add new devices here — use the Firestore-backed UI instead.
 */
export const DEVICES = [
  { id: 1, name: 'Main Irrigation Valve', topic: 'farm/irrigation', type: 'Actuator', pin: 'GPIO 25', status: 'Online', battery: '95%', lastSeen: Date.now() },
  { id: 2, name: 'Soil Sensor #01', topic: 'farm/soil_moisture', type: 'Sensor', pin: 'GPIO 34 (ADC)', status: 'Online', battery: '82%', lastSeen: Date.now() },
  { id: 3, name: 'Greenhouse Temp', topic: 'farm/greenhouse_temp', type: 'Sensor', pin: 'GPIO 4 (DHT22)', status: 'Online', battery: 'N/A', lastSeen: Date.now() - 5000 },
  { id: 4, name: 'Water Tank Level', topic: 'farm/water_tank', type: 'Sensor', pin: 'GPIO 35 (ADC)', status: 'Online', battery: 'N/A', lastSeen: Date.now() - 2000 },
  { id: 5, name: 'Water Pump A', topic: 'farm/pump_a', type: 'Motor', pin: 'GPIO 26', status: 'Offline', battery: '0%', lastSeen: Date.now() - 120000 },
  { id: 6, name: 'Greenhouse Vents', topic: 'farm/vents', type: 'Actuator', pin: 'GPIO 27', status: 'Online', battery: 'N/A', lastSeen: Date.now() },
  { id: 7, name: 'Rain Sensor', topic: 'farm/rain_sensor', type: 'Sensor', pin: 'GPIO 32', status: 'Online', battery: '91%', lastSeen: Date.now() - 10000 },
  { id: 8, name: 'Light Sensor', topic: 'farm/light_sensor', type: 'Sensor', pin: 'GPIO 33 (ADC)', status: 'Online', battery: '78%', lastSeen: Date.now() },
];

export const PIN_MAP = [
  { pin: 'GPIO 4', label: 'DHT22 (Temp/Humidity)', color: 'text-rose-400' },
  { pin: 'GPIO 25', label: 'Irrigation Relay', color: 'text-blue-400' },
  { pin: 'GPIO 26', label: 'Water Pump Relay', color: 'text-blue-400' },
  { pin: 'GPIO 27', label: 'Vent Servo', color: 'text-orange-400' },
  { pin: 'GPIO 32', label: 'Rain Sensor (Digital)', color: 'text-cyan-400' },
  { pin: 'GPIO 33', label: 'Light Sensor (ADC)', color: 'text-yellow-400' },
  { pin: 'GPIO 34', label: 'Soil Moisture (ADC)', color: 'text-purple-400' },
  { pin: 'GPIO 35', label: 'Water Tank Level (ADC)', color: 'text-teal-400' },
];
