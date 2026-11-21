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
      title: 'An engineer liked your published project',
      time: '2 hours ago',
      isUnread: true,
      link: '/hub/explore'
    },
    {
      id: 'n-2',
      type: 'answer',
      icon: MessageSquare,
      title: 'A new reply was added to a technical discussion',
      time: 'Today',
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
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recent interactions and activity across the community
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="px-3 py-1.5 rounded-xl bg-muted hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCheck size={13} className="text-primary" />
          <span>Mark all as read</span>
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
                  ? 'bg-card border-primary/30'
                  : 'bg-card/60 border-border hover:bg-card'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} className="text-primary shrink-0" />
                <div>
                  <p className={`text-xs font-medium ${notif.isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono inline-block">
                    {notif.time}
                  </span>
                </div>
              </div>

              {notif.isUnread && (
                <span className="text-[9px] font-mono font-bold text-primary shrink-0">NEW</span>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
