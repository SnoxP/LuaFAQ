import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import { Save, RotateCcw, AlertTriangle, CheckCircle2, Plus, Trash2, ChevronDown, ChevronRight, GripVertical, LogOut, Loader2, Users, MessageSquare, Wrench, Bot, User as UserIcon, AlertCircle, Upload, ShieldAlert, PanelLeft } from 'lucide-react';
import { FaqCategory, FaqItem } from '../data/defaultFaq';
import { db, collection, getDocs, doc, updateDoc, setDoc, getDoc, onSnapshot, query, orderBy, limit, startAfter, deleteDoc } from '../firebase';
import { GoogleGenAI } from '@google/genai';

import { useLocation, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export default function AdminPage() {
  const { faqData, updateFaqData, resetToDefault, user, userData, isAdmin, isAuthReady, isMaintenanceMode, login, signup, logout } = useFaq();
  const { t, language } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Local state for editing
  const [localData, setLocalData] = useState<FaqCategory[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'faq' | 'users' | 'fix' | 'bot' | 'logs'>('dashboard');
  const [usersList, setUsersList] = useState<{id: string, email?: string, username?: string, discordId?: string, role: string, isOnline?: boolean, lastActive?: number, isBanned?: boolean, createdAt?: number | string, photoURL?: string}[]>([]);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const usersPerPage = 20;
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{id: string, username: string, role: string} | null>(null);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<{today: {visits: number, logins: number}, yesterday: {visits: number, logins: number}}>({
    today: {visits: 0, logins: 0},
    yesterday: {visits: 0, logins: 0}
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Fix state
  const [fixData, setFixData] = useState({ title: '', description: '', version: '', downloadUrl: '' });
  const [isLoadingFix, setIsLoadingFix] = useState(false);
  const [saveFixStatus, setSaveFixStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Bot Settings state
  const [botSettings, setBotSettings] = useState({ dailyLimit: 100, userDailyLimit: 10, rpmLimit: 15, dailyGenerations: 0, lastResetDate: '' });
  const [isLoadingBot, setIsLoadingBot] = useState(false);
  const [saveBotStatus, setSaveBotStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [botStatuses, setBotStatuses] = useState<Record<string, { status: 'checking' | 'online' | 'error', reason?: string }>>({});
  const [isBotModelsExpanded, setIsBotModelsExpanded] = useState(false);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [expandedChatLogId, setExpandedChatLogId] = useState<string | null>(null);
  const [chatLogsCursors, setChatLogsCursors] = useState<any[]>([null]);
  const [chatLogsPage, setChatLogsPage] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Admin Logs state
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [adminLogsCursors, setAdminLogsCursors] = useState<any[]>([null]);
  const [adminLogsPage, setAdminLogsPage] = useState(0);
  const [hasMoreAdminLogs, setHasMoreAdminLogs] = useState(true);
  const [isLoadingAdminLogs, setIsLoadingAdminLogs] = useState(false);
  const isSuperAdmin = user?.email === 'pedronobreneto27@gmail.com' || userData?.discordId === '542832142745337867';

  // Sync local data when faqData changes (e.g., loaded from Firestore)
  useEffect(() => {
    setLocalData(JSON.parse(JSON.stringify(faqData)));
    // FAQs are minimized by default (empty Set)
  }, [faqData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'fix' || tab === 'faq' || tab === 'users' || tab === 'bot') {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeLogs: (() => void) | undefined;

    if (isAdmin) {
      if (activeTab === 'users') {
        setIsLoadingUsers(true);
        setUsersError(null);
        
        const fetchUsers = () => {
          setIsLoadingUsers(true);
          setUsersError(null);
          
          // Use onSnapshot for real-time updates, but handle errors gracefully
          unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
            if (snapshot.empty && snapshot.metadata.fromCache) {
              // Ignore empty cache, wait for server
              console.log("AdminPage: Empty cache, waiting for server...");
              return;
            }
            
            const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
            
            // Remove duplicates based on discordId, keeping the most recently active one
            const uniqueUsersMap = new Map<string, any>();
            users.forEach(u => {
              if (u.discordId) {
                const existing = uniqueUsersMap.get(u.discordId);
                if (!existing || (u.lastActive || 0) > (existing.lastActive || 0)) {
                  uniqueUsersMap.set(u.discordId, u);
                }
              } else {
                uniqueUsersMap.set(u.id, u); // Fallback for users without discordId
              }
            });
            
            const uniqueUsers = Array.from(uniqueUsersMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            console.log(`AdminPage: Loaded ${uniqueUsers.length} unique users.`);
            setUsersList(uniqueUsers);
            setIsLoadingUsers(false);
            setUsersError(null);
          }, (err) => {
            console.error("Error fetching users", err);
            
            // If permission denied, it might be a race condition with auth state.
            // We can try to fallback to a manual getDocs after a delay.
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
              setTimeout(() => {
                import('firebase/firestore').then(({ getDocs, collection }) => {
                  getDocs(collection(db, 'users')).then(snap => {
                    const users = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
                    const uniqueUsersMap = new Map<string, any>();
                    users.forEach(u => {
                      if (u.discordId) {
                        const existing = uniqueUsersMap.get(u.discordId);
                        if (!existing || (u.lastActive || 0) > (existing.lastActive || 0)) {
                          uniqueUsersMap.set(u.discordId, u);
                        }
                      } else {
                        uniqueUsersMap.set(u.id, u);
                      }
                    });
                    setUsersList(Array.from(uniqueUsersMap.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
                    setIsLoadingUsers(false);
                    setUsersError(null);
                  }).catch(fallbackErr => {
                    setUsersError(fallbackErr.message || 'Erro de permissão ao carregar usuários.');
                    setIsLoadingUsers(false);
                  });
                });
              }, 2000);
            } else {
              setUsersError(err.message || 'Erro desconhecido ao carregar usuários.');
              setIsLoadingUsers(false);
            }
          });
        };
        
        fetchUsers();
      } else if (activeTab === 'fix') {
        fetchFixData();
      } else if (activeTab === 'bot') {
        fetchBotSettings();
        checkBotStatus();
        fetchChatLogs();
      } else if (activeTab === 'logs' && isSuperAdmin) {
        fetchAdminLogs();
      } else if (activeTab === 'dashboard') {
        fetchAnalytics();
      }
    }

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [isAdmin, activeTab]);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const todayDoc = await getDoc(doc(db, 'analytics', todayStr));
      const yesterdayDoc = await getDoc(doc(db, 'analytics', yesterdayStr));

      setAnalyticsData({
        today: {
          visits: todayDoc.exists() ? todayDoc.data().visits || 0 : 0,
          logins: todayDoc.exists() ? todayDoc.data().logins || 0 : 0
        },
        yesterday: {
          visits: yesterdayDoc.exists() ? yesterdayDoc.data().visits || 0 : 0,
          logins: yesterdayDoc.exists() ? yesterdayDoc.data().logins || 0 : 0
        }
      });
    } catch (err) {
      console.error("Error fetching analytics", err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchChatLogs = async (pageIndex: number = 0) => {
    if (isLoadingLogs) return;
    setIsLoadingLogs(true);
    try {
      let q = query(collection(db, 'chat_logs'), orderBy('timestamp', 'desc'), limit(20));
      if (pageIndex > 0 && chatLogsCursors[pageIndex]) {
        q = query(collection(db, 'chat_logs'), orderBy('timestamp', 'desc'), startAfter(chatLogsCursors[pageIndex]), limit(20));
      }
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      if (snapshot.docs.length > 0) {
        setChatLogsCursors(prev => {
          const newCursors = [...prev];
          newCursors[pageIndex + 1] = snapshot.docs[snapshot.docs.length - 1];
          return newCursors;
        });
      }
      
      setHasMoreLogs(snapshot.docs.length === 20);
      setChatLogs(logs);
      setChatLogsPage(pageIndex);
    } catch (err) {
      console.error("Error fetching chat logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchAdminLogs = async (pageIndex: number = 0) => {
    if (isLoadingAdminLogs) return;
    setIsLoadingAdminLogs(true);
    try {
      let q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), limit(20));
      if (pageIndex > 0 && adminLogsCursors[pageIndex]) {
        q = query(collection(db, 'admin_logs'), orderBy('timestamp', 'desc'), startAfter(adminLogsCursors[pageIndex]), limit(20));
      }
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      if (snapshot.docs.length > 0) {
        setAdminLogsCursors(prev => {
          const newCursors = [...prev];
          newCursors[pageIndex + 1] = snapshot.docs[snapshot.docs.length - 1];
          return newCursors;
        });
      }
      
      setHasMoreAdminLogs(snapshot.docs.length === 20);
      setAdminLogs(logs);
      setAdminLogsPage(pageIndex);
    } catch (err) {
      console.error("Error fetching admin logs", err);
    } finally {
      setIsLoadingAdminLogs(false);
    }
  };

  const logAdminAction = async (action: string, details: string) => {
    if (!user) return;
    try {
      const { setDoc } = await import('../firebase');
      const logId = `log_${Date.now()}`;
      await setDoc(doc(db, 'admin_logs', logId), {
        action,
        details,
        userEmail: userData?.discordId || user.uid, // Keep field name for compatibility
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error logging admin action", err);
    }
  };

  const checkBotStatus = async () => {
    const modelsToCheck = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.1-pro-preview',
      'gemini-flash-latest',
      'groq-llama-3.1-8b-instant',
      'groq-llama-3.3-70b-versatile'
    ];
    
    const initialStatuses: Record<string, { status: 'checking' | 'online' | 'error', reason?: string }> = {};
    modelsToCheck.forEach(m => initialStatuses[m] = { status: 'checking' });
    setBotStatuses(initialStatuses);

    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      const errorStatuses: Record<string, { status: 'error', reason: string }> = {};
      modelsToCheck.filter(m => !m.startsWith('groq-')).forEach(m => errorStatuses[m] = { status: 'error', reason: 'Chave da API não encontrada.' });
      setBotStatuses(prev => ({ ...prev, ...errorStatuses as any }));
    } else {
      const ai = new GoogleGenAI({ apiKey });

      await Promise.all(modelsToCheck.filter(m => !m.startsWith('groq-')).map(async (modelName) => {
        try {
          await ai.models.generateContent({
            model: modelName,
            contents: 'ping',
            config: { maxOutputTokens: 1 }
          });
          setBotStatuses(prev => ({ ...prev, [modelName]: { status: 'online' } }));
        } catch (err: any) {
          setBotStatuses(prev => ({ ...prev, [modelName]: { status: 'error', reason: err.message || String(err) } }));
        }
      }));
    }

    // Check Groq
    const groqApiKey = process.env.GROQ_API_KEY || (import.meta as any).env.VITE_GROQ_API_KEY;
    if (groqApiKey) {
      try {
        await Promise.all(modelsToCheck.filter(m => m.startsWith('groq-')).map(async (modelName) => {
          try {
            const groqModel = modelName.replace('groq-', '');
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
              },
              body: JSON.stringify({
                messages: [{ role: 'user', content: 'ping' }],
                model: groqModel,
                max_tokens: 1
              })
            });
            
            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw errData;
            }

            setBotStatuses(prev => ({ ...prev, [modelName]: { status: 'online' } }));
          } catch (err: any) {
            let reason = 'Erro desconhecido';
            if (err.error?.code === 'rate_limit_exceeded') {
              reason = 'Cota excedida (Limite atingido)';
            } else if (err.error?.message) {
              reason = err.error.message;
            } else if (err.message) {
              reason = err.message;
            }
            setBotStatuses(prev => ({ ...prev, [modelName]: { status: 'error', reason } }));
          }
        }));
      } catch (err) {
        modelsToCheck.filter(m => m.startsWith('groq-')).forEach(m => {
          setBotStatuses(prev => ({ ...prev, [m]: { status: 'error', reason: 'Falha ao conectar à API' } }));
        });
      }
    } else {
      modelsToCheck.filter(m => m.startsWith('groq-')).forEach(m => {
        setBotStatuses(prev => ({ ...prev, [m]: { status: 'error', reason: 'Chave da API não encontrada.' } }));
      });
    }
  };

  const fetchBotSettings = async () => {
    setIsLoadingBot(true);
    try {
      const docSnap = await getDoc(doc(db, 'content', 'bot_settings'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBotSettings({
          dailyLimit: data.dailyLimit || 100,
          userDailyLimit: data.userDailyLimit || 10,
          rpmLimit: data.rpmLimit || 15,
          dailyGenerations: data.dailyGenerations || 0,
          lastResetDate: data.lastResetDate || ''
        });
      }
    } catch (err) {
      console.error("Error fetching bot settings", err);
    } finally {
      setIsLoadingBot(false);
    }
  };

  const saveBotSettings = async () => {
    setSaveBotStatus('saving');
    try {
      await updateDoc(doc(db, 'content', 'bot_settings'), {
        dailyLimit: botSettings.dailyLimit,
        userDailyLimit: botSettings.userDailyLimit,
        rpmLimit: botSettings.rpmLimit
      });
      setSaveBotStatus('success');
      setTimeout(() => setSaveBotStatus('idle'), 3000);
    } catch (err) {
      console.error("Error saving bot settings", err);
      try {
        const { setDoc } = await import('../firebase');
        await setDoc(doc(db, 'content', 'bot_settings'), {
          dailyLimit: botSettings.dailyLimit,
          userDailyLimit: botSettings.userDailyLimit,
          rpmLimit: botSettings.rpmLimit,
          dailyGenerations: botSettings.dailyGenerations,
          lastResetDate: botSettings.lastResetDate
        });
        setSaveBotStatus('success');
        setTimeout(() => setSaveBotStatus('idle'), 3000);
      } catch (e) {
        setSaveBotStatus('error');
        setTimeout(() => setSaveBotStatus('idle'), 3000);
      }
    }
  };

  const fetchFixData = async () => {
    setIsLoadingFix(true);
    try {
      const docSnap = await getDoc(doc(db, 'content', 'game_fix'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFixData({
          title: data.title || '',
          description: data.description || '',
          version: data.version || '',
          downloadUrl: data.downloadUrl || ''
        });
      }
    } catch (err) {
      console.error("Error fetching fix data", err);
    } finally {
      setIsLoadingFix(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      alert("O arquivo é muito grande. O limite é de 200MB.");
      return;
    }

    // Set title based on file name (without extension)
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setFixData(prev => ({ ...prev, title: fileNameWithoutExt }));
    setUploadProgress(0);

    try {
      // Usando a API do Gofile.io para hospedar o arquivo gratuitamente (suporta CORS)
      
      // 1. Obter o melhor servidor disponível
      const serverResponse = await fetch('https://api.gofile.io/servers', {
        method: 'GET',
      });
      const serverData = await serverResponse.json();
      
      if (serverData.status !== 'ok' || !serverData.data?.servers?.length) {
        throw new Error('Não foi possível conectar aos servidores de upload.');
      }
      
      const server = serverData.data.servers[0].name;

      // 2. Fazer o upload para o servidor selecionado
      const formData = new FormData();
      formData.append('file', file);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null) return null;
          const next = prev + 5;
          return next > 90 ? 90 : next;
        });
      }, 500);

      const uploadResponse = await fetch(`https://${server}.gofile.io/contents/uploadfile`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const uploadData = await uploadResponse.json();

      if (uploadData.status !== 'ok') {
        throw new Error('Falha no upload para o servidor.');
      }

      const downloadURL = uploadData.data.downloadPage;
      
      setFixData(prev => ({ ...prev, downloadUrl: downloadURL }));
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
      
      // Auto-save the new URL
      try {
        const { setDoc } = await import('../firebase');
        const now = new Date().toLocaleDateString('pt-BR');
        await setDoc(doc(db, 'content', 'game_fix'), {
          title: fileNameWithoutExt,
          downloadUrl: downloadURL,
          updatedAt: now
        }, { merge: true });
        alert("Arquivo enviado e link salvo com sucesso!");
      } catch (e) {
        console.error("Error auto-saving fix data:", e);
      }
    } catch (err: any) {
      console.error("Error uploading file", err);
      setUploadProgress(null);
      alert(`Erro ao fazer upload do arquivo: ${err.message || 'Tente novamente mais tarde.'}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFileUpload(e.clipboardData.files[0]);
    }
  };

  const saveFixData = async () => {
    setSaveFixStatus('saving');
    try {
      const { setDoc } = await import('../firebase');
      const now = new Date().toLocaleDateString('pt-BR');
      await setDoc(doc(db, 'content', 'game_fix'), {
        ...fixData,
        updatedAt: now
      }, { merge: true });
      await logAdminAction('update_fix', 'Dados de correção atualizados');
      setSaveFixStatus('success');
      setTimeout(() => setSaveFixStatus('idle'), 3000);
    } catch (err) {
      console.error("Error saving fix data", err);
      setSaveFixStatus('error');
      setTimeout(() => setSaveFixStatus('idle'), 3000);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logAdminAction('update_user_role', `Cargo atualizado para ${newRole} do usuário ${userId}`);
      setUsersList(usersList.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("Error updating role", err);
    }
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    const newBanStatus = !currentBanStatus;
    try {
      await updateDoc(doc(db, 'users', userId), { isBanned: newBanStatus });
      await logAdminAction(newBanStatus ? 'ban_user' : 'unban_user', `Usuário ${newBanStatus ? 'banido' : 'desbanido'}: ${userId}`);
      setUsersList(usersList.map(u => u.id === userId ? { ...u, isBanned: newBanStatus } : u));
    } catch (err) {
      console.error("Error updating ban status", err);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      await setDoc(doc(db, 'content', 'system_settings'), {
        maintenanceMode: !isMaintenanceMode
      }, { merge: true });
      await logAdminAction('toggle_maintenance', `Modo de manutenção ${!isMaintenanceMode ? 'ativado' : 'desativado'}`);
    } catch (err) {
      console.error("Error toggling maintenance mode", err);
      alert("Erro ao alterar o modo de manutenção.");
    }
  };

  const kickUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Expulsar Usuário',
      message: 'Tem certeza que deseja expulsar este usuário? A conta será removida.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', userId));
          await logAdminAction('kick_user', `Usuário expulso: ${userId}`);
          setUsersList(prev => prev.filter(u => u.id !== userId));
        } catch (err) {
          console.error("Error kicking user", err);
        }
      }
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    const userToEdit = usersList.find(u => u.id === editingUser.id);
    if (userToEdit && (userToEdit.email === 'pedronobreneto27@gmail.com' || userToEdit.email === 'pedronobreneto@gmail.com' || userToEdit.id === '542832142745337867' || userToEdit.discordId === '542832142745337867')) {
      alert("Não é permitido editar o administrador principal.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', editingUser.id), { 
        username: editingUser.username,
        role: editingUser.role 
      });
      await logAdminAction('edit_user', `Usuário editado: ${editingUser.id}`);
      setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, username: editingUser.username, role: editingUser.role } : u));
      setEditingUser(null);
    } catch (err) {
      console.error("Error updating user", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login();
      // Note: The redirect is handled by a useEffect watching the user/isAdmin state
    } catch (err: any) {
      console.error("Auth failed", err);
      if (err.code === 'auth/operation-not-allowed') {
        setLoginError('O login com Discord não está ativado no Firebase. Por favor, ative-o no console do Firebase.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setLoginError('Este domínio não está autorizado no Firebase. Adicione a URL atual na lista de domínios autorizados no Console do Firebase (Authentication > Settings > Authorized domains).');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setLoginError('A janela de login foi fechada antes de concluir. Tente novamente.');
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError('O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups para este site ou abra o site em uma nova guia.');
      } else {
        setLoginError(`Erro ao fazer login: ${err.message || err.code || 'Erro desconhecido'}. Se estiver usando o preview, tente abrir o site em uma nova guia.`);
      }
    }
  };

  useEffect(() => {
    if (isAuthReady && user && !isAdmin) {
      navigate('/perfil');
    }
  }, [user, isAdmin, isAuthReady, navigate]);

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      await updateFaqData(localData);
      await logAdminAction('update_faq', 'FAQ atualizado manualmente');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Restaurar Padrão',
      message: 'Tem certeza que deseja restaurar o FAQ para o padrão original? Todas as alterações não salvas serão perdidas.',
      onConfirm: async () => {
        try {
          await resetToDefault();
          await logAdminAction('reset_faq', 'FAQ restaurado para o padrão');
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
          console.error(err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    });
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Category Operations
  const addCategory = () => {
    const newId = `cat_${Date.now()}`;
    setLocalData([...localData, { id: newId, title: 'Nova Categoria', items: [] }]);
    setExpandedCategories(new Set(expandedCategories).add(newId));
  };

  const updateCategoryTitle = (categoryId: string, newTitle: string) => {
    setLocalData(localData.map(cat => cat.id === categoryId ? { ...cat, title: newTitle } : cat));
  };

  const deleteCategory = (categoryId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria e todas as suas perguntas?',
      onConfirm: async () => {
        const newData = localData.filter(cat => cat.id !== categoryId);
        setLocalData(newData);
        try {
          setSaveStatus('saving');
          await updateFaqData(newData);
          await logAdminAction('delete_category', `Categoria excluída: ${categoryId}`);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
          console.error(err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    });
  };

  // Item Operations
  const addItem = (categoryId: string) => {
    const newItemId = `item_${Date.now()}`;
    setLocalData(localData.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, { id: newItemId, question: 'Nova Pergunta', answer: 'Resposta aqui...', author: userData?.username || user?.email || 'Desconhecido' }]
        };
      }
      return cat;
    }));
  };

  const updateItem = (categoryId: string, itemId: string, field: 'question' | 'answer', value: string) => {
    setLocalData(localData.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        };
      }
      return cat;
    }));
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Pergunta',
      message: 'Tem certeza que deseja excluir esta pergunta?',
      onConfirm: async () => {
        const newData = localData.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, items: cat.items.filter(item => item.id !== itemId) };
          }
          return cat;
        });
        setLocalData(newData);
        try {
          setSaveStatus('saving');
          await updateFaqData(newData);
          await logAdminAction('delete_faq_item', `Pergunta excluída da categoria: ${categoryId}`);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
          console.error(err);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceCategoryId = result.source.droppableId;
    const destinationCategoryId = result.destination.droppableId;

    if (sourceCategoryId !== destinationCategoryId) {
      // Moving between categories (optional, can be disabled if not needed)
      const sourceCategoryIndex = localData.findIndex(cat => cat.id === sourceCategoryId);
      const destCategoryIndex = localData.findIndex(cat => cat.id === destinationCategoryId);
      
      if (sourceCategoryIndex === -1 || destCategoryIndex === -1) return;

      const newLocalData = [...localData];
      const sourceItems = [...newLocalData[sourceCategoryIndex].items];
      const destItems = [...newLocalData[destCategoryIndex].items];

      const [movedItem] = sourceItems.splice(result.source.index, 1);
      destItems.splice(result.destination.index, 0, movedItem);

      newLocalData[sourceCategoryIndex] = { ...newLocalData[sourceCategoryIndex], items: sourceItems };
      newLocalData[destCategoryIndex] = { ...newLocalData[destCategoryIndex], items: destItems };

      setLocalData(newLocalData);
    } else {
      // Reordering within the same category
      const categoryIndex = localData.findIndex(cat => cat.id === sourceCategoryId);
      if (categoryIndex === -1) return;

      const newLocalData = [...localData];
      const items = [...newLocalData[categoryIndex].items];
      
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      newLocalData[categoryIndex] = { ...newLocalData[categoryIndex], items };
      setLocalData(newLocalData);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-[#212121] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-[#212121] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#2f2f2f] p-8 rounded-3xl shadow-lg max-w-md w-full text-center border border-black/10 dark:border-white/10">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Acesso Restrito</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Você precisa fazer login para acessar o painel de administração.
          </p>
          <button
            onClick={handleAuth}
            className="w-full py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            Fazer Login com Discord
          </button>
          {loginError && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm text-left">
              <AlertCircle className="w-4 h-4 inline mr-2 -mt-0.5" />
              {loginError}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-full bg-zinc-50 dark:bg-[#212121] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#2f2f2f] p-8 rounded-3xl shadow-lg max-w-md w-full text-center border border-black/10 dark:border-white/10">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Acesso Negado</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Você não tem permissão para acessar esta página. Apenas administradores podem visualizar este conteúdo.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">{t('admin.title')}</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">{t('admin.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMaintenanceMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                isMaintenanceMode 
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30' 
                  : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Wrench className="w-4 h-4" />
              {isMaintenanceMode ? 'Manutenção Ativa' : 'Ativar Manutenção'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-6 gap-2 hide-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <PanelLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === 'faq' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Gerenciar FAQ
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === 'users' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('fix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === 'fix' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Gerenciar Fix
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeTab === 'bot' 
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            Configurações do Bot
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === 'logs' 
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' 
                  : 'bg-white text-zinc-600 dark:bg-[#2f2f2f] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Logs de Admin
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#2f2f2f] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Visitas Hoje
                </h3>
                <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                  {isLoadingAnalytics ? <Loader2 className="w-8 h-8 animate-spin text-zinc-400" /> : analyticsData.today.visits}
                </div>
                {!isLoadingAnalytics && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Ontem: {analyticsData.yesterday.visits}
                  </p>
                )}
              </div>
              <div className="bg-white dark:bg-[#2f2f2f] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-emerald-500" />
                  Logins Hoje
                </h3>
                <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                  {isLoadingAnalytics ? <Loader2 className="w-8 h-8 animate-spin text-zinc-400" /> : analyticsData.today.logins}
                </div>
                {!isLoadingAnalytics && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Ontem: {analyticsData.yesterday.logins}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content goes here, omitted for brevity but should be added based on the original file */}
        {activeTab === 'faq' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#2f2f2f] p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                {saveStatus === 'success' && <span className="text-emerald-500 flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4" /> Salvo</span>}
                {saveStatus === 'error' && <span className="text-red-500 flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4" /> Erro</span>}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={addCategory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Categoria
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Padrão
                </button>
              </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {localData.map((category) => (
                  <div key={category.id} className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-black/20">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => toggleCategory(category.id)}
                          className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                        >
                          {expandedCategories.has(category.id) ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                        <input
                          type="text"
                          value={category.title}
                          onChange={(e) => updateCategoryTitle(category.id, e.target.value)}
                          className="font-semibold text-lg bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 w-full sm:w-64 text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => addItem(category.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Pergunta
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir Categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedCategories.has(category.id) && (
                      <Droppable droppableId={category.id}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="p-4 sm:p-6 space-y-4"
                          >
                            {category.items.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`bg-zinc-50 dark:bg-[#212121] border border-black/5 dark:border-white/5 rounded-2xl p-4 transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''}`}
                                  >
                                    <div className="flex gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-2 cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                                      >
                                        <GripVertical className="w-5 h-5" />
                                      </div>
                                      <div className="flex-1 space-y-3">
                                        <div className="flex justify-between items-start gap-4">
                                          <input
                                            type="text"
                                            value={item.question}
                                            onChange={(e) => updateItem(category.id, item.id, 'question', e.target.value)}
                                            className="w-full font-medium bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Pergunta"
                                          />
                                          <button
                                            onClick={() => deleteItem(category.id, item.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                                            title="Excluir Pergunta"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <textarea
                                          value={item.answer}
                                          onChange={(e) => updateItem(category.id, item.id, 'answer', e.target.value)}
                                          className="w-full bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y font-mono text-sm"
                                          placeholder="Resposta (suporta Markdown)"
                                        />
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                          Autor: {item.author}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                            {category.items.length === 0 && (
                              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl">
                                Nenhuma pergunta nesta categoria.
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </div>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Gerenciar Usuários</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Total: {usersList.length} usuários</p>
            </div>
            
            {usersError && (
              <div className="p-4 m-6 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-500/20">
                <AlertCircle className="w-5 h-5 inline mr-2 -mt-0.5" />
                {usersError}
              </div>
            )}

            <div className="overflow-x-auto">
              {isLoadingUsers ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-black/20 border-b border-black/5 dark:border-white/5">
                      <th className="py-4 px-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">Usuário</th>
                      <th className="py-4 px-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">Cargo</th>
                      <th className="py-4 px-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                      <th className="py-4 px-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {usersList.slice((usersCurrentPage - 1) * usersPerPage, usersCurrentPage * usersPerPage).map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.username} className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                                {u.username || 'Sem nome'}
                                {u.isBanned && <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 text-xs rounded-full font-medium">Banido</span>}
                              </div>
                              <div className="text-sm text-zinc-500 dark:text-zinc-400">{u.email || u.discordId || u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' 
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                              {u.isOnline ? 'Online' : u.lastActive ? `Visto ${new Date(u.lastActive).toLocaleDateString()}` : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser({ id: u.id, username: u.username || '', role: u.role || 'user' })}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Editar Usuário"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserRole(u.id, u.role)}
                              disabled={u.email === 'pedronobreneto27@gmail.com' || u.email === 'pedronobreneto@gmail.com' || u.id === '542832142745337867' || u.discordId === '542832142745337867'}
                              className="p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                              title={u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleUserBan(u.id, u.isBanned || false)}
                              disabled={u.email === 'pedronobreneto27@gmail.com' || u.email === 'pedronobreneto@gmail.com' || u.id === '542832142745337867' || u.discordId === '542832142745337867'}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                u.isBanned 
                                  ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10' 
                                  : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                              }`}
                              title={u.isBanned ? 'Desbanir' : 'Banir'}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => kickUser(u.id)}
                              disabled={u.email === 'pedronobreneto27@gmail.com' || u.email === 'pedronobreneto@gmail.com' || u.id === '542832142745337867' || u.discordId === '542832142745337867'}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Expulsar (Excluir Conta)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && !isLoadingUsers && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            {/* Pagination */}
            {usersList.length > usersPerPage && (
              <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mostrando {(usersCurrentPage - 1) * usersPerPage + 1} a {Math.min(usersCurrentPage * usersPerPage, usersList.length)} de {usersList.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setUsersCurrentPage(p => Math.max(1, p - 1))}
                    disabled={usersCurrentPage === 1}
                    className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setUsersCurrentPage(p => p + 1)}
                    disabled={usersCurrentPage * usersPerPage >= usersList.length}
                    className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fix' && (
          <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Gerenciar Fix</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Atualize as informações do arquivo de correção do jogo.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveFixData}
                  disabled={saveFixStatus === 'saving'}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {saveFixStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveFixStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                {saveFixStatus === 'success' && <span className="text-emerald-500 flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4" /> Salvo</span>}
                {saveFixStatus === 'error' && <span className="text-red-500 flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4" /> Erro</span>}
              </div>
            </div>

            {isLoadingFix ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
              </div>
            ) : (
              <div className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                      : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onPaste={handlePaste}
                >
                  <Upload className="w-10 h-10 text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">Upload do Arquivo</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    Arraste e solte o arquivo aqui, cole (Ctrl+V) ou clique para selecionar.
                    <br />Tamanho máximo: 200MB. Hospedagem gratuita via Gofile.io.
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    Selecionar Arquivo
                  </label>
                  
                  {uploadProgress !== null && (
                    <div className="mt-6 max-w-md mx-auto">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-zinc-600 dark:text-zinc-400">Fazendo upload...</span>
                        <span className="font-medium text-zinc-900 dark:text-white">{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Título
                    </label>
                    <input
                      type="text"
                      value={fixData.title}
                      onChange={(e) => setFixData({ ...fixData, title: e.target.value })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Correção de Erros V1.2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Versão
                    </label>
                    <input
                      type="text"
                      value={fixData.version}
                      onChange={(e) => setFixData({ ...fixData, version: e.target.value })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 1.2.0"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      URL de Download
                    </label>
                    <input
                      type="text"
                      value={fixData.downloadUrl}
                      onChange={(e) => setFixData({ ...fixData, downloadUrl: e.target.value })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-zinc-500 mt-1">Esta URL será atualizada automaticamente se você fizer o upload de um arquivo acima.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Descrição
                    </label>
                    <textarea
                      value={fixData.description}
                      onChange={(e) => setFixData({ ...fixData, description: e.target.value })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px] resize-y"
                      placeholder="Descreva o que esta correção resolve..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bot' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Configurações do Bot</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gerencie os limites de uso da IA.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={saveBotSettings}
                    disabled={saveBotStatus === 'saving'}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                  >
                    {saveBotStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saveBotStatus === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  {saveBotStatus === 'success' && <span className="text-emerald-500 flex items-center gap-1 text-sm"><CheckCircle2 className="w-4 h-4" /> Salvo</span>}
                  {saveBotStatus === 'error' && <span className="text-red-500 flex items-center gap-1 text-sm"><AlertTriangle className="w-4 h-4" /> Erro</span>}
                </div>
              </div>

              {isLoadingBot ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Limite Diário Global
                    </label>
                    <input
                      type="number"
                      value={botSettings.dailyLimit}
                      onChange={(e) => setBotSettings({ ...botSettings, dailyLimit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-zinc-500">Total de respostas que o bot pode dar por dia para todos os usuários.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Limite Diário por Usuário
                    </label>
                    <input
                      type="number"
                      value={botSettings.userDailyLimit}
                      onChange={(e) => setBotSettings({ ...botSettings, userDailyLimit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-zinc-500">Máximo de perguntas que um único usuário pode fazer por dia.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Limite de Requisições por Minuto (RPM)
                    </label>
                    <input
                      type="number"
                      value={botSettings.rpmLimit}
                      onChange={(e) => setBotSettings({ ...botSettings, rpmLimit: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-zinc-500">Máximo de mensagens por minuto para evitar spam.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status dos Modelos */}
            <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
              <button 
                onClick={() => setIsBotModelsExpanded(!isBotModelsExpanded)}
                className="w-full p-6 flex items-center justify-between bg-zinc-50/50 dark:bg-black/20 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white text-left">Status dos Modelos de IA</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 text-left">Verifique a disponibilidade das APIs do Gemini e Groq.</p>
                </div>
                {isBotModelsExpanded ? <ChevronDown className="w-5 h-5 text-zinc-500" /> : <ChevronRight className="w-5 h-5 text-zinc-500" />}
              </button>
              
              {isBotModelsExpanded && (
                <div className="p-6 border-t border-black/5 dark:border-white/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(botStatuses).map(([model, info]) => (
                      <div key={model} className="bg-zinc-50 dark:bg-[#212121] p-4 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-zinc-900 dark:text-white truncate pr-2" title={model}>{model}</span>
                          {info.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-zinc-400 shrink-0" />}
                          {info.status === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Online" />}
                          {info.status === 'error' && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" title="Offline / Erro" />}
                        </div>
                        {info.status === 'error' && info.reason && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-2 line-clamp-2" title={info.reason}>
                            {info.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={checkBotStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Verificar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logs de Chat */}
            <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Logs de Chat</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Histórico de interações com o bot.</p>
                </div>
                <button
                  onClick={() => {
                    setChatLogsCursors([null]);
                    fetchChatLogs(0);
                  }}
                  className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Atualizar Logs"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                {isLoadingLogs ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-black/20 border-b border-black/5 dark:border-white/5">
                        <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data/Hora</th>
                        <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Usuário</th>
                        <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pergunta</th>
                        <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {chatLogs.map((log) => (
                        <React.Fragment key={log.id}>
                          <tr className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3 px-6 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                {log.userPhotoURL && (
                                  <img src={log.userPhotoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-zinc-900 dark:text-white">{log.username || 'Desconhecido'}</div>
                                  <div className="text-xs text-zinc-500">{log.userEmail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-6 text-sm text-zinc-900 dark:text-white truncate max-w-xs">
                              {log.question}
                            </td>
                            <td className="py-3 px-6 text-right">
                              <button
                                onClick={() => setExpandedChatLogId(expandedChatLogId === log.id ? null : log.id)}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                              >
                                {expandedChatLogId === log.id ? 'Ocultar' : 'Ver Resposta'}
                              </button>
                            </td>
                          </tr>
                          {expandedChatLogId === log.id && (
                            <tr className="bg-zinc-50 dark:bg-black/20">
                              <td colSpan={4} className="py-4 px-6">
                                <div className="space-y-4">
                                  <div>
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Pergunta:</span>
                                    <p className="text-sm text-zinc-900 dark:text-white bg-white dark:bg-[#2f2f2f] p-3 rounded-xl border border-black/5 dark:border-white/5">
                                      {log.question}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Resposta do Bot:</span>
                                    <div className="text-sm text-zinc-900 dark:text-white bg-white dark:bg-[#2f2f2f] p-3 rounded-xl border border-black/5 dark:border-white/5 whitespace-pre-wrap font-mono">
                                      {log.response || <span className="text-zinc-400 italic">Sem resposta registrada.</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {chatLogs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                            Nenhum log encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Página {chatLogsPage + 1}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchChatLogs(chatLogsPage - 1)}
                    disabled={chatLogsPage === 0 || isLoadingLogs}
                    className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => fetchChatLogs(chatLogsPage + 1)}
                    disabled={!hasMoreLogs || isLoadingLogs}
                    className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && isSuperAdmin && (
          <div className="bg-white dark:bg-[#2f2f2f] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Logs de Administração</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Histórico de ações realizadas por administradores.</p>
              </div>
              <button
                onClick={() => {
                  setAdminLogsCursors([null]);
                  fetchAdminLogs(0);
                }}
                className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Atualizar Logs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {isLoadingAdminLogs ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-black/20 border-b border-black/5 dark:border-white/5">
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data/Hora</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Admin</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ação</th>
                      <th className="py-3 px-6 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {adminLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-6 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-6 text-sm font-medium text-zinc-900 dark:text-white">
                          {log.userEmail}
                        </td>
                        <td className="py-3 px-6 text-sm text-zinc-900 dark:text-white">
                          <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-xs">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm text-zinc-600 dark:text-zinc-400">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {adminLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                          Nenhum log encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Página {adminLogsPage + 1}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAdminLogs(adminLogsPage - 1)}
                  disabled={adminLogsPage === 0 || isLoadingAdminLogs}
                  className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => fetchAdminLogs(adminLogsPage + 1)}
                  disabled={!hasMoreAdminLogs || isLoadingAdminLogs}
                  className="px-3 py-1 rounded-lg border border-black/10 dark:border-white/10 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl p-6 max-w-md w-full shadow-xl border border-black/10 dark:border-white/10">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{confirmModal.title}</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl p-6 max-w-md w-full shadow-xl border border-black/10 dark:border-white/10">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Editar Usuário</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cargo
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveUserEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
