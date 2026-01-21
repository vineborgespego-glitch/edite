
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import ThemeToggle from '../ThemeToggle';

interface SelectionProps {
  user: User;
  onLogout: () => void;
}

const Selection: React.FC<SelectionProps> = ({ user, onLogout }) => {
  const [logoSrc, setLogoSrc] = useState(`/logo.png?t=${new Date().getTime()}`);
  const [hasError, setHasError] = useState(false);

  const handleLogoError = () => {
    if (logoSrc.includes('logo.png')) setLogoSrc(`/logo.jpg?t=${new Date().getTime()}`);
    else setHasError(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#fffafb] dark:bg-slate-950 transition-colors relative">
      {/* HEADER SUPERIOR */}
      <div className="absolute top-6 left-6 flex items-center">
        <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-rose-50 overflow-hidden flex items-center justify-center p-0.5">
          {!hasError ? (
            <img 
              src={logoSrc} 
              alt="Atelier Logo" 
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

      <div className="w-full max-w-4xl mt-12">
        <header className="flex flex-col items-center mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Painel de Controle</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium italic">
            Olá, <span className="text-rose-600 dark:text-rose-400 font-black">{user.nome}</span>. Escolha seu destino:
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/financeiro" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-rose-100 dark:hover:shadow-rose-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-chart-line text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Financeiro</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Fluxo de caixa, receitas e despesas.</p>
          </Link>

          <Link 
            to="/pedidos" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-rose-100 dark:hover:shadow-rose-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-truck-fast text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Pedidos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Gestão de oficina e consertos.</p>
          </Link>

          <Link 
            to="/clientes" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-rose-100 dark:hover:shadow-rose-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-address-card text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Clientes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Contatos e agenda do WhatsApp.</p>
          </Link>
        </div>

        <button 
          onClick={onLogout}
          className="mt-12 w-full py-4 text-gray-400 hover:text-red-500 font-bold text-[11px] uppercase tracking-[0.2em] transition-colors flex items-center justify-center space-x-2"
        >
          <i className="fa-solid fa-power-off"></i>
          <span>Sair do Aplicativo</span>
        </button>
      </div>
    </div>
  );
};

export default Selection;
