import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Download, Clock, AlertCircle, Loader2, Edit } from 'lucide-react';
import { db, doc, getDoc, deleteDoc } from '../firebase';
import DiscordMarkdown from '../components/DiscordMarkdown';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface FixData {
  title: string;
  description: string;
  version: string;
  downloadUrl: string;
  updatedAt: string;
}

export default function FixPage() {
  const [fixData, setFixData] = useState<FixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAdmin } = useFaq();
  const { t } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFixData = async () => {
      try {
        const docRef = doc(db, 'content', 'game_fix');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFixData(docSnap.data() as FixData);
        }
      } catch (error) {
        console.error("Error fetching fix data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFixData();
  }, []);

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta correção?')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'content', 'game_fix'));
      setFixData(null);
    } catch (error) {
      console.error("Error deleting fix:", error);
      alert("Erro ao excluir a correção.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 mb-6 shadow-sm">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-3">{t('fix.title')}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-base">{t('fix.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400 dark:text-zinc-500" />
          </div>
        ) : fixData && fixData.title ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm transition-colors duration-200"
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-black/10 dark:border-white/10 pb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">{fixData.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#212121] px-2.5 py-1 rounded-lg border border-black/5 dark:border-white/5">
                      <Wrench className="w-4 h-4" />
                      {t('fix.version')} {fixData.version}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {t('fix.updatedAt')} {fixData.updatedAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={fixData.downloadUrl || '#'}
                    target={fixData.downloadUrl ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 font-medium rounded-xl transition-colors ${
                      fixData.downloadUrl 
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200' 
                        : 'bg-black/5 dark:bg-white/10 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      if (!fixData.downloadUrl) {
                        e.preventDefault();
                        alert("O link de download ainda não está disponível.");
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    {t('fix.download')}
                  </a>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => navigate('/painel-admin?tab=fix')}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-50 dark:bg-[#212121] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 font-medium rounded-xl border border-black/10 dark:border-white/10 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 font-medium rounded-xl border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="prose prose-zinc dark:prose-invert max-w-none">
                <h3 className="text-base font-medium text-zinc-900 dark:text-white mb-4">Detalhes da Atualização</h3>
                <div className="bg-zinc-50 dark:bg-[#212121] rounded-xl p-5 border border-black/5 dark:border-white/5">
                  <DiscordMarkdown className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {fixData.description}
                  </DiscordMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#2f2f2f] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm transition-colors duration-200">
            <AlertCircle className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">{t('fix.noFix')}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">No momento, não há arquivos de correção publicados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
