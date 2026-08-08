# 📘 التقرير الفني الشامل لتوثيق المشروع: منصة IoT365 SaaS Dashboard

---

## 📋 جدول المحتويات (Table of Contents)
1. [الملخص التنفيذي ورؤية المشروع (Executive Summary & Project Vision)](#1-الملخص-التنفيذي-ورؤية-المشروع)
2. [المعمارية الهندسية وتدفق البيانات (System Architecture & Data Flow)](#2-المعمارية-الهندسية-وتدفق-البيانات)
3. [التقنيات المستخدمة وبنية البرمجيات (Tech Stack & Software Ecosystem)](#3-التقنيات-المستخدمة-وبنية-البرمجيات)
4. [منظومة الذكاء الاصطناعي وإنترنت الأشياء (AI & IoT Integration)](#4-منظومة-الذكاء-الاصطناعي-وإنترنت-الأشياء)
5. [تصميم قواعد البيانات، الأمن وقواعد الوصول (Database Schema, Rules & Security)](#5-تصميم-قواعد-البيانات-الأمن-وقواعد-الوصول)
6. [التفصيل الهيكلي للمكونات والشاشات (Component Breakdown & UI Modules)](#6-التفصيل-الهيكلي-للمكونات-والشاشات)
7. [دليل النشر، الصيانة والخارطة المستقبلية (Deployment, Operations & Future Roadmap)](#7-دليل-النشر-الصيانة-والخارطة-المستقبلية)

---

## 1. الملخص التنفيذي ورؤية المشروع

### 1.1 التعريف بالمشروع
تُعد منصة **IoT365 (PulseIoT SaaS Dashboard)** حلاً سحابياً متكاملاً لإدارة، مراقبة، والتحكم بأجهزة إنترنت الأشياء (IoT) والشرائح المدمجة (Microcontrollers) مثل **ESP32** و **Arduino** في الوقت الفعلي (Real-time). 

تتميز المنصة بتوفير بيئة عمل تفاعلية مرنة تعتمد على **السحب والإفلات (Drag and Drop)** لبناء لوحات تحكم مخصصة بالكامل دون الحاجة لإعادة كتابة الأكواد أو إعداد خوادم معقدة، مع دمج مساعد ذكاء اصطناعي مخصص لدعم المطورين ومحاكي برمجي مدمج لاختبار الدارات افتراضياً قبل تطبيقها في الواقع.

```
+-----------------------------------------------------------------------------------+
|                              IoT365 SaaS Dashboard                                |
|                                                                                   |
|  [Custom Dashboards]  <-->  [MQTT Real-time Broker]  <-->  [ESP32 / Microcontrollers] |
|          ^                            ^                             ^             |
|          |                            |                             |             |
|  [Firebase Security]        [AI Assistant (LLaMA 3.3)]      [Wokwi Simulator]     |
+-----------------------------------------------------------------------------------+
```

### 1.2 الفلسفة والأهداف الاستراتيجية
1. **الفصل بين إدارة الهوية والاتصال اللحظي (Decoupled Infrastructure):**
   تخفيف العبء عن الأجهزة المدمجة (ESP32) عبر فصل استعلامات قاعدة البيانات عن اتصالات التحكم الفوري. تم تخصيص **Firebase Firestore** لإعدادات المستخدم وملفاته العامة، بينما يمر التحكم والبيانات اللحظية عبر **MQTT Broker** فائق السرعة عبر شبكات **WebSockets Secure (WSS)**.
2. **تجربة مستخدم راقية (Ultra-Premium Tech Aesthetics):**
   اعتماد لغة تصميم تكنولوجية زاهية تجمع بين أنماط **Glassmorphic UI**، خلفيات جزيئية تفاعلية تعتمد على **WebGL / Three.js**، وأزرار نيون توفر تغذية راجعة حركية (Micro-animations).
3. **بيئة متكاملة للمطور والمجتمع (Developer & Community Centric):**
   توفير مجتمع تفاعلي **(Project Hub)** لمشاركة مشاريع إنترنت الأشياء المبتكرة، وتوليد أكواد C++ أوتوماتيكياً متوافقة تماماً مع الأجهزة وتراكيب المنصة.

---

## 2. المعمارية الهندسية وتدفق البيانات

### 2.1 النمط المعماري (Architectural Pattern)
يعتمد المشروع معمارية **ثلاثية الأطراف المتزامنة (Tripartite Reactive Architecture)** المكونة من: الواجهة الأمامية للمستخدم (Frontend Client)، وسيط الاتصال السريع (MQTT Broker)، وقواعد البيانات والخدمات السحابية (Cloud Backend & APIs).

```mermaid
graph TD
    subgraph Client Layer (الواجهة الأمامية)
        React[React 19 / Vite Application]
        useAuth[useAuth Hook - المصادقة]
        useMqtt[useMqtt Hook - الاتصال اللحظي]
        GridController[Universal Controller Grid]
        WokwiSim[Wokwi 3D Simulator Component]
    end

    subgraph Messaging & Real-time Layer (الوسيط اللحظي)
        HiveMQ[HiveMQ Cloud MQTT Broker]
        WSSPort[WebSockets WSS - Port 8884]
        TCPPort[TCP Port 1883]
    end

    subgraph Backend & Database Layer (الخدمات السحابية)
        FirebaseAuth[Firebase Authentication]
        Firestore[Cloud Firestore NoSQL]
        AIProxy[Vercel Serverless Function /api/chat.js]
        GroqAPI[Groq API - LLaMA 3.3 70B]
        NvidiaAPI[NVIDIA API - LLaMA 3.1 Nemotron]
        Cloudinary[Cloudinary CDN Storage]
    end

    subgraph Physical & Virtual Edge Layer (الأجهزة والأطرف)
        ESP32[ESP32 Hardware Module]
        Sensors[الحساسات: DHT22, Soil, Rain, Light]
        Actuators[المحركات: Relays, Servos, Motors]
    end

    %% Flow lines
    React -->|حفظ الجلسة| useAuth
    useAuth -->|Google / Email Auth| FirebaseAuth
    React -->|حفظ التخطيطات والمشاريع| Firestore
    React -->|رفع الصور| Cloudinary
    
    useMqtt <-->|رسائل تشفير WSS| WSSPort
    WSSPort <--> HiveMQ
    HiveMQ <-->|بروتوكول TCP MQTT| TCPPort
    TCPPort <--> ESP32

    ESP32 <--> Sensors
    ESP32 <--> Actuators
    WokwiSim -.->|محاكاة الأوامر| WSSPort

    React -->|استفسارات الذكاء الاصطناعي| AIProxy
    AIProxy -->|الخيار الأول| GroqAPI
    AIProxy -->|الخيار التناوبي Failover| NvidiaAPI
```

### 2.2 خط سير البيانات في الوقت الفعلي (Data Flow Lifecycle)

#### 1. قراءة البيانات من الجهاز إلى المنصة (Telemetry Pipeline):
- يقرأ شريحة **ESP32** قيمة الحساس (مثل درجة الحرارة من حساس DHT22).
- ينشر الجهاز الرسالة بتنسيق خفيف عبر بروتوكول MQTT إلى الموضوع المقترن بمعرف المستخدم الفريد (UID):
  `[USER_UID]/sensor/temperature`
- يستقبل الخادم الوسيط **HiveMQ** الرسالة ويوجهها فوراً عبر WebSocket مشفر إلى متصفح العميل المشترك في الموضوع `[USER_UID]/#`.
- يستقبل الـ Hook المخصص `useMqtt` الرسالة، ويقوم بتحديث الحالة المحلية `deviceStates` خلال أجزاء من الثانية (Sub-second Latency) ورسم التغيير في المؤشر الرقمي والمنحنى البياني التفاعلي (Gauge & Sparkline Chart).

#### 2. إرسال أوامر التحكم من الواجهة إلى الجهاز (Control Command Pipeline):
- ينقر المستخدم على زر المصباح أو يحرك عصا التحكم (Joystick) في قسم `UniversalController`.
- ينفذ التطبيق **تحديثاً تفاؤلياً (Optimistic UI Update)** لإعطاء استجابة بصرية فورية للمستخدم.
- ينشر الـ Hook `useMqtt` الأمر مباشرة نحو الخادم الوسيط على الموضوع:
  `[USER_UID]/actuator/led` بمحتوى `ON` أو `OFF` أو أرقام السرعة والاتجاه للسيارة اللاسلكية.
- يستقبل الـ ESP32 الأمر عبر مكتبة `PubSubClient` وينفذ الإشارة الفيزيائية على منفذ الـ GPIO المناسب.

---

## 3. التقنيات المستخدمة وبنية البرمجيات

### 3.1 تقنيات الواجهة الأمامية (Frontend Ecosystem)
| التقنية / المكتبة | الإصدار | الغرض الاستخدامي |
| :--- | :--- | :--- |
| **React** | `^19.2.6` | الإطار الأساسي لبناء واجهات المستخدم التفاعلية المعياري. |
| **Vite** | `^5.4.21` | أداة التجميع الفائقة السرعة لتطوير وبناء التطبيق. |
| **TailwindCSS** | `^4.3.0` | نظام التنسيق الحديث لإدارة الألوان والأبعاد والتصميم المجاوب. |
| **Framer Motion** | `^12.38.0` | محرك التحريكات الدقيقة والمستجيبة للتفاعل والتحويلات البصرية. |
| **Three.js & R3F** | `^0.184.0` | إنشاء الخلفيات الجزيئية التفاعلية 3D ونماذج الـ PCB للـ ESP32. |
| **react-grid-layout** | `^2.2.3` | تخطيط السحب والإفلات وإعادة تحجيم الأزرار والمؤشرات بدقة. |
| **Recharts** | `^3.8.1` | رسم البيانيات الإحصائية التفاعلية لقراءات الحساسات التاريخية. |
| **Leaflet & React-Leaflet**| `^5.0.0` | عرض خرائط GPS وتحديد النطاقات الجغرافية للأجهزة (Geofencing). |
| **MQTT.js** | `^5.15.1` | العميل التفاعلي لإجراء اتصالات WebSockets اللحظية مع الوسيط. |
| **XLSX** | `^0.185` | تصدير سجلات قراءات الأجهزة والبيانات التاريخية لملفات إكسل. |

### 3.2 بنية الخادم والخدمات السحابية (Backend & Cloud Services)
* **Firebase Authentication:** مصادقة المستخدمين وتأمين الحسابات بالبريد والكلمة السرية وتوفير تسجيل الدخول عبر Google و GitHub OAuth.
* **Cloud Firestore:** قاعدة بيانات سحابية مستنديه (NoSQL) لحفظ تفضيلات المستخدمين، توزيعات لوحات التحكم، والمشاريع العامة والخاصة.
* **Serverless Functions (`/api/chat.js`):** خادم عديم الخادم على بيئة **Vercel** لإجراء الاتصال بأمان مع نماذج الذكاء الاصطناعي دون كشف مفاتيح الـ API في جانب العميل.
* **Cloudinary React SDK:** استضافة وإدارة الوسائط المرفقة للمشاريع وصور الملف الشخصي بكفاءة وتقديمها عبر شبكة CDN فائقة السرعة.

---

## 4. منظومة الذكاء الاصطناعي وإنترنت الأشياء

### 4.1 المساعد الذكي المدمج (AI Assistant System)
تم دمج مساعد ذكاء اصطناعي تقني في مكون `ToolViews.jsx` مدعوم بدالة سحابية (`/api/chat.js`) تعتمد على نماذج لغوية ضخمة متقدمة:

```javascript
// آلية التبديل التلقائي لضمان الموثوقية (Groq primary -> NVIDIA fallback)
1. Groq API (Model: llama-3.3-70b-versatile)
2. Fallback: NVIDIA API (Model: nvidia/llama-3.1-nemotron-51b-instruct)
```

#### الوظائف الرئيسية للمساعد الذكي:
- **تحليل قراءات الحساسات:** تشخيص التذبذبات غير العادية في الحرارة، الرطوبة، أو مستويات الغاز وتقديم توصيات صيانة.
- **توليد أكواد C++ للأجهزة:** إنشاء برامج ESP32 كاملة بناءً على المكونات التي يختارها المستخدم في لوحة التحكم.
- **استكشاف الأخطاء وتتبعها (Troubleshooting):** تقديم حلول فورية لمشاكل انقطاع اتصال الواي فاي، عدم استجابة المنافذ (GPIO Conflict)، وتعارض الـ MQTT Topics.

```
+----------------------------------------------------------------------------+
|                         AI Decision & Assistance                           |
|                                                                            |
| User Prompt -> /api/chat.js -> Groq LLaMA 3.3-70B -> Dynamic C++ Code      |
|                                     | (Failover)                           |
|                                     v                                      |
|                             NVIDIA Nemotron-51B                            |
+----------------------------------------------------------------------------+
```

### 4.2 الميزات الخاصة بإنترنت الأشياء (IoT Core Capabilities)

#### 1. المتحكم العالمي التفاعلي (`UniversalController.jsx`):
يوفر أدوات تحكم متنوعة تشمل:
- **مؤشرات الحساسات (Gauge Widgets):** متغيرة الألوان بحسب الخطر (أزرق/برتقالي/أحمر) مع محرك Sparkline يحفظ آخر 35 قراءة لحظية.
- **مفاتيح التحكم بالمحركات (LED Switch & Servo Sliders):** مفاتيح نيون للتحكم بالشرائح الكهربائية وتعديل زوايا السيرفو (0 - 180 درجة).
- **أدوات التحكم بالروبوتات (D-Pad & Analog Joystick):**
  - **D-Pad:** أزرار اتجاهية تطلق الأوامر أثناء الضغط وتتوقف تلقائياً (`STOP`) فور إفلات الزر.
  - **Analog Joystick:** عصا تحكم تناظرية حسابية تعتمد على الدوال المثلثية (`Math.atan2` و `Math.hypot`) لحساب زاوية وقوة التوجيه ونشرها فوراً للجهاز.

#### 2. محاكي Wokwi المدمج (`SimulatorView.jsx`):
يتيح للمطورين اختبار البرامج في بيئة تفاعلية افتراضية تجسد شريحة ESP32 ومكوناتها دون الحاجة لتوصيل أسلاك أو مخاطرة بإتلاف القطع الإلكترونية.

#### 3. محرك الأتمتة والخرائط الجغرافية (Automations & Geofencing):
- **الأتمتة (Automation Rules):** إنشاء قواعد مشروطة تفاعلية (مثال: `If Soil Moisture < 20% → Turn on Irrigation Relay`).
- **تتبع الخرائط (Geofencing & GPS Tracking):** تحديد النطاقات المسموحة للأجهزة المتحركة وتلقي تنبيهات عند خروج الجهاز عن النطاق المحدد.

---

## 5. تصميم قواعد البيانات، الأمن وقواعد الوصول

### 5.1 هيكلية قاعدة بيانات Firestore (Database Schema)

تعتمد قاعدة البيانات على بنية وثائق مستندية (Document-oriented NoSQL) مقسمة بشكل منهجي:

```
cloud.firestore/
├── users/ (تجميعة المستخدمين)
│   └── {userId}/ (وثيقة المستخدم)
│       ├── displayName: string
│       ├── username: string
│       ├── photoURL: string
│       ├── bio: string
│       ├── createdAt: timestamp
│       └── settings/ (تجميعة الإعدادات الخاصة)
│           ├── dashboards/ (لوحات التحكم والتخطيطات)
│           ├── alerts/ (التنبيهات المخصصة)
│           └── devices/ (سجل الأجهزة المرتبطة)
│
└── projects/ (تجميعة مشاريع مجتمع IOT365 Hub)
    └── {projectId}/ (وثيقة المشروع)
        ├── title: string
        ├── description: string
        ├── tags: array[string]
        ├── visibility: "public" | "private"
        ├── ownerId: string
        ├── imageUrl: string (Cloudinary CDN Link)
        ├── likesCount: number
        └── createdAt: timestamp
```

### 5.2 قواعد الأمن وصلاحيات الوصول (`firestore.rules`)
تم كتابة قواعد حماية دقيقة في ملف `firestore.rules` تضمن التوازن بين شفافية مشاريع المجتمع وحماية بيانات الإعدادات الخاصة:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. تجميعة المستخدمين: القراءة متاحة للجميع بينما الكتابة محصورة بمالك الحساب
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;

      // الإعدادات الخاصة داخل حساب المستخدم محصورة كلياً بمالك الحساب
      match /settings/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    // 2. تجميعة المشاريع: قراءة المشاريع العامة متاحة للجميع، والكتابة للمالك فقط
    match /projects/{projectId} {
      allow read: if resource == null 
                  || resource.data.visibility == 'public' 
                  || (request.auth != null && request.auth.uid == resource.data.ownerId);
      
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

---

## 6. التفصيل الهيكلي للمكونات والشاشات

```
src/
├── App.jsx                       # إدارة الحالة الكلية للمستخدم ومساحات العمل والملاحة
├── firebase.js                   # إعداد وربط Firebase Auth & Firestore
├── index.css                     # المتغيرات الهيكلية والتنسيقات النيونية والأنماط الزجاجية
├── api/
│   └── chat.js                   # الخادم عديم الخادم للاتصال بنماذج الذكاء الاصطناعي
└── components/
    ├── AuthPage.jsx              # شاشة المصادقة وتأكيد البريد وتغيير كلمة السر
    ├── UniversalController.jsx   # الشبكة التفاعلية الرئيسية لإدارة أدوات التحكم اللحظية
    ├── DeveloperGuide.jsx        # دليل المطورين والأكواد المصدريّة البرمجية للـ ESP32
    ├── ProjectPublisher.jsx      # أداة نشر وتأليف المشاريع البرمجية في مجتمع المنصة
    ├── ProjectFeed.jsx           # استعراض المشاريع العامة وتصفية المشاريع بحسب الوسوم
    ├── ProjectDetail.jsx         # تفاصيل المشروع والتفاعل معه والتواصل مع المبتكر
    ├── SimulatorView.jsx         # محاكي Wokwi الافتراضي للدوائر الإلكترونية
    ├── ESP32Model.jsx            # النموذج ثلاثي الأبعاد لجهاز ESP32 باستخدام Framer Motion
    ├── ToolViews.jsx             # شاشات التنبيهات، الأتمتة، الخرائط، والتحليلات والذكاء الاصطناعي
    ├── ProfilePage.jsx           # إدارة الملف الشخصي، المظهر، وربط حسابات الشبكات
    ├── Sidebar.jsx               # القائمة الجانبية التنقلية التفاعلية القابلة للطي
    └── Header.jsx                # شريط العنوان العلوي، مؤشر الاتصال، وإدارة الإشعارات
```

---

## 7. دليل النشر، الصيانة والخارطة المستقبلية

### 7.1 خطوات التشغيل والبناء المحلي (Local Development)
1. **تثبيت الاعتماديات البرمجية:**
   ```bash
   npm install
   ```
2. **إعداد متغيرات البيئة (`.env`):**
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   GROQ_API_KEY=your_groq_key
   NVIDIA_API_KEY=your_nvidia_key
   ```
3. **تشغيل الخادم المحلي:**
   ```bash
   npm run dev
   ```
4. **تجميع المشروع للإنتاج (Production Build):**
   ```bash
   npm run build
   ```

### 7.2 الآفاق والخارطة المستقبلية (Future Roadmap)
1. **دعم الاتصالات الكمية المتعددة (LoRaWAN & BLE Bridge):** إضافة دعم لبروتوكولات الاتصال طويلة المدى والمخفضة للطاقة.
2. **التحليلات التنبؤية بالذكاء الاصطناعي (Predictive Maintenance):** دمج نماذج تعلم الآلة للتنبؤ بأعطال المحركات والمضخات قبل وقوعها بناءً على الاهتزاز والحرارة.
3. **تطبيق الهاتف المحمول المباشر (React Native App):** إصدار نسخة محمولة تعمل بنظامي iOS و Android مع دعم الإشعارات الفورية (Push Notifications).

---
*تم إنشاء هذا التقرير الفني المكتمل لمنصة IoT365 SaaS Dashboard ليكون وثيقة رسمية تشرح كافة الأبعاد الهندسية والتقنية للنظام.*
