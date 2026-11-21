import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ThumbsUp, MessageSquare, Copy, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const ICON_BY_TYPE = {
  like: ThumbsUp,
  clone: Copy,
  answer: MessageSquare,
  comment: MessageSquare,
};

function formatRelativeTime(iso) {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsView({ user }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !db) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setNotifications(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load notifications:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const unreadItems = notifications.filter((n) => n.isUnread !== false);

  const handleOpenNotif = async (notif) => {
    if (notif.isUnread !== false) {
      updateDoc(doc(db, 'notifications', notif.id), { isUnread: false }).catch(() => {});
    }
    navigate(notif.link || '/hub');
  };

  const markAllRead = async () => {
    if (unreadItems.length === 0) return;
    try {
      await Promise.all(
        unreadItems.map((n) => updateDoc(doc(db, 'notifications', n.id), { isUnread: false })),
      );
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleDeleteNotif = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time interactions and activity on your community projects
          </p>
        </div>

        {user && unreadItems.length > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="px-3 py-1.5 rounded-xl bg-muted hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck size={13} className="text-primary" />
            <span>Mark all as read (<span className="font-mono text-primary font-bold">{unreadItems.length}</span>)</span>
          </button>
        )}
      </div>

      {/* ── Body ── */}
      {!user ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Bell size={36} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Sign in to view notifications</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Keep track of likes, documentation clones, and replies to your hardware projects.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      ) : loading ? (
        <div className="bg-card border border-border rounded-2xl p-12 flex items-center justify-center">
          <Loader2 size={24} className="text-primary animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-2.5">
          <Bell size={36} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No notifications yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When developers like your projects or copy your documentation, updates will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const Icon = ICON_BY_TYPE[notif.type] || Bell;
            const isUnread = notif.isUnread !== false;

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenNotif(notif)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isUnread
                    ? 'bg-card border-primary/30'
                    : 'bg-card/60 border-border hover:bg-card'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={17} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium break-words ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono inline-block mt-0.5">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUnread && (
                    <span className="text-[9px] font-mono font-bold text-primary">NEW</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotif(e, notif.id)}
                    title="Delete notification"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
