/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { auth, sendEmailVerification } from './firebase';
import React, { useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import People from './pages/People';
import Chats from './pages/Chats';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import MapPage from './pages/MapPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Avatar from './pages/Avatar';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  if (loading) return <div className="flex h-screen items-center justify-center">Načítání...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (!user.emailVerified) {
    const handleResend = async () => {
      setIsResending(true);
      try {
        await sendEmailVerification(user);
        setMessage('Ověřovací e-mail byl znovu odeslán.');
      } catch (error) {
        setMessage('Chyba při odesílání e-mailu. Zkuste to prosím později.');
      }
      setIsResending(false);
    };

    const handleCheckVerification = async () => {
      await user.reload();
      // Force a re-render by updating some state if needed, or window.location.reload()
      if (user.emailVerified) {
        window.location.reload();
      } else {
        setMessage('E-mail stále není ověřen. Zkontrolujte prosím i složku Spam.');
      }
    };

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-zinc-900 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 text-center border border-zinc-800">
            <h2 className="text-2xl font-bold text-zinc-100 mb-4">Ověřte svůj e-mail</h2>
            <p className="text-zinc-400 mb-6">
              Pro přístup do aplikace musíte ověřit svou e-mailovou adresu. Zkontrolujte prosím svou schránku.
            </p>
            {message && (
              <div className="mb-4 text-sm font-medium text-emerald-400">
                {message}
              </div>
            )}
            <div className="space-y-4">
              <button
                onClick={handleCheckVerification}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-950 bg-emerald-500 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Již jsem e-mail ověřil(a)
              </button>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 transition-colors"
              >
                {isResending ? 'Odesílám...' : 'Znovu odeslat ověřovací e-mail'}
              </button>
              <button
                onClick={() => auth.signOut()}
                className="w-full flex justify-center py-2 px-4 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-zinc-300 bg-transparent hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/people" replace />} />
            <Route path="people" element={<People />} />
            <Route path="chats" element={<Chats />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="map" element={<MapPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="avatar" element={<Avatar />} />
          </Route>
          <Route path="/chat/:chatId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
