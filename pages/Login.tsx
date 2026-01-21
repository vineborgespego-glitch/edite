
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
  // Caminho relativo simples é mais resiliente em ambientes web
  const [logoSrc, setLogoSrc] = useState('logo.png');
  const [hasError, setHasError] = useState(false);

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

  const handleLogoError = () => {
    if (logoSrc === 'logo.png') {
      setLogoSrc('logo.jpg');
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#fffafb] dark:bg-slate-950 transition-colors relative">
      {/* BRANDING NO CANTO OPOSTO AO TOGGLE */}
      <div className="absolute top-6 left-6 flex items-center">
        <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-rose-50 overflow-hidden flex items-center justify-center p-0.5">
          {!hasError ? (
            <img 
              src={logoSrc} 
              alt="Logo" 
              className="w-full h-full object-contain"
              onError={handleLogoError}
            />
          ) : (
            <i className="fa-solid fa-scissors text-rose-500 text-xl"></i>
          )}
        </div>
      </div>

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md mt-12 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Atelier Edite Borges</h1>
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em] mt-1">Gestão de Oficina e Finanças</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">E-mail de Acesso</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <i className="fa-solid fa-envelope text-sm"></i>
              </span>
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Senha</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                <i className="fa-solid fa-lock text-sm"></i>
              </span>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-sm"
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
            className="w-full py-5 bg-rose-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-700 active:scale-95 transition-all shadow-xl shadow-rose-100 dark:shadow-none mt-4 disabled:opacity-50 text-xs"
          >
            {loading ? 'Validando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="mt-10 text-center text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">
          Ainda não tem acesso?{' '}
          <Link to="/register" className="text-rose-600 dark:text-rose-400 font-black hover:underline ml-1">
            Solicitar Cadastro
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
