import React, { useState } from 'react';
import { X, HelpCircle, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AskQuestionModal({ isOpen, onClose, user, onQuestionAdded }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('حساسات ومشغلات');
  const [tags, setTags] = useState(['ESP32']);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('يرجى ملء عنوان وتفاصيل السؤال.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        authorId: user?.uid || 'guest',
        authorName: user?.displayName || 'مطور إلكترونيات',
        authorUsername: user?.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : 'maker',
        authorPhoto: user?.photoURL || null,
        upvotes: 0,
        answersCount: 0,
        isAnswered: false,
        createdAt: new Date().toISOString()
      };

      if (db) {
        await addDoc(collection(db, 'discussions'), qData);
      }
      if (onQuestionAdded) onQuestionAdded(qData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء حفظ السؤال.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-[#18191c] border border-white/10 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 text-foreground text-right">
        
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle size={18} className="text-zinc-400" />
            <h3 className="text-sm font-bold text-white">طرح سؤال تقني جديد</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">عنوان السؤال *</label>
            <input
              type="text"
              required
              placeholder="مثال: كيفية تقليل استهلاك الطاقة في ESP32 عند استخدام Deep Sleep؟"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition-colors"
              >
                <option value="إدارة الطاقة والبطاريات">إدارة الطاقة والبطاريات</option>
                <option value="حساسات ومشغلات">حساسات ومشغلات</option>
                <option value="السحابة وMQTT">السحابة وMQTT</option>
                <option value="روبوتات ومحركات">روبوتات ومحركات</option>
                <option value="برمجيات ثابتة وRTOS">برمجيات ثابتة وRTOS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">الوسوم</label>
              <input
                type="text"
                placeholder="ESP32, I2C (اضغط Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-500"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-white/[0.04] border border-white/[0.08] text-zinc-300 px-2 py-0.5 rounded">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">تفاصيل السؤال *</label>
            <textarea
              required
              rows={4}
              placeholder="اشرح المشكلة بالتفصيل، السلوك المتوقع، وما قمت بتجربته..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-500 resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.12] text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'جاري الإرسال...' : 'نشر السؤال'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
