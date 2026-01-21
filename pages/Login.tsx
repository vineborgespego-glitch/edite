
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../App';
import ThemeToggle from '../ThemeToggle';

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

      if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
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
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white dark:bg-slate-950 transition-colors relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <i className="fa-solid fa-wallet text-white text-3xl"></i>
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-1">Atelier Edite Borges</h1>
        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-center mb-8 uppercase tracking-widest tracking-widest">Gestão de Oficina e Finanças</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <i className="fa-solid fa-envelope text-sm"></i>
              </span>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-[10px] text-center font-black uppercase">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 dark:shadow-none mt-2 disabled:opacity-50"
          >
            {loading ? 'Sincronizando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-xs font-medium">
          Ainda não tem acesso?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline">
            Solicitar Cadastro
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
