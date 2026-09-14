/*
 * 🌿 IOT365 — SMART FARM & IRRIGATION CONTROLLER
 * نظام الري والزراعة الذكية
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ESP32Servo.h>

const char* USER_UID = ""; // 👈 ضع معرف الـ UID هنا

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
