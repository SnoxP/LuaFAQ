import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFaq } from './FaqContext';
import { useSettings } from './SettingsContext';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: { data: string; mimeType: string };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  startNewSession: () => void;
  loadSession: (id: string) => void;
  deleteSession: (e: React.MouseEvent, id: string) => void;
  saveSessionToStorage: (sessionId: string, msgs: Message[], title?: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useFaq();
  const { t } = useSettings();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: t('home.welcome') || 'Olá! 👋 Sou o assistente virtual do LuaTools. Como posso te ajudar hoje? (Lembrando que minhas respostas são baseadas no nosso FAQ oficial, ok?)'
    }
  ]);

  const startNewSession = () => {
    const newId = Date.now().toString();
    setCurrentSessionId(newId);
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: t('home.welcome') || 'Olá! 👋 Sou o assistente virtual do LuaTools. Como posso te ajudar hoje? (Lembrando que minhas respostas são baseadas no nosso FAQ oficial, ok?)'
      }
    ]);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`chat_sessions_${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) {
            setCurrentSessionId(parsed[0].id);
            setMessages(parsed[0].messages);
          } else {
            startNewSession();
          }
        } catch (e) {
          startNewSession();
        }
      } else {
        startNewSession();
      }
    } else {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: t('home.welcome') || 'Olá! 👋 Sou o assistente virtual do LuaTools. Como posso te ajudar hoje? (Lembrando que minhas respostas são baseadas no nosso FAQ oficial, ok?)'
        }
      ]);
    }
  }, [user]);

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (user) {
      localStorage.setItem(`chat_sessions_${user.uid}`, JSON.stringify(updated));
    }
    if (currentSessionId === id) {
      if (updated.length > 0) {
        loadSession(updated[0].id);
      } else {
        startNewSession();
      }
    }
  };

  const saveSessionToStorage = (sessionId: string, msgs: Message[], title?: string) => {
    if (!user) return;
    setSessions(prev => {
      const existing = prev.find(s => s.id === sessionId);
      let updated: ChatSession[];
      if (existing) {
        updated = prev.map(s => s.id === sessionId ? {
          ...s,
          messages: msgs,
          updatedAt: Date.now()
        } : s);
      } else {
        const newSession: ChatSession = {
          id: sessionId,
          title: title || t('home.newChat'),
          messages: msgs,
          updatedAt: Date.now()
        };
        updated = [newSession, ...prev];
      }
      localStorage.setItem(`chat_sessions_${user.uid}`, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ChatContext.Provider value={{
      sessions,
      currentSessionId,
      messages,
      setMessages,
      startNewSession,
      loadSession,
      deleteSession,
      saveSessionToStorage,
      isSidebarOpen,
      setIsSidebarOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
