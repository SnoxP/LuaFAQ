import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext';
import { ChatProvider } from './context/ChatContext';
import { FaqProvider } from './context/FaqContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <FaqProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </FaqProvider>
    </SettingsProvider>
  </StrictMode>,
);
