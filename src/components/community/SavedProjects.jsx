import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Cpu, Trash2, Calendar } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function SavedProjects({ user }) {
  const navigate = useNavigate();
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !db) {
      setSavedList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'saved_projects'), where('userId', '==', user.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ docId: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
        setSavedList(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load saved projects:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const handleRemove = async (e, docId) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'saved_projects', docId));
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Bookmark size={20} className="text-primary" />
            <span>Saved Projects</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Your personal library of bookmarked projects and circuits for quick reference
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hub/explore')}
          className="px-4 py-2 rounded-xl bg-muted hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Cpu size={14} className="text-primary" />
          <span>Explore Projects</span>
        </button>
      </div>

      {/* ── Saved Cards Grid ── */}
      {!user ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Bookmark size={40} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Sign in to view saved projects</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Bookmark hardware builds and circuits from the community repository to keep them synced to your account.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-pulse h-64">
              <div className="h-32 bg-muted rounded-xl" />
              <div className="h-4 bg-muted rounded-lg w-3/4" />
              <div className="h-3 bg-muted rounded-lg w-full" />
            </div>
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Bookmark size={40} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No saved projects yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Bookmark any project from the Explore Projects page to keep it here for quick access.
          </p>
          <button
            type="button"
            onClick={() => navigate('/hub/explore')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            Browse Repository Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedList.map((item) => (
            <div
              key={item.docId}
              onClick={() => navigate(`/hub/project/${item.projectId}`)}
              className="group bg-card hover:border-primary/45 border border-border rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-background overflow-hidden border-b border-border">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-background">
                    <Cpu size={24} className="text-primary" />
                    <span className="text-[10px] text-muted-foreground font-mono">Hardware Project</span>
                  </div>
                )}

                {item.difficulty && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-border text-primary">
                      {item.difficulty}
                    </span>
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 text-[9px] font-mono text-muted-foreground bg-black/70 backdrop-blur-sm border border-border px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Calendar size={9} className="text-primary" />
                  <span>{item.savedAt ? new Date(item.savedAt).toLocaleDateString('en-US') : 'Saved'}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col space-y-2.5">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {item.summary || 'View full schematics, component list, and firmware documentation.'}
                </p>

                {Array.isArray(item.componentsList) && item.componentsList.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {item.componentsList.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-muted border border-border text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2.5 border-t border-border mt-auto text-[10px] text-muted-foreground">
                  <span className="truncate font-medium">
                    By {item.ownerName || 'Developer'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, item.docId)}
                    title="Remove from saved"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
