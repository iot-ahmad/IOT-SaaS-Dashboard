/*
 * 🏎️ IOT365 — SMART RC CAR CONTROLLER
 * تحكم كامل بالسيارة الذكية وحساس المسافة
 */
#include <WiFi.h>
#include <PubSubClient.h>

const char* USER_UID = ""; // 👈 ضع معرف الـ UID هنا

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
