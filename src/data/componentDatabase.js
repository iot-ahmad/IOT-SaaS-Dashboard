/**
 * Component Database of common IoT hardware parts
 * Categorized by: MCU, SENSOR, ACTUATOR, POWER, DISPLAY, CONNECTIVITY, OTHER
 */

export const COMPONENT_CATEGORIES = [
  { id: 'ALL', label: 'All Components', color: '#38BDF8' },
  { id: 'MCU', label: 'Microcontrollers (MCU)', color: '#38BDF8' },
  { id: 'SENSOR', label: 'Sensors', color: '#22C55E' },
  { id: 'ACTUATOR', label: 'Actuators & Motors', color: '#F59E0B' },
  { id: 'DISPLAY', label: 'Displays & Indicators', color: '#A855F7' },
  { id: 'POWER', label: 'Power & Battery', color: '#EC4899' },
  { id: 'CONNECTIVITY', label: 'Connectivity & Networking', color: '#06B6D4' },
  { id: 'OTHER', label: 'Other Parts', color: '#64748B' },
];

export const COMPONENT_DATABASE = [
  // MCUs
  {
    id: 'esp32-devkit',
    name: 'ESP32 NodeMCU DevKit V1',
    category: 'MCU',
    role: 'Dual-core microcontroller with integrated Wi-Fi, Bluetooth BLE, and digital/analog GPIO pins',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3.3V', '5V', 'GND', 'GPIO2', 'GPIO4', 'GPIO5', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'EN', 'VP', 'VN'],
    description: 'High-performance 240MHz dual-core development board with full support for MQTT, HTTPS, and WebSockets.'
  },
  {
    id: 'esp8266-nodemcu',
    name: 'NodeMCU ESP8266 V3',
    category: 'MCU',
    role: 'Cost-effective Wi-Fi microcontroller ideal for lightweight IoT nodes and smart home automation',
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3.3V', 'GND', 'D0 (GPIO16)', 'D1 (GPIO5)', 'D2 (GPIO4)', 'D3 (GPIO0)', 'D4 (GPIO2)', 'D5 (GPIO14)', 'D6 (GPIO12)', 'D7 (GPIO13)', 'D8 (GPIO15)', 'A0'],
    description: 'Classic Wi-Fi development board well-suited for low-cost telemetry and single-sensor applications.'
  },
  {
    id: 'arduino-uno-r3',
    name: 'Arduino Uno R3',
    category: 'MCU',
    role: 'Standard 5V educational microcontroller board for beginners and general electronics prototyping',
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['5V', '3.3V', 'GND', 'A0', 'A1', 'A2', 'A3', 'A4 (SDA)', 'A5 (SCL)', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    description: 'Rugged, easy-to-wire ATmega328P development board with extensive library support.'
  },
  {
    id: 'raspberry-pi-pico-w',
    name: 'Raspberry Pi Pico W',
    category: 'MCU',
    role: 'RP2040 dual-core ARM Cortex-M0+ microcontroller with onboard Wi-Fi supporting MicroPython and C/C++',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3V3', 'GND', 'GP0', 'GP1', 'GP2', 'GP3', 'GP4', 'GP5', 'GP14', 'GP15', 'GP16', 'GP17', 'GP26 (ADC0)', 'GP27 (ADC1)', 'GP28 (ADC2)', 'VBUS'],
    description: 'Compact, high-performance board from Raspberry Pi featuring Programmable I/O (PIO) and multiple I2C/SPI buses.'
  },

  // SENSORS
  {
    id: 'dht22',
    name: 'DHT22 / AM2302 Precision Temp & Humidity Sensor',
    category: 'SENSOR',
    role: 'Measures ambient temperature (-40°C to +80°C) and relative humidity with high accuracy',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'DATA (Out)', 'NC'],
    description: 'Calibrated digital temperature and humidity sensor using a single-wire serial protocol.'
  },
  {
    id: 'dht11',
    name: 'DHT11 Basic Temp & Humidity Sensor',
    category: 'SENSOR',
    role: 'Indoor temperature and humidity monitoring for starter and educational projects',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'DATA (Signal)'],
    description: 'Budget-friendly digital sensor for basic indoor climate tracking.'
  },
  {
    id: 'ultrasonic-hcsr04',
    name: 'HC-SR04 Ultrasonic Distance Sensor',
    category: 'SENSOR',
    role: 'Non-contact distance measurement from 2cm to 400cm for obstacle avoidance and level sensing',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'TRIG (Trigger)', 'ECHO (Receive)'],
    description: 'Emits 40kHz ultrasonic pulses and calculates distance based on time-of-flight echo return.'
  },
  {
    id: 'soil-moisture-capacitive',
    name: 'Capacitive Soil Moisture Sensor v1.2',
    category: 'SENSOR',
    role: 'Measures soil volumetric water content for smart irrigation without electrode corrosion',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'AOUT (Analog Output)'],
    description: 'Corrosion-resistant capacitive probe that outputs an analog voltage inversely proportional to soil moisture.'
  },
  {
    id: 'pir-motion-hc-sr501',
    name: 'HC-SR501 PIR Motion Sensor',
    category: 'SENSOR',
    role: 'Detects infrared heat signatures from human or animal movement for security and smart lighting',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'OUT (Digital 3.3V)'],
    description: 'Passive infrared sensor equipped with a Fresnel dome lens and onboard potentiometers for sensitivity and trigger hold time.'
  },
  {
    id: 'mq2-gas-sensor',
    name: 'MQ-2 Flammable Gas & Smoke Sensor',
    category: 'SENSOR',
    role: 'Detects LPG, propane, methane, hydrogen, and smoke for early fire and leak warning systems',
    imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'AOUT (Analog Concentration)', 'DOUT (Digital Threshold)'],
    description: 'Electrochemical chemiresistor gas sensor with both analog concentration readout and adjustable comparator trigger.'
  },
  {
    id: 'ds18b20-waterproof',
    name: 'DS18B20 Waterproof Temperature Probe',
    category: 'SENSOR',
    role: 'Precision temperature monitoring in liquids, water tanks, hydroponics, and wet soil',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (Red)', 'GND (Black)', 'DATA (Yellow/White)'],
    description: '1-Wire digital thermometer sealed inside a waterproof stainless-steel probe.'
  },

  // ACTUATORS
  {
    id: 'relay-module-1ch',
    name: '1-Channel 5V Opto-Isolated Relay Module',
    category: 'ACTUATOR',
    role: 'Electrical isolation and switching for high-voltage AC (110V/220V) appliances, pumps, and lighting',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'IN (Signal)', 'COM', 'NO (Normally Open)', 'NC (Normally Closed)'],
    description: 'Optocoupler-isolated relay module protecting microcontroller logic pins from inductive flyback spikes.'
  },
  {
    id: 'relay-module-4ch',
    name: '4-Channel 5V Relay Board',
    category: 'ACTUATOR',
    role: 'Independent switching control for up to 4 high-voltage AC or DC electrical loads',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC', 'GND', 'IN1', 'IN2', 'IN3', 'IN4', 'COM1-4', 'NO1-4'],
    description: 'Four-channel relay bank ideal for multi-zone smart home automation and industrial control panels.'
  },
  {
    id: 'servo-sg90',
    name: 'SG90 Micro Servo Motor (9g)',
    category: 'ACTUATOR',
    role: 'Precise angular positioning from 0° to 180° for valves, smart locks, and sensor pan/tilt mounts',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (Red 5V)', 'GND (Brown)', 'PWM Signal (Orange)'],
    description: 'Lightweight geared servo driven by standard 50Hz PWM pulses for accurate angular control.'
  },
  {
    id: 'l298n-motor-driver',
    name: 'L298N Dual H-Bridge Motor Driver',
    category: 'ACTUATOR',
    role: 'Bidirectional speed and direction control for two DC motors or one bipolar stepper motor',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['12V / 5V In', 'GND', '5V Out', 'IN1', 'IN2', 'IN3', 'IN4', 'ENA (PWM)', 'ENB (PWM)', 'OUT1/2', 'OUT3/4'],
    description: 'High-current dual H-Bridge driver board delivering up to 2A per channel for robotics and RC vehicles.'
  },
  {
    id: 'water-pump-5v',
    name: '5V DC Submersible Mini Water Pump',
    category: 'ACTUATOR',
    role: 'Pumps water for automated plant irrigation, hydroponics, and miniature fluid systems',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['V+ (5V DC)', 'V- (GND)'],
    description: 'Low-noise, low-power brush pump capable of delivering up to 120 L/h flow rate.'
  },

  // DISPLAYS
  {
    id: 'oled-096-ssd1306',
    name: '0.96" OLED Display SSD1306 I2C (128x64)',
    category: 'DISPLAY',
    role: 'Displays live sensor telemetry, Wi-Fi connection status, and compact graphical widgets',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'SCL (Clock)', 'SDA (Data)'],
    description: 'High-contrast self-illuminating monochrome graphical display requiring only two I2C data pins.'
  },
  {
    id: 'lcd-1602-i2c',
    name: '1602 Character LCD with I2C Backpack (16x2)',
    category: 'DISPLAY',
    role: 'Displays two lines of alphanumeric status messages and sensor readouts',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'SDA', 'SCL'],
    description: 'Classic 16x2 backlit LCD module paired with a PCF8574 I2C expander to reduce pin usage.'
  },

  // POWER
  {
    id: 'battery-18650-tp4056',
    name: '18650 Li-Ion Battery Pack with TP4056 Charger',
    category: 'POWER',
    role: 'Provides portable rechargeable power with overcharge and deep-discharge protection',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['IN+ (5V USB)', 'IN- (GND)', 'BAT+', 'BAT-', 'OUT+', 'OUT- (Boosted 5V/3.3V)'],
    description: 'Complete battery management unit enabling off-grid operation for remote IoT nodes.'
  },
  {
    id: 'solar-panel-5v',
    name: '5V / 1W Monocrystalline Mini Solar Panel',
    category: 'POWER',
    role: 'Harvests solar energy to trickle-charge battery packs for outdoor weather and agricultural stations',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['Positive (+)', 'Negative (-)'],
    description: 'Weatherproof monocrystalline photovoltaic panel for continuous outdoor autonomous operation.'
  }
];

export const WIRE_COLORS = [
  { id: 'red', name: 'Red (VCC / Power)', hex: '#EF4444', textClass: 'text-red-400' },
  { id: 'black', name: 'Black (GND / Ground)', hex: '#475569', textClass: 'text-slate-400' },
  { id: 'yellow', name: 'Yellow (DATA / Signal)', hex: '#F59E0B', textClass: 'text-amber-400' },
  { id: 'blue', name: 'Blue (I2C SDA / Control)', hex: '#38BDF8', textClass: 'text-sky-400' },
  { id: 'green', name: 'Green (I2C SCL / PWM)', hex: '#22C55E', textClass: 'text-emerald-400' },
  { id: 'orange', name: 'Orange (Echo / Trigger)', hex: '#FB923C', textClass: 'text-orange-400' },
  { id: 'purple', name: 'Purple (TX / RX)', hex: '#A855F7', textClass: 'text-purple-400' },
  { id: 'white', name: 'White (Analog / General)', hex: '#E2E8F0', textClass: 'text-slate-200' },
];
