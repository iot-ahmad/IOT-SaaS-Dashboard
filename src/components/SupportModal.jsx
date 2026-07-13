import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, LifeBuoy } from 'lucide-react';

const InstagramIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = ({ size = 20, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function SupportModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer z-40"
          />

          {/* Modal content card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-card/95 dark:bg-[#0c0d12]/95 border border-border/80 dark:border-white/[0.08] p-8 rounded-3xl w-full max-w-md shadow-[0_20px_80px_rgba(0,0,0,0.9)] text-foreground z-50 overflow-hidden"
            dir="rtl"
          >
            {/* Subtle neon glowing accent dots */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 left-5 text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted/50 transition-all cursor-pointer z-10 animate-none select-none"
              title="إغلاق"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 text-primary">
                <LifeBuoy size={24} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">الدعم الفني · Support</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                نسعد بمساعدتك! تواصل معنا مباشرة عبر القنوات الرسمية التالية:
              </p>
            </div>

            {/* Links list */}
            <div className="space-y-4">
              {/* Instagram Link */}
              <a
                href="https://www.instagram.com/iot365.tech?igsh=MjVvcnlhNm41cnBi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 border border-pink-500/15 hover:border-pink-500/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-500/10">
                    <InstagramIcon size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground group-hover:text-pink-400 transition-colors">الانستغرام (Instagram)</p>
                    <p className="text-[11px] text-muted-foreground font-mono">@iot365.tech</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted-foreground group-hover:text-pink-400 group-hover:translate-x-[-2px] transition-all" />
              </a>

              {/* LinkedIn Link */}
              <a
                href="https://www.linkedin.com/in/ahmad-al-batayneh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600/5 to-cyan-500/5 hover:from-blue-600/10 hover:to-cyan-500/10 border border-blue-600/15 hover:border-blue-600/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/10">
                    <LinkedinIcon size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">لينكد إن (LinkedIn)</p>
                    <p className="text-[11px] text-muted-foreground">م. أحمد البطاينة</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted-foreground group-hover:text-blue-400 group-hover:translate-x-[-2px] transition-all" />
              </a>
            </div>

            {/* Footer note */}
            <div className="mt-6 pt-4 border-t border-border/40 text-center">
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                IOT365 SMART DASHBOARD · SUPPORT TEAM
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
