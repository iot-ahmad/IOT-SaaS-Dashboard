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
  { id: 'all', label: 'كافة المواضيع' },
  { id: 'power', label: 'إدارة الطاقة والبطاريات' },
  { id: 'sensors', label: 'الحساسات والمشغلات' },
  { id: 'cloud', label: 'السحابة وMQTT' },
  { id: 'robotics', label: 'الروبوتات والمحركات' },
  { id: 'firmware', label: 'البرمجيات الثابتة وRTOS' },
];

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
      const text = `${q.title} ${q.content} ${(q.tags || []).join(' ')}`.toLowerCase();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <HelpCircle size={20} className="text-zinc-400" />
            <span>النقاشات والأسئلة التقنية</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            اطرح استفساراتك حول الدوائر الإلكترونية والبرمجة مع مجتمع المهندسين
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={14} />
          <span>اطرح سؤالاً جديداً</span>
        </button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="ابحث في الأسئلة والحلول التقنية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e2024] border border-white/[0.08] rounded-xl py-2.5 px-3 pr-10 text-xs text-white focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-500"
            />
            <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('newest')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'newest' ? 'bg-white/[0.12] text-white' : 'bg-[#1e2024] text-zinc-400 hover:text-white'
              }`}
            >
              الأحدث
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'popular' ? 'bg-white/[0.12] text-white' : 'bg-[#1e2024] text-zinc-400 hover:text-white'
              }`}
            >
              الأكثر تفاعلاً
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'unanswered' ? 'bg-white/[0.12] text-white' : 'bg-[#1e2024] text-zinc-400 hover:text-white'
              }`}
            >
              بانتظار إجابة
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
                <div key={n} className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-5 space-y-3 animate-pulse h-32" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-10 text-center space-y-3">
              <HelpCircle size={36} className="text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">لا توجد أسئلة حالياً</h3>
              <p className="text-xs text-zinc-400">كن أول من يطرح استفساراً في المجتمع!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white font-medium text-xs"
              >
                + طرح سؤال
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-[#18191c] border border-white/[0.08] hover:border-white/20 rounded-2xl p-5 space-y-3 transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleUpvote(q.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 min-w-[48px] ${
                      upvotedQuestions[q.id]
                        ? 'bg-white/[0.15] border-white/30 text-white'
                        : 'bg-[#1e2024] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={14} className={upvotedQuestions[q.id] ? 'fill-white' : ''} />
                    <span className="text-xs font-bold font-mono mt-1">{q.upvotes || 0}</span>
                  </button>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-400">
                        {q.category || 'عام'}
                      </span>
                      {q.isAnswered && (
                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={11} /> تم الحل
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs md:text-sm font-bold text-white hover:text-zinc-200 transition-colors cursor-pointer">
                      {q.title}
                    </h3>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {q.content}
                    </p>

                    {q.tags && q.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {q.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-zinc-500 bg-white/[0.03] px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500">
                  <span>{q.authorName || 'مستخدم'} · {q.createdAt}</span>
                  <div className="flex items-center gap-1 font-mono">
                    <MessageSquare size={12} />
                    <span>{q.answersCount || 0} إجابات</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Topics Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#18191c] border border-white/[0.08] rounded-2xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-white border-b border-white/[0.06] pb-2">
              الموضوعات التقنية
            </h3>
            <div className="space-y-1">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSearchQuery(topic.id === 'all' ? '' : topic.label)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all text-right cursor-pointer"
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
