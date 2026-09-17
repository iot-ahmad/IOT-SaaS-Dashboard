import React, { useState } from 'react';
import {
  Sparkles, Copy, Eye, X, Check, ArrowRight, Layers,
  Cpu, Star, Bookmark, ExternalLink, HelpCircle, Flame
} from 'lucide-react';
import { FEATURED_TEMPLATES } from '../../data/featuredTemplates';
import { SchematicSvgViewer } from './WiringBuilder';
import { MarkdownPreview } from '../ProjectPublisher';

/**
 * Preview Full Project Dialog (without leaving the wizard)
 */
export function ProjectDetailPreviewModal({ template, isOpen, onClose, onApplyTemplate }) {
  const [activeTab, setActiveTab] = useState('doc'); // 'doc' | 'wiring' | 'parts'

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-card dark:bg-[#0c0e14] border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
                {template.difficulty}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                <Copy size={11} className="text-sky-400" />
                استُخدم {template.timesUsedAsTemplate} مرة كنموذج
              </span>
            </div>
            <h3 className="text-base font-extrabold text-foreground mt-1">{template.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onApplyTemplate(template);
                onClose();
              }}
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20"
            >
              <Copy size={13} />
              استخدم هيكل هذا المشروع كنموذج
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 px-5 pt-3 border-b border-border bg-muted/10">
          <button
            type="button"
            onClick={() => setActiveTab('doc')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'doc' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            التوثيق والكود
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wiring')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'wiring' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            مخطط التوصيل ({template.connections?.length || 0} أسلاك)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('parts')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'parts' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            القطع المستخدمة ({template.components?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
          {activeTab === 'doc' && (
            <div className="space-y-4">
              <MarkdownPreview text={`${template.overviewTemplate}\n\n## 💻 كود التشغيل\n\`\`\`cpp\n${template.codeTemplate}\n\`\`\``} />
            </div>
          )}

          {activeTab === 'wiring' && (
            <div className="space-y-4">
              <SchematicSvgViewer components={template.components} connections={template.connections} />
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {template.components?.map((c, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-card dark:bg-[#07090e] border border-border">
                  <img src={c.imageUrl} alt={c.name} className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" />
                  <div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">{c.category}</span>
                    <h5 className="text-xs font-bold text-foreground mt-0.5">{c.name}</h5>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{c.function}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Featured Projects Selector Modal
 */
export default function FeaturedTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate,
  filterTag = ''
}) {
  const [selectedPreview, setSelectedPreview] = useState(null);

  if (!isOpen) return null;

  const filtered = filterTag
    ? FEATURED_TEMPLATES.filter(t => t.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())) || t.title.toLowerCase().includes(filterTag.toLowerCase()))
    : FEATURED_TEMPLATES;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
        <div className="bg-card dark:bg-[#0c0e14] border border-border rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Flame size={18} className="text-amber-400" />
                المشاريع المميزة والقوالب الجاهزة (Featured Templates)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ابدأ مشروعك من هيكل معد مسبقاً يوفر عليك الوقت في إعداد التوصيلات والكود
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(template => (
                <div
                  key={template.id}
                  className="bg-card dark:bg-[#090b10] border border-border hover:border-primary/50 rounded-2xl overflow-hidden transition-all shadow-lg flex flex-col justify-between group"
                >
                  <div className="relative h-36 w-full bg-zinc-950 overflow-hidden">
                    <img src={template.coverImage} alt={template.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-400">
                      {template.difficulty}
                    </div>
                    <div className="absolute top-2.5 left-2.5 bg-sky-500/20 backdrop-blur-md border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-md text-[9px] font-mono flex items-center gap-1">
                      <Copy size={10} />
                      استُخدم {template.timesUsedAsTemplate} مرة
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {template.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {template.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPreview(template)}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        معاينة كاملة
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(template);
                          onClose();
                        }}
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        className="text-[11px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-primary/20"
                      >
                        <Copy size={12} />
                        استخدم كنموذج
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Full Dialog */}
      <ProjectDetailPreviewModal
        template={selectedPreview}
        isOpen={!!selectedPreview}
        onClose={() => setSelectedPreview(null)}
        onApplyTemplate={(t) => {
          onSelectTemplate(t);
          onClose();
        }}
      />
    </>
  );
}
