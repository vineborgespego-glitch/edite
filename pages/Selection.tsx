
import React from 'react';
// Importação explícita para resolver erro de tipo no ambiente
import { Link } from 'react-router-dom';
import { User } from '../types';
import ThemeToggle from '../ThemeToggle';

interface SelectionProps {
  user: User;
  onLogout: () => void;
}

const Selection: React.FC<SelectionProps> = ({ user, onLogout }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-slate-950 transition-colors relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl">
        <header className="flex flex-col items-center mb-12 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-4">
            <i className="fa-solid fa-rocket text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Portal da Empresa</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium italic">
            Olá, <span className="text-indigo-600 dark:text-indigo-400 font-bold">{user.nome}</span>. Selecione o módulo de trabalho:
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            to="/financeiro" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-indigo-100 dark:hover:shadow-indigo-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-chart-line text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Financeiro</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Fluxo de caixa, receitas, despesas e relatórios.</p>
            <div className="mt-6 flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <span>Acessar</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </Link>

          <Link 
            to="/pedidos" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-violet-100 dark:hover:shadow-violet-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-truck-fast text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Pedidos</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Vendas, produção e acompanhamento de entregas.</p>
            <div className="mt-6 flex items-center text-violet-600 dark:text-violet-400 font-bold text-xs">
              <span>Acessar</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </Link>

          <Link 
            to="/clientes" 
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl hover:shadow-teal-100 dark:hover:shadow-teal-950/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-address-card text-2xl"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Clientes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Sua agenda de contatos, WhatsApp e endereços.</p>
            <div className="mt-6 flex items-center text-teal-600 dark:text-teal-400 font-bold text-xs">
              <span>Acessar</span>
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </div>
          </Link>
        </div>

        <button 
          onClick={onLogout}
          className="mt-12 w-full py-4 text-gray-400 hover:text-red-500 font-bold text-sm transition-colors flex items-center justify-center space-x-2"
        >
          <i className="fa-solid fa-power-off"></i>
          <span>Desconectar do Sistema</span>
        </button>
      </div>
    </div>
  );
};

export default Selection;
