import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { useFaq } from '../context/FaqContext';
import { useSettings } from '../context/SettingsContext';
import DiscordMarkdown from '../components/DiscordMarkdown';

export default function FaqPage() {
  const { faqData, updateFaqData, isAdmin } = useFaq();
  const { t } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  // Filter categories based on admin status
  const visibleFaqData = useMemo(() => {
    return faqData.filter(category => isAdmin || !category.adminOnly);
  }, [faqData, isAdmin]);

  // Set initial active category when data loads
  useEffect(() => {
    if (visibleFaqData.length > 0 && !activeCategory) {
      setActiveCategory(visibleFaqData[0].id);
    }
  }, [visibleFaqData, activeCategory]);

  const toggleItem = (id: string) => {
    if (editingItemId === id) return; // Prevent collapse while editing
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
  };

  const cancelEditing = () => {
    setEditingItemId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const saveEdit = async (categoryId: string, itemId: string) => {
    const newData = faqData.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: category.items.map(item => 
            item.id === itemId 
              ? { ...item, question: editQuestion, answer: editAnswer }
              : item
          )
        };
      }
      return category;
    });
    
    await updateFaqData(newData);
    setEditingItemId(null);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return visibleFaqData;

    const term = searchTerm.toLowerCase();
    return visibleFaqData.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.question.toLowerCase().includes(term) || 
        item.answer.toLowerCase().includes(term)
      )
    })).filter(category => category.items.length > 0);
  }, [visibleFaqData, searchTerm]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <span key={i} className="bg-white/20 text-white rounded px-1">{part}</span> : part
    );
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white mb-3">{t('faq.title')}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-base">{t('faq.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-12 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#2f2f2f] border border-black/10 dark:border-white/10 rounded-2xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors shadow-sm text-[15px]"
            placeholder={t('faq.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#2f2f2f] rounded-2xl border border-black/10 dark:border-white/10 max-w-2xl mx-auto shadow-sm transition-colors duration-200">
            <AlertCircle className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">{t('faq.noResults')} "{searchTerm}"</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">Tente usar outras palavras-chave ou abra um ticket no Discord.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Categories Sidebar (only show if not searching) */}
            {!searchTerm && (
              <div className="w-full md:w-64 shrink-0">
                <div className="sticky top-8 space-y-1">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-3">Categorias</h3>
                  {visibleFaqData.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors text-sm ${
                        activeCategory === category.id 
                          ? 'bg-white dark:bg-[#2f2f2f] text-zinc-900 dark:text-white font-medium border border-black/10 dark:border-white/10 shadow-sm' 
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      {category.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ Content */}
            <div className="flex-1 space-y-8">
              {filteredData.map(category => {
                if (!searchTerm && category.id !== activeCategory) return null;

                return (
                  <div key={category.id} className="space-y-4">
                    {searchTerm && (
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        {category.title}
                      </h2>
                    )}
                    
                    <div className="space-y-3">
                      {category.items.map(item => {
                        const isExpanded = expandedItems[item.id];
                        const isEditing = editingItemId === item.id;
                        
                        return (
                          <motion.div 
                            key={item.id}
                            initial={false}
                            className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
                              isExpanded ? 'bg-white dark:bg-[#2f2f2f] border-black/20 dark:border-white/20 shadow-sm' : 'bg-white/50 dark:bg-[#2f2f2f]/50 border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
                            }`}
                          >
                            <button
                              onClick={() => toggleItem(item.id)}
                              className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                            >
                              <div className="flex items-center gap-3 pr-4 w-full">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-zinc-50 dark:bg-[#212121] border border-black/20 dark:border-white/20 rounded-lg px-3 py-2 text-zinc-900 dark:text-white font-medium focus:outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors"
                                    placeholder="Pergunta..."
                                  />
                                ) : (
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[15px] break-words">
                                    {searchTerm ? highlightText(item.question, searchTerm) : item.question}
                                  </span>
                                )}
                              </div>
                              {!isEditing && (
                                isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                )
                              )}
                            </button>
                            
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="px-5 pb-5 pt-1 text-zinc-600 dark:text-zinc-300 border-t border-black/5 dark:border-white/5 mt-2">
                                    {isEditing ? (
                                      <div className="pt-3 space-y-4">
                                        <textarea
                                          value={editAnswer}
                                          onChange={(e) => setEditAnswer(e.target.value)}
                                          className="w-full bg-zinc-50 dark:bg-[#212121] border border-black/20 dark:border-white/20 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 text-sm focus:outline-none focus:border-black/40 dark:focus:border-white/40 transition-colors min-h-[200px] resize-y"
                                          placeholder="Resposta (suporta Markdown)..."
                                        />
                                        <div className="flex items-center justify-end gap-3">
                                          <button
                                            onClick={cancelEditing}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#212121] text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/10 dark:border-white/10 text-sm font-medium"
                                          >
                                            <X className="w-4 h-4" />
                                            Cancelar
                                          </button>
                                          <button
                                            onClick={() => saveEdit(category.id, item.id)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
                                          >
                                            <Save className="w-4 h-4" />
                                            Salvar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="pt-3">
                                        <DiscordMarkdown className="text-[15px] leading-relaxed break-words">
                                          {item.answer}
                                        </DiscordMarkdown>
                                        
                                        {isAdmin && (
                                          <div className="mt-6 flex justify-end">
                                            <button
                                              onClick={() => startEditing(item)}
                                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-[#212121] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5 dark:border-white/5 text-sm font-medium"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                              Editar Guia
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
