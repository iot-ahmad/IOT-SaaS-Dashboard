import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Cpu, Trash2 } from 'lucide-react';

export default function SavedProjects({ user }) {
  const navigate = useNavigate();
  const [savedList, setSavedList] = useState([]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Bookmark size={20} className="text-zinc-400" />
            <span>المشاريع المحفوظة</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            مكتبتك الخاصة للمشاريع والدوائر التي قمت بحفظها للرجوع إليها
          </p>
        </div>

        <button
          onClick={() => navigate('/hub/explore')}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-xs font-medium text-white transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Cpu size={14} />
          <span>استكشاف المشاريع</span>
        </button>
      </div>

      {/* ── Saved Cards Grid ── */}
      {savedList.length === 0 ? (
        <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-12 text-center space-y-3">
          <Bookmark size={40} className="text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">لم تقم بحفظ أي مشاريع بعد</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            يمكنك حفظ أي مشروع من صفحة استكشاف المشاريع لتظهر هنا وتتمكن من الرجوع إليها سريعاً.
          </p>
          <button
            onClick={() => navigate('/hub/explore')}
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-medium text-xs transition-all cursor-pointer"
          >
            تصفح المستودع الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedList.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/hub/project/${item.id}`)}
              className="group bg-[#18191c] hover:bg-[#1e2025] border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col"
            >
              <div className="p-4 flex-1 flex flex-col space-y-2">
                <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed flex-1">
                  {item.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
