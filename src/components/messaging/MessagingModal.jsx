import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Code, X, Search, Shield, Flag,
  UserX, ExternalLink, HelpCircle, CheckCheck,
  ChevronRight, Lock, CornerDownLeft, Copy, Check
} from 'lucide-react';
import { useMessaging } from '../../context/MessagingContext';

export default function MessagingModal({ user }) {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    isMessagingOpen,
    setIsMessagingOpen,
    sendMessage,
    convertToPublicQA,
    blockUser,
    reportConversation,
    privacySettings,
    setPrivacySettings
  } = useMessaging();

  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isMessagingOpen || !user) return null;

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const otherUid = c.participants?.find(p => p !== user.uid);
    const otherData = c.participantsData?.[otherUid];
    const nameMatch = otherData?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const projectMatch = c.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || projectMatch;
  });

  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return { name: 'User', avatar: '' };
    const otherUid = conv.participants.find(p => p !== user.uid);
    return conv.participantsData?.[otherUid] || { name: 'IoT Developer', avatar: '' };
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !codeSnippet.trim()) return;
    sendMessage(inputText, codeSnippet);
    setInputText('');
    setCodeSnippet('');
    setShowCodeInput(false);
  };

  const handleOpenQAConvert = () => {
    if (activeConversation?.projectTitle) {
      setQaQuestion(`Question about ${activeConversation.projectTitle}`);
    }
    const lastMsg = messages[messages.length - 1]?.text || '';
    setQaAnswer(lastMsg);
    setQaModalOpen(true);
  };

  const handleConfirmQA = async (e) => {
    e.preventDefault();
    if (!activeConversation?.projectId) return;
    const ok = await convertToPublicQA({
      question: qaQuestion,
      answer: qaAnswer,
      projectId: activeConversation.projectId,
      projectTitle: activeConversation.projectTitle
    });
    if (ok) {
      alert('Question and answer published successfully as a public reference for all project developers!');
      setQaModalOpen(false);
    }
  };

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const activeOther = getOtherParticipant(activeConversation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="ltr">
      <div className="bg-card border border-border rounded-3xl w-full max-w-4xl h-[620px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-left">
        
        {/* ─── Top Bar ─── */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center text-primary">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Direct Messages</h3>
              <p className="text-[10px] text-muted-foreground">Connect and exchange code and schematics with the developer community</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
              title="Privacy Settings"
            >
              <Shield size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsMessagingOpen(false)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Privacy Settings Bar ─── */}
        {showSettings && (
          <div className="p-3 bg-muted/50 border-b border-border text-xs flex flex-wrap items-center justify-between gap-3 text-left animate-fadeIn">
            <div className="flex items-center gap-2">
              <Lock size={14} className="text-primary" />
              <span className="font-bold text-foreground">Allow messages from:</span>
              <select
                value={privacySettings.allowMessagesFrom || 'everyone'}
                onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessagesFrom: e.target.value }))}
                className="bg-input border border-border rounded-lg py-1 px-2 text-xs text-foreground focus:outline-none focus:border-primary"
              >
                <option value="everyone">Everyone (Recommended for community)</option>
                <option value="followers">Followers Only</option>
              </select>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Blocked users: {privacySettings.blockedUsers?.length || 0}
            </div>
          </div>
        )}

        {/* ─── Main Content Split ─── */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left / Sidebar: Conversation List */}
          <div className={`w-full sm:w-72 md:w-80 border-r border-border flex flex-col bg-card/20 ${activeConversation ? 'hidden sm:flex' : 'flex'}`}>
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations or projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/50 scrollbar-thin">
              {filteredConversations.map(conv => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?.id === conv.id;
                const unread = conv.unreadFor?.[user.uid] || 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-card/40'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {other.avatar ? (
                        <img src={other.avatar} alt={other.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold">
                          {(other.name || 'U').charAt(0)}
                        </div>
                      )}
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-extrabold flex items-center justify-center shadow">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-foreground truncate">{other.name}</h4>
                        {conv.projectId && (
                          <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                            {conv.projectTitle || 'Project'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <MessageSquare size={24} className="mx-auto opacity-30" />
                  <p className="text-xs">No active conversations yet.</p>
                  <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
                    Browse community projects and click "Message Developer" to start a conversation.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right / Chat Thread View */}
          <div className={`flex-1 flex flex-col bg-card/5 ${!activeConversation ? 'hidden sm:flex' : 'flex'}`}>
            {activeConversation ? (
              <>
                {/* Chat Header with Project Context */}
                <div className="p-3 px-4 border-b border-border bg-card/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Back button on mobile */}
                    <button
                      type="button"
                      onClick={() => setActiveConversation(null)}
                      className="sm:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>

                    {activeOther.avatar ? (
                      <img src={activeOther.avatar} alt={activeOther.name} className="w-9 h-9 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                        {(activeOther.name || 'U').charAt(0)}
                      </div>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-foreground">{activeOther.name}</h4>
                      {activeConversation.projectTitle && (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeConversation.projectId) {
                              navigate(`/hub/project/${activeConversation.projectId}`);
                              setIsMessagingOpen(false);
                            }
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Re: {activeConversation.projectTitle}</span>
                          <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thread Actions */}
                  <div className="flex items-center gap-1.5">
                    {activeConversation.projectId && (
                      <button
                        type="button"
                        onClick={handleOpenQAConvert}
                        className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Convert to public Q&A on the project page"
                      >
                        <HelpCircle size={11} />
                        Publish as Public Q&A
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const otherUid = activeConversation.participants?.find(p => p !== user.uid);
                        if (window.confirm('Are you sure you want to block this user from messaging you?')) {
                          blockUser(otherUid);
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Block User"
                    >
                      <UserX size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const reason = prompt('Enter reason for reporting this conversation:');
                        if (reason) reportConversation(activeConversation.id, reason);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      title="Report inappropriate content"
                    >
                      <Flag size={14} />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === user.uid;

                    return (
                      <div
                        key={msg.id || i}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%]">
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed space-y-2 ${
                              isMe
                                ? 'bg-primary text-primary-foreground rounded-tr-none font-medium'
                                : 'bg-muted text-foreground border border-border rounded-tl-none'
                            }`}
                          >
                            {/* Text content */}
                            {msg.text && (
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            )}

                            {/* Code Snippet */}
                            {msg.codeSnippet && (
                              <div className="mt-2 rounded-xl overflow-hidden border border-border bg-background text-left font-mono text-[11px]" dir="ltr">
                                <div className="bg-muted px-2.5 py-1 text-[9px] text-muted-foreground flex items-center justify-between border-b border-border">
                                  <span>CODE / PIN FIX</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(msg.id, msg.codeSnippet)}
                                    className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedCodeId === msg.id ? <Check size={10} className="text-primary" /> : <Copy size={10} className="text-primary" />}
                                    <span>{copiedCodeId === msg.id ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                                <pre className="p-2.5 text-primary overflow-x-auto scrollbar-thin">
                                  <code>{msg.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] text-muted-foreground/60 font-mono mt-1 px-1">
                          {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSend} className="p-3 border-t border-border bg-card/20 space-y-2">
                  {/* Code snippet drawer */}
                  {showCodeInput && (
                    <div className="p-2 bg-muted border border-border rounded-xl space-y-1 animate-fadeIn">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-mono text-primary font-bold">Code / Pinout Editor</span>
                        <button type="button" onClick={() => setShowCodeInput(false)} className="hover:text-red-400">
                          <X size={12} />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        placeholder="// Paste wiring config or Arduino function here..."
                        className="w-full bg-transparent font-mono text-[11px] text-foreground focus:outline-none resize-none"
                        dir="ltr"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCodeInput(!showCodeInput)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        showCodeInput ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title="Insert Code Snippet or Pinout"
                    >
                      <Code size={15} />
                    </button>

                    <input
                      type="text"
                      placeholder="Write a message to the developer..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-input border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />

                    <button
                      type="submit"
                      style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      className="p-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md shadow-primary/20"
                      title="Send"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
                <MessageSquare size={32} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground">Select a conversation to start</h4>
                <p className="text-xs max-w-xs text-muted-foreground/80 leading-relaxed">
                  Message project owners directly to ask technical questions or suggest improvements to circuits and code.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Convert to Public Q&A Modal ─── */}
      {qaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn" dir="ltr">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                <h4 className="text-sm font-bold text-foreground">Convert Conversation to Public Q&A</h4>
              </div>
              <button type="button" onClick={() => setQaModalOpen(false)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              This question and answer will be displayed on the <strong className="text-foreground">"{activeConversation?.projectTitle}"</strong> project page to help other developers.
            </p>

            <form onSubmit={handleConfirmQA} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted-foreground">Question / Issue</label>
                <input
                  type="text"
                  required
                  value={qaQuestion}
                  onChange={(e) => setQaQuestion(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted-foreground">Answer / Proposed Solution</label>
                <textarea
                  rows={4}
                  required
                  value={qaAnswer}
                  onChange={(e) => setQaAnswer(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  className="flex-1 font-bold py-2.5 rounded-xl text-xs hover:opacity-90 transition-opacity"
                >
                  Publish to Project Page
                </button>
                <button
                  type="button"
                  onClick={() => setQaModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
