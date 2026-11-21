/**
 * Featured & Template Projects for IOT365 Hub
 * Supports "Use as template" with structure pre-filling.
 */

export const FEATURED_TEMPLATES = [
  {
    id: 'template-weather-station',
    title: 'IoT Smart Weather Station',
    summary: 'An intelligent climate monitoring node that reads ambient temperature and humidity, displays live telemetry on an OLED screen, and publishes real-time MQTT alerts over Wi-Fi.',
    difficulty: 'Beginner',
    difficultyColor: '#22C55E',
    is_featured: true,
    timesUsedAsTemplate: 34,
    rating: 4.9,
    author: 'Ahmed Al-Najjar',
    authorRole: 'IoT Hardware Architect',
    coverImage: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'DHT22', 'OLED', 'Weather', 'WiFi', 'MQTT'],
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'Processes sensor telemetry, manages Wi-Fi connectivity, and publishes MQTT payloads',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'DHT22 / AM2302',
        category: 'SENSOR',
        function: 'Measures ambient temperature (±0.5°C accuracy) and relative humidity',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: '0.96" OLED Display SSD1306',
        category: 'DISPLAY',
        function: 'Renders temperature, humidity, and Wi-Fi signal strength locally',
        imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: '18650 Li-Ion Battery Pack with TP4056',
        category: 'POWER',
        function: 'Provides autonomous off-grid power for outdoor deployment',
        imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'DHT22 / AM2302', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'Sensor Power' },
      { id: 'w2', fromComp: 'DHT22 / AM2302', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'Common Ground' },
      { id: 'w3', fromComp: 'DHT22 / AM2302', fromPin: 'DATA', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO25', color: '#F59E0B', note: '1-Wire Digital Signal' },
      { id: 'w4', fromComp: '0.96" OLED Display SSD1306', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'Display Power' },
      { id: 'w5', fromComp: '0.96" OLED Display SSD1306', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'Display Ground' },
      { id: 'w6', fromComp: '0.96" OLED Display SSD1306', fromPin: 'SDA', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO21', color: '#38BDF8', note: 'I2C Data Bus' },
      { id: 'w7', fromComp: '0.96" OLED Display SSD1306', fromPin: 'SCL', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO22', color: '#22C55E', note: 'I2C Clock Bus' }
    ],
    wiringImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
    wiringDescription: `### Electrical Wiring Table (ESP32 NodeMCU):
1. 0.96" OLED Display (I2C):
   - VCC ──► ESP32 3.3V
   - GND ──► ESP32 GND
   - SDA ──► GPIO 21
   - SCL ──► GPIO 22

2. DHT22 Temperature & Humidity Sensor:
   - VCC ──► ESP32 3.3V
   - GND ──► Common GND
   - DATA ──► GPIO 25 (with 4.7kΩ pull-up resistor)

3. Power Supply:
   - 18650 Battery output via TP4056 module ──► ESP32 VIN & GND pins.`,
    overviewTemplate: `This project builds a compact, low-power smart weather station for high-precision environmental monitoring.

### Key Features:
- Real-time temperature and humidity sampling every 2 seconds.
- Encrypted telemetry streaming to the cloud via MQTT.
- Local status readout on an integrated I2C OLED display.
- Deep Sleep power-saving mode for extended battery life.`,
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
    title: 'Automated Smart Farm Irrigation System',
    summary: 'Automates plant irrigation using capacitive soil moisture probes and a 5V submersible water pump with smart scheduling and dry-run protection.',
    difficulty: 'Intermediate',
    difficultyColor: '#F59E0B',
    is_featured: true,
    timesUsedAsTemplate: 28,
    rating: 4.8,
    author: 'Sara Al-Mahdi',
    authorRole: 'Embedded Systems Specialist',
    coverImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'Soil Moisture', 'Relay', 'Water Pump', 'Automation'],
    wiringImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80',
    wiringDescription: `### Electrical Wiring Table (ESP32 NodeMCU):
1. Capacitive Soil Moisture Sensor:
   - VCC ──► ESP32 3.3V
   - GND ──► Common GND
   - AOUT ──► GPIO 34 (ADC1 Analog Input)

2. 5V Relay Control Module:
   - VCC ──► 5V (VIN)
   - GND ──► GND
   - IN ──► GPIO 26

3. 5V DC Submersible Water Pump:
   - Pump Positive (+) ──► Relay NO (Normally Open) terminal
   - Relay COM terminal ──► External 5V Power Supply Positive (+)
   - Pump Negative (-) ──► Common Power Supply Ground (-)`,
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'Monitors soil moisture levels and automatically triggers the irrigation pump relay',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'Capacitive Soil Moisture Sensor',
        category: 'SENSOR',
        function: 'Measures soil water saturation via corrosion-free analog capacitance sensing',
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: '1-Channel 5V Relay Module',
        category: 'ACTUATOR',
        function: 'Switches the irrigation water pump on/off while isolating the control logic circuit',
        imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: '5V DC Submersible Water Pump',
        category: 'ACTUATOR',
        function: 'Draws water from the reservoir and delivers it through the drip irrigation line',
        imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'Capacitive Soil Moisture Sensor', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '3.3V', color: '#EF4444', note: 'Sensor Power' },
      { id: 'w2', fromComp: 'Capacitive Soil Moisture Sensor', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'Ground' },
      { id: 'w3', fromComp: 'Capacitive Soil Moisture Sensor', fromPin: 'AOUT', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO34 (ADC)', color: '#E2E8F0', note: 'Analog Readout' },
      { id: 'w4', fromComp: '1-Channel 5V Relay Module', fromPin: 'VCC', toComp: 'ESP32 NodeMCU DevKit V1', toPin: '5V (VIN)', color: '#EF4444', note: '5V Relay Power' },
      { id: 'w5', fromComp: '1-Channel 5V Relay Module', fromPin: 'GND', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GND', color: '#475569', note: 'Ground' },
      { id: 'w6', fromComp: '1-Channel 5V Relay Module', fromPin: 'IN', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO26', color: '#22C55E', note: 'Pump Trigger Signal' }
    ],
    overviewTemplate: `An autonomous smart irrigation system designed to maintain optimal soil moisture for crops while minimizing water waste.

### Project Objectives:
- Continuously sample soil moisture and evaluate dryness thresholds.
- Automatically actuate the water pump for a timed cycle when moisture drops below 30%.
- Log irrigation events and water usage telemetry to the cloud dashboard.`,
    codeTemplate: `const int SOIL_PIN = 34;
const int PUMP_RELAY_PIN = 26;
const int DRY_THRESHOLD = 2400; // Calibrate threshold based on your sensor in dry air vs water

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
    title: 'ESP32 Wi-Fi / Bluetooth Autonomous RC Robot Car',
    summary: 'A smart mobile robot equipped with dual DC gear motors, an L298N H-Bridge driver, and an ultrasonic radar servo mount for real-time remote control and autonomous obstacle avoidance.',
    difficulty: 'Advanced',
    difficultyColor: '#A855F7',
    is_featured: true,
    timesUsedAsTemplate: 21,
    rating: 4.95,
    author: 'Omar Al-Qasim',
    authorRole: 'Robotics & Automation Lead',
    coverImage: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80',
    tags: ['ESP32', 'L298N', 'Robotics', 'HC-SR04', 'RC Car', 'Motors'],
    components: [
      {
        id: 'comp-1',
        name: 'ESP32 NodeMCU DevKit V1',
        category: 'MCU',
        function: 'Receives low-latency wireless steering commands and generates PWM motor control signals',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-2',
        name: 'L298N Dual H-Bridge Motor Driver',
        category: 'ACTUATOR',
        function: 'Drives and controls the speed and rotation direction of the left and right DC motors',
        imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-3',
        name: 'HC-SR04 Ultrasonic Distance Sensor',
        category: 'SENSOR',
        function: 'Detects walls and obstacles ahead of the vehicle for emergency braking and pathfinding',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: 'comp-4',
        name: 'SG90 Micro Servo Motor',
        category: 'ACTUATOR',
        function: 'Sweeps the ultrasonic distance sensor left and right to scan the surrounding environment',
        imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=500&auto=format&fit=crop&q=80'
      }
    ],
    connections: [
      { id: 'w1', fromComp: 'L298N Dual H-Bridge Motor Driver', fromPin: 'IN1', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO18', color: '#F59E0B', note: 'Left Motor Forward' },
      { id: 'w2', fromComp: 'L298N Dual H-Bridge Motor Driver', fromPin: 'IN2', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO19', color: '#F59E0B', note: 'Left Motor Reverse' },
      { id: 'w3', fromComp: 'L298N Dual H-Bridge Motor Driver', fromPin: 'IN3', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO22', color: '#38BDF8', note: 'Right Motor Forward' },
      { id: 'w4', fromComp: 'L298N Dual H-Bridge Motor Driver', fromPin: 'IN4', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO23', color: '#38BDF8', note: 'Right Motor Reverse' },
      { id: 'w5', fromComp: 'HC-SR04 Ultrasonic Distance Sensor', fromPin: 'TRIG', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO5', color: '#FB923C', note: 'Trigger Pulse' },
      { id: 'w6', fromComp: 'HC-SR04 Ultrasonic Distance Sensor', fromPin: 'ECHO', toComp: 'ESP32 NodeMCU DevKit V1', toPin: 'GPIO4', color: '#FB923C', note: 'Echo Return Signal' }
    ],
    wiringImageUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=1000&auto=format&fit=crop&q=80',
    wiringDescription: `### Electrical Wiring Table (ESP32 + L298N):
1. L298N Dual H-Bridge Motor Driver:
   - IN1 ──► GPIO 18 (Left Motor)
   - IN2 ──► GPIO 19 (Left Motor)
   - IN3 ──► GPIO 22 (Right Motor)
   - IN4 ──► GPIO 23 (Right Motor)
   - L298N GND ──► Common GND shared between ESP32 and battery pack

2. HC-SR04 Ultrasonic Distance Sensor:
   - VCC ──► 5V
   - GND ──► GND
   - TRIG ──► GPIO 5
   - ECHO ──► Voltage Divider ──► GPIO 4 (3.3V logic level protection)

3. SG90 Micro Servo Motor:
   - Orange PWM Signal Wire ──► GPIO 13`,
    overviewTemplate: `An ESP32-powered robotic vehicle featuring dual operating modes: low-latency manual teleoperation from the web dashboard, and autonomous ultrasonic obstacle avoidance.`,
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
