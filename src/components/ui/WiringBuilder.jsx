import React, { useState } from 'react';
import {
  Zap, Upload, Image, Trash2, AlertCircle, FileText, Check,
  Camera, Eye, Layers, ExternalLink, Sparkles
} from 'lucide-react';
import { compressImage, uploadToCloudinary } from '../../lib/cloudinaryUpload';

/**
 * Clean Wiring & Schematic Viewer component for ProjectDetail / Preview
 */
export function SchematicSvgViewer({ wiringImageUrl, wiringDescription, components = [] }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-4">
      {/* Wiring Image */}
      {wiringImageUrl ? (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#141518] text-center p-3 group">
            <img
              src={wiringImageUrl}
              alt="مخطط التوصيل الكهربائي"
              className="w-full object-contain max-h-[460px] mx-auto rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => setIsZoomed(true)}
            />
            <button
              onClick={() => setIsZoomed(true)}
              className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} />
              <span>تكبير المخطط</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-white/[0.08] bg-[#16171a] text-center space-y-2">
          <Zap size={28} className="text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-400">لم يتم إرفاق صورة لمخطط التوصيل لهذا المشروع.</p>
        </div>
      )}

      {/* Wiring Explanation */}
      {wiringDescription ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <FileText size={14} className="text-zinc-400" />
            <span>شرح وتفاصيل التوصيل الصحيح (Pinout & Wiring Guide):</span>
          </h4>
          <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap bg-[#1e2024] p-4 rounded-xl border border-white/[0.06] font-mono select-text">
            {wiringDescription}
          </div>
        </div>
      ) : null}

      {/* Fullscreen Zoom Modal */}
      {isZoomed && wiringImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={wiringImageUrl}
              alt="مخطط التوصيل بالحجم الكامل"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-white text-xs font-bold hover:bg-white/10"
            >
              إغلاق (✕)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Modern Wiring Builder: Image Upload & Detailed Wiring Explanation
 */
export default function WiringBuilder({
  components = [],
  wiringImageUrl = '',
  onWiringImageChange,
  wiringDescription = '',
  onWiringDescriptionChange
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Handle image upload
  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const compressed = await compressImage(file, 1600, 1200, 0.85);
      const res = await uploadToCloudinary(compressed);
      if (res && res.secure_url) {
        onWiringImageChange(res.secure_url);
      } else {
        throw new Error('فشل رفع الصورة إلى السحابة');
      }
    } catch (err) {
      console.error(err);
      // Fallback to base64 local preview if Cloudinary isn't configured
      const reader = new FileReader();
      reader.onload = (ev) => {
        onWiringImageChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onWiringImageChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleInsertTemplate = () => {
    const mcu = components.find(c => c.category === 'MCU' || c.name?.toLowerCase().includes('esp') || c.name?.toLowerCase().includes('arduino'));
    const mcuName = mcu?.name || 'ESP32 NodeMCU';

    const defaultGuide = `### 🔌 جدول التوصيل الكهربائي (${mcuName}):
1. التغذية والطاقة:
   - ${mcuName} 3.3V / 5V  ───►  VCC لجميع الحساسات
   - ${mcuName} GND       ───►  GND (تأريض مشترك)

2. خطوط الإشارة والبيانات:
   - الحساس 1 (Data/OUT)  ───►  GPIO 21 (SDA / Signal)
   - الحساس 2 (Data/OUT)  ───►  GPIO 22 (SCL / ADC)
   - المشغل/الريلاي (IN)   ───►  GPIO 25 (Digital Output)

⚠️ ملاحظات هامة:
- تأكد من استخدام مقاومة Pull-up 4.7kΩ مع حساسات I2C أو 1-Wire عند الحاجة.
- لا تقم بتوصيل المحركات أو المضخات مباشرة بالمتحكم؛ استخدم مرحل (Relay) أو محرك درايفر (L298N) مع مصدر طاقة خارجي.`;

    onWiringDescriptionChange(defaultGuide);
  };

  return (
    <div className="space-y-6">
      
      {/* ── 1. Upload Schematic Image ── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Image size={16} className="text-zinc-400" />
              <span>1. رفع صورة مخطط التوصيل (Schematic / Circuit Diagram)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              صورة مصممة عبر برامج الدوائر (Fritzing, Wokwi, EasyEDA) أو صورة واضحة للتوصيل الحقيقي
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {showUrlInput ? 'رفع ملف بدلاً من الرابط' : '+ إضافة برابط صورة مباشر'}
          </button>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* URL Input */}
        {showUrlInput && (
          <form onSubmit={handleApplyUrl} className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/schematic.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-[#1e2024] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/20"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs font-bold"
            >
              تطبيق الرابط
            </button>
          </form>
        )}

        {/* Image Preview or Upload Dropzone */}
        {wiringImageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#141518] text-center p-3 space-y-3">
            <img
              src={wiringImageUrl}
              alt="مخطط التوصيل المرفوع"
              className="max-h-80 mx-auto object-contain rounded-lg"
            />
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
              <span className="text-zinc-400 font-mono text-[11px]">تم إرفاق صورة المخطط بنجاح ✓</span>
              <button
                type="button"
                onClick={() => onWiringImageChange('')}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 size={13} />
                <span>حذف الصورة واستبدالها</span>
              </button>
            </div>
          </div>
        ) : (
          <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/[0.1] hover:border-white/[0.25] rounded-2xl bg-[#141518]/50 hover:bg-[#141518] transition-all cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:scale-105 transition-all mb-3">
              {uploading ? (
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <Upload size={22} />
              )}
            </div>
            <p className="text-xs font-bold text-white mb-1">
              {uploading ? 'جاري رفع ومعالجة صورة المخطط...' : 'اضغط لاختيار صورة المخطط أو اسحبها إلى هنا'}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono">
              يدعم PNG, JPG, WebP أو لقطات شاشة من Fritzing و Wokwi
            </p>
          </label>
        )}
      </div>

      {/* ── 2. Step-by-Step Wiring & Pinout Guide ── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              <span>2. شرح وتفاصيل التوصيل الصحيح (Pinout & Wiring Guide)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              وضح أرقام الأرجل (Pins) وكيفية توصيل كل حساس أو مشغل بالمتحكم خطوة بخطوة
            </p>
          </div>

          <button
            type="button"
            onClick={handleInsertTemplate}
            className="text-xs text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            + إدراج قالب توصيل مقترح
          </button>
        </div>

        <textarea
          rows={7}
          value={wiringDescription}
          onChange={(e) => onWiringDescriptionChange(e.target.value)}
          placeholder={`اكتب هنا تفاصيل الأرجل والتوصيلات:\nمثال:\n- VCC الحساس ──► منفذ 3.3V في ESP32\n- GND الحساس ──► منفذ GND في ESP32\n- خط البيانات (Data) ──► منفذ GPIO21`}
          className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-white/20 leading-relaxed font-mono resize-none transition-colors"
        />
      </div>

    </div>
  );
}
