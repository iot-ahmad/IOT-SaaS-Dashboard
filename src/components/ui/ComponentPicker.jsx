import React, { useState, useMemo, useRef } from 'react';
import {
  Cpu, Plus, Trash2, Search, X, ImagePlus, Check, Sparkles,
  Layers, Tag, Info, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { COMPONENT_DATABASE, COMPONENT_CATEGORIES } from '../../data/componentDatabase';
import { compressImage, uploadToCloudinary } from '../../lib/cloudinaryUpload';

/**
 * Catalog Modal to pick pre-configured components
 */
function ComponentDatabaseModal({ isOpen, onClose, onSelect, onAddCustom }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Custom part form state
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customCategory, setCustomCategory] = useState('SENSOR');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customUploading, setCustomUploading] = useState(false);

  const filteredComponents = useMemo(() => {
    return COMPONENT_DATABASE.filter(item => {
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory;
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.role && item.role.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomUploading(true);
    try {
      const compressed = await compressImage(file, 600, 600, 0.8);
      const url = await uploadToCloudinary(compressed, () => {}, 'iot365/components');
      setCustomImageUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setCustomUploading(false);
    }
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustom({
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      function: customRole.trim(),
      category: customCategory,
      imageUrl: customImageUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80'
    });
    // Reset
    setCustomName('');
    setCustomRole('');
    setCustomImageUrl('');
    setShowCustomForm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-card dark:bg-[#0c0e14] border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary animate-pulse" />
              مكتبة الأجهزة والقطع الإلكترونية
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">اختر من القطع الجاهزة أو أضف قطعة مخصصة لمشروعك</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Category filter */}
        <div className="p-5 border-b border-border space-y-3 bg-muted/30">
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="ابحث عن قطعة (ESP32, DHT22, Relay, شاشة, سيرفو...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card dark:bg-[#07080c] border border-border rounded-xl py-2.5 pr-10 pl-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {COMPONENT_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-primary text-black shadow-md shadow-primary/20'
                    : 'bg-card dark:bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {!showCustomForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredComponents.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect({
                        id: `part-${Date.now()}-${item.id}`,
                        name: item.name,
                        function: item.role,
                        category: item.category,
                        imageUrl: item.imageUrl
                      });
                      onClose();
                    }}
                    className="group flex gap-3 p-3 rounded-2xl bg-card dark:bg-[#0e111a] border border-border hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer relative"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover border border-border shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.defaultPins?.length || 0} Pins
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                        {item.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredComponents.length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-muted-foreground">لم نجد قطعة مطابقة لبحثك في المكتبة.</p>
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(true)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    + إضافة قطعة مخصصة يدوياً الآن
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Custom Part Form */
            <form onSubmit={handleCreateCustom} className="space-y-4 max-w-md mx-auto py-2">
              <h4 className="text-sm font-bold text-foreground">إضافة قطعة مخصصة يدوياً</h4>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground">اسم القطعة أو الحساس *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: BMP280 Barometric Pressure"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-card dark:bg-[#07080c] border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">التصنيف</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-card dark:bg-[#07080c] border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="MCU">وحدة تحكم (MCU)</option>
                    <option value="SENSOR">حساس (SENSOR)</option>
                    <option value="ACTUATOR">مشغل / محرك (ACTUATOR)</option>
                    <option value="DISPLAY">شاشة (DISPLAY)</option>
                    <option value="POWER">طاقة (POWER)</option>
                    <option value="OTHER">أخرى (OTHER)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">صورة القطعة</label>
                  <label className="flex items-center justify-center p-2.5 border border-dashed border-border rounded-xl text-xs text-muted-foreground hover:border-primary cursor-pointer">
                    {customUploading ? 'جاري الرفع...' : customImageUrl ? 'تم اختيار صورة' : 'اختر صورة'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCustomUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground">وظيفة القطعة في المشروع</label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر لوظيفة هذه القطعة..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full bg-card dark:bg-[#07080c] border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  className="flex-1 font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  إضافة القطعة للمشروع
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-card/20">
          {!showCustomForm ? (
            <button
              type="button"
              onClick={() => setShowCustomForm(true)}
              className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus size={14} /> لم تجد قطعتك؟ أضف قطعة مخصصة
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              العودة لقائمة المكتبة
            </button>
          )}

          <span className="text-[11px] text-muted-foreground font-mono">
            {COMPONENT_DATABASE.length} قطع متوفرة
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Visual Card Grid for Hardware Components
 */
export default function ComponentPicker({ components = [], onChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);

  const handleAddComponent = (newComp) => {
    onChange([...components, newComp]);
  };

  const handleUpdateComponent = (id, updatedFields) => {
    onChange(components.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleRemoveComponent = (id) => {
    onChange(components.filter(c => c.id !== id));
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'MCU': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'SENSOR': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ACTUATOR': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DISPLAY': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'POWER': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Top Banner Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-foreground">شبكة بطاقات الأجهزة والقطع التفاعلية</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            أضف كل قطعة إلكترونية مستخدمة (ميكروكنترولر، حساسات، شاشات، مضخات). يمكنك التعديل المباشر على الصور وأوصاف الوظائف لتبسيط فهم الدائرة لبقية المطورين.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp) => (
          <div
            key={comp.id}
            className="group bg-card dark:bg-[#0d1017] border border-border rounded-2xl p-4 flex flex-col justify-between hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/5 relative"
          >
            {/* Remove Action */}
            <button
              type="button"
              onClick={() => handleRemoveComponent(comp.id)}
              className="absolute top-3 left-3 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="حذف القطعة"
            >
              <Trash2 size={13} />
            </button>

            <div className="space-y-3">
              {/* Image & Category */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-border bg-black/40 shrink-0">
                  {comp.imageUrl ? (
                    <img src={comp.imageUrl} alt={comp.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Cpu size={20} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md border mb-1 ${getCategoryColor(comp.category)}`}>
                    {comp.category || 'PART'}
                  </span>
                  <input
                    type="text"
                    value={comp.name}
                    onChange={(e) => handleUpdateComponent(comp.id, { name: e.target.value })}
                    placeholder="اسم القطعة..."
                    className="w-full bg-transparent font-bold text-xs text-foreground focus:outline-none focus:border-b border-primary truncate"
                  />
                </div>
              </div>

              {/* Function / Role */}
              <div>
                <textarea
                  rows={2}
                  value={comp.function || ''}
                  onChange={(e) => handleUpdateComponent(comp.id, { function: e.target.value })}
                  placeholder="وظيفة القطعة في المشروع..."
                  className="w-full bg-card dark:bg-[#07090e] border border-border rounded-xl p-2.5 text-[11px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary resize-none transition-colors"
                />
              </div>
            </div>
          </div>
        ))}

        {/* "+ Add Part" Trigger Card */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 bg-card/[0.01] hover:bg-card/[0.04] transition-all flex flex-col items-center justify-center text-center group cursor-pointer min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
            <Plus size={22} />
          </div>
          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
            + إضافة جهاز أو قطعة (Add Part)
          </span>
          <span className="text-[10px] text-muted-foreground mt-1">
            اختر من قاعدة بيانات المكونات أو أضف يدوياً
          </span>
        </button>
      </div>

      {/* Catalog Modal */}
      <ComponentDatabaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleAddComponent}
        onAddCustom={handleAddComponent}
      />
    </div>
  );
}
