/**
 * IOT365 Simulator Ready-Made Projects
 * Complete with:
 * - Full C++ Arduino code (sketch.ino)
 * - Complete Wokwi circuit wiring (diagram.json)
 * - Required libraries (libraries.txt)
 * - Hardware Pinout & Dashboard Topic mapping
 */

export const SIMULATOR_PROJECTS = [
  {
    id: 'all-in-one',
    title: 'مشروع الطقس والمحطة الشاملة (Weather & All-In-One Station)',
    badge: 'موصى به للاختبار الشامل',
    description: 'مشروع ESP32 ضخم وشامل يجمع 5 حساسات و 8 مشغلات للتحقق من جميع أدوات لوحة التحكم والتيرمنال وقراءات الحساسات في وقت واحد.',
    wokwiUrl: 'https://wokwi.com/projects/468717878078638081',
    accentColor: 'from-blue-600 to-indigo-600',
    stats: { sensors: 5, actuators: 8, wires: 28 },
    pinouts: [
      { component: 'DHT22 (الحرارة والرطوبة)', pin: 'GPIO 15', type: 'Sensor', topic: 'sensor/temp & sensor/humidity', note: 'يرسل الحرارة °C والرطوبة %' },
      { component: 'HC-SR04 (حساس المسافة)', pin: 'Trig: GPIO 5, Echo: GPIO 18', type: 'Sensor', topic: 'sensor/distance', note: 'يرسل المسافة بالسنتيمتر' },
      { component: 'Potentiometer (رطوبة/مستوى)', pin: 'GPIO 34 (ADC1)', type: 'Sensor', topic: 'farm/moisture', note: 'محاكاة رطوبة التربة أو مستوى الخزان (0-100%)' },
      { component: 'LDR (حساس الضوء المحيط)', pin: 'GPIO 35 (ADC1)', type: 'Sensor', topic: 'sensor/light', note: 'يرسل شدة الإضاءة المحيطة (0-100%)' },
      { component: 'PIR Motion (حساس الحركة)', pin: 'GPIO 19', type: 'Sensor', topic: 'security/motion', note: 'يرسل 1 عند كشف حركة و 0 عند السكون' },
      { component: 'مصباح LED (إضاءة رئيسية)', pin: 'GPIO 2', type: 'Actuator', topic: 'actuator/led', note: 'تشغيل/إطفاء ON/OFF' },
      { component: 'مرحّل Relay (مضخة/جهاز)', pin: 'GPIO 25', type: 'Actuator', topic: 'actuator/relay', note: 'تشغيل/إطفاء ON/OFF' },
      { component: 'سيرفو SG90 (بوابة/صمام)', pin: 'GPIO 13', type: 'Actuator', topic: 'actuator/servo', note: 'التحكم بالزاوية 0–180 درجة' },
      { component: 'مروحة / Dimmer PWM', pin: 'GPIO 4', type: 'Actuator', topic: 'actuator/dimmer & stem/fan', note: 'التحكم بسرعة/شدة الإضاءة (0-255)' },
      { component: 'صفارة إنذار Buzzer', pin: 'GPIO 12', type: 'Actuator', topic: 'sound/buzzer', note: 'تنبيهات صوتية فورية عند إرسال BEEP' },
      { component: 'حلقة RGB NeoPixel (16 LED)', pin: 'GPIO 23', type: 'Actuator', topic: 'light/rgb', note: 'ألوان متغيرة عبر صيغة R,G,B' },
      { component: 'شاشة OLED SSD1306 (I2C)', pin: 'SDA: GPIO 21, SCL: GPIO 22', type: 'Display', topic: 'display/oled', note: 'عرض حي لقراءات الحساسات والرسائل الواردة' },
      { component: 'أداة السيارة D-Pad & Speed', pin: 'Serial + OLED Visual', type: 'Controller', topic: 'car/move & car/speed', note: 'FORWARD, BACK, LEFT, RIGHT, STOP' }
    ],
    widgets: [
      { id: 'aio_temp', type: 'gauge', name: 'درجة الحرارة (Temp DHT22)', topic: 'sensor/temp', unit: '°C', minVal: 0, maxVal: 60, w: 3, h: 3 },
      { id: 'aio_hum', type: 'gauge', name: 'الرطوبة النسبية (Humidity)', topic: 'sensor/humidity', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'aio_dist', type: 'gauge', name: 'المسافة (Sonar HC-SR04)', topic: 'sensor/distance', unit: 'cm', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'aio_soil', type: 'gauge', name: 'رطوبة التربة (Soil Moisture)', topic: 'farm/moisture', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'aio_light', type: 'gauge', name: 'شدة الإضاءة (Light LDR)', topic: 'sensor/light', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'aio_led', type: 'switch', name: 'مصباح LED الرئيسي', topic: 'actuator/led', unit: '', maxVal: 1, w: 2, h: 2 },
      { id: 'aio_relay', type: 'relay', name: 'مرحّل Relay 220V', topic: 'actuator/relay', unit: '', maxVal: 1, w: 2, h: 2 },
      { id: 'aio_servo', type: 'servo', name: 'سيرفو البوابة / الصمام (SG90)', topic: 'actuator/servo', unit: '°', maxVal: 180, w: 3, h: 2 },
      { id: 'aio_fan', type: 'dimmer', name: 'مروحة التبريد / الديمر (PWM)', topic: 'actuator/dimmer', unit: '%', maxVal: 255, w: 3, h: 2 },
      { id: 'aio_buzzer', type: 'buzzer', name: 'صفارة الإنذار (Buzzer)', topic: 'sound/buzzer', unit: '', maxVal: 1, w: 2, h: 2 },
      { id: 'aio_dpad', type: 'dpad', name: 'تحكم السيارة (RC D-Pad)', topic: 'car/move', unit: '', maxVal: 1, w: 3, h: 4 },
      { id: 'aio_speed', type: 'speed', name: 'سرعة السيارة (Speed Slider)', topic: 'car/speed', unit: '', maxVal: 255, w: 3, h: 2 }
    ],
    presetDevices: [
      { id: 'dev_temp', name: 'مستشعر الحرارة DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', unit: '°C' },
      { id: 'dev_hum', name: 'مستشعر الرطوبة DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', unit: '%' },
      { id: 'dev_dist', name: 'مستشعر المسافة سونار HC-SR04', type: 'Sensor', pin: 'GPIO 5/18', topic: 'sensor/distance', unit: 'cm' },
      { id: 'dev_soil', name: 'مستشعر رطوبة التربة Potentiometer', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', unit: '%' },
      { id: 'dev_light', name: 'مستشعر الإضاءة المحيطة LDR', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', unit: '%' },
      { id: 'dev_pir', name: 'كاشف الحركة PIR Motion', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', unit: 'State' },
      { id: 'dev_led', name: 'مصباح الإشارة الرئيسي LED', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led', unit: 'State' },
      { id: 'dev_relay', name: 'مرحل التحكم بالأجهزة Relay', type: 'Actuator', pin: 'GPIO 25', topic: 'actuator/relay', unit: 'State' },
      { id: 'dev_servo', name: 'محرك السيرفو SG90', type: 'Motor', pin: 'GPIO 13', topic: 'actuator/servo', unit: '°' },
      { id: 'dev_fan', name: 'مروحة التبريد السريعة PWM', type: 'Actuator', pin: 'GPIO 4', topic: 'actuator/dimmer', unit: 'PWM' },
      { id: 'dev_buzzer', name: 'صفارة التنبيه الصوتي Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer', unit: 'State' }
    ],
    libraries: `PubSubClient
DHT sensor library
Adafruit Unified Sensor
Adafruit SSD1306
Adafruit GFX Library
Adafruit NeoPixel
ESP32Servo`,
    diagramJson: `{
  "version": 1,
  "author": "IOT365 Platform",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-dht22", "id": "dht", "top": -150, "left": -180, "attrs": { "temperature": "27.5", "humidity": "55" } },
    { "type": "wokwi-hc-sr04", "id": "sonar", "top": -160, "left": 120, "attrs": { "distance": "35" } },
    { "type": "wokwi-potentiometer", "id": "pot", "top": 150, "left": -220, "attrs": {} },
    { "type": "wokwi-photoresistor-sensor", "id": "ldr", "top": 280, "left": -220, "attrs": {} },
    { "type": "wokwi-pir-motion-sensor", "id": "pir", "top": -260, "left": -30, "attrs": {} },
    { "type": "wokwi-led", "id": "led_main", "top": 130, "left": 220, "attrs": { "color": "red", "label": "LED" } },
    { "type": "wokwi-resistor", "id": "r_led", "top": 170, "left": 180, "attrs": { "resistance": "220" } },
    { "type": "wokwi-led", "id": "led_relay", "top": 220, "left": 220, "attrs": { "color": "green", "label": "RELAY" } },
    { "type": "wokwi-resistor", "id": "r_relay", "top": 260, "left": 180, "attrs": { "resistance": "220" } },
    { "type": "wokwi-led", "id": "led_pwm", "top": 310, "left": 220, "attrs": { "color": "blue", "label": "PWM/FAN" } },
    { "type": "wokwi-resistor", "id": "r_pwm", "top": 350, "left": 180, "attrs": { "resistance": "220" } },
    { "type": "wokwi-servo", "id": "servo", "top": -80, "left": 300, "attrs": {} },
    { "type": "wokwi-buzzer", "id": "buzzer", "top": 30, "left": 320, "attrs": { "volume": "0.2" } },
    { "type": "wokwi-neopixel-ring", "id": "ring", "top": 240, "left": 320, "attrs": { "pixels": "16" } },
    { "type": "board-ssd1306", "id": "oled", "top": 420, "left": 20, "attrs": { "i2cAddress": "0x3c" } }
  ],
  "connections": [
    [ "esp:GND.1", "dht:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "dht:VCC", "red", [ "v0" ] ],
    [ "esp:D15", "dht:SDA", "gold", [ "v0" ] ],

    [ "esp:GND.1", "sonar:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "sonar:VCC", "red", [ "v0" ] ],
    [ "esp:D5", "sonar:TRIG", "purple", [ "v0" ] ],
    [ "esp:D18", "sonar:ECHO", "blue", [ "v0" ] ],

    [ "esp:GND.1", "pot:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "pot:VCC", "red", [ "v0" ] ],
    [ "esp:D34", "pot:SIG", "orange", [ "v0" ] ],

    [ "esp:GND.1", "ldr:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "ldr:VCC", "red", [ "v0" ] ],
    [ "esp:D35", "ldr:AO", "cyan", [ "v0" ] ],

    [ "esp:GND.1", "pir:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "pir:VCC", "red", [ "v0" ] ],
    [ "esp:D19", "pir:OUT", "green", [ "v0" ] ],

    [ "esp:D2", "r_led:1", "green", [ "v0" ] ],
    [ "r_led:2", "led_main:A", "green", [ "v0" ] ],
    [ "led_main:C", "esp:GND.2", "black", [ "v0" ] ],

    [ "esp:D25", "r_relay:1", "green", [ "v0" ] ],
    [ "r_relay:2", "led_relay:A", "green", [ "v0" ] ],
    [ "led_relay:C", "esp:GND.2", "black", [ "v0" ] ],

    [ "esp:D4", "r_pwm:1", "blue", [ "v0" ] ],
    [ "r_pwm:2", "led_pwm:A", "blue", [ "v0" ] ],
    [ "led_pwm:C", "esp:GND.2", "black", [ "v0" ] ],

    [ "esp:GND.2", "servo:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "servo:V+", "red", [ "v0" ] ],
    [ "esp:D13", "servo:PWM", "orange", [ "v0" ] ],

    [ "esp:GND.2", "buzzer:1", "black", [ "v0" ] ],
    [ "esp:D12", "buzzer:2", "yellow", [ "v0" ] ],

    [ "esp:GND.2", "ring:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "ring:VDD", "red", [ "v0" ] ],
    [ "esp:D23", "ring:DIN", "purple", [ "v0" ] ],

    [ "esp:GND.2", "oled:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "oled:VCC", "red", [ "v0" ] ],
    [ "esp:D22", "oled:SCL", "yellow", [ "v0" ] ],
    [ "esp:D21", "oled:SDA", "blue", [ "v0" ] ]
  ],
  "dependencies": {}
}`,
    sketchCode: (uidPlaceholder = '') => `/*
 * ==================================================================================
 * IOT365 PLATFORM — ALL-IN-ONE SIMULATOR TEST STATION
 * ==================================================================================
 * مشروع محاكاة متكامل لاختبار جميع وظائف المنصة:
 * - الحساسات: DHT22 (حرارة ورطوبة), HC-SR04 (مسافة), LDR (ضوء), Potentiometer (رطوبة تربة), PIR (حركة)
 * - المشغلات: LED (GPIO 2), Relay (GPIO 25), PWM Fan (GPIO 4), Servo (GPIO 13), Buzzer (GPIO 12)
 * - العرض والإضاءة: WS2812 NeoPixel Ring (GPIO 23), OLED SSD1306 (I2C 21/22)
 * - يدعم التحكم بالسيارة D-Pad & Speed
 * ==================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ESP32Servo.h>
#include <Adafruit_NeoPixel.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ==================================================================================
// USER CONFIGURATION — إعدادات المستخدم
// اترك USER_UID فارغاً "" لاستبداله لاحقاً، أو الصق UID حسابك من المنصة مباشرة:
// ==================================================================================
const char* USER_UID = "${uidPlaceholder}"; 

// Network & MQTT Broker Config
const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";
const int   mqtt_port   = 1883;

// Pin Definitions
#define PIN_DHT         15
#define PIN_TRIG        5
#define PIN_ECHO        18
#define PIN_POT         34
#define PIN_LDR         35
#define PIN_PIR         19
#define PIN_LED         2
#define PIN_RELAY       25
#define PIN_PWM_FAN     4
#define PIN_SERVO       13
#define PIN_BUZZER      12
#define PIN_NEOPIXEL    23
#define NUM_PIXELS      16
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64

// Hardware Objects
DHT dht(PIN_DHT, DHT22);
Servo myServo;
Adafruit_NeoPixel pixels(NUM_PIXELS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
WiFiClient espClient;
PubSubClient client(espClient);

// Timing variables
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL = 3000; // كل 3 ثواني
String lastOledMsg = "Ready...";
String lastMoveCmd = "STOP";
int currentSpeed = 150;

// Helper: Get full topic with fallback to guest
String getTopic(const char* subTopic) {
  if (strlen(USER_UID) > 0) {
    return String(USER_UID) + "/" + subTopic;
  }
  return String("guest_iot365/") + subTopic;
}

// Update OLED Display
void updateOLED(float t, float h, float d, int moisture) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("--- IOT365 LIVE ---");
  
  display.setCursor(0, 14);
  display.printf("Temp: %.1fC  Hum: %.0f%%\\n", t, h);
  display.printf("Dist: %.1fcm  Soil: %d%%\\n", d, moisture);
  display.printf("Car : %s (Spd: %d)\\n", lastMoveCmd.c_str(), currentSpeed);
  display.printf("Msg : %s", lastOledMsg.substring(0, 16).c_str());
  
  display.display();
}

// Read HC-SR04 distance
float readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 99.0;
  return duration * 0.034 / 2.0;
}

// MQTT Message Callback (Receives commands from dashboard)
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();
  String topStr = String(topic);
  
  Serial.printf("[MQTT RX] %s -> %s\\n", topic, message.c_str());
  lastOledMsg = message;

  // 1) LED Control
  if (topStr.endsWith("/actuator/led")) {
    if (message.equalsIgnoreCase("ON") || message == "1") {
      digitalWrite(PIN_LED, HIGH);
    } else {
      digitalWrite(PIN_LED, LOW);
    }
  }
  // 2) Relay Control
  else if (topStr.endsWith("/actuator/relay")) {
    if (message.equalsIgnoreCase("ON") || message == "1") {
      digitalWrite(PIN_RELAY, HIGH);
    } else {
      digitalWrite(PIN_RELAY, LOW);
    }
  }
  // 3) Servo Control (0-180)
  else if (topStr.endsWith("/actuator/servo")) {
    int angle = message.toInt();
    angle = constrain(angle, 0, 180);
    myServo.write(angle);
  }
  // 4) PWM Dimmer / Fan Speed (0-255 or 0-100)
  else if (topStr.endsWith("/actuator/dimmer") || topStr.endsWith("/stem/fan")) {
    int val = message.toInt();
    if (val <= 100) val = map(val, 0, 100, 0, 255);
    val = constrain(val, 0, 255);
    analogWrite(PIN_PWM_FAN, val);
  }
  // 5) Buzzer Control
  else if (topStr.endsWith("/sound/buzzer")) {
    if (message == "BEEP" || message == "ON" || message == "1") {
      tone(PIN_BUZZER, 1000, 200); // 200ms beep
    } else {
      noTone(PIN_BUZZER);
    }
  }
  // 6) NeoPixel RGB Control (Format: "r,g,b" or "ON"/"OFF")
  else if (topStr.endsWith("/light/rgb")) {
    if (message.indexOf(',') > 0) {
      int c1 = message.indexOf(',');
      int c2 = message.indexOf(',', c1 + 1);
      int r = message.substring(0, c1).toInt();
      int g = message.substring(c1 + 1, c2).toInt();
      int b = message.substring(c2 + 1).toInt();
      for (int i = 0; i < NUM_PIXELS; i++) {
        pixels.setPixelColor(i, pixels.Color(r, g, b));
      }
      pixels.show();
    } else if (message.equalsIgnoreCase("OFF")) {
      pixels.clear();
      pixels.show();
    }
  }
  // 7) RC Car D-Pad Direction
  else if (topStr.endsWith("/car/move")) {
    lastMoveCmd = message;
    Serial.printf("Car Direction Changed: %s\\n", message.c_str());
    if (message == "FORWARD") {
      pixels.setPixelColor(0, pixels.Color(0, 255, 0));
    } else if (message == "BACK") {
      pixels.setPixelColor(0, pixels.Color(255, 0, 0));
    } else if (message == "LEFT" || message == "RIGHT") {
      pixels.setPixelColor(0, pixels.Color(255, 255, 0));
    } else {
      pixels.setPixelColor(0, pixels.Color(0, 0, 255));
    }
    pixels.show();
  }
  // 8) RC Car Speed
  else if (topStr.endsWith("/car/speed")) {
    currentSpeed = constrain(message.toInt(), 0, 255);
  }
  // 9) OLED Display Text
  else if (topStr.endsWith("/display/oled")) {
    lastOledMsg = message;
  }
}

// Connect to WiFi and HiveMQ
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection... ");
    String clientId = "ESP32_IOT365_" + String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("CONNECTED!");

      // Subscribe to all actuator topics
      String subPrefix = (strlen(USER_UID) > 0) ? String(USER_UID) + "/#" : "guest_iot365/#";
      client.subscribe(subPrefix.c_str());
      Serial.printf("Subscribed to: %s\\n", subPrefix.c_str());

      // Welcome sound & LED blink
      digitalWrite(PIN_LED, HIGH);
      tone(PIN_BUZZER, 1800, 100);
      delay(100);
      digitalWrite(PIN_LED, LOW);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2s...");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\\n====================================");
  Serial.println("Starting IOT365 All-In-One ESP32 Station");
  Serial.println("====================================");

  // Initialize Pin Modes
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_PWM_FAN, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT);

  // Initialize Hardware
  dht.begin();
  myServo.attach(PIN_SERVO);
  myServo.write(90); // Center position

  pixels.begin();
  pixels.setBrightness(120);
  pixels.clear();
  pixels.show();

  // Initialize OLED (Address 0x3C)
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 10);
    display.println("IOT365 Station");
    display.println("Connecting WiFi...");
    display.display();
  }

  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  // Telemetry Loop
  unsigned long now = millis();
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    lastTelemetryTime = now;

    // 1) Read DHT22
    float temp = dht.readTemperature();
    float hum  = dht.readHumidity();
    if (isnan(temp)) temp = 26.5;
    if (isnan(hum))  hum  = 50.0;

    // 2) Read Distance HC-SR04
    float dist = readDistanceCm();

    // 3) Read Potentiometer (Soil Moisture / Level)
    int potRaw = analogRead(PIN_POT);
    int moisture = map(potRaw, 0, 4095, 0, 100);

    // 4) Read LDR (Light)
    int ldrRaw = analogRead(PIN_LDR);
    int lightPct = map(ldrRaw, 0, 4095, 100, 0);

    // 5) Read PIR Motion
    int motion = digitalRead(PIN_PIR);

    // Publish Telemetry to MQTT
    client.publish(getTopic("sensor/temp").c_str(), String(temp, 1).c_str());
    client.publish(getTopic("sensor/humidity").c_str(), String(hum, 1).c_str());
    client.publish(getTopic("sensor/distance").c_str(), String(dist, 1).c_str());
    client.publish(getTopic("farm/moisture").c_str(), String(moisture).c_str());
    client.publish(getTopic("sensor/light").c_str(), String(lightPct).c_str());
    client.publish(getTopic("security/motion").c_str(), String(motion).c_str());

    Serial.printf("[TELEMETRY] Temp: %.1fC | Hum: %.1f%% | Dist: %.1fcm | Moisture: %d%% | Light: %d%% | Motion: %d\\n",
                  temp, hum, dist, moisture, lightPct, motion);

    // Update OLED Screen
    updateOLED(temp, hum, dist, moisture);
  }
}
`
  },
  {
    id: 'smart-farm',
    title: 'المزرعة الذكية والري التلقائي (Smart Farm & Irrigation)',
    badge: 'مشاريع زراعية و STEM',
    description: 'مشروع متخصص للمزارع الذكية والبيوت المحمية: قياس رطوبة التربة عبر Potentiometer، حرارة ورطوبة الجو عبر DHT22، والتحكم بمضخة المياه وصمام الري.',
    wokwiUrl: 'https://wokwi.com/projects/475438726717854721',
    accentColor: 'from-emerald-600 to-teal-600',
    stats: { sensors: 2, actuators: 3, wires: 12 },
    pinouts: [
      { component: 'DHT22 (حرارة ورطوبة البيوت المحمية)', pin: 'GPIO 15', type: 'Sensor', topic: 'sensor/temp & sensor/humidity', note: 'قراءات الجو المحيط' },
      { component: 'Potentiometer (رطوبة التربة)', pin: 'GPIO 34', type: 'Sensor', topic: 'farm/moisture', note: 'نسبة الرطوبة 0–100%' },
      { component: 'مرحّل مضخة المياه (Water Pump)', pin: 'GPIO 25', type: 'Actuator', topic: 'farm/pump & actuator/relay', note: 'تشغيل/إيقاف المضخة' },
      { component: 'سيرفو صمام المياه (Water Valve)', pin: 'GPIO 13', type: 'Actuator', topic: 'farm/valve & actuator/servo', note: 'فتح/إغلاق الصمام' },
      { component: 'مصباح التنبيه (Low Water Alarm)', pin: 'GPIO 2', type: 'Actuator', topic: 'actuator/led', note: 'إشارة تحذير عند الجفاف' }
    ],
    widgets: [
      { id: 'farm_temp', type: 'gauge', name: 'درجة حرارة المحمية (Temp)', topic: 'sensor/temp', unit: '°C', minVal: 0, maxVal: 60, w: 3, h: 3 },
      { id: 'farm_hum', type: 'gauge', name: 'رطوبة الهواء (Humidity)', topic: 'sensor/humidity', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'farm_soil', type: 'gauge', name: 'رطوبة التربة (Soil Moisture)', topic: 'farm/moisture', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'farm_pump', type: 'pump', name: 'مضخة مياه الري (Water Pump)', topic: 'farm/pump', unit: '', maxVal: 1, w: 3, h: 3 },
      { id: 'farm_valve', type: 'valve', name: 'صمام مياه الري (Water Valve)', topic: 'farm/valve', unit: '°', maxVal: 180, w: 3, h: 3 },
      { id: 'farm_alarm', type: 'switch', name: 'تنبيه انخفاض المياه (Alarm LED)', topic: 'actuator/led', unit: '', maxVal: 1, w: 3, h: 2 }
    ],
    presetDevices: [
      { id: 'fdev_temp', name: 'مستشعر حرارة البيوت المحمية DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/temp', unit: '°C' },
      { id: 'fdev_hum', name: 'مستشعر رطوبة الجو DHT22', type: 'Sensor', pin: 'GPIO 15', topic: 'sensor/humidity', unit: '%' },
      { id: 'fdev_soil', name: 'مستشعر رطوبة التربة التناظري Soil Probe', type: 'Sensor', pin: 'GPIO 34', topic: 'farm/moisture', unit: '%' },
      { id: 'fdev_pump', name: 'مضخة مياه الري الذاتي Pump', type: 'Actuator', pin: 'GPIO 25', topic: 'farm/pump', unit: 'State' },
      { id: 'fdev_valve', name: 'صمام التحكم بتدفق المياه Servo Valve', type: 'Motor', pin: 'GPIO 13', topic: 'farm/valve', unit: '°' },
      { id: 'fdev_led', name: 'مصباح التحذير من جفاف الخزان', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led', unit: 'State' }
    ],
    libraries: `PubSubClient
DHT sensor library
ESP32Servo`,
    diagramJson: `{
  "version": 1,
  "author": "IOT365 Platform",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-dht22", "id": "dht", "top": -140, "left": -160, "attrs": { "temperature": "24", "humidity": "60" } },
    { "type": "wokwi-potentiometer", "id": "pot", "top": 80, "left": -180, "attrs": {} },
    { "type": "wokwi-led", "id": "pump_led", "top": -120, "left": 180, "attrs": { "color": "blue", "label": "PUMP" } },
    { "type": "wokwi-resistor", "id": "r_pump", "top": -80, "left": 150, "attrs": { "resistance": "220" } },
    { "type": "wokwi-servo", "id": "valve_servo", "top": 80, "left": 180, "attrs": {} },
    { "type": "wokwi-led", "id": "warn_led", "top": 200, "left": 180, "attrs": { "color": "red", "label": "ALARM" } },
    { "type": "wokwi-resistor", "id": "r_warn", "top": 240, "left": 150, "attrs": { "resistance": "220" } }
  ],
  "connections": [
    [ "esp:GND.1", "dht:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "dht:VCC", "red", [ "v0" ] ],
    [ "esp:D15", "dht:SDA", "gold", [ "v0" ] ],

    [ "esp:GND.1", "pot:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "pot:VCC", "red", [ "v0" ] ],
    [ "esp:D34", "pot:SIG", "orange", [ "v0" ] ],

    [ "esp:D25", "r_pump:1", "blue", [ "v0" ] ],
    [ "r_pump:2", "pump_led:A", "blue", [ "v0" ] ],
    [ "pump_led:C", "esp:GND.2", "black", [ "v0" ] ],

    [ "esp:GND.2", "valve_servo:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "valve_servo:V+", "red", [ "v0" ] ],
    [ "esp:D13", "valve_servo:PWM", "green", [ "v0" ] ],

    [ "esp:D2", "r_warn:1", "red", [ "v0" ] ],
    [ "r_warn:2", "warn_led:A", "red", [ "v0" ] ],
    [ "warn_led:C", "esp:GND.2", "black", [ "v0" ] ]
  ],
  "dependencies": {}
}`,
    sketchCode: (uidPlaceholder = '') => `/*
 * IOT365 — SMART FARM & IRRIGATION CONTROLLER
 * نظام الري والزراعة الذكية
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

const char* USER_UID = "${uidPlaceholder}";

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

#define PIN_DHT    15
#define PIN_SOIL   34
#define PIN_PUMP   25
#define PIN_VALVE  13
#define PIN_ALARM  2

DHT dht(PIN_DHT, DHT22);
Servo valveServo;
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSend = 0;

String getTopic(const char* t) {
  if (strlen(USER_UID) > 0) return String(USER_UID) + "/" + t;
  return String("guest_iot365/") + t;
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  String tStr = String(topic);

  if (tStr.endsWith("/farm/pump") || tStr.endsWith("/actuator/relay")) {
    digitalWrite(PIN_PUMP, (msg == "ON" || msg == "1") ? HIGH : LOW);
  } else if (tStr.endsWith("/farm/valve") || tStr.endsWith("/actuator/servo")) {
    int angle = msg.toInt();
    valveServo.write(constrain(angle, 0, 180));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_ALARM, OUTPUT);
  dht.begin();
  valveServo.attach(PIN_VALVE);
  valveServo.write(0);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    while (!client.connect("ESP32_FarmClient")) delay(1000);
    String sub = (strlen(USER_UID) > 0) ? String(USER_UID) + "/#" : "guest_iot365/#";
    client.subscribe(sub.c_str());
  }
  client.loop();

  if (millis() - lastSend > 3000) {
    lastSend = millis();
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    int soil = map(analogRead(PIN_SOIL), 0, 4095, 0, 100);

    client.publish(getTopic("sensor/temp").c_str(), String(t, 1).c_str());
    client.publish(getTopic("sensor/humidity").c_str(), String(h, 1).c_str());
    client.publish(getTopic("farm/moisture").c_str(), String(soil).c_str());

    // Auto Alarm if soil is dry (< 20%)
    if (soil < 20) digitalWrite(PIN_ALARM, HIGH);
    else digitalWrite(PIN_ALARM, LOW);
  }
}
`
  },
  {
    id: 'smart-home',
    title: 'المنزل الذكي ونظام الحماية (Smart Home & Security)',
    badge: 'أمن وسلامة وأتمتة',
    description: 'نظام حماية منزلي يشتمل على حساس حركة PIR، قفل باب إلكتروني (Servo)، صفارة إنذار (Buzzer)، وإضاءة ذكية قابلة للتعتيم.',
    wokwiUrl: 'https://wokwi.com/projects/475438918066225153',
    accentColor: 'from-amber-600 to-red-600',
    stats: { sensors: 2, actuators: 4, wires: 16 },
    pinouts: [
      { component: 'PIR Motion (كاشف الحركة)', pin: 'GPIO 19', type: 'Sensor', topic: 'security/motion', note: '1 حركة، 0 أمان' },
      { component: 'LDR (مستوى الإضاءة الليلية)', pin: 'GPIO 35', type: 'Sensor', topic: 'sensor/light', note: '0-100%' },
      { component: 'سيرفو قفل الباب (Door Lock)', pin: 'GPIO 13', type: 'Actuator', topic: 'security/door & actuator/servo', note: '0 مقفل، 90 مفتوح' },
      { component: 'صفارة الإنذار (Siren / Buzzer)', pin: 'GPIO 12', type: 'Actuator', topic: 'sound/buzzer', note: 'BEEP أو إنذار مستمر' },
      { component: 'مصباح الإضاءة الرئيسية (LED)', pin: 'GPIO 2', type: 'Actuator', topic: 'actuator/led', note: 'ON/OFF' }
    ],
    widgets: [
      { id: 'home_motion', type: 'switch', name: 'كاشف الحركة (PIR Motion)', topic: 'security/motion', unit: '', maxVal: 1, w: 3, h: 2 },
      { id: 'home_light', type: 'gauge', name: 'مستوى الإضاءة الليلية (LDR)', topic: 'sensor/light', unit: '%', minVal: 0, maxVal: 100, w: 3, h: 3 },
      { id: 'home_door', type: 'doorlock', name: 'قفل الباب الذكي الإلكتروني', topic: 'security/door', unit: '', maxVal: 1, w: 3, h: 3 },
      { id: 'home_siren', type: 'buzzer', name: 'صفارة إنذار الاقتحام (Siren)', topic: 'sound/buzzer', unit: '', maxVal: 1, w: 3, h: 2 },
      { id: 'home_light_main', type: 'switch', name: 'إضاءة الغرفة الرئيسية (LED)', topic: 'actuator/led', unit: '', maxVal: 1, w: 2, h: 2 }
    ],
    presetDevices: [
      { id: 'hdev_pir', name: 'مستشعر الحركة والسرقة PIR Motion', type: 'Sensor', pin: 'GPIO 19', topic: 'security/motion', unit: 'State' },
      { id: 'hdev_ldr', name: 'مستشعر الإضاءة المحيطة LDR Sensor', type: 'Sensor', pin: 'GPIO 35', topic: 'sensor/light', unit: '%' },
      { id: 'hdev_lock', name: 'سيرفو قفل الباب الإلكتروني Door Lock', type: 'Motor', pin: 'GPIO 13', topic: 'security/door', unit: '°' },
      { id: 'hdev_buzzer', name: 'صفارة إنذار الطوارئ Siren Buzzer', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer', unit: 'State' },
      { id: 'hdev_led', name: 'مصباح إضاءة الغرفة الرئيسية LED', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led', unit: 'State' }
    ],
    libraries: `PubSubClient
ESP32Servo`,
    diagramJson: `{
  "version": 1,
  "author": "IOT365 Platform",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-pir-motion-sensor", "id": "pir", "top": -160, "left": -120, "attrs": {} },
    { "type": "wokwi-photoresistor-sensor", "id": "ldr", "top": 120, "left": -160, "attrs": {} },
    { "type": "wokwi-servo", "id": "lock", "top": -120, "left": 180, "attrs": { "label": "LOCK" } },
    { "type": "wokwi-buzzer", "id": "buzzer", "top": 40, "left": 200, "attrs": { "volume": "0.3" } },
    { "type": "wokwi-led", "id": "light", "top": 160, "left": 200, "attrs": { "color": "yellow", "label": "LIGHT" } },
    { "type": "wokwi-resistor", "id": "r_light", "top": 200, "left": 170, "attrs": { "resistance": "220" } }
  ],
  "connections": [
    [ "esp:GND.1", "pir:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "pir:VCC", "red", [ "v0" ] ],
    [ "esp:D19", "pir:OUT", "green", [ "v0" ] ],

    [ "esp:GND.1", "ldr:GND", "black", [ "v0" ] ],
    [ "esp:3V3", "ldr:VCC", "red", [ "v0" ] ],
    [ "esp:D35", "ldr:AO", "cyan", [ "v0" ] ],

    [ "esp:GND.2", "lock:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "lock:V+", "red", [ "v0" ] ],
    [ "esp:D13", "lock:PWM", "orange", [ "v0" ] ],

    [ "esp:GND.2", "buzzer:1", "black", [ "v0" ] ],
    [ "esp:D12", "buzzer:2", "purple", [ "v0" ] ],

    [ "esp:D2", "r_light:1", "yellow", [ "v0" ] ],
    [ "r_light:2", "light:A", "yellow", [ "v0" ] ],
    [ "light:C", "esp:GND.2", "black", [ "v0" ] ]
  ],
  "dependencies": {}
}`,
    sketchCode: (uidPlaceholder = '') => `/*
 * IOT365 — SMART HOME & SECURITY
 * نظام المنزل الذكي والإنذار
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

const char* USER_UID = "${uidPlaceholder}";

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

#define PIN_PIR    19
#define PIN_LDR    35
#define PIN_LOCK   13
#define PIN_BUZZER 12
#define PIN_LIGHT  2

Servo lockServo;
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastSend = 0;

String getTopic(const char* t) {
  if (strlen(USER_UID) > 0) return String(USER_UID) + "/" + t;
  return String("guest_iot365/") + t;
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  String tStr = String(topic);

  if (tStr.endsWith("/security/door") || tStr.endsWith("/actuator/servo")) {
    if (msg == "OPEN" || msg == "1") lockServo.write(90);
    else lockServo.write(0);
  } else if (tStr.endsWith("/sound/buzzer")) {
    if (msg == "BEEP" || msg == "ON") tone(PIN_BUZZER, 2000, 300);
    else noTone(PIN_BUZZER);
  } else if (tStr.endsWith("/actuator/led")) {
    digitalWrite(PIN_LIGHT, (msg == "ON" || msg == "1") ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  lockServo.attach(PIN_LOCK);
  lockServo.write(0); // Locked

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    while (!client.connect("ESP32_SecurityClient")) delay(1000);
    String sub = (strlen(USER_UID) > 0) ? String(USER_UID) + "/#" : "guest_iot365/#";
    client.subscribe(sub.c_str());
  }
  client.loop();

  if (millis() - lastSend > 2500) {
    lastSend = millis();
    int motion = digitalRead(PIN_PIR);
    int light = map(analogRead(PIN_LDR), 0, 4095, 100, 0);

    client.publish(getTopic("security/motion").c_str(), String(motion).c_str());
    client.publish(getTopic("sensor/light").c_str(), String(light).c_str());

    if (motion == 1) {
      tone(PIN_BUZZER, 1500, 100);
    }
  }
}
`
  },
  {
    id: 'rc-car',
    title: 'الروبوت والسيارة الذكية (Robotics & RC Smart Car)',
    badge: 'روبوتكس وتحكم D-Pad',
    description: 'سيارة ذكية مدعومة بحساس مسافة لمكافحة الاصطدام، تحكم كامل بالاتجاهات D-Pad وسلايدر السرعة ومصابيح أمامية وبوق صوتي.',
    wokwiUrl: 'https://wokwi.com/projects/475439028329251841',
    accentColor: 'from-purple-600 to-pink-600',
    stats: { sensors: 1, actuators: 5, wires: 14 },
    pinouts: [
      { component: 'HC-SR04 (كشف العوائق أمامي)', pin: 'Trig: GPIO 5, Echo: GPIO 18', type: 'Sensor', topic: 'sensor/distance', note: 'تنبيه مسافة لتجنب الاصطدام' },
      { component: 'D-Pad التحكم بالاتجاهات', pin: 'Serial + LED Indicators', type: 'Controller', topic: 'car/move', note: 'FORWARD, BACK, LEFT, RIGHT, STOP' },
      { component: 'Speed Slider (السرعة)', pin: 'PWM 0-255', type: 'Controller', topic: 'car/speed', note: 'سرعة المحركات 0–255' },
      { component: 'المصابيح الأمامية (Headlights)', pin: 'GPIO 2', type: 'Actuator', topic: 'actuator/led', note: 'ON / OFF' },
      { component: 'بوق السيارة (Horn Buzzer)', pin: 'GPIO 12', type: 'Actuator', topic: 'sound/buzzer', note: 'صفارة صوتية BEEP' }
    ],
    widgets: [
      { id: 'car_dist', type: 'gauge', name: 'رادار المسافة لتفادي الاصطدام (Sonar)', topic: 'sensor/distance', unit: 'cm', minVal: 0, maxVal: 100, w: 4, h: 3 },
      { id: 'car_dpad', type: 'dpad', name: 'عجلة التوجيه والاتجاهات (D-Pad)', topic: 'car/move', unit: '', maxVal: 1, w: 4, h: 4 },
      { id: 'car_speed', type: 'speed', name: 'مستوى سرعة المحركات (PWM Speed)', topic: 'car/speed', unit: '', maxVal: 255, w: 4, h: 2 },
      { id: 'car_lights', type: 'switch', name: 'المصابيح الأمامية (Headlights)', topic: 'actuator/led', unit: '', maxVal: 1, w: 2, h: 2 },
      { id: 'car_horn', type: 'buzzer', name: 'بوق السيارة التنبيهي (Horn)', topic: 'sound/buzzer', unit: '', maxVal: 1, w: 2, h: 2 }
    ],
    presetDevices: [
      { id: 'cdev_sonar', name: 'رادار كشف الحواجز Sonar HC-SR04', type: 'Sensor', pin: 'GPIO 5/18', topic: 'sensor/distance', unit: 'cm' },
      { id: 'cdev_fwd', name: 'محركات دفع السيارة الذكية', type: 'Motor', pin: 'GPIO 4', topic: 'car/move', unit: 'State' },
      { id: 'cdev_speed', name: 'منظم سرعة الحركة PWM Controller', type: 'Actuator', pin: 'PWM', topic: 'car/speed', unit: 'PWM' },
      { id: 'cdev_lights', name: 'المصابيح الأمامية LED Headlights', type: 'Actuator', pin: 'GPIO 2', topic: 'actuator/led', unit: 'State' },
      { id: 'cdev_horn', name: 'بوق التنبيه الصوتي Car Horn', type: 'Actuator', pin: 'GPIO 12', topic: 'sound/buzzer', unit: 'State' }
    ],
    libraries: `PubSubClient`,
    diagramJson: `{
  "version": 1,
  "author": "IOT365 Platform",
  "editor": "wokwi",
  "parts": [
    { "type": "wokwi-esp32-devkit-v1", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-hc-sr04", "id": "sonar", "top": -150, "left": -60, "attrs": { "distance": "40" } },
    { "type": "wokwi-led", "id": "headlight", "top": 120, "left": -120, "attrs": { "color": "white", "label": "LIGHT" } },
    { "type": "wokwi-resistor", "id": "r_light", "top": 160, "left": -150, "attrs": { "resistance": "220" } },
    { "type": "wokwi-buzzer", "id": "horn", "top": 80, "left": 180, "attrs": { "volume": "0.3" } },
    { "type": "wokwi-led", "id": "motor_fwd", "top": -80, "left": 180, "attrs": { "color": "green", "label": "FWD" } },
    { "type": "wokwi-resistor", "id": "r_fwd", "top": -40, "left": 150, "attrs": { "resistance": "220" } }
  ],
  "connections": [
    [ "esp:GND.1", "sonar:GND", "black", [ "v0" ] ],
    [ "esp:VIN", "sonar:VCC", "red", [ "v0" ] ],
    [ "esp:D5", "sonar:TRIG", "purple", [ "v0" ] ],
    [ "esp:D18", "sonar:ECHO", "blue", [ "v0" ] ],

    [ "esp:D2", "r_light:1", "white", [ "v0" ] ],
    [ "r_light:2", "headlight:A", "white", [ "v0" ] ],
    [ "headlight:C", "esp:GND.1", "black", [ "v0" ] ],

    [ "esp:GND.2", "horn:1", "black", [ "v0" ] ],
    [ "esp:D12", "horn:2", "yellow", [ "v0" ] ],

    [ "esp:D4", "r_fwd:1", "green", [ "v0" ] ],
    [ "r_fwd:2", "motor_fwd:A", "green", [ "v0" ] ],
    [ "motor_fwd:C", "esp:GND.2", "black", [ "v0" ] ]
  ],
  "dependencies": {}
}`,
    sketchCode: (uidPlaceholder = '') => `/*
 * IOT365 — SMART RC CAR CONTROLLER
 * تحكم كامل بالسيارة الذكية وحساس المسافة
 */
#include <WiFi.h>
#include <PubSubClient.h>

const char* USER_UID = "${uidPlaceholder}";

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* mqtt_server = "broker.hivemq.com";

#define PIN_TRIG  5
#define PIN_ECHO  18
#define PIN_LIGHT 2
#define PIN_HORN  12
#define PIN_FWD   4

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastSend = 0;
int currentSpeed = 180;

String getTopic(const char* t) {
  if (strlen(USER_UID) > 0) return String(USER_UID) + "/" + t;
  return String("guest_iot365/") + t;
}

float readDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long d = pulseIn(PIN_ECHO, HIGH, 25000);
  if (d == 0) return 99.0;
  return d * 0.034 / 2.0;
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg;
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  msg.trim();
  String tStr = String(topic);

  if (tStr.endsWith("/car/move")) {
    Serial.printf("[CAR] Move: %s\\n", msg.c_str());
    if (msg == "FORWARD") digitalWrite(PIN_FWD, HIGH);
    else digitalWrite(PIN_FWD, LOW);
  } else if (tStr.endsWith("/car/speed")) {
    currentSpeed = msg.toInt();
    Serial.printf("[CAR] Speed set to: %d\\n", currentSpeed);
  } else if (tStr.endsWith("/sound/buzzer")) {
    tone(PIN_HORN, 1200, 150);
  } else if (tStr.endsWith("/actuator/led")) {
    digitalWrite(PIN_LIGHT, (msg == "ON" || msg == "1") ? HIGH : LOW);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LIGHT, OUTPUT);
  pinMode(PIN_HORN, OUTPUT);
  pinMode(PIN_FWD, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(300);

  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    while (!client.connect("ESP32_CarClient")) delay(1000);
    String sub = (strlen(USER_UID) > 0) ? String(USER_UID) + "/#" : "guest_iot365/#";
    client.subscribe(sub.c_str());
  }
  client.loop();

  if (millis() - lastSend > 2000) {
    lastSend = millis();
    float dist = readDistance();
    client.publish(getTopic("sensor/distance").c_str(), String(dist, 1).c_str());
    if (dist < 15.0) {
      tone(PIN_HORN, 800, 80); // Collision alert
    }
  }
}
`
  }
];
