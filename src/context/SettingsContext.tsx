import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Language = 'pt-BR' | 'en';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const translations = {
  'pt-BR': {
    'nav.home': 'Início',
    'nav.faq': 'FAQ',
    'nav.fix': 'Fix',
    'nav.donate': 'Doar',
    'nav.admin': 'Painel Admin',
    'nav.profile': 'Meu Perfil',
    'nav.login': 'Entrar',
    'nav.logout': 'Sair',
    'theme.light': 'Claro',
    'theme.dark': 'Escuro',
    'theme.system': 'Sistema',
    'lang.toggle': 'Mudar Idioma',
    'home.title': 'Como posso ajudar?',
    'home.placeholder': 'Faça sua pergunta sobre os scripts...',
    'home.loginRequired': 'Você precisa estar logado para usar o chat.',
    'home.loginButton': 'Fazer Login Com O Discord',
    'home.newChat': 'Novo Chat',
    'home.dailyLimit': 'Limite diário atingido',
    'home.rateLimit': 'Muitas requisições. Aguarde um momento.',
    'home.welcome': 'Olá! 👋 Sou o assistente virtual do LuaTools. Como posso te ajudar hoje? (Lembrando que minhas respostas são baseadas no nosso FAQ oficial, ok?)',
    'home.footer': 'O assistente pode cometer erros. Considere verificar informações importantes no',
    'faq.title': 'Central de Ajuda',
    'faq.subtitle': 'Encontre soluções rápidas para os problemas mais comuns.',
    'faq.search': 'Buscar nas perguntas frequentes...',
    'faq.noResults': 'Nenhum resultado encontrado para',
    'fix.title': 'Correção do Jogo',
    'fix.subtitle': 'Baixe a versão mais recente do arquivo de correção para garantir que o jogo funcione perfeitamente.',
    'fix.version': 'Versão',
    'fix.updatedAt': 'Atualizado em:',
    'fix.download': 'Baixar Correção',
    'fix.noFix': 'Nenhuma correção disponível no momento.',
    'donate.title': 'Apoie o Projeto',
    'donate.subtitle': 'Sua doação ajuda a manter os servidores online e o desenvolvimento contínuo de novas ferramentas.',
    'donate.pix': 'Chave PIX (E-mail)',
    'donate.copy': 'Copiar Chave PIX',
    'donate.copied': 'Copiado!',
    'donate.amount': 'Valor da Doação (R$)',
    'donate.minAmount': 'O valor mínimo é R$ 1,00',
    'donate.copyPaste': 'Pix Copia e Cola',
    'donate.thanks': 'Qualquer valor é muito bem-vindo e ajuda a manter o projeto vivo!',
    'profile.title': 'Meu Perfil',
    'profile.subtitle': 'Gerencie suas informações pessoais',
    'profile.name': 'Nome de Usuário',
    'profile.email': 'E-mail',
    'profile.discordId': 'ID do Discord',
    'profile.bio': 'Biografia',
    'profile.role': 'Cargo',
    'profile.admin': 'Administrador',
    'profile.member': 'Membro',
    'profile.save': 'Salvar Alterações',
    'profile.saving': 'Salvando...',
    'profile.success': 'Salvo com sucesso!',
    'profile.error': 'Erro ao salvar',
    'profile.logout': 'Sair da Conta',
    'admin.title': 'Painel de Administração',
    'admin.subtitle': 'Gerencie o conteúdo e configurações do site',
    'admin.tabFaq': 'Gerenciar FAQ',
    'admin.tabUsers': 'Usuários',
    'admin.tabFix': 'Correções',
    'admin.tabBot': 'Config. do Bot',
    'admin.save': 'Salvar Alterações',
    'admin.saving': 'Salvando...',
    'admin.success': 'Salvo!',
    'admin.error': 'Erro',
    'admin.reset': 'Restaurar Padrão',
    'admin.addCategory': 'Adicionar Categoria',
    'admin.addQuestion': 'Adicionar Pergunta',
    'admin.categoryTitle': 'Título da Categoria',
    'admin.categoryDesc': 'Descrição (opcional)',
    'admin.adminOnly': 'Apenas para Administradores',
    'admin.question': 'Pergunta',
    'admin.answer': 'Resposta (suporta Markdown)',
    'admin.deleteCategory': 'Excluir Categoria',
    'admin.deleteQuestion': 'Excluir',
    'admin.confirmTitle': 'Confirmar Ação',
    'admin.confirmCancel': 'Cancelar',
    'admin.confirmConfirm': 'Confirmar',
    'admin.loginTitle': 'Acesso Restrito',
    'admin.signupTitle': 'Criar Conta',
    'admin.loginSubtitle': 'Área exclusiva para administradores do LuaTools.',
    'admin.loginHelper': 'Caso seja cargo Helper ou +, contate o SnoxP718 para adicioná-lo ao site.',
    'admin.email': 'E-mail',
    'admin.password': 'Senha',
    'admin.loginBtn': 'Entrar',
    'admin.signupBtn': 'Criar Conta',
    'admin.noAccount': 'Não tem uma conta? Criar agora',
    'admin.hasAccount': 'Já tem uma conta? Entrar',
    'admin.accessDenied': 'Acesso Negado',
    'admin.accessDeniedMsg': 'Sua conta ({email}) não tem permissão de administrador.',
    'admin.goToProfile': 'Ir para o Meu Perfil',
    'admin.logoutTryOther': 'Sair e tentar outra conta',
    'admin.manageUsers': 'Gerenciar Usuários',
    'admin.status': 'Status',
    'admin.actions': 'Ações',
    'admin.online': 'Online',
    'admin.offline': 'Offline',
    'admin.removeAdmin': 'Remover Admin',
    'admin.makeAdmin': 'Tornar Admin',
    'admin.noUsers': 'Nenhum usuário encontrado.',
    'admin.manageFix': 'Gerenciar Fix',
    'admin.saveFix': 'Salvar Fix',
    'admin.fileHosting': 'Hospedagem de Arquivos',
    'admin.fileHostingDesc': 'Você pode fazer o upload do arquivo diretamente aqui. Ele será hospedado anonimamente e de forma gratuita via Gofile.io (sem limite de tamanho, suporta CORS). Arraste o arquivo para a área abaixo ou clique para selecionar.',
    'admin.dragFile': 'Arraste o arquivo do Fix aqui',
    'admin.orClick': 'ou clique para procurar no seu computador',
    'admin.uploading': 'Enviando...',
    'admin.fixTitle': 'Título da Correção',
    'admin.fixTitlePlaceholder': 'Ex: Correção de Bugs v1.2.0',
    'admin.fixVersion': 'Versão',
    'admin.fixVersionPlaceholder': 'Ex: 1.2.0',
    'admin.fixLink': 'Link de Download',
    'admin.fixLinkPlaceholder': 'https://...',
    'admin.fixDesc': 'Descrição',
    'admin.fixDescPlaceholder': 'O que há de novo nesta versão?',
    'admin.botSettings': 'Configurações do Bot (IA)',
    'admin.saveSettings': 'Salvar Configurações',
    'admin.botStatus': 'Status do Bot',
    'admin.botStatusDesc': 'Verifica se a API do Gemini está respondendo corretamente.',
    'admin.botError': 'Erro:',
    'admin.botChecking': 'Verificando...',
    'admin.botOnline': 'Operacional',
    'admin.botApiError': 'Erro na API',
    'admin.botTestAgain': 'Testar Novamente',
    'admin.dailyUsage': 'Uso Diário',
    'admin.dailyUsageDesc': 'Quantidade de mensagens respondidas pelo bot hoje.',
    'admin.lastReset': 'Último reset:',
    'admin.never': 'Nunca',
    'admin.chatLogs': 'Log de Mensagens',
    'admin.chatLogsDesc': 'Últimas perguntas feitas ao bot.',
    'admin.noLogs': 'Nenhum log encontrado.',
    'admin.globalLimit': 'Limite Diário de Mensagens (Global)',
    'admin.globalLimitDesc': 'Define o número máximo de perguntas que o bot pode responder por dia para todos os usuários somados.',
    'admin.userLimit': 'Cota Diária por Usuário',
    'admin.userLimitDesc': 'Define quantas perguntas cada usuário individual pode fazer por dia (controlado via navegador).',
    'admin.rpmLimit': 'Requisições por Minuto (RPM)',
    'admin.rpmLimitDesc': 'Define quantas perguntas o usuário pode fazer por minuto (evita spam rápido).',
    'admin.cancel': 'Cancelar',
    'admin.confirm': 'Confirmar',
  },
  'en': {
    'nav.home': 'Home',
    'nav.faq': 'FAQ',
    'nav.fix': 'Fix',
    'nav.donate': 'Donate',
    'nav.admin': 'Admin Panel',
    'nav.profile': 'My Profile',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'lang.toggle': 'Change Language',
    'home.title': 'How can I help?',
    'home.placeholder': 'Ask your question about the scripts...',
    'home.loginRequired': 'You need to be logged in to use the chat.',
    'home.loginButton': 'Login With Discord',
    'home.newChat': 'New Chat',
    'home.dailyLimit': 'Daily limit reached',
    'home.rateLimit': 'Too many requests. Please wait a moment.',
    'home.welcome': 'Hello! 👋 I am the LuaTools virtual assistant. How can I help you today? (Remember that my answers are based on our official FAQ, ok?)',
    'home.footer': 'The assistant can make mistakes. Consider verifying important information on',
    'faq.title': 'Help Center',
    'faq.subtitle': 'Find quick solutions to the most common problems.',
    'faq.search': 'Search frequently asked questions...',
    'faq.noResults': 'No results found for',
    'fix.title': 'Game Fix',
    'fix.subtitle': 'Download the latest version of the fix file to ensure the game works perfectly.',
    'fix.version': 'Version',
    'fix.updatedAt': 'Updated at:',
    'fix.download': 'Download Fix',
    'fix.noFix': 'No fix available at the moment.',
    'donate.title': 'Support the Project',
    'donate.subtitle': 'Your donation helps keep the servers online and the continuous development of new tools.',
    'donate.pix': 'PIX Key (Email)',
    'donate.copy': 'Copy PIX Key',
    'donate.copied': 'Copied!',
    'donate.amount': 'Donation Amount (R$)',
    'donate.minAmount': 'The minimum amount is R$ 1.00',
    'donate.copyPaste': 'Pix Copy and Paste',
    'donate.thanks': 'Any amount is very welcome and helps keep the project alive!',
    'profile.title': 'My Profile',
    'profile.subtitle': 'Manage your personal information',
    'profile.name': 'Username',
    'profile.email': 'Email',
    'profile.discordId': 'Discord ID',
    'profile.bio': 'Bio',
    'profile.role': 'Role',
    'profile.admin': 'Administrator',
    'profile.member': 'Member',
    'profile.save': 'Save Changes',
    'profile.saving': 'Saving...',
    'profile.success': 'Saved successfully!',
    'profile.error': 'Error saving',
    'profile.logout': 'Logout',
    'admin.title': 'Admin Panel',
    'admin.subtitle': 'Manage site content and settings',
    'admin.tabFaq': 'Manage FAQ',
    'admin.tabUsers': 'Users',
    'admin.tabFix': 'Fixes',
    'admin.tabBot': 'Bot Settings',
    'admin.save': 'Save Changes',
    'admin.saving': 'Saving...',
    'admin.success': 'Saved!',
    'admin.error': 'Error',
    'admin.reset': 'Reset to Default',
    'admin.addCategory': 'Add Category',
    'admin.addQuestion': 'Add Question',
    'admin.categoryTitle': 'Category Title',
    'admin.categoryDesc': 'Description (optional)',
    'admin.adminOnly': 'Admin Only',
    'admin.question': 'Question',
    'admin.answer': 'Answer (supports Markdown)',
    'admin.deleteCategory': 'Delete Category',
    'admin.deleteQuestion': 'Delete',
    'admin.confirmTitle': 'Confirm Action',
    'admin.confirmCancel': 'Cancel',
    'admin.confirmConfirm': 'Confirm',
    'admin.loginTitle': 'Restricted Access',
    'admin.signupTitle': 'Create Account',
    'admin.loginSubtitle': 'Exclusive area for LuaTools administrators.',
    'admin.loginHelper': 'If you are Helper role or +, contact SnoxP718 to add you to the site.',
    'admin.email': 'Email',
    'admin.password': 'Password',
    'admin.loginBtn': 'Login',
    'admin.signupBtn': 'Create Account',
    'admin.noAccount': 'Don\'t have an account? Create now',
    'admin.hasAccount': 'Already have an account? Login',
    'admin.accessDenied': 'Access Denied',
    'admin.accessDeniedMsg': 'Your account ({email}) does not have administrator permission.',
    'admin.goToProfile': 'Go to My Profile',
    'admin.logoutTryOther': 'Logout and try another account',
    'admin.manageUsers': 'Manage Users',
    'admin.status': 'Status',
    'admin.actions': 'Actions',
    'admin.online': 'Online',
    'admin.offline': 'Offline',
    'admin.removeAdmin': 'Remove Admin',
    'admin.makeAdmin': 'Make Admin',
    'admin.noUsers': 'No users found.',
    'admin.manageFix': 'Manage Fix',
    'admin.saveFix': 'Save Fix',
    'admin.fileHosting': 'File Hosting',
    'admin.fileHostingDesc': 'You can upload the file directly here. It will be hosted anonymously and for free via Gofile.io (no size limit, supports CORS). Drag the file to the area below or click to select.',
    'admin.dragFile': 'Drag the Fix file here',
    'admin.orClick': 'or click to browse your computer',
    'admin.uploading': 'Uploading...',
    'admin.fixTitle': 'Fix Title',
    'admin.fixTitlePlaceholder': 'Ex: Bug Fixes v1.2.0',
    'admin.fixVersion': 'Version',
    'admin.fixVersionPlaceholder': 'Ex: 1.2.0',
    'admin.fixLink': 'Download Link',
    'admin.fixLinkPlaceholder': 'https://...',
    'admin.fixDesc': 'Description',
    'admin.fixDescPlaceholder': 'What\'s new in this version?',
    'admin.botSettings': 'Bot Settings (AI)',
    'admin.saveSettings': 'Save Settings',
    'admin.botStatus': 'Bot Status',
    'admin.botStatusDesc': 'Checks if the Gemini API is responding correctly.',
    'admin.botError': 'Error:',
    'admin.botChecking': 'Checking...',
    'admin.botOnline': 'Operational',
    'admin.botApiError': 'API Error',
    'admin.botTestAgain': 'Test Again',
    'admin.dailyUsage': 'Daily Usage',
    'admin.dailyUsageDesc': 'Number of messages answered by the bot today.',
    'admin.lastReset': 'Last reset:',
    'admin.never': 'Never',
    'admin.chatLogs': 'Chat Logs',
    'admin.chatLogsDesc': 'Latest questions asked to the bot.',
    'admin.noLogs': 'No logs found.',
    'admin.globalLimit': 'Daily Message Limit (Global)',
    'admin.globalLimitDesc': 'Sets the maximum number of questions the bot can answer per day for all users combined.',
    'admin.userLimit': 'Daily Quota per User',
    'admin.userLimitDesc': 'Sets how many questions each individual user can ask per day (controlled via browser).',
    'admin.rpmLimit': 'Requests per Minute (RPM)',
    'admin.rpmLimitDesc': 'Sets how many questions the user can ask per minute (prevents fast spam).',
    'admin.cancel': 'Cancel',
    'admin.confirm': 'Confirm',
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'pt-BR' || saved === 'en') return saved;
    return navigator.language.startsWith('en') ? 'en' : 'pt-BR';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    const applyTheme = (currentTheme: Theme) => {
      const isDark = 
        currentTheme === 'dark' || 
        (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'pt-BR' ? 'en' : 'pt-BR');
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, toggleLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
