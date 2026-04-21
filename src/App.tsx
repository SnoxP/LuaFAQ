import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import FaqPage from './pages/FaqPage';
import FixPage from './pages/FixPage';
import DonatePage from './pages/DonatePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import DiscordCallback from './pages/DiscordCallback';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="fix" element={<FixPage />} />
            <Route path="donate" element={<DonatePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="painel-admin" element={<AdminPage />} />
            <Route path="auth/discord/callback" element={<DiscordCallback />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
