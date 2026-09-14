/*
 * ==================================================================================
 * 🌐 IOT365 PLATFORM — ALL-IN-ONE SIMULATOR TEST STATION
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
// 🔑 USER CONFIGURATION — إعدادات المستخدم
// اترك USER_UID فارغاً "" لاستبداله لاحقاً، أو الصق UID حسابك من المنصة مباشرة:
// ==================================================================================
const char* USER_UID = ""; 

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
  Serial.println("🚀 Starting IOT365 All-In-One ESP32 Station");
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
