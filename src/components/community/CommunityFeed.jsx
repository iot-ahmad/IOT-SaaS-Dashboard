import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import {
  Code, Cpu, ThumbsUp, MessageSquare, Share2,
  ArrowRight, Eye, Send, Plus
} from 'lucide-react';

export default function CommunityFeed({ user }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Post State
  const [postContent, setPostContent] = useState('');
  const [postHardware, setPostHardware] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showHardwareInput, setShowHardwareInput] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let fetchedProjects = [];
        if (db) {
          try {
            const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            fetchedProjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.warn('Firestore fetch projects in feed error:', e);
          }
        }
        setProjects(fetchedProjects);
        setPosts([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setIsPosting(true);

    const newPost = {
      id: `p-${Date.now()}`,
      authorName: user?.displayName || 'مطور في المجتمع',
      authorUsername: user?.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : 'maker',
      authorPhoto: user?.photoURL || null,
      createdAt: 'الآن',
      content: postContent.trim(),
      hardware: postHardware ? postHardware.split(',').map(s => s.trim()) : [],
      likes: 0,
      comments: 0,
      shares: 0
    };

    setPosts([newPost, ...posts]);
    setPostContent('');
    setPostHardware('');
    setShowHardwareInput(false);
    setIsPosting(false);
  };

  const handleToggleLike = (postId) => {
    setLikedPosts(prev => {
      const isLiked = prev[postId];
      const updated = { ...prev, [postId]: !isLiked };
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1 } : p));
      return updated;
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ── Top Header ── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-white">
            خلاصة المجتمع وتحديثات الهاردوير
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            شارك تجاربك مع الحساسات والمتحكمات واطلع على مشاريع المطورين
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/hub/explore')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-zinc-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu size={14} className="text-zinc-400" />
            <span>تصفح المشاريع</span>
          </button>
          <button
            onClick={() => navigate('/hub/new')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>نشر مشروع</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── Main Stream (2 Cols) ── */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Post Creator Box */}
          <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/[0.08] text-zinc-300 font-bold flex items-center justify-center text-xs">
                  {(user?.displayName || 'U').charAt(0)}
                </div>
              )}
              
              <div className="flex-1 space-y-2.5">
                <textarea
                  rows={2}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="اكتب تحديثاً سريعاً أو نصيحة تقنية حول تجاربك في الـ IoT..."
                  className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 resize-none transition-all font-sans"
                />

                {showHardwareInput && (
                  <input
                    type="text"
                    value={postHardware}
                    onChange={(e) => setPostHardware(e.target.value)}
                    placeholder="أسماء القطع مفصولة بفواصل (مثال: ESP32, DHT22, OLED)..."
                    className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none transition-all"
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowHardwareInput(!showHardwareInput)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                        showHardwareInput ? 'bg-white/[0.1] border-white/20 text-white' : 'border-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Cpu size={13} />
                      <span>+ إضافة عتاد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/hub/new')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                    >
                      <Code size={13} />
                      <span>توثيق مشروع كامل</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!postContent.trim() || isPosting}
                    onClick={handleCreatePost}
                    className="px-4 py-1.5 rounded-lg bg-white/[0.1] hover:bg-white/[0.18] border border-white/[0.12] text-white font-bold text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                  >
                    <Send size={11} className="rotate-180" />
                    <span>نشر</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts & Project Updates Stream */}
          {posts.length === 0 && projects.length === 0 ? (
            <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-10 text-center space-y-3">
              <Cpu size={36} className="text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">لا توجد منشورات أو مشاريع بعد</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                كن أول من يشارك تحديثاً أو يوثق مشروعاً في المجتمع!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User created posts */}
              {posts.map((post) => (
                <div key={post.id} className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] text-zinc-300 font-bold flex items-center justify-center text-xs">
                        {(post.authorName || 'U').charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{post.authorName}</span>
                        <p className="text-[10px] text-zinc-500 font-mono">@{post.authorUsername} · {post.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{post.content}</p>

                  {post.hardware && post.hardware.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hardware.map((hw, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                          {hw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-zinc-400 text-xs">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 text-xs transition-colors cursor-pointer ${
                        likedPosts[post.id] ? 'text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      <ThumbsUp size={13} className={likedPosts[post.id] ? 'fill-white' : ''} />
                      <span>{post.likes}</span>
                    </button>
                    <button onClick={() => navigate('/hub/discussions')} className="hover:text-white text-xs">
                      {post.comments} تعليق
                    </button>
                  </div>
                </div>
              ))}

              {/* Feed from published projects */}
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/hub/project/${p.id}`)}
                  className="bg-[#18191c] hover:bg-[#1e2025] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] text-zinc-300 font-bold flex items-center justify-center text-xs">
                        {(p.ownerName || 'M').charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{p.ownerName || 'مطور'}</span>
                        <p className="text-[10px] text-zinc-500 font-mono">نشر مشروعاً جديداً · {new Date(p.createdAt || Date.now()).toLocaleDateString('ar-JO')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                      {p.difficulty || 'مبتدئ'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white hover:text-zinc-200 transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                      {p.summary}
                    </p>
                  </div>

                  {p.images?.[0] && (
                    <div className="rounded-xl overflow-hidden border border-white/[0.06] max-h-64 bg-[#141518]">
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs text-zinc-500 font-mono">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Eye size={12} /> {p.metrics?.views || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {p.metrics?.likes || 0}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 hover:underline flex items-center gap-1">
                      عرض التوثيق الكامل <ArrowRight size={11} className="rotate-180" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">
          
          <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2">
              أحدث المشاريع المنشورة
            </h3>
            {projects.length === 0 ? (
              <p className="text-[11px] text-zinc-500">لا توجد مشاريع حتى الآن</p>
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/hub/project/${proj.id}`)}
                    className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                  >
                    <h4 className="text-xs font-medium text-white line-clamp-1">{proj.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">بواسطة {proj.ownerName || 'مطور'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-white">الوسوم الشائعة</h3>
            <div className="flex flex-wrap gap-1">
              {['ESP32', 'BME280', 'MQTT', 'DHT22', 'Relay', 'OLED', 'DeepSleep'].map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/hub/explore?q=${t}`)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2024] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
