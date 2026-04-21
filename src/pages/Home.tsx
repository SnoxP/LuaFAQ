import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Loader2, AlertCircle, Image as ImageIcon, X, Plus, Menu, MessageSquare, Trash2, PanelLeft, Cpu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import DiscordMarkdown from '../components/DiscordMarkdown';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing. Chatbot will not work.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

import { useChat, Message } from '../context/ChatContext';

export default function Home() {
  const { faqData, user, userData } = useFaq();
  const { t } = useSettings();
  const { currentSessionId, messages, setMessages, saveSessionToStorage, isSidebarOpen, setIsSidebarOpen } = useChat();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWhyLoginOpen, setIsWhyLoginOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
  const [showUsageTip, setShowUsageTip] = useState(false);
  const [modelStatuses, setModelStatuses] = useState<Record<string, { status: 'checking' | 'online' | 'error' }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const hideUsageTip = localStorage.getItem('hideUsageTip');
      if (!hideUsageTip) {
        setShowUsageTip(true);
      }
    }
  }, [user]);

  // Check model statuses
  useEffect(() => {
    const checkModels = async () => {
      const modelsToCheck = [
        'gemini-3.1-flash-lite-preview',
        'groq-llama-3.1-8b-instant',
        'groq-llama-3.3-70b-versatile'
      ];
      
      const initialStatuses: Record<string, { status: 'checking' | 'online' | 'error' }> = {};
      modelsToCheck.forEach(m => initialStatuses[m] = { status: 'checking' });
      setModelStatuses(initialStatuses);

      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (apiKey) {
        // We won't ping Gemini automatically on Home to avoid rate limits (15 RPM free tier)
        // Just assume they are online unless they fail during chat
        modelsToCheck.filter(m => !m.startsWith('groq-')).forEach(m => {
          setModelStatuses(prev => ({ ...prev, [m]: { status: 'online' } }));
        });
      } else {
        modelsToCheck.filter(m => !m.startsWith('groq-')).forEach(m => {
          setModelStatuses(prev => ({ ...prev, [m]: { status: 'error' } }));
        });
      }

      // We won't ping Groq automatically on Home to avoid rate limits
      // Just assume they are online unless they fail during chat
      modelsToCheck.filter(m => m.startsWith('groq-')).forEach(m => {
        setModelStatuses(prev => ({ ...prev, [m]: { status: 'online' } }));
      });
    };

    checkModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    chatRef.current = null;
  }, [faqData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    if (!user) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `⚠️ ${t('home.loginRequired')}`
      }]);
      return;
    }

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: userText,
      image: selectedImage || undefined
    };
    
    const currentMessages = [...messages, newUserMsg];
    setMessages(currentMessages);
    setIsLoading(true);
    setSelectedImage(null);

    const isFirstUserMessage = messages.length === 1 && messages[0].id === 'welcome';
    const sessionTitle = isFirstUserMessage ? (userText.slice(0, 30) + (userText.length > 30 ? '...' : '')) : undefined;
    if (currentSessionId) {
      saveSessionToStorage(currentSessionId, currentMessages, sessionTitle);
    }

    let logRefId: string | null = null;
    try {
      // Save chat log to Firestore
      try {
        const logRef = doc(collection(db, 'chat_logs'));
        logRefId = logRef.id;
        await setDoc(logRef, {
          userId: user.uid,
          userEmail: userData?.discordId || user.uid, // Keep field name for compatibility, but store ID
          username: userData?.username || '',
          userPhotoURL: userData?.photoURL || '',
          question: userText || '[Imagem enviada]',
          timestamp: Date.now()
        });
      } catch (logError) {
        console.error("Error saving chat log:", logError);
      }

      // Compact FAQ to save tokens
      const compactFaq = faqData.map(c => 
        c.items.map(i => `Q: ${i.question}\nA: ${i.answer}`).join('\n\n')
      ).join('\n\n');

      const systemInstruction = `Você é o assistente virtual amigável e especialista do servidor Discord 'LuaTools'.
      Seu objetivo é ajudar os usuários respondendo dúvidas com base no seguinte FAQ:
      ${compactFaq}

      REGRAS:
      1. Seja educado, amigável e humano. Se o usuário apenas disser "oi", "olá", "bom dia", etc., responda de forma acolhedora e pergunte como pode ajudar.
      2. Para dúvidas técnicas gerais, priorize responder com base no FAQ fornecido.
      3. Se a dúvida técnica não estiver no FAQ, NÃO diga apenas que não sabe. Tente deduzir o problema usando seu conhecimento geral de programação/sistemas e forneça alternativas ou passos de troubleshooting que possam resolver a situação. Apenas se for algo muito específico e sem solução aparente, sugira pedir ajuda no servidor.
      4. Seja claro, direto e use emojis para deixar a conversa mais leve.
      5. Quando responder a uma dúvida do FAQ, sugira 1 ou 2 perguntas relacionadas no final.
      6. ANÁLISE DE IMAGENS: Se o usuário enviar uma imagem, aja como um desenvolvedor sênior investigando um bug. Analise a imagem detalhadamente, pense passo a passo sobre o que está visível (erros de sintaxe, logs, interface), identifique a causa raiz e forneça uma explicação técnica aprofundada com possíveis soluções (mesmo que não estejam no FAQ).`;

      try {
        const today = new Date().toLocaleDateString('pt-BR');
        const botRef = doc(db, 'content', 'bot_settings');
        const botSnap = await getDoc(botRef);
        
        if (botSnap.exists()) {
          const data = botSnap.data();
          const globalLimit = data.dailyLimit || 100;
          const userLimit = data.userDailyLimit || 10;
          const rpmLimit = data.rpmLimit || 15;
          const currentGens = data.lastResetDate === today ? (data.dailyGenerations || 0) : 0;
          
          if (currentGens >= globalLimit) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: '⚠️ O limite diário global de respostas do bot foi atingido. Por favor, tente novamente amanhã ou peça ajuda no servidor.'
            }]);
            setIsLoading(false);
            return;
          }

          const now = Date.now();
          const rpmUsageData = localStorage.getItem('bot_rpm_usage');
          let rpmUsage: number[] = rpmUsageData ? JSON.parse(rpmUsageData) : [];
          rpmUsage = rpmUsage.filter(timestamp => now - timestamp < 60000);

          if (rpmUsage.length >= rpmLimit) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `⚠️ Você está enviando mensagens rápido demais. O limite é de ${rpmLimit} por minuto. Aguarde um instante.`
            }]);
            setIsLoading(false);
            return;
          }

          const userUsageData = localStorage.getItem('bot_usage');
          let userUsage = userUsageData ? JSON.parse(userUsageData) : { date: today, count: 0 };
          
          if (userUsage.date !== today) {
            userUsage = { date: today, count: 0 };
          }

          if (userUsage.count >= userLimit) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              text: `⚠️ Você atingiu sua cota diária de ${userLimit} perguntas. Por favor, tente novamente amanhã ou peça ajuda no servidor.`
            }]);
            setIsLoading(false);
            return;
          }
          
          await updateDoc(botRef, {
            dailyGenerations: currentGens + 1,
            lastResetDate: today
          });

          userUsage.count += 1;
          localStorage.setItem('bot_usage', JSON.stringify(userUsage));

          rpmUsage.push(now);
          localStorage.setItem('bot_rpm_usage', JSON.stringify(rpmUsage));

        } else {
          await setDoc(botRef, {
            dailyLimit: 100,
            userDailyLimit: 10,
            rpmLimit: 15,
            dailyGenerations: 1,
            lastResetDate: today
          });
          localStorage.setItem('bot_usage', JSON.stringify({ date: today, count: 1 }));
        }
      } catch (e) {
        console.error("Error checking bot limits", e);
      }

      // Limit history to the last 4 messages (2 interactions) to save tokens, especially for Groq
      const historyMessages = currentMessages.filter(m => m.id !== 'welcome').slice(-4);
      
      const newModelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: newModelMsgId,
        role: 'model',
        text: ''
      }]);

      let fullText = '';

      if (selectedModel.startsWith('groq-')) {
        const apiKey = process.env.GROQ_API_KEY || (import.meta as any).env.VITE_GROQ_API_KEY;
        if (!apiKey) {
          throw new Error('Chave da API do Groq não configurada.');
        }

        const groqModel = selectedModel.replace('groq-', '');
        const groqMessages = historyMessages.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: m.text || ''
        }));

        // Add system instruction
        groqMessages.unshift({
          role: 'system',
          content: systemInstruction
        });

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            messages: groqMessages,
            model: groqModel,
            temperature: 0.4,
            stream: true,
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Erro da Groq: ${response.status}`);
        }

        if (!response.body) throw new Error("A resposta não contém um corpo de stream.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunkText = decoder.decode(value, { stream: true });
            const lines = chunkText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const dataStr = line.slice(6);
                if (dataStr.trim()) {
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.choices[0]?.delta?.content) {
                      fullText += parsed.choices[0].delta.content;
                      setMessages(prev => prev.map(msg => 
                        msg.id === newModelMsgId ? { ...msg, text: fullText } : msg
                      ));
                    }
                  } catch (e) {
                    // Ignore JSON parsing errors for partial chunks
                  }
                }
              }
            }
          }
        }

      } else {
        const ai = getAI();
        if (!ai) {
          throw new Error('Chave da API do Gemini não configurada.');
        }

        const contents = historyMessages.map(m => {
          const parts: any[] = [];
          if (m.text) {
            parts.push({ text: m.text });
          }
          if (m.image) {
            parts.push({ inlineData: { data: m.image.data, mimeType: m.image.mimeType } });
          }
          if (parts.length === 1 && m.image) {
             parts.unshift({ text: "Analise esta imagem." });
          }
          return {
            role: m.role,
            parts
          };
        });

        const responseStream = await ai.models.generateContentStream({
          model: selectedModel,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          }
        });

        for await (const chunk of responseStream) {
          fullText += chunk.text;
          setMessages(prev => prev.map(msg => 
            msg.id === newModelMsgId ? { ...msg, text: fullText } : msg
          ));
        }
      }

      if (!fullText) {
        setMessages(prev => prev.map(msg => 
          msg.id === newModelMsgId ? { ...msg, text: 'Ocorreu um erro ao processar a resposta.' } : msg
        ));
      } else if (logRefId) {
        try {
          await updateDoc(doc(db, 'chat_logs', logRefId), {
            response: fullText
          });
        } catch (updateErr) {
          console.error("Error updating chat log with response:", updateErr);
        }
      }

      setMessages(prev => {
        if (currentSessionId) {
          saveSessionToStorage(currentSessionId, prev);
        }
        return prev;
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `⚠️ Ocorreu um erro na IA. Troque o modelo para outro funcional no "+" ou fale com o Snox para consertar.\n\nDetalhes técnicos: ${error.message || 'Erro desconhecido'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = (event.target?.result as string).split(',')[1];
      setSelectedImage({ data, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (event) => {
          const data = (event.target?.result as string).split(',')[1];
          setSelectedImage({ data, mimeType: file.type });
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full bg-zinc-50 dark:bg-[#212121] transition-colors duration-200 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 ${
                  msg.role === 'user'
                    ? 'bg-white dark:bg-[#2f2f2f] text-zinc-900 dark:text-zinc-100 shadow-sm border border-black/5 dark:border-transparent'
                    : 'text-zinc-800 dark:text-zinc-200'
                }`}
              >
                {msg.image && (
                  <img 
                    src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                    alt="Uploaded" 
                    className="max-w-full rounded-xl mb-3 border border-black/10 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                )}
                <DiscordMarkdown className="text-[15px] leading-relaxed">
                  {msg.text}
                </DiscordMarkdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
              </div>
              <div className="text-zinc-500 dark:text-zinc-400 px-5 py-3.5 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[15px]">Pensando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area */}
      <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
        {!user ? (
          <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl border border-black/10 dark:border-white/10 p-6 text-center shadow-lg transition-colors duration-200">
            <p className="text-zinc-600 dark:text-zinc-300 mb-4">{t('home.loginRequired')}</p>
            <div className="flex flex-col items-center gap-3">
              <Link to="/login" className="inline-block px-6 py-2 bg-[#5865F2] text-white font-medium rounded-full hover:bg-[#4752C4] transition-colors shadow-sm">
                {t('home.loginButton')}
              </Link>
              <button 
                onClick={() => setIsWhyLoginOpen(true)}
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white underline transition-colors"
              >
                Por que preciso logar?
              </button>
            </div>
          </div>
        ) : (
          <div className="relative bg-white dark:bg-[#2f2f2f] rounded-3xl border border-black/10 dark:border-white/10 shadow-lg focus-within:border-black/20 dark:focus-within:border-white/20 transition-colors duration-200">
            {selectedImage && (
              <div className="absolute bottom-full left-0 mb-3 ml-4">
                <div className="relative inline-block">
                  <img 
                    src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} 
                    alt="Preview" 
                    className="h-16 rounded-lg border border-black/10 dark:border-white/10 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-full p-1 border border-black/10 dark:border-zinc-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 p-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
              />
              <div className="relative" ref={attachmentMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`p-3 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0 ${showAttachmentMenu ? 'bg-black/5 dark:bg-white/5 text-zinc-900 dark:text-zinc-200' : ''}`}
                >
                  <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowAttachmentMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Adicionar imagem</span>
                            <span className="text-[10px] text-zinc-500">Enviar foto para a IA</span>
                          </div>
                        </button>

                        <div className="h-px bg-black/5 dark:bg-white/5 my-1 mx-2" />

                        <div className="px-3 py-2">
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Modelo da IA</span>
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModel('gemini-3.1-flash-lite-preview');
                                setShowAttachmentMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${selectedModel === 'gemini-3.1-flash-lite-preview' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                <span>3.1 Flash Lite</span>
                                {modelStatuses['gemini-3.1-flash-lite-preview']?.status === 'error' && (
                                  <span title="Erro ao conectar com este modelo">⚠️</span>
                                )}
                              </div>
                              {selectedModel === 'gemini-3.1-flash-lite-preview' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModel('groq-llama-3.1-8b-instant');
                                setShowAttachmentMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${selectedModel === 'groq-llama-3.1-8b-instant' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                <span>Llama 3.1 8B (Groq)</span>
                                {modelStatuses['groq-llama-3.1-8b-instant']?.status === 'error' && (
                                  <span title="Erro ao conectar com este modelo">⚠️</span>
                                )}
                              </div>
                              {selectedModel === 'groq-llama-3.1-8b-instant' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedModel('groq-llama-3.3-70b-versatile');
                                setShowAttachmentMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${selectedModel === 'groq-llama-3.3-70b-versatile' ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4" />
                                <span>Llama 3.3 70B (Groq)</span>
                                {modelStatuses['groq-llama-3.3-70b-versatile']?.status === 'error' && (
                                  <span title="Erro ao conectar com este modelo">⚠️</span>
                                )}
                              </div>
                              {selectedModel === 'groq-llama-3.3-70b-versatile' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={selectedImage ? "Imagem selecionada..." : t('home.placeholder')}
                disabled={isLoading}
                rows={1}
                className="w-full bg-transparent border-none resize-none text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-0 py-3 max-h-32 overflow-y-auto disabled:opacity-50"
                style={{ minHeight: '44px' }}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="p-3 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:bg-black/10 dark:disabled:bg-white/10 disabled:text-zinc-400 dark:disabled:text-zinc-500 transition-colors shrink-0 mb-0.5 mr-0.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
        <div className="text-center mt-3">
          <p className="text-xs text-zinc-500">
            {t('home.footer')}{' '}
            <a href="https://ptb.discord.com/channels/1408201417834893385/1464812261611933839" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-700 dark:hover:text-zinc-400">Discord</a>.
          </p>
        </div>
      </div>
      </div>

      {/* Why Login Modal */}
      <AnimatePresence>
        {isWhyLoginOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWhyLoginOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#212121] rounded-2xl shadow-xl overflow-hidden border border-black/10 dark:border-white/10"
            >
              <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Por que preciso logar?</h3>
                <button
                  onClick={() => setIsWhyLoginOpen(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <p>
                  O login é necessário para garantir o funcionamento adequado da plataforma. Ao acessar sua conta, o sistema consegue oferecer respostas mais precisas, mantendo o contexto das interações e evitando repetições ou informações genéricas.
                </p>
                <p>
                  Além disso, a autenticação contribui para a segurança do serviço, prevenindo usos indevidos, como spam e abusos, e assegurando uma experiência mais estável para todos os usuários.
                </p>
                <p>
                  Ressaltamos que não realizamos qualquer uso indevido das informações da sua conta. Os dados fornecidos são utilizados exclusivamente para permitir o acesso e o funcionamento do sistema, não sendo compartilhados, vendidos ou utilizados para outros fins.
                </p>
              </div>
              <div className="p-6 border-t border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-[#171717] flex justify-end">
                <button
                  onClick={() => setIsWhyLoginOpen(false)}
                  className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUsageTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#212121] rounded-2xl shadow-xl overflow-hidden border border-black/10 dark:border-white/10"
            >
              <div className="p-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Dica de uso</h3>
                <button
                  onClick={() => setShowUsageTip(false)}
                  className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <p>
                  Para garantir o melhor funcionamento do bot, recomendamos que você reúna todas as suas perguntas em uma única mensagem. As requisições são limitadas, e enviar várias mensagens separadas pode reduzir a eficiência das respostas ou consumir rapidamente o limite disponível.
                </p>
                <p>
                  Ao enviar tudo de uma vez, você aumenta as chances de receber uma resposta mais completa, organizada e precisa.
                </p>
              </div>
              <div className="p-6 border-t border-black/10 dark:border-white/10 bg-zinc-50 dark:bg-[#171717] flex justify-end gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem('hideUsageTip', 'true');
                    setShowUsageTip(false);
                  }}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 font-medium rounded-xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                >
                  Não mostrar novamente
                </button>
                <button
                  onClick={() => setShowUsageTip(false)}
                  className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Ok
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
