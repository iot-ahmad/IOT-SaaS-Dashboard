import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Globe, Camera, Copy, Check, Shield, Bell, Link as LinkIcon,
  CreditCard, Lock, Smartphone, Mail, Activity, Cpu, Sparkles, X,
  AlertCircle, Edit3, ChevronRight,
} from 'lucide-react';
import {
  updateProfile, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, linkWithPopup, unlink, GoogleAuthProvider, GithubAuthProvider,
} from 'firebase/auth';
import {
  collection, doc, query, where, getDocs, getDoc, setDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { Button } from './ui/neon-button';

// ─── Inline SVG brand icons (not available in this lucide-react version) ────
const GithubIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedinIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ─── Card wrapper shared across all tabs ─────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-card/[0.02] border border-border rounded-2xl p-6 backdrop-blur-md hover:bg-card/[0.04] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-slate-300 dark:border-white/20 ${className}`}>
    {children}
  </div>
);

// ─── Image compression helper ─────────────────────────────────────────────────
const compressAvatar = (file, maxW = 400, maxH = 400, quality = 0.8) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (evt) => {
      const img = new Image();
      img.src = evt.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) { if (width > maxW) { height = Math.round((height * maxW) / width); width = maxW; } }
        else { if (height > maxH) { width = Math.round((width * maxH) / height); height = maxH; } }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], 'avatar.jpg', { type: 'image/jpeg', lastModified: Date.now() }) : file),
          'image/jpeg', quality,
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

// ─── TABS definition ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'public',    label: 'Public Profile',      icon: User },
  { id: 'account',   label: 'Account',              icon: Edit3 },
  { id: 'security',  label: 'Security',             icon: Shield },
  { id: 'notifs',    label: 'Notifications',        icon: Bell },
  { id: 'connected', label: 'Connected Accounts',   icon: LinkIcon },
  { id: 'billing',   label: 'Billing',              icon: CreditCard },
];

// ─── Main ProfilePage component ───────────────────────────────────────────────
/**
 * Unified profile & settings page.
 * Consolidates account editing previously split between SettingsView (Dashboard)
 * and the edit modal in UserProfile (public Hub page).
 *
 * @param {{ user: object, userUID: string, logout: function }} props
 */
export default function ProfilePage({ user, userUID, logout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('public');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

  // ── Public Profile state ─────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(true);
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername]       = useState('');
  const [editHeadline, setEditHeadline]       = useState('');
  const [editBio, setEditBio]                 = useState('');
  const [editAvatarUrl, setEditAvatarUrl]     = useState('');
  const [editGithub, setEditGithub]           = useState('');
  const [editLinkedin, setEditLinkedin]       = useState('');
  const [editWebsite, setEditWebsite]         = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileError, setProfileError]       = useState('');

  // ── Account / General state ──────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [language, setLanguage]       = useState('English');
  const [timezone, setTimezone]       = useState('(GMT+03:00) Amman');
  const [uidCopied, setUidCopied]     = useState(false);

  // ── Security state ───────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Notifications state ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    push: true, email: true, sms: false, marketing: false,
  });

  // ── Connected Accounts state ─────────────────────────────────────────────
  const [providers, setProviders] = useState([]);

  // ─── Helpers ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load data on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userUID) return;

    // Load Firestore prefs (language, timezone, notifications)
    const loadPrefs = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userUID, 'settings', 'prefs'));
        if (snap.exists()) {
          const d = snap.data();
          if (d.language) setLanguage(d.language);
          if (d.timezone) setTimezone(d.timezone);
          if (d.notifications) setNotifications(d.notifications);
        }
      } catch { /* non-critical */ }
    };

    // Load public profile data
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const snap = await getDoc(doc(db, 'users', userUID));
        const data = snap.exists() ? snap.data() : {};
        setFirestoreProfile(data);
        setEditDisplayName(data.displayName || user?.displayName || '');
        setEditUsername(data.username || '');
        setEditHeadline(data.headline || '');
        setEditBio(data.bio || '');
        setEditAvatarUrl(data.avatarUrl || data.photoURL || user?.photoURL || '');
        setEditGithub(data.socialLinks?.github || '');
        setEditLinkedin(data.socialLinks?.linkedin || '');
        setEditWebsite(data.socialLinks?.website || '');
      } catch { /* non-critical */ }
      finally { setProfileLoading(false); }
    };

    // Load auth providers
    if (auth.currentUser) {
      setProviders(auth.currentUser.providerData.map(p => p.providerId));
    }

    loadPrefs();
    loadProfile();
  }, [userUID, user]);

  // ─── Avatar upload ───────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userUID) return;
    setAvatarUploading(true);
    setProfileError('');
    try {
      const compressed = await compressAvatar(file);
      const storagePath = `users/${userUID}/avatar_${Date.now()}.jpg`;
      const uploadTask = uploadBytesResumable(ref(storage, storagePath), compressed);
      uploadTask.on('state_changed', null,
        () => { showToast('فشل رفع الصورة الشخصية.', 'error'); setAvatarUploading(false); },
        async () => {
          setEditAvatarUrl(await getDownloadURL(uploadTask.snapshot.ref));
          setAvatarUploading(false);
          showToast('تم رفع الصورة — اضغط حفظ لتأكيد التغييرات.');
        },
      );
    } catch { showToast('حدث خطأ أثناء معالجة الصورة.', 'error'); setAvatarUploading(false); }
  };

  // ─── Save public profile ─────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    const formatted = editUsername.toLowerCase().replace(/\s+/g, '').trim();

    const reserved = ['hub', 'devices', 'settings', 'alerts', 'automations', 'developer', 'home', 'controller', 'views', 'profile'];
    if (reserved.includes(formatted)) {
      setProfileError('اسم المستخدم هذا محجوز للمنصة، يرجى اختيار اسم آخر.');
      return;
    }
    if (!/^[a-z0-9_-]{3,20}$/.test(formatted)) {
      setProfileError('يجب أن يتكون اسم المستخدم من 3-20 حرفاً إنجليزياً أو أرقام أو شرطات فقط.');
      return;
    }

    setLoading(true);
    try {
      // Check username uniqueness when changed
      if (formatted !== firestoreProfile?.username) {
        const q = query(collection(db, 'users'), where('username', '==', formatted));
        const qs = await getDocs(q);
        if (!qs.empty && qs.docs[0].id !== userUID) {
          setProfileError('اسم المستخدم هذا مستخدم بالفعل من قبل مطور آخر.');
          setLoading(false);
          return;
        }
      }

      const updatedFields = {
        displayName: editDisplayName.trim(),
        username: formatted,
        headline: editHeadline.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl,
        socialLinks: {
          github: editGithub.trim(),
          linkedin: editLinkedin.trim(),
          website: editWebsite.trim(),
        },
      };

      await setDoc(doc(db, 'users', userUID), updatedFields, { merge: true });

      // Also update Firebase Auth display name
      if (auth.currentUser && editDisplayName.trim() !== user?.displayName) {
        await updateProfile(auth.currentUser, { displayName: editDisplayName.trim() });
      }

      setFirestoreProfile(prev => ({ ...(prev || {}), ...updatedFields }));
      showToast('تم حفظ الملف الشخصي بنجاح! ✅');
    } catch (err) {
      if (err?.code === 'permission-denied') {
        setProfileError('⛔ خطأ صلاحيات Firestore — راجع قواعد الأمان في Firebase Console.');
      } else {
        setProfileError(`فشل الحفظ: ${err?.code || err?.message || 'خطأ غير معروف'}`);
      }
    }
    setLoading(false);
  };

  // ─── Save account/general settings ──────────────────────────────────────
  const saveGeneral = async () => {
    setLoading(true);
    try {
      if (auth.currentUser && displayName !== user?.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      await setDoc(doc(db, 'users', userUID, 'settings', 'prefs'), { language, timezone }, { merge: true });
      showToast('تم حفظ إعدادات الحساب!');
    } catch (err) { showToast(err.message, 'error'); }
    setLoading(false);
  };

  // ─── Save notifications ──────────────────────────────────────────────────
  const saveNotifications = async (next) => {
    setNotifications(next);
    try {
      await setDoc(doc(db, 'users', userUID, 'settings', 'prefs'), { notifications: next }, { merge: true });
      showToast('تم حفظ إعدادات الإشعارات!');
    } catch { showToast('فشل حفظ الإشعارات.', 'error'); }
  };

  // ─── Change password ─────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return showToast('كلمتا المرور غير متطابقتين.', 'error');
    if (!currentPassword) return showToast('يرجى إدخال كلمة المرور الحالية.', 'error');
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      showToast('تم تحديث كلمة المرور بنجاح!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { showToast(err.message, 'error'); }
    setLoading(false);
  };

  // ─── Link / Unlink social providers ─────────────────────────────────────
  const linkAccount = async (providerId) => {
    setLoading(true);
    try {
      const p = providerId === 'google.com' ? new GoogleAuthProvider() : new GithubAuthProvider();
      await linkWithPopup(auth.currentUser, p);
      setProviders(prev => [...prev, providerId]);
      showToast(`تم ربط ${providerId} بنجاح!`);
    } catch (err) { showToast(err.message, 'error'); }
    setLoading(false);
  };

  const unlinkAccount = async (providerId) => {
    setLoading(true);
    try {
      await unlink(auth.currentUser, providerId);
      setProviders(prev => prev.filter(p => p !== providerId));
      showToast(`تم فصل ${providerId}.`);
    } catch (err) { showToast(err.message, 'error'); }
    setLoading(false);
  };

  // ─── Copy UID ────────────────────────────────────────────────────────────
  const copyUID = () => {
    navigator.clipboard.writeText(userUID);
    setUidCopied(true);
    setTimeout(() => setUidCopied(false), 2500);
  };

  // ─── Input class helper ──────────────────────────────────────────────────
  const inputCls = 'w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground';

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 relative">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-fadeIn ${toast.type === 'error' ? 'bg-red-500/95 text-white' : 'bg-blue-500/95 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center gap-4">
        {/* Avatar mini-preview */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 bg-muted flex-shrink-0 flex items-center justify-center">
          {(editAvatarUrl || user?.photoURL) ? (
            <img src={editAvatarUrl || user?.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-black text-primary">
              {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Profile &amp; Settings</h2>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        {/* Link to public hub profile */}
        {firestoreProfile?.username && (
          <button
            onClick={() => navigate(`/${firestoreProfile.username}`)}
            className="ml-auto flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            View Public Profile <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Layout: sidebar tabs + content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Tab list */}
        <div className="md:col-span-1 space-y-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <Button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                variant={active ? 'default' : 'ghost'}
                neon={active}
                className="mx-0 w-full text-left rounded-xl flex items-center justify-start gap-2.5"
              >
                <Icon size={16} className="flex-shrink-0" />
                {label}
                {id === 'billing' && (
                  <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">قريباً</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="md:col-span-2 space-y-6">

          {/* ══ TAB: Public Profile ══════════════════════════════════════ */}
          {activeTab === 'public' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {profileError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle size={15} className="shrink-0" /> {profileError}
                </div>
              )}

              {profileLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <Card>
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Camera size={16} className="text-primary" /> Profile Photo</h3>
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/25 group flex-shrink-0">
                        {editAvatarUrl ? (
                          <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center text-foreground text-2xl font-bold uppercase">
                            {editDisplayName.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera size={18} className="text-white" />
                        </div>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Upload Profile Picture</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF up to 2MB. Will be compressed to 400×400.</p>
                        {avatarUploading && <p className="text-xs text-primary mt-1 animate-pulse">جاري الرفع...</p>}
                      </div>
                    </div>
                  </Card>

                  {/* Public identity */}
                  <Card>
                    <h3 className="font-bold mb-4 flex items-center gap-2"><User size={16} className="text-primary" /> Public Identity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5 font-semibold">Display Name *</label>
                        <input className={inputCls} value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="e.g. Ahmad Al-Mohamad" required />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5 font-semibold">Username (Vanity URL) *</label>
                        <input className={`${inputCls} font-mono`} value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="e.g. smart_dev" dir="ltr" required />
                        <p className="text-[10px] text-muted-foreground mt-1">iot365.app/{editUsername || 'username'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="text-xs text-muted-foreground block mb-1.5 font-semibold">Headline</label>
                      <input className={inputCls} value={editHeadline} onChange={e => setEditHeadline(e.target.value)} placeholder="e.g. Hardware Engineer & IoT Developer" />
                    </div>
                    <div className="mt-4">
                      <label className="text-xs text-muted-foreground block mb-1.5 font-semibold">Bio</label>
                      <textarea rows={3} className={`${inputCls} resize-none`} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell the community about your projects and interests..." />
                    </div>
                  </Card>

                  {/* Social links */}
                  <Card>
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={16} className="text-blue-400" /> Social &amp; Professional Links</h3>
                    <div className="space-y-3">
                      {[
                        { icon: GithubIcon, key: 'github', val: editGithub, set: setEditGithub, ph: 'https://github.com/username' },
                        { icon: LinkedinIcon, key: 'linkedin', val: editLinkedin, set: setEditLinkedin, ph: 'https://linkedin.com/in/username' },
                        { icon: Globe, key: 'website', val: editWebsite, set: setEditWebsite, ph: 'https://yourwebsite.com' },
                      ].map(({ icon: Icon, key, val, set, ph }) => (
                        <div key={key} className="flex items-center bg-muted border border-border rounded-xl px-3 focus-within:border-primary/50 transition-all">
                          <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph} dir="ltr"
                            className="flex-1 bg-transparent border-none py-2.5 px-2 focus:outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground" />
                          <Icon size={15} className="text-muted-foreground shrink-0" />
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Button type="submit" disabled={loading || avatarUploading} className="mx-0 w-full rounded-xl disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Public Profile'}
                  </Button>
                </>
              )}
            </form>
          )}

          {/* ══ TAB: Account ═════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <>
              {/* Device UID */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent p-6 shadow-[0_0_40px_rgba(245,158,11,0.12)]">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-1">
                  <Cpu size={16} className="text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">Your Device UID</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  استخدم هذا الـ UID في كود Arduino / ESP32 الخاص بك لربط جهازك بالموقع.
                </p>
                <div className="flex items-stretch gap-2 mb-4">
                  <code className="flex-1 bg-background/40 border border-border rounded-xl py-3 px-4 text-sm font-mono text-primary break-all leading-relaxed">
                    {userUID}
                  </code>
                  <button id="btn-copy-uid" onClick={copyUID}
                    className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-4 rounded-xl border text-xs font-bold transition-all duration-300 ${uidCopied ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-muted border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary'}`}>
                    {uidCopied ? <Check size={18} /> : <Copy size={18} />}
                    {uidCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Firebase Data Path</p>
                  <code className="text-[11px] font-mono text-amber-300/70 break-all">
                    users/<span className="text-amber-300">{userUID}</span>/widgets/<span className="text-muted-foreground">[Data_Key]</span>
                  </code>
                </div>
              </div>

              {/* Display name + email */}
              <Card>
                <h3 className="font-bold mb-4 flex items-center gap-2"><User size={18} className="text-primary" /> Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
                    <input className={inputCls} value={displayName} onChange={e => setDisplayName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Email</label>
                    <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={user?.email || ''} readOnly />
                  </div>
                </div>
              </Card>

              {/* Localization */}
              <Card>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> Localization</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className={inputCls}>
                      <option>English</option>
                      <option>Arabic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Timezone</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls}>
                      <option>(GMT+03:00) Amman</option>
                      <option>(GMT+00:00) UTC</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Button type="button" onClick={saveGeneral} disabled={loading} className="mx-0 w-full rounded-xl disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Account Settings'}
              </Button>
              <Button type="button" onClick={logout} variant="ghost" neon={false}
                className="mx-0 w-full rounded-xl text-red-400 border-red-500/30">
                Sign Out
              </Button>
            </>
          )}

          {/* ══ TAB: Security ════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Shield size={18} className="text-red-400" /> Security</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Lock size={14} className="text-muted-foreground" /> Change Password</h4>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputCls} />
                      <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} />
                      <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} />
                      <button onClick={handleChangePassword} disabled={loading}
                        className="bg-muted hover:bg-secondary text-foreground text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 border border-border">
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-bold flex items-center gap-2"><Smartphone size={14} className="text-muted-foreground" /> Two-Factor Auth (2FA)</h4>
                        <p className="text-xs text-muted-foreground mt-1">Add an extra layer of security to your account.</p>
                      </div>
                      <button className="bg-primary/20 text-primary text-sm font-bold py-1.5 px-3 rounded-lg hover:bg-primary/30 transition-colors">Enable</button>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2"><Activity size={14} className="text-muted-foreground" /> Active Sessions</h4>
                    <div className="flex justify-between items-center bg-muted p-3 rounded-lg border border-primary/20">
                      <div>
                        <p className="text-xs font-bold text-primary">{navigator.platform} • Current Session</p>
                        <p className="text-[10px] text-muted-foreground">{navigator.userAgent.slice(0, 70)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ══ TAB: Notifications ═══════════════════════════════════════ */}
          {activeTab === 'notifs' && (
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Bell size={18} className="text-yellow-400" /> Notifications</h3>
              <div className="space-y-4">
                {[
                  { id: 'push',      label: 'Push Notifications', desc: 'Receive alerts directly on your device' },
                  { id: 'email',     label: 'Email Alerts',       desc: 'Get daily summaries and critical alerts via email' },
                  { id: 'sms',       label: 'SMS Notifications',  desc: 'Critical system failures sent to your phone' },
                  { id: 'marketing', label: 'Marketing',          desc: 'Updates about new features and offers' },
                ].map((item) => {
                  const active = notifications[item.id];
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => saveNotifications({ ...notifications, [item.id]: !active })}
                        className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0 ${active ? 'bg-primary' : 'bg-muted border border-border'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ══ TAB: Connected Accounts ══════════════════════════════════ */}
          {activeTab === 'connected' && (
            <Card>
              <h3 className="font-bold mb-2 flex items-center gap-2"><LinkIcon size={18} className="text-purple-400" /> Connected Accounts</h3>
              <p className="text-sm text-muted-foreground mb-6">Link external services to log in faster and sync your data.</p>
              <div className="space-y-4">
                {/* Google */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center p-2">
                      <svg viewBox="0 0 24 24" className="w-full h-full">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Google</p>
                      <p className={`text-xs ${providers.includes('google.com') ? 'text-primary' : 'text-muted-foreground'}`}>
                        {providers.includes('google.com') ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => providers.includes('google.com') ? unlinkAccount('google.com') : linkAccount('google.com')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${providers.includes('google.com') ? 'text-red-400 hover:bg-red-500/10' : 'bg-muted border border-border hover:bg-secondary text-foreground'}`}>
                    {providers.includes('google.com') ? 'Disconnect' : 'Connect'}
                  </button>
                </div>

                {/* GitHub */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#333] text-white rounded-full flex items-center justify-center p-2.5">
                      <GithubIcon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">GitHub</p>
                      <p className={`text-xs ${providers.includes('github.com') ? 'text-primary' : 'text-muted-foreground'}`}>
                        {providers.includes('github.com') ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => providers.includes('github.com') ? unlinkAccount('github.com') : linkAccount('github.com')}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${providers.includes('github.com') ? 'text-red-400 hover:bg-red-500/10' : 'bg-muted border border-border hover:bg-secondary text-foreground'}`}>
                    {providers.includes('github.com') ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* ══ TAB: Billing ════════════════════════════════════════════ */}
          {activeTab === 'billing' && (
            <Card>
              <h3 className="font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-primary" /> Billing &amp; Plan</h3>
              <div className="bg-gradient-to-br from-purple-950/40 to-black/40 border border-primary/20 rounded-xl p-5 mb-6 relative overflow-hidden text-center">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="relative z-10 py-6">
                  <div className="inline-block bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-primary/30 mb-4">
                    Coming Soon
                  </div>
                  <h4 className="text-xl font-bold mb-2">مجاني للاستخدام الشخصي</h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    المنصة ستكون مجانية بالكامل للمشاريع الشخصية. سيتم لاحقاً إطلاق خطط مدفوعة مخصصة للجامعات والمؤسسات بأسعار رمزية.
                  </p>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
