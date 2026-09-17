import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  doc, setDoc, getDocs, getDoc, orderBy, serverTimestamp, arrayUnion
} from 'firebase/firestore';

const MessagingContext = createContext();

export function MessagingProvider({ user, children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Privacy preferences
  const [privacySettings, setPrivacySettings] = useState({
    allowMessagesFrom: 'everyone', // 'everyone' | 'followers'
    blockedUsers: []
  });

  // Load user privacy preferences
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'user_settings', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().messaging) {
          setPrivacySettings(snap.data().messaging);
        }
      } catch (err) {
        console.error('Error loading messaging settings:', err);
      }
    };
    fetchSettings();
  }, [user]);

  // Subscribe to all conversations where current user is a participant
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // Sort by lastMessageAt descending
      convList.sort((a, b) => {
        const tA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (new Date(a.lastMessageAt || 0).getTime());
        const tB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (new Date(b.lastMessageAt || 0).getTime());
        return tB - tA;
      });

      setConversations(convList);

      // Compute total unread
      let totalUnread = 0;
      convList.forEach(c => {
        if (c.unreadFor && c.unreadFor[user.uid]) {
          totalUnread += c.unreadFor[user.uid];
        }
      });
      setUnreadCount(totalUnread);
    }, (err) => {
      console.warn('Conversations subscription info:', err.message);
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!activeConversation?.id) {
      setMessages([]);
      return;
    }

    const msgsRef = collection(db, 'conversations', activeConversation.id, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setMessages(list);

      // Clear unread count for current user
      if (user && activeConversation.unreadFor && activeConversation.unreadFor[user.uid] > 0) {
        updateDoc(doc(db, 'conversations', activeConversation.id), {
          [`unreadFor.${user.uid}`]: 0
        }).catch(() => {});
      }
    }, (err) => {
      console.warn('Messages subscription:', err.message);
    });

    return () => unsubscribe();
  }, [activeConversation?.id, user]);

  // Open or create a conversation with a recipient
  const startConversation = useCallback(async ({
    recipientId,
    recipientName = 'User',
    recipientAvatar = '',
    projectId = null,
    projectTitle = null
  }) => {
    if (!user) return null;
    if (recipientId === user.uid) {
      console.log('Cannot message self');
      return null;
    }

    setLoading(true);
    setIsMessagingOpen(true);

    try {
      // Find existing conversation between these 2 users
      const existing = conversations.find(c =>
        c.participants &&
        c.participants.includes(user.uid) &&
        c.participants.includes(recipientId)
      );

      if (existing) {
        // If there's a new project context, optionally update it
        if (projectId && existing.projectId !== projectId) {
          await updateDoc(doc(db, 'conversations', existing.id), {
            projectId,
            projectTitle
          });
          existing.projectId = projectId;
          existing.projectTitle = projectTitle;
        }
        setActiveConversation(existing);
        setLoading(false);
        return existing;
      }

      // Create new conversation
      const participantsData = {
        [user.uid]: {
          name: user.displayName || 'Developer',
          avatar: user.photoURL || '',
          email: user.email || ''
        },
        [recipientId]: {
          name: recipientName,
          avatar: recipientAvatar,
          email: ''
        }
      };

      const newConvData = {
        participants: [user.uid, recipientId],
        participantsData,
        lastMessage: 'بدء المحادثة',
        lastMessageAt: serverTimestamp(),
        lastSenderId: user.uid,
        projectId: projectId || null,
        projectTitle: projectTitle || null,
        unreadFor: {
          [recipientId]: 0,
          [user.uid]: 0
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'conversations'), newConvData);
      const createdConv = { id: docRef.id, ...newConvData };
      setActiveConversation(createdConv);
      return createdConv;
    } catch (err) {
      console.error('Failed to start conversation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, conversations]);

  // Send a message
  const sendMessage = async (text, codeSnippet = '') => {
    if (!user || !activeConversation?.id || (!text?.trim() && !codeSnippet?.trim())) return;

    const recipientId = activeConversation.participants.find(p => p !== user.uid);

    try {
      const msgData = {
        senderId: user.uid,
        senderName: user.displayName || 'Developer',
        senderAvatar: user.photoURL || '',
        text: text.trim(),
        codeSnippet: codeSnippet ? codeSnippet.trim() : null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'conversations', activeConversation.id, 'messages'), msgData);

      // Update conversation summary
      await updateDoc(doc(db, 'conversations', activeConversation.id), {
        lastMessage: text.trim() || 'كود برمجي 💻',
        lastMessageAt: serverTimestamp(),
        lastSenderId: user.uid,
        [`unreadFor.${recipientId}`]: (activeConversation.unreadFor?.[recipientId] || 0) + 1
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Convert DM snippet to Public Q&A on project
  const convertToPublicQA = async ({ question, answer, projectId, projectTitle }) => {
    if (!projectId || !question || !answer) return;
    try {
      const qaData = {
        question: question.trim(),
        answer: answer.trim(),
        authorName: user?.displayName || 'مطور في المجتمع',
        authorId: user?.uid,
        projectId,
        projectTitle: projectTitle || 'مشروع IoT',
        createdAt: new Date().toISOString(),
        upvotes: 1
      };
      await addDoc(collection(db, 'projects', projectId, 'public_qa'), qaData);
      return true;
    } catch (err) {
      console.error('Failed to convert Q&A:', err);
      return false;
    }
  };

  // Privacy: Block user
  const blockUser = async (targetUid) => {
    if (!user || !targetUid) return;
    try {
      const updatedBlocked = [...(privacySettings.blockedUsers || []), targetUid];
      setPrivacySettings(prev => ({ ...prev, blockedUsers: updatedBlocked }));
      await setDoc(doc(db, 'user_settings', user.uid), {
        messaging: { ...privacySettings, blockedUsers: updatedBlocked }
      }, { merge: true });
    } catch (err) {
      console.error('Failed to block user:', err);
    }
  };

  // Report conversation
  const reportConversation = async (convId, reason) => {
    if (!user || !convId) return;
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        conversationId: convId,
        reason,
        createdAt: serverTimestamp()
      });
      alert('تم إرسال البلاغ إلى فريق الإشراف للمراجعة.');
    } catch (err) {
      console.error('Failed to report conversation:', err);
    }
  };

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        unreadCount,
        isMessagingOpen,
        setIsMessagingOpen,
        startConversation,
        sendMessage,
        convertToPublicQA,
        blockUser,
        reportConversation,
        privacySettings,
        setPrivacySettings,
        loading
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return ctx;
}
