import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ThumbsUp, MessageSquare, CheckCheck } from 'lucide-react';

export default function NotificationsView() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      type: 'like',
      icon: ThumbsUp,
      title: 'أعجب أحد المهندسين بمشروعك المنشور',
      time: 'منذ ساعتين',
      isUnread: true,
      link: '/hub/explore'
    },
    {
      id: 'n-2',
      type: 'answer',
      icon: MessageSquare,
      title: 'تمت إضافة رد جديد على أحد النقاشات التقنية',
      time: 'اليوم',
      isUnread: false,
      link: '/hub/discussions'
    }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isUnread: false })));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={18} className="text-zinc-400" />
            <span>التنبيهات</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            آخر التفاعلات والمشاركات داخل المجتمع
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCheck size={13} />
          <span>تحديد الكل كمقروء</span>
        </button>
      </div>

      {/* ── Notification Items ── */}
      <div className="space-y-2.5">
        {notifications.map((notif) => {
          const Icon = notif.icon;

          return (
            <div
              key={notif.id}
              onClick={() => navigate(notif.link)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                notif.isUnread
                  ? 'bg-[#18191c] border-white/[0.15]'
                  : 'bg-[#18191c]/50 border-white/[0.06] hover:bg-[#18191c]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                  <Icon size={15} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${notif.isUnread ? 'text-white' : 'text-zinc-300'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-mono inline-block">
                    {notif.time}
                  </span>
                </div>
              </div>

              {notif.isUnread && (
                <div className="w-2 h-2 rounded-full bg-white shrink-0" />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
