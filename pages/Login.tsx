
import React, { useState } from 'react';
// Fixed: Using namespace import and destructuring to bypass environment type resolution errors for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { User } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../App';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const targetUrl = `${SUPABASE_URL}/users?email=eq.${encodeURIComponent(email.trim())}`;
      const response = await fetch(targetUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const users = await response.json();

      if (Array.isArray(users) && users.length > 0) {
        const dbUser = users[0];
        if (String(dbUser.senha_hash) === password.trim()) {
          onLogin(dbUser);
        } else {
          setError('Senha incorreta.');
        }
      } else {
        setError('E-mail não encontrado.');
      }
    } catch (err: any) {
      setError(`Erro de conexão.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#fffafb] dark:bg-slate-950 transition-colors relative">
      {/* BRANDING - APENAS TEXTO */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div className="text-left">
          <p className="text-[12px] font-black text-rose-600 uppercase tracking-tighter leading-none">Atelier</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Edite Borges</p>
        </div>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md text-center mt-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Login</h1>
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-[0.3em] mt-2">Acesso ao Sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">E-mail cadastrado</label>
            <input
              type="email"
              required
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Senha de acesso</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-100 dark:shadow-none mt-4 text-xs"
          >
            {loading ? 'Verificando...' : 'Entrar no Atelier'}
          </button>
        </form>

        <p className="mt-10 text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest">
          Não tem conta? <Link to="/register" className="text-rose-600 font-black hover:underline ml-1">Clique aqui</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
