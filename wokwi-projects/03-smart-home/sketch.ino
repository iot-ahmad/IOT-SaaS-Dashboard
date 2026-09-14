/*
 * 🔒 IOT365 — SMART HOME & SECURITY
 * نظام المنزل الذكي والإنذار
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

const char* USER_UID = ""; // 👈 ضع معرف الـ UID هنا

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
