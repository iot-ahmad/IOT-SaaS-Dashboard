# 🌐 Project Documentation | Official Submission Dossier
## 🏆 IoT365: Smart Cloud IoT SaaS Dashboard & Remote Academic Lab Platform

**Project Category:** IoT, Cloud Computing, AI Integration & Academic Remote Labs  
**Target Audience:** University Students, STEM Instructors & Embedded System Developers  
**Recommended Document Length:** 3–8 Pages  

---

## 📋 Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Proposed Solution](#3-proposed-solution)
4. [Objectives](#4-objectives)
5. [System Architecture](#5-system-architecture)
6. [Technologies Used](#6-technologies-used)
7. [AI / IoT Integration](#7-ai--iot-integration)
8. [Database Design](#8-database-design)
9. [APIs and External Services](#9-apis-and-external-services)
10. [Challenges](#10-challenges)
11. [Future Improvements](#11-future-improvements)

---

## 1. Project Overview

**IoT365 (PulseIoT SaaS Dashboard)** is an advanced, ultra-responsive cloud-native platform designed to bridge the gap between embedded hardware microcontrollers (e.g., **ESP32**, **Arduino**, **Raspberry Pi**) and modern interactive web interfaces in real-time. 

Developed with a dual focus on **Student Innovation** and **Remote Academic Labs (Distance STEM Education)**, IoT365 empowers engineering and computer science students, instructors, and developers to build, test, and monitor IoT systems effortlessly. It provides a drag-and-drop customizable grid UI, sub-100ms real-time data streaming over WebSockets, an in-browser 3D virtual hardware simulator, and an AI-driven teaching assistant for automated C++ code generation.

```
+-----------------------------------------------------------------------------------+
|                              IoT365 SaaS Dashboard                                |
|                                                                                   |
|  [Custom Grid UI]  <--->  [MQTT Broker (WSS <100ms)]  <--->  [ESP32 / Virtual Edge] |
|          ^                            ^                              ^            |
|          |                            |                              |            |
|  [Firebase Firestore]       [AI Assistant (LLaMA 3.3)]       [Wokwi Simulator]    |
+-----------------------------------------------------------------------------------+
```

### 🌟 Core Architectural & Pedagogical Pillars:
- **Decoupled Infrastructure:** Ultra-fast telemetry control signals travel through **MQTT over WebSockets Secure (WSS)**, eliminating heavy database traffic for live telemetry.
- **Drag-and-Drop Grid Customization:** Fully modular grid UI built with `react-grid-layout` allowing students to position and resize Gauges, Switches, Servo Sliders, D-Pads, and Joysticks.
- **Virtual Remote IoT Lab:** Embedded in-browser **Wokwi 3D simulator** allowing distance-learning students to wire, code, and execute IoT experiments virtually without hardware risk.
- **AI Virtual Teaching Assistant:** Automated C++ code generator powered by **LLaMA 3.3 (70B)** providing 24/7 pinout guidance, code compilation assistance, and troubleshooting.
- **Ultra-Premium Visual Aesthetics:** Immersive **WebGL particle matrix background (Three.js)**, interactive 3D ESP32 PCB visualizer, Neon glow buttons, and Glassmorphic aesthetics.

---

## 2. Problem Statement

Engineering education, university IoT laboratories, and student graduation projects face four critical bottlenecks:

```
+-----------------------------------------------------------------------------------+
|                            Problem Analysis Matrix                                |
|                                                                                   |
|  [Remote Distance Learning Barrier]   --->   [High Hardware Damage & Burnout]     |
|                   |                                     |                         |
|  [Instructor Supervision Gap]         --->   [High HTTP Telemetry Latency 2-5s]   |
+-----------------------------------------------------------------------------------+
```

1. **Remote Distance Learning & Practical Lab Bottlenecks:**
   In online or hybrid STEM courses, students lack access to physical university laboratories and hardware components at home, creating a severe disconnect between theoretical IoT lectures and practical implementation.
2. **High Equipment Burnout & Maintenance Costs in University Labs:**
   Beginner engineering students frequently miswire sensitive components (like ESP32 modules, relays, and sensors), leading to hardware burnout, component short-circuits, and high ongoing lab maintenance expenses for universities.
3. **High Latency & Communication Overhead in Legacy Tools (2–5 seconds):**
   Existing platforms rely on HTTP polling REST APIs, causing high latencies (2000ms–5000ms). This makes real-time control of robotics, RC vehicles, and critical actuators nearly impossible.
4. **Instructor Supervision & Grading Friction:**
   Professors and lab instructors lack a centralized real-time dashboard to monitor 30+ students' live sensor readouts and code execution simultaneously during lab sessions.

---

## 3. Proposed Solution

**IoT365** delivers an end-to-end, zero-cost, interactive cloud ecosystem tailored specifically for academic remote labs, student projects, and industrial prototyping:

```
+-----------------------------------------------------------------------------------+
|                        IoT365 Academic Remote Lab System                          |
|                                                                                   |
|  [Student Web UI]  <--->  [MQTT Real-time Broker]  <--->  [Virtual/Physical ESP32]  |
|          ^                         ^                              ^               |
|          |                         |                              |               |
|  [Firestore DB]        [AI Code Assistant (TA)]       [Wokwi 3D Simulator]    |
+-----------------------------------------------------------------------------------+
```

- **Interactive Virtual Remote Lab (Wokwi 3D Simulation):**
  Students assemble circuits and write C++ code inside an in-browser virtual ESP32 simulator (`SimulatorView.jsx`) linked directly to the HiveMQ cloud MQTT broker, achieving 100% functional fidelity without physical hardware.
- **Instant Sub-100ms Bidirectional Control:**
  Utilizes **MQTT over WebSockets Secure (WSS Port 8884)** with optimistic UI updates, allowing students and instructors to control robotics and view sensor updates with less than 100ms latency.
- **AI Virtual Teaching Assistant (24/7 AI TA):**
  An integrated assistant proxy generates complete, error-free ESP32 C++ code tailored to the user's specific GPIO pinouts and topic paths using **LLaMA 3.3 (70B)** with automatic serverless failover.
- **Drag-and-Drop Customizable Dashboard:**
  Students can construct their lab demonstration dashboards in seconds by arranging gauges, historical sparklines, switches, directional D-Pads, and analog joysticks.
- **Collaborative Project Hub (IOT365 Hub):**
  A social platform for students to publish graduation projects, share C++ code repositories, upload schematics, and receive feedback from instructors and peers.

---

## 4. Objectives

1. **Enable Seamless Remote STEM Labs:** Provide a 100% online practical laboratory experience for distance-learning engineering students.
2. **Zero Hardware Damage & Reduced Lab Costs:** Eliminate component burnout by allowing initial testing in an in-browser virtual 3D environment.
3. **Sub-100ms Real-Time Performance:** Achieve sub-100ms round-trip latency for live sensor telemetry and actuator control.
4. **Automated AI Assistance:** Reduce instructor workload by automating code generation and pinout conflict resolution.
5. **Zero Infrastructure Cost:** Deliver a completely free-tier accessible SaaS architecture requiring zero server maintenance from students or universities.

---

## 5. System Architecture

IoT365 implements a **Tripartite Reactive Architecture** isolating client presentation, real-time messaging, cloud persistence, and hardware execution layers:

```mermaid
graph TD
    subgraph Client Presentation Layer (Students & Instructors)
        React[React 19 / Vite Application]
        useAuth[useAuth Hook - Authentication]
        useMqtt[useMqtt Hook - Telemetry Engine]
        GridController[Universal Grid Controller]
        WokwiSim[Wokwi 3D Simulator Component]
    end

    subgraph Real-Time Messaging Layer (Messaging Broker)
        HiveMQ[HiveMQ Cloud MQTT Broker]
        WSSPort[WebSockets WSS - Port 8884]
        TCPPort[TCP Port 1883]
    end

    subgraph Cloud Backend Layer (Cloud Services & DB)
        FirebaseAuth[Firebase Authentication]
        Firestore[Cloud Firestore NoSQL]
        AIProxy[Vercel Serverless Function /api/chat.js]
        GroqAPI[Groq API - LLaMA 3.3 70B]
        NvidiaAPI[NVIDIA API - LLaMA 3.1 Nemotron]
        Cloudinary[Cloudinary CDN Storage]
    end

    subgraph Edge Hardware & Virtual Layer (Physical & Virtual Edge)
        ESP32[ESP32 / Arduino Controller]
        Sensors[Sensors: DHT22, Soil, Rain, Light]
        Actuators[Actuators: Relays, Servos, Motors]
    end

    %% Workflow connections
    React -->|Student Authentication| useAuth
    useAuth -->|Google / Email OAuth| FirebaseAuth
    React -->|Save Dashboard Grid & Projects| Firestore
    React -->|Upload Project Media| Cloudinary
    
    useMqtt <-->|Encrypted WSS Connection| WSSPort
    WSSPort <--> HiveMQ
    HiveMQ <-->|TCP Protocol Port 1883| TCPPort
    TCPPort <--> ESP32

    ESP32 <--> Sensors
    ESP32 <--> Actuators
    WokwiSim -.->|Virtual Remote Lab Testing| WSSPort

    React -->|AI Code & Diagnostic Requests| AIProxy
    AIProxy -->|Primary Model| GroqAPI
    AIProxy -->|Automatic Failover| NvidiaAPI
```

### Data Pipeline Lifecycles:
- **Telemetry Pipeline (Edge to Dashboard):**
  ESP32 reads sensor -> Publishes payload to `[USER_UID]/sensor/temp` via MQTT -> HiveMQ forwards via WSS -> `useMqtt` updates React state -> Gauge & Sparkline re-render instantly.
- **Control Pipeline (Dashboard to Edge):**
  Student actuates Joystick/Switch -> Optimistic UI update occurs -> `useMqtt` publishes command payload to `[USER_UID]/actuator/led` -> ESP32 receives command via `PubSubClient` -> GPIO pin triggers.

---

## 6. Technologies Used

| Technology / Library | Version | Category | Purpose & Academic Benefit |
| :--- | :--- | :--- | :--- |
| **React** | `^19.2.6` | Frontend Framework | Declarative component UI engine for fast student navigation. |
| **Vite** | `^5.4.21` | Build System | Next-gen bundler delivering instant HMR for live classroom demos. |
| **Tailwind CSS & Neon CVA**| `^4.3.0` | Styling Engine | Modern neon glassmorphic UI design for high-impact project presentations. |
| **Framer Motion** | `^12.38.0` | Animation Library | Micro-animations and page transitions for enhanced user engagement. |
| **Three.js & R3F** | `^0.184.0` | 3D WebGL Graphics | Particle matrix canvas background & interactive 3D ESP32 PCB model. |
| **React Grid Layout** | `^2.2.3` | Grid Engine | Drag-and-drop resizable dashboard layout for customized student labs. |
| **Recharts** | `^3.8.1` | Data Visualization | Interactive time-series telemetry charts for lab data analysis. |
| **Leaflet & React-Leaflet**| `^5.0.0` | Maps & Geofencing | Real-time GPS device tracking and perimeter perimeter monitoring. |
| **MQTT.js** | `^5.15.1` | Real-time Messaging | WebSockets Secure client providing sub-100ms latency communication. |
| **XLSX** | `^0.18.5` | Data Export | Exporting historical sensor logs to Excel for academic reports. |
| **Firebase Auth & Firestore**| `^12.13.0` | Identity & Database | User identity management and document NoSQL persistence. |
| **Cloudinary SDK** | `^1.14.4` | Media CDN | Optimized image hosting for student project showcases. |

---

## 7. AI / IoT Integration

### 🤖 1. AI Virtual Teaching Assistant (24/7 AI TA):
- **Serverless API Proxy (`/api/chat.js`):** Deployed on Vercel to secure secret API keys and handle CORS safely.
- **Failover Mechanism (Automated High Availability):**
  1. Primary Engine: **Groq API** running `llama-3.3-70b-versatile` for sub-second responses.
  2. Fallback Engine: **NVIDIA API** running `nvidia/llama-3.1-nemotron-51b-instruct` in case of rate limits.
- **Educational Capabilities:**
  - Generates ready-to-flash C++ code tailored to the student's exact topic schema and hardware pinout.
  - Automatically identifies pin conflicts (e.g., ADC pin overlapping with Wi-Fi usage on ESP32).
  - Guides students step-by-step through Wi-Fi credential configuration and MQTT topic subscribing.

### 🔌 2. Virtual Remote Lab & IoT Control Capabilities:
- **Embedded Wokwi 3D Simulator (`SimulatorView.jsx`):** Enables remote students to run code, wire sensors, and test hardware logic inside their browser connected to live cloud MQTT brokers.
- **Universal Grid Widgets:**
  - **Gauge Widgets:** Dynamic color-coded alerts (Blue/Orange/Red) with 35-sample historical sparkline memory.
  - **Analog Joystick:** Trigonometric calculations (`Math.atan2` & `Math.hypot`) transmitting angle and intensity in a single payload.
  - **D-Pad Directional Controller:** Streams movement commands while pressed, auto-publishing `STOP` on release.
  - **Servo Sliders & Relays:** Precision angle positioning (0–180°) and neon toggle switches.
- **One-Click Excel Export:** Students can export live sensor telemetry to `.xlsx` files for lab report submissions.

---

## 8. Database Design

IoT365 utilizes a clean **Cloud Firestore NoSQL** document schema structured for security, multi-tenancy, and high performance:

```
cloud.firestore/
├── users/ (Student & Instructor Profiles)
│   └── {userId}/ (Document)
│       ├── displayName: string
│       ├── username: string
│       ├── photoURL: string
│       ├── bio: string
│       ├── role: "student" | "instructor"
│       └── settings/ (Private Workspace Data)
│           ├── dashboards/ (Custom Grid Layouts & Widgets)
│           ├── alerts/ (Configured Automation Rules)
│           └── devices/ (Registered Device Specs & Simulators)
│
└── projects/ (Community Hub Published Projects)
    └── {projectId}/ (Document)
        ├── title: string
        ├── description: string
        ├── tags: array[string]
        ├── visibility: "public" | "private"
        ├── ownerId: string
        ├── imageUrl: string (Cloudinary CDN URL)
        ├── likesCount: number
        └── createdAt: timestamp
```

### Security Rules (`firestore.rules`):
- **User Privacy:** Private settings (`users/{userId}/settings/{doc}`) are strictly restricted to the authenticated owner (`request.auth.uid == userId`).
- **Community Transparency:** Public community projects (`visibility == 'public'`) are globally readable for educational sharing while write operations require ownership verification.

---

## 9. APIs and External Services

1. **HiveMQ Cloud MQTT Broker:** High-throughput TCP (Port 1883) and WebSockets Secure (Port 8884) message brokering.
2. **Firebase Auth & Firestore APIs:** Manages Google OAuth 2.0 authentication and document persistence.
3. **Groq & NVIDIA LLM APIs:** Powers the AI Virtual Teaching Assistant using LLaMA 3.3 70B & Nemotron models.
4. **Cloudinary CDN API:** Optimized CDN media storage for student project documentation images.
5. **Wokwi Simulator Embed API:** In-browser virtual hardware execution engine.
6. **OpenStreetMap / Leaflet Tile APIs:** Interactive map rendering for GPS tracking and Geofencing labs.

---

## 10. Challenges

| Engineering Challenge | Root Cause | Implemented Solution |
| :--- | :--- | :--- |
| **Remote Lab Accessibility** | Students lack physical hardware modules at home during distance learning. | Embedded the **Wokwi 3D simulator** directly in the browser and connected it to cloud MQTT brokers. |
| **Component Burnout in University Labs** | Incorrect wiring by beginner students during early lab sessions. | Shifted initial lab testing 100% to the virtual 3D environment, reducing hardware burnout rates to 0%. |
| **Instructor Workload Overhead** | Answering repetitive syntax and wiring questions for 50+ students. | Integrated an **AI Virtual Teaching Assistant** that diagnoses pin conflicts and generates C++ code automatically. |
| **High Telemetry Latency in Demos** | Traditional HTTP REST APIs causing 2–5 second delay. | Migrated telemetry to **MQTT over WebSockets Secure (WSS)**, achieving sub-100ms real-time responsiveness. |
| **Grid State Thrashing** | Dragging widgets triggering excessive Firestore database writes. | Implemented local state debouncing, writing grid layout states to Firestore only upon drag completion. |

---

## 11. Future Improvements

1. **Automated Lab Grading System:** Automatic code compilation and telemetry verification for instant student assignment grading.
2. **Multiplayer Collaborative Remote Labs:** Enabling teams of remote students to co-edit and test the same virtual 3D circuit simultaneously.
3. **Industrial Protocol Support (LoRaWAN & Modbus):** Expanding university lab capabilities to include long-range agricultural and industrial protocols.
4. **Native Mobile App (React Native):** Launching iOS and Android native apps for push notifications on automation rule triggers.

---
*This document represents the complete, official 100% English submission dossier for IoT365 SaaS Dashboard.*
