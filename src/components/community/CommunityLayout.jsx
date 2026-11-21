import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Compass, Plus, MessageSquare, Bell, Bookmark,
  User, Search, HelpCircle, LogOut,
  LayoutDashboard, ChevronRight, ChevronLeft, Cpu
} from 'lucide-react';
import { useMessaging } from '../../context/MessagingContext';
import SupportModal from '../SupportModal';
import { BrandLogo } from '../ui/BrandLogo';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function CommunityLayout({ user, logout, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, setIsMessagingOpen } = useMessaging();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user?.uid || !db) {
      setUnreadNotifsCount(0);
      return;
    }
    const q = query(collection(db, 'notifications'), where('recipientId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const count = snap.docs.filter((d) => d.data().isUnread !== false).length;
        setUnreadNotifsCount(count);
      },
      () => setUnreadNotifsCount(0),
    );
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/hub/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { label: 'Feed & Updates', path: '/hub', icon: Home, exact: true },
    { label: 'Explore Projects', path: '/hub/explore', icon: Compass },
    { label: 'Publish Project', path: '/hub/new', icon: Plus },
    { label: 'Discussions & Q&A', path: '/hub/discussions', icon: HelpCircle },
    { label: 'Saved Projects', path: '/hub/saved', icon: Bookmark },
    { label: 'Direct Messages', action: () => setIsMessagingOpen(true), icon: MessageSquare, badge: unreadCount },
    { label: 'Notifications', path: '/hub/notifications', icon: Bell, badge: unreadNotifsCount },
    { label: 'Profile', path: user?.username ? `/${user.username}` : (user?.displayName ? `/${user.displayName.toLowerCase().replace(/\s+/g, '_')}` : '/profile'), icon: User },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20" dir="ltr">
      
      {/* ─── Top Minimalist Bar ─── */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left side: Official Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
          >
            <BrandLogo className="h-7 w-auto" />
            <span className="text-[10px] text-primary font-semibold bg-muted border border-border px-2 py-0.5 rounded-md hidden sm:inline-block">
              Community
            </span>
          </button>
        </div>

        {/* Center: Search input */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search projects, code, or hardware (ESP32, BME280)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-input border border-border rounded-xl py-1.5 pl-9 pr-14 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-all"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-muted-foreground bg-muted border border-border px-1 py-0.5 rounded">
            Enter
          </span>
        </form>

        {/* Right side: Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMessagingOpen(true)}
            className="relative p-2 rounded-xl bg-transparent border-0 text-primary hover:bg-muted transition-colors cursor-pointer"
            title="Direct Messages"
          >
            <MessageSquare size={15} className="text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted border border-border hover:border-primary/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <LayoutDashboard size={13} className="text-primary" />
                <span>Dashboard</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all cursor-pointer"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-muted text-primary font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-2xl shadow-xl p-1.5 z-50 space-y-1 text-left animate-fadeIn">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-bold text-foreground truncate">{user.displayName || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        const target = user?.username ? `/${user.username}` : (user?.displayName ? `/${user.displayName.toLowerCase().replace(/\s+/g, '_')}` : '/profile');
                        navigate(target);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <User size={13} className="text-primary" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => { navigate('/hub/new'); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={13} className="text-primary" />
                      <span>Publish Project</span>
                    </button>

                    <div className="border-t border-border pt-1 mt-1">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 text-xs text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Body: Side Navigation (Dashboard Style) + Content Area ─── */}
      <div className="flex-1 flex w-full">
        
        {/* ── Sidebar on the Side (Dashboard Style) ── */}
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-sidebar border-r border-sidebar-border p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col justify-between transition-all duration-300 shrink-0 z-30`}>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              {!isCollapsed && (
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Navigation
                </span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-primary hover:bg-muted transition-colors ml-auto cursor-pointer"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {isCollapsed ? <ChevronRight size={14} className="text-primary" /> : <ChevronLeft size={14} className="text-primary" />}
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? currentPath === item.path
                  : item.path && currentPath.startsWith(item.path);

                return (
                  <button
                    key={idx}
                    onClick={() => item.action ? item.action() : navigate(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary/12 text-foreground border border-primary/25 shadow-sm font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} className="text-primary" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-mono tabular-nums">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!isCollapsed && (
            <div className="bg-muted/40 border border-border rounded-2xl p-3.5 space-y-2 mt-4">
              <p className="text-xs font-bold text-foreground">Share Your Build</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Publish your schematics and firmware code so the community can learn and build.
              </p>
              <button
                onClick={() => navigate('/hub/new')}
                className="w-full py-2 px-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus size={13} />
                <span>New Project</span>
              </button>
            </div>
          )}

        </aside>

        {/* ── Main Canvas ── */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto bg-background">
          {children}
        </main>

      </div>

      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
