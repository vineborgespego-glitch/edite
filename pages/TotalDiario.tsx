
import React from 'react';
import { TotalDiario } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface TotalDiarioPageProps {
  totalDiario: TotalDiario[];
  onUpdate: (dateKey: string, val: string) => void;
}

const TotalDiarioPage: React.FC<TotalDiarioPageProps> = ({ totalDiario }) => {
  const sorted = [...totalDiario].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/financeiro" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-xl flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fechamentos Cartão</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="px-6 py-6 space-y-4">
        {sorted.map((td, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-black text-rose-600 uppercase tracking-widest">
                {new Date(td.created_at).toLocaleDateString('pt-BR')}
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(td.valor_total || "0"))}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-50 dark:border-slate-800">
              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Clientes Consolidados:</p>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic">
                {td.clientes || "Nenhum cliente registrado"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Serviços:</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{td.descrições_serviços}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default TotalDiarioPage;
