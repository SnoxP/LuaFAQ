import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageSquare, ShieldAlert, Home, Settings, Wrench, User as UserIcon, Plus, Heart, Sun, Moon, Globe, Trash2, PanelLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '../context/ChatContext';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useFaq();
  const { theme, setTheme, language, toggleLanguage, t } = useSettings();
  const { sessions, currentSessionId, loadSession, deleteSession, startNewSession, isSidebarOpen, setIsSidebarOpen } = useChat();

  const navLinks = [
    { name: t('nav.home'), path: '/', icon: <Home className="w-5 h-5 mr-3" /> },
    { name: t('nav.faq'), path: '/faq', icon: <MessageSquare className="w-5 h-5 mr-3" /> },
    { name: t('nav.fix'), path: '/fix', icon: <Wrench className="w-5 h-5 mr-3" /> },
    { name: t('nav.donate'), path: '/donate', icon: <Heart className="w-5 h-5 mr-3" /> },
  ];

  if (user) {
    if (isAdmin) {
      navLinks.push({ name: t('nav.admin'), path: '/painel-admin', icon: <Settings className="w-5 h-5 mr-3" /> });
    } else {
      navLinks.push({ 
        name: t('nav.profile'), 
        path: '/perfil', 
        icon: user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full mr-3" />
        ) : (
          <UserIcon className="w-5 h-5 mr-3" />
        )
      });
    }
  } else {
    navLinks.push({ name: t('nav.login'), path: '/login', icon: <UserIcon className="w-5 h-5 mr-3" /> });
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-white dark:bg-[#212121] flex items-center justify-between px-4 z-50 border-b border-black/10 dark:border-white/10 transition-colors duration-200">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-medium text-zinc-900 dark:text-zinc-200">LuaTools</span>
        <div className="w-6"></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-[#171717] border-r border-black/10 dark:border-transparent flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${!isMobileMenuOpen && !isSidebarOpen ? 'md:w-0 md:overflow-hidden md:border-none' : 'md:w-64'}`}
      >
        <div className="p-3 flex items-center justify-between">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group flex-1"
          >
            <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <img src="https://i.ibb.co/3YkVfchM/image-1.png" alt="LuaTools Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition-colors">LuaTools</span>
          </Link>
          <div className="flex items-center gap-1">
            {user && (
              <button 
                onClick={() => { startNewSession(); navigate('/'); setIsMobileMenuOpen(false); }} 
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                title={t('home.newChat')}
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="hidden md:block p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              title="Fechar barra lateral"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="py-2 px-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </div>

        {user && (
          <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 border-t border-black/10 dark:border-white/10">
            {sessions.map(session => (
              <div key={session.id} className="group relative flex items-center">
                <button
                  onClick={() => { loadSession(session.id); navigate('/'); setIsMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left truncate ${
                    currentSessionId === session.id && location.pathname === '/'
                      ? 'bg-black/10 dark:bg-white/10 text-zinc-900 dark:text-white font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{session.title}</span>
                </button>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="absolute right-2 p-1.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                  title="Excluir chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-black/10 dark:border-white/10 space-y-1">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <Globe className="w-5 h-5 mr-3" />
            {language === 'pt-BR' ? 'English' : 'Português'}
          </button>
          <button
            onClick={() => {
              if (theme === 'light') setTheme('dark');
              else if (theme === 'dark') setTheme('system');
              else setTheme('light');
            }}
            className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            {theme === 'dark' ? <Moon className="w-5 h-5 mr-3" /> : theme === 'light' ? <Sun className="w-5 h-5 mr-3" /> : <Settings className="w-5 h-5 mr-3" />}
            {theme === 'dark' ? t('theme.dark') : theme === 'light' ? t('theme.light') : t('theme.system')}
          </button>
          <a
            href="https://ptb.discord.com/channels/1408201417834893385/1464812261611933839"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Discord
          </a>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative w-full min-w-0 pt-12 md:pt-0">
        {!isSidebarOpen && (
          <div className="hidden md:block absolute top-4 left-4 z-10">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-lg shadow-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Abrir barra lateral">
              <PanelLeft className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
