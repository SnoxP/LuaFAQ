import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import { User as UserIcon, LogOut, Save, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { db, doc, getDoc, setDoc } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, isAdmin, isAuthReady, logout } = useFaq();
  const { t } = useSettings();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isAuthReady && !user) {
      navigate('/painel-admin');
    }
  }, [user, isAuthReady, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.username) setUsername(data.username);
          if (data.discordId) setDiscordId(data.discordId);
          if (data.bio) setBio(data.bio);
        } else {
          setDiscordId(user.discordId);
          setUsername(user.username);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        username: username,
        discordId: discordId,
        bio: bio
      }, { merge: true });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#212121]">
        <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200"
        >
          <div className="bg-white dark:bg-[#2f2f2f] px-6 sm:px-8 py-6 border-b border-black/10 dark:border-white/10 flex items-center justify-between transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-zinc-50 dark:bg-[#212121] rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 p-2 text-zinc-600 dark:text-zinc-300" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">{t('profile.title')}</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">{t('profile.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-zinc-50 dark:bg-[#212121] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white transition-colors border border-black/10 dark:border-white/10"
            >
              <LogOut className="w-4 h-4" />
              {t('profile.logout')}
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">Discord ID</label>
                <input
                  type="text"
                  value={discordId || user.uid}
                  disabled
                  className="w-full bg-zinc-50 dark:bg-[#212121]/50 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed text-[15px] font-mono"
                />
                <p className="text-xs text-zinc-500 mt-2">O seu identificador único do Discord.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('profile.name')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors text-[15px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('profile.discordId')}</label>
                <input
                  type="text"
                  value={discordId}
                  disabled
                  className="w-full bg-zinc-50 dark:bg-[#212121]/50 border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-zinc-500 cursor-not-allowed text-[15px]"
                />
                <p className="text-xs text-zinc-500 mt-2">O ID do Discord não pode ser alterado.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('profile.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  className="w-full bg-white dark:bg-[#212121] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors resize-none text-[15px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">{t('profile.role')}</label>
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-[#212121] text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5">
                  {isAdmin ? t('profile.admin') : t('profile.member')}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-black/10 dark:border-white/10 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors ${
                  saveStatus === 'success' ? 'bg-emerald-600 text-white' :
                  saveStatus === 'error' ? 'bg-red-600 text-white' :
                  'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                }`}
              >
                {saveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                 saveStatus === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                 <Save className="w-4 h-4" />}
                {saveStatus === 'saving' ? t('profile.saving') :
                 saveStatus === 'success' ? t('profile.success') :
                 saveStatus === 'error' ? t('profile.error') :
                 t('profile.save')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
