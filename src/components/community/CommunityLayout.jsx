import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Compass, Plus, MessageSquare, Bell, Bookmark,
  User, Search, Sun, Moon, HelpCircle, LogOut,
  LayoutDashboard, ChevronRight, ChevronLeft, Cpu
} from 'lucide-react';
import { useMessaging } from '../../context/MessagingContext';
import SupportModal from '../SupportModal';

export default function CommunityLayout({ user, logout, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, setIsMessagingOpen } = useMessaging();

  const [isDark, setIsDark] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupport, setShowSupport] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const isDarkTheme = localStorage.theme ? localStorage.theme === 'dark' : true;
    setIsDark(isDarkTheme);
    if (isDarkTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

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
    { label: 'الخلاصة والتحديثات', path: '/hub', icon: Home, exact: true },
    { label: 'استكشاف المشاريع', path: '/hub/explore', icon: Compass },
    { label: 'نشر وتوثيق مشروع', path: '/hub/new', icon: Plus },
    { label: 'النقاشات والأسئلة', path: '/hub/discussions', icon: HelpCircle },
    { label: 'المشاريع المحفوظة', path: '/hub/saved', icon: Bookmark },
    { label: 'الرسائل المباشرة', action: () => setIsMessagingOpen(true), icon: MessageSquare, badge: unreadCount },
    { label: 'التنبيهات', path: '/hub/notifications', icon: Bell, badge: 2 },
    { label: 'الملف الشخصي', path: user?.username ? `/${user.username}` : (user?.displayName ? `/${user.displayName.toLowerCase().replace(/\s+/g, '_')}` : '/profile'), icon: User },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-[#121316] text-[#e3e4e8] flex flex-col font-sans selection:bg-white/20 selection:text-white" dir="rtl">
      
      {/* ─── Top Minimalist Bar (NO top tabs, clean and sleek) ─── */}
      <header className="sticky top-0 z-40 bg-[#16171a]/95 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Right side: Official Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hub')}
            className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
          >
            <img 
              src={isDark ? "/logo_horizontal.svg" : "/logo_horizontal_light.svg"} 
              alt="IOT365 Logo" 
              className="h-7 w-auto object-contain" 
            />
            <span className="text-[10px] text-zinc-400 font-medium bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-md hidden sm:inline-block">
              المجتمع
            </span>
          </button>
        </div>

        {/* Center: Search input */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="ابحث عن مشاريع، أكواد، أو أجهزة (ESP32, BME280)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1c1d22] border border-white/[0.08] rounded-xl py-1.5 px-3 pr-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 transition-all"
          />
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-1 py-0.5 rounded">
            Enter
          </span>
        </form>

        {/* Left side: Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="تبديل المظهر"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            onClick={() => setIsMessagingOpen(true)}
            className="relative p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="الرسائل المباشرة"
          >
            <MessageSquare size={15} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.05] border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                <LayoutDashboard size={13} />
                <span>لوحة التحكم</span>
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-1.5 p-0.5 rounded-full ring-1 ring-white/20 hover:ring-white/40 transition-all cursor-pointer"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-[#18191c] border border-white/10 rounded-2xl shadow-xl p-1.5 z-50 space-y-1 text-right animate-fadeIn">
                    <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                      <p className="text-xs font-bold text-white truncate">{user.displayName || 'مستخدم'}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        const target = user?.username ? `/${user.username}` : (user?.displayName ? `/${user.displayName.toLowerCase().replace(/\s+/g, '_')}` : '/profile');
                        navigate(target);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <User size={13} />
                      <span>الملف الشخصي</span>
                    </button>

                    <button
                      onClick={() => { navigate('/hub/new'); setIsUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>نشر مشروع</span>
                    </button>

                    <div className="border-t border-white/[0.08] pt-1 mt-1">
                      <button
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-2 text-xs text-rose-400 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
            >
              تسجيل الدخول
            </button>
          )}
        </div>
      </header>

      {/* ─── Main Body: Side Navigation (Dashboard Style) + Content Area ─── */}
      <div className="flex-1 flex w-full">
        
        {/* ── Sidebar on the Side (Dashboard Style) ── */}
        <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#151619] border-l border-white/[0.08] p-3 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col justify-between transition-all duration-300 shrink-0 z-30`}>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              {!isCollapsed && (
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  الأقسام
                </span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors mr-auto"
                title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
              >
                {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
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
                        ? 'bg-white/[0.12] text-white border border-white/[0.15] shadow-sm font-semibold'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} className={isActive ? 'text-white' : 'text-zinc-400'} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!isCollapsed && (
            <div className="bg-[#1a1b1f] border border-white/[0.08] rounded-2xl p-3.5 space-y-2 mt-4">
              <p className="text-xs font-bold text-white">انشر مشروعك</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                شارك مخططاتك وأكوادك البرمجية ليتعلم منها المجتمع.
              </p>
              <button
                onClick={() => navigate('/hub/new')}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus size={13} />
                <span>نشر مشروع جديد</span>
              </button>
            </div>
          )}

        </aside>

        {/* ── Main Canvas ── */}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto bg-[#121316]">
          {children}
        </main>

      </div>

      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
    </div>
  );
}
