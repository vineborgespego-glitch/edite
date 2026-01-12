
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../App';

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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
            <i className="fa-solid fa-wallet text-white text-3xl"></i>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">IAFinanceCRM</h1>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 italic">Banco de Dados Supabase Online</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fa-solid fa-envelope"></i>
              </span>
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-xs text-center font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 dark:shadow-none mt-2 disabled:bg-indigo-300"
          >
            {loading ? 'Consultando Banco...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Criar agora
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
