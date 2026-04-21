import React, { useEffect } from 'react';
import { useFaq } from '../context/FaqContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, user, isAuthReady } = useFaq();

  useEffect(() => {
    if (isAuthReady) {
      if (!user) {
        login();
      } else {
        window.location.href = '/';
      }
    }
  }, [isAuthReady, user, login]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-white">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-4" />
      <p className="font-medium">Redirecionando para o login do Discord...</p>
    </div>
  );
}
