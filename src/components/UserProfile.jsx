import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Globe, Edit3, Camera, FileText, Cpu, Eye, ThumbsUp, Copy, Check, AlertCircle, X, Sparkles, FolderCode } from 'lucide-react';

// Inline SVG icons for brands not available in this lucide-react version
const GithubIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = ({ size = 18, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
import { Button } from './ui/neon-button';

// Helper function to compress images using Canvas (from ProjectPublisher)
const compressAvatar = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], "avatar.jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function UserProfile({ currentUser }) {
  const { username } = useParams();
  const navigate = useNavigate();

  // Profile data states
  const [profileUser, setProfileUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit profile states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // State: current user has no Firestore profile yet — show setup screen
  const [profileSetupNeeded, setProfileSetupNeeded] = useState(false);

  // Fetch developer profile and projects
  useEffect(() => {
    if (!username) return;

    const loadProfileAndProjects = async () => {
      try {
        setLoading(true);
        setError('');
        setProfileSetupNeeded(false);

        // Find user with matching unique username
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('username', '==', username.toLowerCase().trim()));
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          const userData = { uid: userDoc.id, ...userDoc.data() };
          setProfileUser(userData);

          // Populate edit fields in case they match current user
          setEditDisplayName(userData.displayName || '');
          setEditUsername(userData.username || '');
          setEditHeadline(userData.headline || '');
          setEditBio(userData.bio || '');
          setEditAvatarUrl(userData.avatarUrl || userData.photoURL || '');
          setEditGithub(userData.socialLinks?.github || '');
          setEditLinkedin(userData.socialLinks?.linkedin || '');
          setEditWebsite(userData.socialLinks?.website || '');

          // Fetch user's public projects
          const projRef = collection(db, 'projects');
          const projQuery = query(
            projRef,
            where('ownerId', '==', userDoc.id),
            where('visibility', '==', 'public')
          );
          const projSnap = await getDocs(projQuery);
          const projectsList = [];
          projSnap.forEach((doc) => {
            projectsList.push({ id: doc.id, ...doc.data() });
          });

          // Sort by newest
          projectsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setProjects(projectsList);

        } else {
          // Username not found — check if the logged-in user just hasn't set up yet
          if (currentUser) {
            // Check by UID in case they have a doc but no username field
            const { getDoc: _getDoc, doc: _doc } = await import('firebase/firestore');
            const uidDocRef = _doc(db, 'users', currentUser.uid);
            const uidSnap = await _getDoc(uidDocRef);

            if (!uidSnap.exists() || !uidSnap.data()?.username) {
              // Logged-in user with no profile setup — trigger onboarding
              setProfileSetupNeeded(true);
              setEditDisplayName(currentUser.displayName || '');
              setEditUsername('');
              setEditAvatarUrl(currentUser.photoURL || '');
              setLoading(false);
              return;
            }
          }
          setError('المطور غير موجود أو لم يقم بإنشاء اسم مستخدم فريد بعد.');
        }
      } catch (err) {
        console.error("Error loading developer profile:", err);
        setError('حدث خطأ أثناء تحميل الملف الشخصي.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndProjects();
  }, [username, currentUser]);

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    setAvatarUploading(true);
    setModalError('');
    setModalSuccess('');

    try {
      // Compress avatar image
      const compressedFile = await compressAvatar(file);
      const storagePath = `users/${currentUser.uid}/avatar_${Date.now()}.jpg`;
      const fileRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(fileRef, compressedFile);

      uploadTask.on('state_changed',
        null,
        (err) => {
          console.error("Avatar upload failed:", err);
          setModalError('فشل رفع الصورة الشخصية.');
          setAvatarUploading(false);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setEditAvatarUrl(downloadUrl);
          setAvatarUploading(false);
          setModalSuccess('تم تحديث المعاينة بنجاح. يرجى الضغط على حفظ.');
        }
      );
    } catch (err) {
      console.error(err);
      setModalError('حدث خطأ أثناء معالجة الصورة.');
      setAvatarUploading(false);
    }
  };

  // Validate & Save Edited Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setModalError('');
    setModalSuccess('');

    const formattedUsername = editUsername.toLowerCase().replace(/\s+/g, '').trim();

    // Reserved Route keywords check to avoid path collisions
    const reservedKeywords = ['hub', 'devices', 'settings', 'alerts', 'automations', 'developer', 'home', 'controller', 'views'];
    if (reservedKeywords.includes(formattedUsername)) {
      setModalError('اسم المستخدم هذا محجوز للمنصة، يرجى اختيار اسم آخر.');
      return;
    }

    if (!/^[a-z0-9_-]{3,20}$/.test(formattedUsername)) {
      setModalError('يجب أن يتكون اسم المستخدم من 3 إلى 20 حرفاً إنجليزياً أو أرقام أو شرطات فقط.');
      return;
    }

    try {
      // Check username uniqueness (always check during onboarding, or when username changed)
      const existingUsername = profileUser?.username || null;
      if (formattedUsername !== existingUsername) {
        const userQuery = query(collection(db, 'users'), where('username', '==', formattedUsername));
        const querySnapshot = await getDocs(userQuery);
        
        // If there's a match and it isn't our own document
        if (!querySnapshot.empty) {
          const matchingDoc = querySnapshot.docs[0];
          if (matchingDoc.id !== currentUser.uid) {
            setModalError('اسم المستخدم هذا مستخدم بالفعل من قبل مطور آخر.');
            return;
          }
        }
      }

      // Save user profile details
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedFields = {
        displayName: editDisplayName.trim(),
        username: formattedUsername,
        headline: editHeadline.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl,
        socialLinks: {
          github: editGithub.trim(),
          linkedin: editLinkedin.trim(),
          website: editWebsite.trim()
        }
      };

      await setDoc(userRef, updatedFields, { merge: true });
      
      // Update local state
      setProfileUser(prev => ({ ...(prev || { uid: currentUser.uid }), ...updatedFields }));
      setProfileSetupNeeded(false);
      setModalSuccess('تم إنشاء الملف الشخصي بنجاح!');
      
      // Redirect to the new vanity URL
      setTimeout(() => {
        setShowEditModal(false);
        setModalSuccess('');
        navigate(`/${formattedUsername}`);
      }, 800);

    } catch (err) {
      console.error("❌ Firestore write error:", err?.code, err?.message);
      // Detect Firebase permission errors
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        setModalError('⛔ خطأ صلاحيات Firestore — يرجى تطبيق قواعد الأمان من Firebase Console → Firestore → Rules');
      } else if (err?.code === 'unavailable' || err?.code === 'network-request-failed') {
        setModalError('📡 لا يوجد اتصال بالإنترنت. تحقق من اتصالك وأعد المحاولة.');
      } else {
        setModalError(`فشل الحفظ: ${err?.code || err?.message || 'خطأ غير معروف'}`);
      }
    }
  };

  const isOwnProfile = currentUser && profileUser && currentUser.uid === profileUser.uid;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Onboarding: logged-in user with no profile yet ──────────────
  if (profileSetupNeeded && currentUser) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        {/* Glowing avatar placeholder */}
        <div className="relative mx-auto w-24 h-24 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-amber-400/20 border-2 border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-primary">
                {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
            <Sparkles size={13} className="text-black" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          مرحباً، {currentUser.displayName?.split(' ')[0] || 'مطور'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          أنت على وشك إنشاء ملفك الشخصي في <span className="text-primary font-bold">IOT365 Hub</span>
        </p>
        <p className="text-xs text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          اختر اسم مستخدم فريد ليصبح رابطك الشخصي على المنصة ويظهر مشاريعك للعالم.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          {[
            { icon: '🔗', label: 'رابط شخصي' },
            { icon: '📦', label: 'نشر مشاريع' },
            { icon: '🌍', label: 'مجتمع عالمي' },
          ].map((f) => (
            <div key={f.label} className="bg-card/[0.03] border border-border rounded-2xl p-3">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">{f.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="bg-primary hover:bg-primary/90 text-black font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-primary/20 text-sm cursor-pointer"
        >
          <Sparkles size={14} className="inline-block mr-1 mb-0.5" />
          إعداد الملف الشخصي الآن
        </button>

        <p className="text-[10px] text-muted-foreground mt-4">يمكنك تعديل هذه المعلومات لاحقاً في أي وقت</p>

        {/* Render the edit modal so they can fill in their info */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0c10] border border-border p-6 rounded-3xl w-full max-w-lg relative text-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-1 text-white text-right flex items-center justify-end gap-2 border-b border-border pb-3">
                أنشئ ملفك الشخصي
                <Sparkles size={18} className="text-primary" />
              </h3>
              <p className="text-xs text-muted-foreground text-right mb-5">ستظهر معلوماتك على صفحتك العامة في Hub</p>

              {modalError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
                  <AlertCircle size={16} />
                  <p>{modalError}</p>
                </div>
              )}
              {modalSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
                  <Check size={16} />
                  <p>{modalSuccess}</p>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-right">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/25 group">
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white text-2xl font-bold uppercase">
                        {editDisplayName.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={18} className="text-white" />
                    </div>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{avatarUploading ? 'جاري الرفع...' : 'اضغط لرفع صورة شخصية'}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">اسم المستخدم الفريد *</label>
                    <input required type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                      placeholder="e.g. smart_dev" dir="ltr"
                      className="w-full bg-card/5 border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm font-mono text-left" />
                    <p className="text-[9px] text-muted-foreground mt-1">رابطك: hub/{editUsername || 'username'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">الاسم الظاهر *</label>
                    <input required type="text" value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)}
                      placeholder="مثال: أحمد المحمد"
                      className="w-full bg-card/5 border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">العنوان التعريفي</label>
                  <input type="text" value={editHeadline} onChange={e => setEditHeadline(e.target.value)}
                    placeholder="مهندس عتاد وأنظمة مدمجة"
                    className="w-full bg-card/5 border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-primary text-sm text-white" />
                </div>

                <div className="pt-3 flex gap-3">
                  <button type="submit" disabled={avatarUploading}
                    className="flex-1 bg-primary text-black font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-md shadow-primary/10 disabled:opacity-50">
                    إنشاء الملف الشخصي
                  </button>
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-card/5 border border-border text-muted-foreground font-bold py-2.5 rounded-xl text-xs cursor-pointer">
                    لاحقاً
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 404: profile not found and user is a guest ───────────────────
  if (error || !profileUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-card/[0.02] border border-border p-8 rounded-3xl backdrop-blur-xl">
        <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">الملف الشخصي غير متاح</h3>
        <p className="text-sm text-muted-foreground mt-3">{error || 'لم يتم العثور على هذا المستخدم.'}</p>
        <button
          onClick={() => navigate('/hub')}
          className="mt-6 bg-primary text-black font-bold px-6 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
        >
          الذهاب للمستودع العام
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Developer Profile Header Card */}
      <div className="bg-gradient-to-br from-white/[0.01] to-white/[0.03] border border-border rounded-3xl p-6 md:p-8 backdrop-blur-xl relative overflow-hidden shadow-xl">
        
        {/* Glow backdrop on profile card */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
          
          {/* Action button: Edit Profile (Redirects to unified ProfilePage in dashboard) */}
          {isOwnProfile && (
            <button
              onClick={() => {
                navigate('/');
                // In App.jsx, the activeTool is checked. We want settings/profile to load.
                // Since navigate('/') goes back to the root Dashboard, we let Sidebar/App state handle it.
                // We will dispatch a custom event or let App.jsx know, but since the user is navigating to '/',
                // they can click their avatar. Alternatively, we can let them know to click their avatar.
                // To make it seamless, we can set localStorage activeTool before navigating.
                localStorage.setItem('active_tool_fallback', 'profile');
                window.location.href = '/?tool=profile';
              }}
              className="bg-card/5 hover:bg-card/10 border border-white/15 hover:border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer order-last md:order-first self-stretch md:self-auto justify-center"
            >
              <Edit3 size={14} />
              تعديل بروفايل المطور
            </button>
          )}

          {/* User Details info */}
          <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-right">
            
            {/* Avatar image */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-md">
              {profileUser.avatarUrl || profileUser.photoURL ? (
                <img src={profileUser.avatarUrl || profileUser.photoURL} alt={profileUser.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white font-bold text-3xl uppercase">
                  {profileUser.displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* User credentials */}
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">{profileUser.displayName}</h2>
              <p className="text-xs text-primary font-mono font-bold">@{profileUser.username}</p>
              {profileUser.headline ? (
                <p className="text-sm font-semibold text-slate-300">{profileUser.headline}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">مطور IoT هاوٍ</p>
              )}
              {profileUser.bio && (
                <p className="text-xs text-muted-foreground max-w-lg leading-relaxed mt-2">{profileUser.bio}</p>
              )}

              {/* Social Links Icons */}
              <div className="flex gap-4 justify-center md:justify-end pt-3">
                {profileUser.socialLinks?.github && (
                  <a href={profileUser.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="Github">
                    <GithubIcon size={18} />
                  </a>
                )}
                {profileUser.socialLinks?.linkedin && (
                  <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="LinkedIn">
                    <LinkedinIcon size={18} />
                  </a>
                )}
                {profileUser.socialLinks?.website && (
                  <a href={profileUser.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-white transition-colors" title="Personal Website">
                    <Globe size={18} />
                  </a>
                )}
                {!profileUser.socialLinks?.github && !profileUser.socialLinks?.linkedin && !profileUser.socialLinks?.website && (
                  <span className="text-[10px] text-muted-foreground">لا توجد روابط اجتماعية مضافة</span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Projects Grid Heading */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-white text-right flex items-center justify-end gap-2">
          مشاريع المطور العامة ({projects.length})
          <FolderCode size={18} className="text-primary" />
        </h3>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-card/[0.01] border border-border rounded-3xl p-8 backdrop-blur-xl">
            <FolderCode className="w-14 h-14 text-muted-foreground mx-auto mb-3" />
            <h4 className="text-sm font-bold text-muted-foreground">لا توجد مشاريع عامة</h4>
            <p className="text-xs text-muted-foreground mt-1">لم يقم هذا المطور بنشر أي مشاريع عامة بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/hub/project/${proj.id}`)}
                className="group bg-card/[0.02] hover:bg-card/[0.04] border border-border hover:border-primary/50 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between h-[300px] relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-primary/5 cursor-pointer"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] text-muted-foreground font-mono">{new Date(proj.createdAt).toLocaleDateString()}</span>
                    {proj.images && proj.images.length > 0 ? (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0">
                        <img src={proj.images[0]} alt={proj.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-card/5 border border-border flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                        <Cpu size={20} />
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-primary transition-colors text-right line-clamp-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 text-right leading-relaxed line-clamp-3">
                    {proj.summary}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 justify-end mt-4 line-clamp-1 h-6">
                    {proj.componentsList && proj.componentsList.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg bg-zinc-900 border border-border text-muted-foreground group-hover:border-primary/20 group-hover:text-primary transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 mt-4 text-[10px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      <span>{proj.metrics?.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      <span>{proj.metrics?.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Copy size={12} />
                      <span>{proj.metrics?.clones || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
