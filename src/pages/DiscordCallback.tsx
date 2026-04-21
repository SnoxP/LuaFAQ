import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

export default function DiscordCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError('Nenhum token encontrado na URL. O login foi cancelado ou falhou.');
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (!accessToken) {
      setError('Token de acesso não encontrado.');
      return;
    }

    // Buscar dados do usuário no Discord
    fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar dados do Discord');
        return res.json();
      })
      .then(async (data) => {
        const avatarUrl = data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discriminator || '0') % 5}.png`;

        try {
          // Sign in anonymously to Firebase to get a UID for Firestore rules
          const userCredential = await signInAnonymously(auth);
          const firebaseUid = userCredential.user.uid;

          const userData = {
            uid: firebaseUid, // Use Firebase UID for Firestore
            email: data.email,
            username: data.username || data.global_name,
            photoURL: avatarUrl,
            discordId: data.id,
          };

          localStorage.setItem('discord_user', JSON.stringify(userData));
          
          // Log the login action
          try {
            const { db, doc, setDoc } = await import('../firebase');
            const logId = `log_${Date.now()}`;
            await setDoc(doc(db, 'admin_logs', logId), {
              action: 'login',
              details: `Usuário entrou: ${userData.username} (${userData.discordId})`,
              userEmail: firebaseUid,
              timestamp: Date.now()
            });
          } catch (logErr) {
            console.error("Failed to log login action", logErr);
          }

          window.location.href = '/'; // Força o reload para o contexto pegar os dados atualizados
        } catch (firebaseErr: any) {
          console.error("Firebase Auth Error:", firebaseErr);
          if (firebaseErr.code === 'auth/admin-restricted-operation' || firebaseErr.code === 'auth/operation-not-allowed') {
            setError("Para usar o login com Discord, você precisa ativar o 'Anônimo' (Anonymous) nos provedores de login do Firebase Authentication no console do Firebase.");
          } else {
            setError("Erro ao autenticar no banco de dados: " + firebaseErr.message);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-white">
        <h2 className="text-xl font-bold text-red-500 mb-4">Erro no Login</h2>
        <p className="mb-6">{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-medium"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#212121] text-zinc-900 dark:text-white">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mb-4" />
      <p className="font-medium">Autenticando com o Discord...</p>
    </div>
  );
}
