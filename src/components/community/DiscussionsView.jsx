import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import {
  HelpCircle, MessageSquare, ThumbsUp, Plus, Search, Tag,
  CheckCircle2, Filter
} from 'lucide-react';
import AskQuestionModal from './AskQuestionModal';

const TOPICS = [
  { id: 'all', label: 'All Topics' },
  { id: 'power', label: 'Power & Battery Management' },
  { id: 'sensors', label: 'Sensors & Actuators' },
  { id: 'cloud', label: 'Cloud & MQTT' },
  { id: 'robotics', label: 'Robotics & Motors' },
  { id: 'firmware', label: 'Firmware & RTOS' },
];

const formatCategory = (cat) => {
  const map = {
    'عام': 'General',
    'إدارة الطاقة والبطاريات': 'Power & Battery Management',
    'حساسات ومشغلات': 'Sensors & Actuators',
    'الحساسات والمشغلات': 'Sensors & Actuators',
    'السحابة وMQTT': 'Cloud & MQTT',
    'روبوتات ومحركات': 'Robotics & Motors',
    'الروبوتات والمحركات': 'Robotics & Motors',
    'برمجيات ثابتة وRTOS': 'Firmware & RTOS',
    'البرمجيات الثابتة وRTOS': 'Firmware & RTOS',
  };
  return map[cat] || cat || 'General';
};

export default function DiscussionsView({ user }) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [upvotedQuestions, setUpvotedQuestions] = useState({});

  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      try {
        let fetched = [];
        if (db) {
          try {
            const q = query(collection(db, 'discussions'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          } catch (e) {
            console.warn('Firestore fetch discussions error:', e);
          }
        }
        setQuestions(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscussions();
  }, []);

  const handleToggleUpvote = (qid) => {
    setUpvotedQuestions(prev => {
      const isUpvoted = prev[qid];
      const updated = { ...prev, [qid]: !isUpvoted };
      setQuestions(questions.map(q => q.id === qid ? { ...q, upvotes: isUpvoted ? q.upvotes - 1 : q.upvotes + 1 } : q));
      return updated;
    });
  };

  const handleQuestionAdded = (newQ) => {
    setQuestions([newQ, ...questions]);
  };

  const filteredQuestions = questions.filter(q => {
    if (searchQuery.trim()) {
      const text = `${q.title} ${q.content} ${formatCategory(q.category)} ${(q.tags || []).join(' ')}`.toLowerCase();
      if (!text.includes(searchQuery.toLowerCase())) return false;
    }
    if (activeTab === 'unanswered' && q.isAnswered) return false;
    return true;
  }).sort((a, b) => {
    if (activeTab === 'popular') return (b.upvotes || 0) - (a.upvotes || 0);
    return 0;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5">
            <HelpCircle size={20} className="text-primary" />
            <span>Technical Discussions &amp; Q&amp;A</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Ask questions about electronic circuits, sensors, and firmware with the engineering community
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto hover:bg-primary/90"
        >
          <Plus size={14} />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search technical questions and solutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-border rounded-xl py-2.5 pl-10 pr-3 text-xs text-foreground focus:outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground"
            />
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('newest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'newest' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'popular' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'unanswered' ? 'bg-primary text-primary-foreground font-bold' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Unanswered
            </button>
          </div>
        </div>
      </div>

      {/* ── Main List + Topics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-card border border-border rounded-2xl p-5 space-y-3 animate-pulse h-32" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-3">
              <HelpCircle size={36} className="text-primary mx-auto" />
              <h3 className="text-sm font-bold text-foreground">No questions found</h3>
              <p className="text-xs text-muted-foreground">Be the first to ask a technical question in the community!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer"
              >
                + Ask Question
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-card border border-border hover:border-primary/40 rounded-2xl p-5 space-y-3 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleUpvote(q.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[48px] ${
                      upvotedQuestions[q.id]
                        ? 'bg-primary/15 border-primary/40 text-primary'
                        : 'bg-muted border-border text-primary hover:border-primary/40'
                    }`}
                  >
                    <ThumbsUp size={14} className="text-primary" />
                    <span className="text-xs font-bold font-mono text-primary mt-1">{q.upvotes || 0}</span>
                  </button>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-muted border border-border text-primary">
                        {formatCategory(q.category)}
                      </span>
                      {q.isAnswered && (
                        <span className="text-[10px] font-medium text-primary flex items-center gap-1">
                          <CheckCircle2 size={11} className="text-primary" /> Solved
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs md:text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
                      {q.title}
                    </h3>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {q.content}
                    </p>

                    {q.tags && q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {q.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-primary bg-muted px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-[10px] text-muted-foreground">
                  <span>{q.authorName || 'User'} · {q.createdAt}</span>
                  <div className="flex items-center gap-1 font-mono text-primary font-bold">
                    <MessageSquare size={12} className="text-primary" />
                    <span>{q.answersCount || 0} Answers</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Topics Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-foreground border-b border-border pb-2">
              Technical Topics
            </h3>
            <div className="space-y-1">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSearchQuery(topic.id === 'all' ? '' : topic.label)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-left cursor-pointer"
                >
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onQuestionAdded={handleQuestionAdded}
      />

    </div>
  );
}
