
import React from 'react';
// Fixed: Using namespace import and destructuring to bypass environment type resolution errors for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { User } from '../types';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface SelectionProps {
  user: User;
  onLogout: () => void;
}

const Selection: React.FC<SelectionProps> = ({ user, onLogout }) => {
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

      <div className="w-full max-w-4xl text-center mt-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Painel Principal</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Seja bem-vinda, <span className="text-rose-600 font-black">{user.nome}</span>.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/financeiro" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:-translate-y-2 transition-all">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-chart-line text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Financeiro</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Caixa e Gráficos</p>
          </Link>

          <Link to="/pedidos" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:-translate-y-2 transition-all">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-scissors text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Pedidos</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Oficina e Recibos</p>
          </Link>

          <Link to="/clientes" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:-translate-y-2 transition-all">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 mx-auto group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-users text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">Clientes</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Agenda WhatsApp</p>
          </Link>
        </div>

        <button onClick={onLogout} className="mt-12 text-gray-300 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.3em] transition-colors">
          Encerrar Sessão
        </button>
      </div>
    </div>
  );
};

export default Selection;
