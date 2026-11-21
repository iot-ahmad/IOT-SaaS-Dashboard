import React, { useEffect, useRef } from 'react';
import { X, Copy, Check, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

export default function MoreMenu({
  isOpen,
  onClose,
  wokwiUrlInput,
  setWokwiUrlInput,
  onApplyUrl,
  onResetDefault,
  isDefaultUrl,
  activeWokwiUrl,
  userUID,
  copiedUid,
  onCopyUid,
  onReloadIframe,
  isCustomProject,
  onOpenModal,
  buttonRef
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        buttonRef?.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target) &&
        (!buttonRef?.current || !buttonRef.current.contains(e.target))
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات المحاكي والحساب"
      className="absolute end-0 top-full mt-2 w-72 sm:w-80 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl p-3 z-50 flex flex-col gap-3 text-xs animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="font-bold text-foreground">إعدادات المحاكي والحساب</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق القائمة"
          className="text-zinc-400 hover:text-foreground p-1 rounded-md"
        >
          <X size={14} />
        </button>
      </div>

      {/* Wokwi Project URL Form */}
      <form onSubmit={onApplyUrl} className="flex flex-col gap-1.5">
        <label htmlFor="wokwi-url-input" className="text-zinc-400 text-[11px]">
          رابط مشروع Wokwi:
        </label>
        <div className="flex items-center gap-1.5">
          <input
            id="wokwi-url-input"
            type="text"
            value={wokwiUrlInput}
            onChange={(e) => setWokwiUrlInput(e.target.value)}
            placeholder="رابط Wokwi أو Project ID..."
            className="flex-1 bg-zinc-800 border border-white/10 text-xs rounded-lg px-2.5 py-1.5 outline-none font-mono text-zinc-200 truncate focus:border-primary/50"
          />
          <button
            type="submit"
            className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            تحديث
          </button>
        </div>
        {!isDefaultUrl && (
          <button
            type="button"
            onClick={onResetDefault}
            className="text-[10px] text-zinc-400 hover:text-primary text-start underline cursor-pointer"
          >
            استعادة الرابط الافتراضي
          </button>
        )}
      </form>

      {/* Account UID */}
      {userUID && (
        <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
          <span className="text-zinc-400 text-[11px]">معرّف الحساب (UID):</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={userUID}
              dir="ltr"
              aria-label="Account UID"
              className="flex-1 bg-zinc-800 border border-white/10 text-[11px] font-mono text-zinc-300 px-2 py-1 rounded-lg select-all outline-none"
            />
            <button
              type="button"
              onClick={onCopyUid}
              aria-label="نسخ معرّف الحساب"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold shrink-0 cursor-pointer"
            >
              {copiedUid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedUid ? 'تم' : 'نسخ'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action links */}
      <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            onReloadIframe();
            onClose();
          }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-foreground text-xs transition-colors cursor-pointer text-start"
        >
          <RefreshCw size={13} />
          <span>إعادة تحميل المحاكي</span>
        </button>

        <a
          href={activeWokwiUrl.includes('http') ? activeWokwiUrl : `https://wokwi.com/projects/${activeWokwiUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-foreground text-xs transition-colors text-start"
        >
          <ExternalLink size={13} />
          <span>فتح في Wokwi بتبويب جديد ↗</span>
        </a>

        {!isCustomProject && (
          <button
            type="button"
            onClick={() => {
              onOpenModal();
              onClose();
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 text-amber-400 hover:text-amber-300 text-xs transition-colors cursor-pointer text-start"
          >
            <Sparkles size={13} />
            <span>الكود ومخطط التوصيل الكامل</span>
          </button>
        )}
      </div>
    </div>
  );
}
