import React, { createContext, useContext, useState, useEffect } from 'react';
import { FaqCategory, defaultFaq } from '../data/defaultFaq';
import { db, auth, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, increment } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: localStorage.getItem('discord_user') ? JSON.parse(localStorage.getItem('discord_user')!).uid : null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface CustomUser {
  uid: string;
  email: string;
  username: string;
  photoURL: string;
  discordId: string;
}

interface FaqContextType {
  faqData: FaqCategory[];
  updateFaqData: (newData: FaqCategory[]) => Promise<void>;
  resetToDefault: () => Promise<void>;
  user: CustomUser | null;
  userData: any | null;
  isAdmin: boolean;
  isAuthReady: boolean;
  isMaintenanceMode: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
}

const FaqContext = createContext<FaqContextType | undefined>(undefined);

export const FaqProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [faqData, setFaqData] = useState<FaqCategory[]>([]);
  const [user, setUser] = useState<CustomUser | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Maintenance Mode Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'content', 'system_settings'), (docSnap) => {
      if (docSnap.exists()) {
        setIsMaintenanceMode(docSnap.data().maintenanceMode === true);
      } else {
        setIsMaintenanceMode(false);
      }
    }, (error) => {
      console.error("Error fetching system settings:", error);
    });
    return () => unsubscribe();
  }, []);

  // Auth Listener
  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;

    const storedUser = localStorage.getItem('discord_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as CustomUser;
        setUser(parsedUser);
        
        const isMainAdmin = parsedUser.discordId === '542832142745337867' || parsedUser.email === 'pedronobreneto27@gmail.com';
        
        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            // If not signed in to Firebase, sign in anonymously
            try {
              await signInAnonymously(auth);
            } catch (err) {
              console.error("Failed to sign in anonymously", err);
              setIsAdmin(isMainAdmin);
              setIsAuthReady(true);
            }
            return; // Wait for the next onAuthStateChanged trigger
          }

          // Migrate existing users who have Discord ID as uid
          let currentUid = parsedUser.uid;
          if (currentUid !== firebaseUser.uid) {
            currentUid = firebaseUser.uid;
            const updatedUser = { ...parsedUser, uid: currentUid };
            localStorage.setItem('discord_user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          }

          // Now we are authenticated in Firebase
          try {
            unsubscribeUser = onSnapshot(doc(db, 'users', currentUid), async (userDoc) => {
              if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.isBanned) {
                  localStorage.removeItem('discord_user');
                  setUser(null);
                  setUserData(null);
                  setIsAdmin(false);
                  setIsAuthReady(true);
                  alert("Sua conta foi banida. Entre em contato com o administrador.");
                  return;
                }
                
                setUserData(data);
                setIsAdmin(data.role === 'admin' || isMainAdmin);
              } else {
                // Document doesn't exist, try to create it
                try {
                  await setDoc(doc(db, 'users', currentUid), {
                    email: parsedUser.email,
                    username: parsedUser.username,
                    discordId: parsedUser.discordId,
                    photoURL: parsedUser.photoURL,
                    role: isMainAdmin ? 'admin' : 'user',
                    isOnline: true,
                    lastActive: Date.now(),
                    createdAt: Date.now()
                  });
                } catch (e) {
                  console.error("Failed to create missing user document", e);
                }
                
                setUserData(null);
                setIsAdmin(isMainAdmin);
              }
              setIsAuthReady(true);
            }, (error) => {
              console.error("Error listening to user doc:", error);
              // If permission denied, still allow them to use the app as logged in locally
              setIsAdmin(isMainAdmin);
              setIsAuthReady(true);
            });
          } catch (e) {
            console.error("Firestore error:", e);
            setIsAdmin(isMainAdmin);
            setIsAuthReady(true);
          }
        });
      } catch (e) {
        console.error("Error parsing stored user", e);
        localStorage.removeItem('discord_user');
        setIsAuthReady(true);
      }
    } else {
      setIsAuthReady(true);
    }

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // Analytics Tracker
  useEffect(() => {
    const trackVisit = async () => {
      const today = new Date().toISOString().split('T')[0];
      const visitKey = `visited_${today}`;
      
      if (!sessionStorage.getItem(visitKey)) {
        try {
          await setDoc(doc(db, 'analytics', today), {
            visits: increment(1)
          }, { merge: true });
          sessionStorage.setItem(visitKey, 'true');
        } catch (err) {
          console.error("Error tracking visit", err);
        }
      }
    };
    trackVisit();
  }, []);

  useEffect(() => {
    if (user) {
      const trackLogin = async () => {
        const today = new Date().toISOString().split('T')[0];
        const loginKey = `logged_in_${today}_${user.uid}`;
        
        if (!sessionStorage.getItem(loginKey)) {
          try {
            await setDoc(doc(db, 'analytics', today), {
              logins: increment(1)
            }, { merge: true });
            sessionStorage.setItem(loginKey, 'true');
          } catch (err) {
            console.error("Error tracking login", err);
          }
        }
      };
      trackLogin();
    }
  }, [user]);

  // Presence Tracker
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    
    const setOnline = async () => {
      try {
        await setDoc(userRef, { 
          isOnline: true, 
          lastActive: Date.now()
        }, { merge: true });
      } catch (error) {
        console.error("Error setting online status", error);
      }
    };

    setOnline();

    const interval = setInterval(() => {
      setDoc(userRef, { lastActive: Date.now() }, { merge: true }).catch(console.error);
    }, 60000);

    const handleBeforeUnload = () => {
      setDoc(userRef, { isOnline: false, lastActive: Date.now() }, { merge: true }).catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setDoc(userRef, { isOnline: false, lastActive: Date.now() }, { merge: true }).catch(console.error);
    };
  }, [user]);

  // Data Listener
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubscribe = onSnapshot(collection(db, 'faq'), (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, we can optionally seed it or just use local default
        setFaqData(defaultFaq);
      } else {
        const data = snapshot.docs.map(doc => doc.data() as FaqCategory);
        setFaqData(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'faq');
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const updateFaqData = async (newData: FaqCategory[]) => {
    if (!isAdmin) throw new Error("Unauthorized");
    
    try {
      // Get current docs to find what needs to be deleted
      const snapshot = await getDocs(collection(db, 'faq'));
      const currentIds = snapshot.docs.map(d => d.id);
      const newIds = newData.map(d => d.id);
      
      // Delete removed categories
      for (const id of currentIds) {
        if (!newIds.includes(id)) {
          await deleteDoc(doc(db, 'faq', id));
        }
      }
      
      // Add/Update categories
      for (const category of newData) {
        await setDoc(doc(db, 'faq', category.id), category);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'faq');
    }
  };

  const resetToDefault = async () => {
    if (!isAdmin) throw new Error("Unauthorized");
    await updateFaqData(defaultFaq);
  };

  const login = async () => {
    const clientId = (import.meta as any).env.VITE_DISCORD_CLIENT_ID;
    if (!clientId) {
      alert("Erro: VITE_DISCORD_CLIENT_ID não está configurado nas variáveis de ambiente da Vercel.");
      return;
    }
    const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20email`;
    window.location.href = url;
  };

  const signup = async () => {
    return login();
  };

  const logout = async () => {
    if (user) {
      try {
        const logId = `log_${Date.now()}`;
        await setDoc(doc(db, 'admin_logs', logId), {
          action: 'logout',
          details: `Usuário saiu: ${userData?.username || 'Desconhecido'} (${userData?.discordId || user.uid})`,
          userEmail: user.uid,
          timestamp: Date.now()
        });
      } catch (logErr) {
        console.error("Failed to log logout action", logErr);
      }
    }
    localStorage.removeItem('discord_user');
    setUser(null);
    setUserData(null);
    setIsAdmin(false);
    window.location.href = '/';
  };

  return (
    <FaqContext.Provider value={{ faqData, updateFaqData, resetToDefault, user, userData, isAdmin, isAuthReady, isMaintenanceMode, login, signup, logout }}>
      {children}
    </FaqContext.Provider>
  );
};

export const useFaq = () => {
  const context = useContext(FaqContext);
  if (context === undefined) {
    throw new Error('useFaq must be used within a FaqProvider');
  }
  return context;
};
