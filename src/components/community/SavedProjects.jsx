import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Cpu, Trash2 } from 'lucide-react';

export default function SavedProjects({ user }) {
  const navigate = useNavigate();
  const [savedList, setSavedList] = useState([]);

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
          onClick={() => navigate('/hub/explore')}
          className="px-4 py-2 rounded-xl bg-muted hover:bg-secondary border border-border text-xs font-medium text-foreground transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Cpu size={14} className="text-primary" />
          <span>Explore Projects</span>
        </button>
      </div>

      {/* ── Saved Cards Grid ── */}
      {savedList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <Bookmark size={40} className="text-primary mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No saved projects yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Bookmark any project from the Explore Projects page to keep it here for quick access.
          </p>
          <button
            onClick={() => navigate('/hub/explore')}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all cursor-pointer"
          >
            Browse Repository Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedList.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/hub/project/${item.id}`)}
              className="group bg-card hover:border-primary/40 border border-border rounded-2xl overflow-hidden transition-all cursor-pointer flex flex-col"
            >
              <div className="p-4 flex-1 flex flex-col space-y-2">
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                  {item.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
