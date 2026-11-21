import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import {
  Code, Cpu, ThumbsUp, MessageSquare, Share2,
  ArrowRight, Eye, Send, Plus
} from 'lucide-react';

const formatDifficulty = (diff) => {
  const map = { 'مبتدئ': 'Beginner', 'متوسط': 'Intermediate', 'متقدم': 'Advanced' };
  return map[diff] || diff || 'Beginner';
};

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
      authorName: user?.displayName || 'Community Developer',
      authorUsername: user?.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : 'maker',
      authorPhoto: user?.photoURL || null,
      createdAt: 'Just now',
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
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-foreground">
            Community Feed &amp; Hardware Updates
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share your experiments with sensors and microcontrollers and explore developer projects
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/hub/explore')}
            className="px-3.5 py-2 rounded-xl bg-muted hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Cpu size={14} className="text-primary" />
            <span>Browse Projects</span>
          </button>
          <button
            onClick={() => navigate('/hub/new')}
            className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer hover:bg-primary/90"
          >
            <Plus size={14} />
            <span>Publish Project</span>
          </button>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ── Main Stream (2 Cols) ── */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Post Creator Box */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full object-cover border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted text-primary font-bold flex items-center justify-center text-xs">
                  {(user?.displayName || 'U').charAt(0)}
                </div>
              )}
              
              <div className="flex-1 space-y-2.5">
                <textarea
                  rows={2}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share a quick update or technical tip about your IoT experiments..."
                  className="w-full bg-input border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none transition-all font-sans"
                />

                {showHardwareInput && (
                  <input
                    type="text"
                    value={postHardware}
                    onChange={(e) => setPostHardware(e.target.value)}
                    placeholder="Hardware components separated by commas (e.g., ESP32, DHT22, OLED)..."
                    className="w-full bg-input border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
                  />
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowHardwareInput(!showHardwareInput)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
                        showHardwareInput ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Cpu size={13} className="text-primary" />
                      <span>+ Add Hardware</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/hub/new')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs"
                    >
                      <Code size={13} className="text-primary" />
                      <span>Document Full Project</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={!postContent.trim() || isPosting}
                    onClick={handleCreatePost}
                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5 hover:bg-primary/90"
                  >
                    <Send size={11} />
                    <span>Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts & Project Updates Stream */}
          {posts.length === 0 && projects.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
              <Cpu size={36} className="text-primary mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No posts or projects yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first to share an update or document a project in the community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User created posts */}
              {posts.map((post) => (
                <div key={post.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted text-primary font-bold flex items-center justify-center text-xs">
                        {(post.authorName || 'U').charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">{post.authorName}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">@{post.authorUsername} · {post.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-foreground/85 leading-relaxed">{post.content}</p>

                  {post.hardware && post.hardware.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.hardware.map((hw, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-primary">
                          {hw}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border text-muted-foreground text-xs">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1 text-xs transition-colors cursor-pointer font-mono font-bold ${
                        likedPosts[post.id] ? 'text-primary' : 'text-primary/80 hover:text-primary'
                      }`}
                    >
                      <ThumbsUp size={13} className="text-primary" />
                      <span>{post.likes}</span>
                    </button>
                    <button onClick={() => navigate('/hub/discussions')} className="hover:text-foreground text-xs font-mono">
                      <span className="text-primary font-bold">{post.comments}</span> Comments
                    </button>
                  </div>
                </div>
              ))}

              {/* Feed from published projects */}
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/hub/project/${p.id}`)}
                  className="bg-card hover:border-primary/40 border border-border rounded-2xl p-5 space-y-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-muted text-primary font-bold flex items-center justify-center text-xs">
                        {(p.ownerName || 'M').charAt(0)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">{p.ownerName || 'Developer'}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">Published a new project · {new Date(p.createdAt || Date.now()).toLocaleDateString('en-US')}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-primary">
                      {formatDifficulty(p.difficulty)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {p.summary}
                    </p>
                  </div>

                  {p.images?.[0] && (
                    <div className="rounded-xl overflow-hidden border border-border max-h-64 bg-background">
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-border text-xs text-primary font-mono font-bold">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Eye size={12} className="text-primary" /> {p.metrics?.views || 0}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-primary" /> {p.metrics?.likes || 0}</span>
                    </div>
                    <span className="text-[11px] text-primary hover:underline flex items-center gap-1 font-sans">
                      View Full Documentation <ArrowRight size={11} className="text-primary" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Right Column ── */}
        <div className="space-y-4">
          
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-2">
              Latest Published Projects
            </h3>
            {projects.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 4).map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/hub/project/${proj.id}`)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                  >
                    <h4 className="text-xs font-medium text-foreground line-clamp-1">{proj.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">by {proj.ownerName || 'Developer'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground">Popular Tags</h3>
            <div className="flex flex-wrap gap-1">
              {['ESP32', 'BME280', 'MQTT', 'DHT22', 'Relay', 'OLED', 'DeepSleep'].map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(`/hub/explore?q=${t}`)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted border border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
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
