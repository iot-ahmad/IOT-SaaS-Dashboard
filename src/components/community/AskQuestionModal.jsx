import React, { useState } from 'react';
import { X, HelpCircle, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AskQuestionModal({ isOpen, onClose, user, onQuestionAdded }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Sensors & Actuators');
  const [tags, setTags] = useState(['ESP32']);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (t) => {
    setTags(tags.filter(item => item !== t));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both the question title and details.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const qData = {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        authorId: user?.uid || 'guest',
        authorName: user?.displayName || 'Hardware Developer',
        authorUsername: user?.displayName ? user.displayName.toLowerCase().replace(/\s+/g, '_') : 'maker',
        authorPhoto: user?.photoURL || null,
        upvotes: 0,
        answersCount: 0,
        isAnswered: false,
        createdAt: new Date().toISOString()
      };

      if (db) {
        await addDoc(collection(db, 'discussions'), qData);
      }
      if (onQuestionAdded) onQuestionAdded(qData);
      onClose();
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving the question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="ltr">
      <div className="bg-card border border-border w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4 text-foreground text-left">
        
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Ask a Technical Question</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Question Title *</label>
            <input
              type="text"
              required
              placeholder="e.g., How to reduce ESP32 power consumption during Deep Sleep?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-input border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-input border border-border rounded-xl py-2 px-2.5 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="Power & Battery Management">Power &amp; Battery Management</option>
                <option value="Sensors & Actuators">Sensors &amp; Actuators</option>
                <option value="Cloud & MQTT">Cloud &amp; MQTT</option>
                <option value="Robotics & Motors">Robotics &amp; Motors</option>
                <option value="Firmware & RTOS">Firmware &amp; RTOS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tags</label>
              <input
                type="text"
                placeholder="ESP32, I2C (Press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-input border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-muted border border-border text-primary px-2 py-0.5 rounded">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-foreground">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Question Details *</label>
            <textarea
              required
              rows={4}
              placeholder="Explain the problem in detail, expected behavior, and what you have tried so far..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-input border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground resize-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
            >
              {loading ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
