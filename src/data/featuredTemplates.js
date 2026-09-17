/**
 * Featured & Template Projects for IOT365 Hub
 * Supports "Use as template" with structure pre-filling.
 */

export const FEATURED_TEMPLATES = [
  {
    id: 'template-weather-station',
    title: 'محطة طقس ذكية متكاملة (IoT Smart Weather Station)',
    summary: 'نظام مراقبة مناخية ذكي يقرأ درجات الحرارة والرطوبة ويرسل البيانات فوراً عبر WiFi إلى لوحة التحكم مع تنبيهات عند الارتفاع.',
    difficulty: 'مبتدئ',
    difficultyColor: '#22C55E',
    is_featured: true,
    timesUsedAsTemplate: 34,
    rating: 4.9,
    author: 'أحمد النجار',
    authorRole: 'IoT Hardware Architect',
    coverImage: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'DHT22', 'OLED', 'Weather', 'WiFi', 'MQTT'],
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'معالجة قراءات الحساسات والاتصال بشبكة WiFi وإرسال حزم MQTT',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'DHT22 / AM2302',
        category: 'SENSOR',
        function: 'قياس درجات الحرارة بدقة ±0.5°C ونسبة الرطوبة الجوية',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: 'شاشة OLED 0.96 بوصة SSD1306',
        category: 'DISPLAY',
        function: 'عرض درجة الحرارة وحالة الطقس وقوة إشارة WiFi محلياً',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: 'بطارية ليثيوم 18650 مع شاحن TP4056',
        category: 'POWER',
        function: 'تغذية المحطة بطاقة مستقلة للاستخدام في الأماكن الخارجية',
        imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'DHT22 / AM2302', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'تغذية الحساس' },
      { id: 'w2', fromComp: 'DHT22 / AM2302', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'الأرضي المشترك' },
      { id: 'w3', fromComp: 'DHT22 / AM2302', fromPin: 'DATA', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO25', color: '#F59E0B', note: 'إشارة القراءة الرقمية' },
      { id: 'w4', fromComp: 'شاشة OLED 0.96 بوصة SSD1306', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'تغذية الشاشة' },
      { id: 'w5', fromComp: 'شاشة OLED 0.96 بوصة SSD1306', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'أرضي الشاشة' },
      { id: 'w6', fromComp: 'شاشة OLED 0.96 بوصة SSD1306', fromPin: 'SDA', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO21', color: '#38BDF8', note: 'I2C Data Bus' },
      { id: 'w7', fromComp: 'شاشة OLED 0.96 بوصة SSD1306', fromPin: 'SCL', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO22', color: '#22C55E', note: 'I2C Clock Bus' }
    ],
    overviewTemplate: `يهدف هذا المشروع إلى بناء محطة طقس ذكية مدمجة ومنخفضة التكلفة لمراقبة المناخ والحرارة بدقة عالية.

### 🌟 المميزات الرئيسية:
- قراءة فورية للحرارة والرطوبة كل ثانيتين.
- إرسال البيانات إلى السحابة عبر بروتوكول MQTT المشفر.
- عرض فوري على شاشة OLED مدمجة.
- وضع السكون العميق (Deep Sleep) لتوفير البطارية.`,
    codeTemplate: `#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>

#define DHTPIN 25
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  Serial.println("Weather Station Initialized!");
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }
  
  Serial.printf("Temp: %.1f C | Humidity: %.1f %%\n", temp, hum);
  delay(3000);
}`
  },

  {
    id: 'template-smart-farm',
    title: 'نظام ري المزرعة الذكية (Automated Smart Farm)',
    summary: 'أتمتة عملية الري اعتماداً على حساسات رطوبة التربة السعوية ومضخة مياه 5V مع جدولة ذكية وحماية ضد الجفاف.',
    difficulty: 'متوسط',
    difficultyColor: '#F59E0B',
    is_featured: true,
    timesUsedAsTemplate: 28,
    rating: 4.8,
    author: 'سارة المهدي',
    authorRole: 'Embedded Systems Specialist',
    coverImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'Soil Moisture', 'Relay', 'Water Pump', 'Automation'],
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'مراقبة مستوى رطوبة التربة والتحكم الآلي بتشغيل مضخة الري',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'حساس رطوبة التربة السعوي',
        category: 'SENSOR',
        function: 'قياس نسبة تشبع التربة بالماء عبر إشارة تناظرية دقيقة',
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: 'مرحل أحادي القناة 5V Relay',
        category: 'ACTUATOR',
        function: 'تشغيل وفصل مضخة الري وعزل دائرة الجهد العالي',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: 'مضخة مياه غاطسة 5V DC',
        category: 'ACTUATOR',
        function: 'سحب الماء من الخزان وضخه إلى شبكة التنقيط للنباتات',
        imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'حساس رطوبة التربة السعوي', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'تغذية الحساس' },
      { id: 'w2', fromComp: 'حساس رطوبة التربة السعوي', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'أرضي' },
      { id: 'w3', fromComp: 'حساس رطوبة التربة السعوي', fromPin: 'AOUT', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO34 (ADC)', color: '#E2E8F0', note: 'قراءة تناظرية' },
      { id: 'w4', fromComp: 'مرحل أحادي القناة 5V Relay', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '5V (VIN)', color: '#EF4444', note: 'تغذية الريليه 5V' },
      { id: 'w5', fromComp: 'مرحل أحادي القناة 5V Relay', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'أرضي' },
      { id: 'w6', fromComp: 'مرحل أحادي القناة 5V Relay', fromPin: 'IN', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO26', color: '#22C55E', note: 'إشارة التحكم في المضخة' }
    ],
    overviewTemplate: `نظام ري ذاتي يضمن الحفاظ على رطوبة التربة المثالية للنباتات دون هدر للمياه.

### 🌿 أهداف المشروع:
- قراءة نسبة الرطوبة بشكل متواصل وتحديد عتبة الجفاف.
- تشغيل المضخة تلقائياً لمدة محددة عند انخفاض الرطوبة عن 30%.
- إرسال إشعارات استهلاك المياه للداشبورد.`,
    codeTemplate: `const int SOIL_PIN = 34;
const int PUMP_RELAY_PIN = 26;
const int DRY_THRESHOLD = 2400; // عدل القيمة حسب معايرة حساسك

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH); // OFF for active-low relay
}

void loop() {
  int moistureRaw = analogRead(SOIL_PIN);
  Serial.print("Soil Moisture Raw: ");
  Serial.println(moistureRaw);

  if (moistureRaw > DRY_THRESHOLD) {
    Serial.println("Soil is dry! Triggering irrigation pump...");
    digitalWrite(PUMP_RELAY_PIN, LOW); // Turn Pump ON
    delay(5000); // Water for 5 seconds
    digitalWrite(PUMP_RELAY_PIN, HIGH); // Turn Pump OFF
  }
  delay(10000);
}`
  },

  {
    id: 'template-rc-car',
    title: 'سيارة ذكية يتم التحكم بها عن بُعد (ESP32 Bluetooth / WiFi RC Robot Car)',
    summary: 'روبوت متنقل ذكي مزود بمحركات DC وسيرفو ومستشعر مسافة لتفادي العوائق مع تحكم فوري من الداشبورد أو الهاتف.',
    difficulty: 'متقدم',
    difficultyColor: '#A855F7',
    is_featured: true,
    timesUsedAsTemplate: 21,
    rating: 4.95,
    author: 'عمر القاسم',
    authorRole: 'Robotics & Automation Lead',
    coverImage: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'L298N', 'Robotics', 'HC-SR04', 'RC Car', 'Motors'],
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'استقبال أوامر التوجيه اللاسلكية وتوليد إشارات PWM للمحركات',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'لوحة قيادة المحركات L298N Dual H-Bridge',
        category: 'ACTUATOR',
        function: 'تغذية والتحكم في سرعة واتجاه محركين DC تيار مستمر',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: 'HC-SR04 (حساس مسافة بالموجات فوق الصوتية)',
        category: 'SENSOR',
        function: 'كشف الجدران والعوائق أمام السيارة والتوقف التلقائي في حالات الطوارئ',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: 'محرك سيرفو صغير SG90 Micro Servo',
        category: 'ACTUATOR',
        function: 'تدوير حساس المسافة يميناً ويساراً لمسح البيئة المحيطة',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'لوحة قيادة المحركات L298N Dual H-Bridge', fromPin: 'IN1', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO18', color: '#F59E0B', note: 'المحرك الأيسر أمام' },
      { id: 'w2', fromComp: 'لوحة قيادة المحركات L298N Dual H-Bridge', fromPin: 'IN2', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO19', color: '#F59E0B', note: 'المحرك الأيسر خلف' },
      { id: 'w3', fromComp: 'لوحة قيادة المحركات L298N Dual H-Bridge', fromPin: 'IN3', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO22', color: '#38BDF8', note: 'المحرك الأيمن أمام' },
      { id: 'w4', fromComp: 'لوحة قيادة المحركات L298N Dual H-Bridge', fromPin: 'IN4', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO23', color: '#38BDF8', note: 'المحرك الأيمن خلف' },
      { id: 'w5', fromComp: 'HC-SR04 (حساس مسافة بالموجات فوق الصوتية)', fromPin: 'TRIG', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO5', color: '#FB923C', note: 'نبضة الإرسال' },
      { id: 'w6', fromComp: 'HC-SR04 (حساس مسافة بالموجات فوق الصوتية)', fromPin: 'ECHO', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO4', color: '#FB923C', note: 'إشارة الارتداد' }
    ],
    overviewTemplate: `مركبة روبوتية ذكية تعتمد على متحكم ESP32 توفر نمطي قيادة: تحكم يدوي كامل عبر أزرار الداشبورد، ونمط قيادة ذاتية لتفادي الحواجز.`,
    codeTemplate: `#define IN1 18
#define IN2 19
#define IN3 22
#define IN4 23
#define TRIG_PIN 5
#define ECHO_PIN 4

void moveForward() {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
}

void stopMotors() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
}

void loop() {
  // Add steering logic or autonomous obstacle avoidance
}`
  }
];
