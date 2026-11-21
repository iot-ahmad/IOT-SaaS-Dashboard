import React, { useState } from 'react';
import {
  Zap, Upload, Image, Trash2, AlertCircle, FileText, Check,
  Camera, Eye, Layers, ExternalLink
} from 'lucide-react';
import { compressImage, uploadToCloudinary } from '../../lib/cloudinaryUpload';

/**
 * Clean Wiring & Schematic Viewer component for ProjectDetail / Preview
 */
export function SchematicSvgViewer({ wiringImageUrl, wiringDescription, components = [] }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="space-y-4 text-left" dir="ltr">
      {/* Wiring Image */}
      {wiringImageUrl ? (
        <div className="space-y-2">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card text-center p-3 group">
            <img
              src={wiringImageUrl}
              alt="Electrical Wiring Schematic"
              className="w-full object-contain max-h-[460px] mx-auto rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => setIsZoomed(true)}
            />
            <button
              onClick={() => setIsZoomed(true)}
              className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-border text-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Eye size={13} className="text-primary" />
              <span>Zoom Schematic</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-border bg-card text-center space-y-2">
          <Zap size={28} className="text-primary/60 mx-auto" />
          <p className="text-xs text-muted-foreground">No wiring schematic image attached to this project.</p>
        </div>
      )}

      {/* Wiring Explanation */}
      {wiringDescription ? (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText size={14} className="text-primary" />
            <span>Pinout &amp; Wiring Guide:</span>
          </h4>
          <div className="text-xs text-foreground/85 leading-relaxed whitespace-pre-wrap bg-muted/40 p-4 rounded-xl border border-border font-mono select-text">
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
              alt="Full Size Wiring Schematic"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-white text-xs font-bold hover:bg-white/10"
            >
              Close (X)
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
        throw new Error('Failed to upload image to cloud storage');
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

    const defaultGuide = `### Electrical Wiring Table (${mcuName}):
1. Power & Ground Distribution:
   - ${mcuName} 3.3V / 5V  ───►  VCC for all sensors
   - ${mcuName} GND       ───►  Common GND bus

2. Signal & Data Lines:
   - Sensor 1 (Data/OUT)  ───►  GPIO 21 (SDA / Signal)
   - Sensor 2 (Data/OUT)  ───►  GPIO 22 (SCL / ADC)
   - Actuator/Relay (IN)  ───►  GPIO 25 (Digital Output)

Important Notes:
- Ensure a 4.7kΩ pull-up resistor is used on I2C or 1-Wire data lines where required.
- Never drive motors or pumps directly from MCU GPIO pins; always use an isolated relay module or motor driver (e.g., L298N) with an external power supply.`;

    onWiringDescriptionChange(defaultGuide);
  };

  return (
    <div className="space-y-6 text-left" dir="ltr">
      
      {/* ── 1. Upload Schematic Image ── */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Image size={16} className="text-primary" />
              <span>1. Upload Wiring Schematic (Schematic / Circuit Diagram)</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a circuit diagram exported from Fritzing, Wokwi, or EasyEDA, or a clear photo of your breadboard build
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-primary hover:underline transition-colors cursor-pointer"
          >
            {showUrlInput ? 'Upload file instead of URL' : '+ Add via direct image URL'}
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
              className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
            >
              Apply URL
            </button>
          </form>
        )}

        {/* Image Preview or Upload Dropzone */}
        {wiringImageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-background text-center p-3 space-y-3">
            <img
              src={wiringImageUrl}
              alt="Uploaded Wiring Schematic"
              className="max-h-80 mx-auto object-contain rounded-lg"
            />
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground font-mono text-[11px]">Schematic image attached</span>
              <button
                type="button"
                onClick={() => onWiringImageChange('')}
                className="text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Trash2 size={13} />
                <span>Remove &amp; Replace Image</span>
              </button>
            </div>
          </div>
        ) : (
          <label className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-border hover:border-primary/40 rounded-2xl bg-background/60 hover:bg-muted/30 transition-all cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex items-center justify-center text-primary group-hover:scale-105 transition-all mb-3">
              {uploading ? (
                <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              ) : (
                <Upload size={26} className="text-primary" />
              )}
            </div>
            <p className="text-xs font-bold text-foreground mb-1">
              {uploading ? 'Uploading and processing schematic image...' : 'Click to select schematic image or drag and drop here'}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">
              Supports PNG, JPG, WebP, or screenshots from Fritzing &amp; Wokwi
            </p>
          </label>
        )}
      </div>

      {/* ── 2. Step-by-Step Wiring & Pinout Guide ── */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              <span>2. Pinout &amp; Step-by-Step Wiring Guide</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Document the exact pin numbers and how each sensor or actuator connects to the microcontroller
            </p>
          </div>

          <button
            type="button"
            onClick={handleInsertTemplate}
            className="text-xs text-primary hover:bg-primary/10 bg-muted border border-border px-3 py-1.5 rounded-xl transition-all cursor-pointer font-semibold"
          >
            + Insert Suggested Wiring Template
          </button>
        </div>

        <textarea
          rows={7}
          value={wiringDescription}
          onChange={(e) => onWiringDescriptionChange(e.target.value)}
          placeholder={`Write pinout and wiring details here:\nExample:\n- Sensor VCC ──► ESP32 3.3V Pin\n- Sensor GND ──► ESP32 GND Pin\n- Data Line (SDA) ──► ESP32 GPIO21`}
          className="w-full bg-input border border-border rounded-xl p-3.5 text-xs text-foreground focus:outline-none focus:border-primary/50 leading-relaxed font-mono resize-none transition-colors"
        />
      </div>

    </div>
  );
}
