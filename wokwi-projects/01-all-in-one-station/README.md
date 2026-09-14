# المحطة الشاملة لاختبار منصة IOT365 (All-In-One IoT Station)

مشروع محاكاة كامل على Wokwi لاختبار كافة قدرات الموقع والداشبورد وحساسات إنترنت الأشياء في مكان واحد.

---

## 📋 طريقة التشغيل في 30 ثانية على Wokwi:
1. افتح موقع [Wokwi.com](https://wokwi.com) واختر **ESP32**.
2. انتقل لتبويب `diagram.json`، واحذف كل شيء والصق محتوى ملف `diagram.json`.
3. انتقل لتبويب `sketch.ino`، والصق كود `sketch.ino`.
4. انتقل لتبويب `libraries.txt`، والصق محتويات `libraries.txt`.
5. ضع معرّف حسابك (UID) في خانة:
   ```cpp
   const char* USER_UID = "YOUR_UID_HERE";
   ```
   *(إذا تركته فارغاً `""`، يمكنك اختباره تحت `guest_iot365`)*.
6. اضغط على الزر الأخضر **▶ Play** لبدء المحاكاة والبث اللحظي للداشبورد!

---

## 🔌 جدول التوصيلات والمواضيع (Pinout & MQTT Topics):

| القطعة | المنفذ (Pin) | نوع الإشارة | موضوع الـ MQTT | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| **DHT22** | GPIO 15 | قراءة رقمية | `sensor/temp` و `sensor/humidity` | حرارة ورطوبة الجو |
| **HC-SR04** | Trig 5, Echo 18 | نبضي | `sensor/distance` | قياس المسافة بالموجات فوق الصوتية (سم) |
| **Potentiometer** | GPIO 34 | تماثلي ADC1 | `farm/moisture` | رطوبة التربة أو مستوى الخزان (0-100%) |
| **LDR** | GPIO 35 | تماثلي ADC1 | `sensor/light` | حساس شدة الضوء المحيط |
| **PIR Motion** | GPIO 19 | رقمي Input | `security/motion` | كاشف الحركة (1 حركة، 0 أمان) |
| **LED Switch** | GPIO 2 | رقمي Output | `actuator/led` | تشغيل وإطفاء المصباح |
| **Relay** | GPIO 25 | رقمي Output | `actuator/relay` | تشغيل وإطفاء المرحّل الكهربائي |
| **Servo SG90** | GPIO 13 | PWM Servo | `actuator/servo` | زاوية دوران السيرفو (0 إلى 180) |
| **PWM Fan** | GPIO 4 | PWM Output | `actuator/dimmer` و `stem/fan` | مروحة أو إضاءة متغيرة (0-255) |
| **Buzzer** | GPIO 12 | صوت Tone | `sound/buzzer` | صفارة صوتية وتنبيهات الطوارئ |
| **NeoPixel Ring** | GPIO 23 | WS2812 Data | `light/rgb` | إضاءة ملونة بصيغة `R,G,B` |
| **OLED Display** | I2C (21, 22) | I2C Bus | `display/oled` | شاشة لعرض البيانات والأوامر الواردة |
| **D-Pad & Speed** | البرمجة | أوامر نصية | `car/move` و `car/speed` | FORWARD, BACK, LEFT, RIGHT, STOP |
