/**
 * Component Database of common IoT hardware parts
 * Categorized by: MCU, SENSOR, ACTUATOR, POWER, DISPLAY, CONNECTIVITY, OTHER
 */

export const COMPONENT_CATEGORIES = [
  { id: 'ALL', label: 'الكل (All)', color: '#38BDF8' },
  { id: 'MCU', label: 'وحدات تحكم (MCU / Microcontroller)', color: '#38BDF8' },
  { id: 'SENSOR', label: 'حساسات (Sensors)', color: '#22C55E' },
  { id: 'ACTUATOR', label: 'مشغلات ومحركات (Actuators)', color: '#F59E0B' },
  { id: 'DISPLAY', label: 'شاشات ومؤشرات (Displays)', color: '#A855F7' },
  { id: 'POWER', label: 'تغذية وطاقة (Power)', color: '#EC4899' },
  { id: 'CONNECTIVITY', label: 'اتصال وشبكات (Connectivity)', color: '#06B6D4' },
  { id: 'OTHER', label: 'أخرى (Other)', color: '#64748B' },
];

export const COMPONENT_DATABASE = [
  // MCUs
  {
    id: 'esp32-devkit',
    name: 'ESP32 NodeMCU DevKit V1',
    category: 'MCU',
    role: 'وحدة معالجة مركزية تدعم WiFi وBluetooth مع منافذ GPIO رقمية وتناظرية',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3.3V', '5V', 'GND', 'GPIO2', 'GPIO4', 'GPIO5', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'EN', 'VP', 'VN'],
    description: 'لوحة تطوير قوية ثنائية النواة بتردد 240MHz مع دعم كامل لاتصال MQTT وWebSockets.'
  },
  {
    id: 'esp8266-nodemcu',
    name: 'NodeMCU ESP8266 V3',
    category: 'MCU',
    role: 'متحكم اقتصادي يدعم اتصال WiFi مناسب للمشاريع الخفيفة والمنزل الذكي',
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3.3V', 'GND', 'D0 (GPIO16)', 'D1 (GPIO5)', 'D2 (GPIO4)', 'D3 (GPIO0)', 'D4 (GPIO2)', 'D5 (GPIO14)', 'D6 (GPIO12)', 'D7 (GPIO13)', 'D8 (GPIO15)', 'A0'],
    description: 'متحكم WiFi كلاسيكي مثالي للتطبيقات التي تحتاج حساسات قليلة وتكلفة منخفضة.'
  },
  {
    id: 'arduino-uno-r3',
    name: 'Arduino Uno R3',
    category: 'MCU',
    role: 'المتحكم القياسي التعليمي بجهد 5V للمبتدئين ومشاريع الإلكترونيات العامة',
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['5V', '3.3V', 'GND', 'A0', 'A1', 'A2', 'A3', 'A4 (SDA)', 'A5 (SCL)', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13'],
    description: 'لوحة تطوير كلاسيكية تعتمد على معالج ATmega328P متينة وسهلة التوصيل.'
  },
  {
    id: 'raspberry-pi-pico-w',
    name: 'Raspberry Pi Pico W',
    category: 'MCU',
    role: 'معالج ثنائي النواة RP2040 مع شريحة WiFi تدعم برمجة MicroPython وC++',
    imageUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['3V3', 'GND', 'GP0', 'GP1', 'GP2', 'GP3', 'GP4', 'GP5', 'GP14', 'GP15', 'GP16', 'GP17', 'GP26 (ADC0)', 'GP27 (ADC1)', 'GP28 (ADC2)', 'VBUS'],
    description: 'لوحة صغيرة فائقة الأداء من Raspberry Pi مع واجهات I2C وSPI متعددة.'
  },

  // SENSORS
  {
    id: 'dht22',
    name: 'DHT22 / AM2302 (حساس حرارة ورطوبة عالي الدقة)',
    category: 'SENSOR',
    role: 'قياس درجات الحرارة من -40 إلى 80 مئوية والرطوبة النسبية بدقة عالية',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'DATA (Out)', 'NC'],
    description: 'حساس حرارة ورطوبة رقمي يعتمد بروتوكول One-Wire مع مقاومة pull-up مدمجة.'
  },
  {
    id: 'dht11',
    name: 'DHT11 (حساس حرارة ورطوبة اقتصادي)',
    category: 'SENSOR',
    role: 'قياس الحرارة والرطوبة في الأماكن المغلقة للمشاريع التعليمية',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'DATA (Signal)'],
    description: 'خيار منخفض التكلفة لمراقبة المناخ الداخلي.'
  },
  {
    id: 'ultrasonic-hcsr04',
    name: 'HC-SR04 (حساس مسافة بالموجات فوق الصوتية)',
    category: 'SENSOR',
    role: 'قياس المسافات بدقة من 2 سم إلى 400 سم وتفادي العوائق للمركبات',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'TRIG (إطلاق)', 'ECHO (استقبال)'],
    description: 'يطلق موجات فوق صوتية بتردد 40kHz ويحسب زمن الارتداد لمعرفة المسافة بدقة.'
  },
  {
    id: 'soil-moisture-capacitive',
    name: 'حساس رطوبة التربة السعوي (Capacitive Soil Sensor)',
    category: 'SENSOR',
    role: 'قياس مستوى رطوبة التربة لمشاريع الري الذكي دون تآكل كهربائي',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'AOUT (إشارة تناظرية)'],
    description: 'حساس سعوي مقاوم للصدأ يرسل جهد تناظري يتناسب عكسياً مع كمية الماء في التربة.'
  },
  {
    id: 'pir-motion-hc-sr501',
    name: 'حساس الحركة بالأشعة تحت الحمراء (HC-SR501 PIR)',
    category: 'SENSOR',
    role: 'كشف حركة الأجسام والبشر لأنظمة الأمان والإنارة التلقائية',
    imageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'OUT (Digital 3.3V)'],
    description: 'حساس حركة سلبي مزود بعدسة Fresnel ومقاومتين لتعديل الحساسية وزمن التأخير.'
  },
  {
    id: 'mq2-gas-sensor',
    name: 'حساس الغاز والدخان MQ-2',
    category: 'SENSOR',
    role: 'كشف تسرب غاز الطهي (LPG)، الميثان، والدخان للإنذار المبكر من الحرائق',
    imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'AOUT (قيمة كمية)', 'DOUT (عتبة رقمية)'],
    description: 'مستشعر كهروكيميائي يسخن داخلياً لاكتشاف الغازات القابلة للاشتعال.'
  },
  {
    id: 'ds18b20-waterproof',
    name: 'حساس حرارة السوائل ضد الماء DS18B20',
    category: 'SENSOR',
    role: 'قياس درجة حرارة الماء، خزانات التبريد، والتربة المبللة بدقة عالية',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (Red)', 'GND (Black)', 'DATA (Yellow/White)'],
    description: 'حساس رقمي مدمج داخل كبسولة فولاذية مقاومة للماء والصدأ.'
  },

  // ACTUATORS
  {
    id: 'relay-module-1ch',
    name: 'مرحل أحادي القناة (1-Channel 5V Relay Module)',
    category: 'ACTUATOR',
    role: 'عزل كهربائي وتحكم بالأجهزة ذات الجهد العالي 220V مثل المضخات والإنارة',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'IN (Signal)', 'COM', 'NO (Normally Open)', 'NC (Normally Closed)'],
    description: 'مرحل معزول ضوئياً Optocoupler لحماية الميكروكنترولر من التيارات الارتدادية.'
  },
  {
    id: 'relay-module-4ch',
    name: 'مرحل رباعي القنوات (4-Channel Relay Board)',
    category: 'ACTUATOR',
    role: 'التحكم المستقل بـ 4 أجهزة تيار متردد 220V أو تيار مستمر DC',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC', 'GND', 'IN1', 'IN2', 'IN3', 'IN4', 'COM1-4', 'NO1-4'],
    description: 'لوحة ريليهات رباعية مثالية لتوزيع الأحمال في غرف المنزل الذكي.'
  },
  {
    id: 'servo-sg90',
    name: 'محرك سيرفو صغير SG90 Micro Servo (9g)',
    category: 'ACTUATOR',
    role: 'تدوير دقيق بزاوية محددة من 0 إلى 180 درجة لفتح الصمامات والمزاليج',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (Red 5V)', 'GND (Brown)', 'PWM Signal (Orange)'],
    description: 'محرك ميكانيكي صغير يعمل بإشارات PWM للتحكم بالزاوية بدقة متناهية.'
  },
  {
    id: 'l298n-motor-driver',
    name: 'لوحة قيادة المحركات L298N Dual H-Bridge',
    category: 'ACTUATOR',
    role: 'التحكم في سرعة واتجاه محركين DC أو محرك خطوي Stepper Motor للسيارات الذكية',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['12V / 5V In', 'GND', '5V Out', 'IN1', 'IN2', 'IN3', 'IN4', 'ENA (PWM)', 'ENB (PWM)', 'OUT1/2', 'OUT3/4'],
    description: 'دائرة قيادة قوية تدعم حتى 2A لكل قناة لتشغيل عجلات الروبوتات والمركبات الذكية.'
  },
  {
    id: 'water-pump-5v',
    name: 'مضخة مياه غاطسة صغيرة 5V DC Mini Water Pump',
    category: 'ACTUATOR',
    role: 'ضخ المياه لري النباتات أو ملء الخزانات الصغيرة',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['V+ (5V DC)', 'V- (GND)'],
    description: 'مضخة هادئة وصغيرة تستهلك طاقة منخفضة وتضخ حتى 120 لتر/ساعة.'
  },

  // DISPLAYS
  {
    id: 'oled-096-ssd1306',
    name: 'شاشة OLED 0.96 بوصة SSD1306 I2C (128x64)',
    category: 'DISPLAY',
    role: 'عرض قراءات الحساسات وحالة الاتصال والرسوم البيانية المصغرة',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (3.3V-5V)', 'GND', 'SCL (Clock)', 'SDA (Data)'],
    description: 'شاشة واضحة ذات تباين عالي وزاوية رؤية واسعة تحتاج فقط لسلكين للاتصال عبر I2C.'
  },
  {
    id: 'lcd-1602-i2c',
    name: 'شاشة LCD 1602 مع محول I2C (16x2)',
    category: 'DISPLAY',
    role: 'عرض نصوص إرشادية وقراءات رقمية على سطرين',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['VCC (5V)', 'GND', 'SDA', 'SCL'],
    description: 'شاشة LCD كلاسيكية خلفية بإضاءة زرقاء أو خضراء مع متحكم PCF8574 I2C.'
  },

  // POWER
  {
    id: 'battery-18650-tp4056',
    name: 'بطارية ليثيوم 18650 مع شاحن TP4056 وحماية',
    category: 'POWER',
    role: 'تغذية المحطة الذكية بالطاقة المحمولة مع حماية الشحن والتفريغ الزائد',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['IN+ (5V USB)', 'IN- (GND)', 'BAT+', 'BAT-', 'OUT+', 'OUT- (Boosted 5V/3.3V)'],
    description: 'نظام إدارة طاقة متكامل يوفر استقلالية تامة عن المقابس الكهربائية.'
  },
  {
    id: 'solar-panel-5v',
    name: 'لوح شمسي صغير 5V / 1W Solar Panel',
    category: 'POWER',
    role: 'توليد الطاقة الشمسية وإعادة شحن البطارية لمحطات الطقس الخارجية المستقلة',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&auto=format&fit=crop&q=80',
    defaultPins: ['Positive (+)', 'Negative (-)'],
    description: 'خلية شمسية أحادية البلورة مقاومة للعوامل الجوية لتشغيل مستمر في الهواء الطلق.'
  }
];

export const WIRE_COLORS = [
  { id: 'red', name: 'أحمر (VCC / Power)', hex: '#EF4444', textClass: 'text-red-400' },
  { id: 'black', name: 'أسود (GND / Ground)', hex: '#475569', textClass: 'text-slate-400' },
  { id: 'yellow', name: 'أصفر (DATA / Signal)', hex: '#F59E0B', textClass: 'text-amber-400' },
  { id: 'blue', name: 'أزرق (I2C SDA / Control)', hex: '#38BDF8', textClass: 'text-sky-400' },
  { id: 'green', name: 'أخضر (I2C SCL / PWM)', hex: '#22C55E', textClass: 'text-emerald-400' },
  { id: 'orange', name: 'برتقالي (Echo / Trigger)', hex: '#FB923C', textClass: 'text-orange-400' },
  { id: 'purple', name: 'بنفسجي (TX / RX)', hex: '#A855F7', textClass: 'text-purple-400' },
  { id: 'white', name: 'أبيض (Analog / General)', hex: '#E2E8F0', textClass: 'text-slate-200' },
];
