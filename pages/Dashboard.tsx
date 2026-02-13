
import React, { useMemo, useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onLogout }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const stats = useMemo(() => {
    const txList = Array.isArray(transactions) ? transactions : [];
    const receitas = txList.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + (t.valor || 0), 0);
    const despesas = txList.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + (t.valor || 0), 0);
    return { receitas, despesas, balanco: receitas - despesas };
  }, [transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors pb-24 md:pb-6">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 text-left">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-gray-100"><i className="fa-solid fa-chevron-left text-gray-400"></i></Link>
          <div>
            <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Financeiro</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Atelier Edite</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={onLogout} className="text-gray-300 hover:text-red-500"><i className="fa-solid fa-power-off text-lg"></i></button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Saldo Atual</p>
          <h3 className="text-4xl font-black tracking-tight">{formatCurrency(stats.balanco)}</h3>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase opacity-70">Receitas</p>
              <p className="text-lg font-bold">{formatCurrency(stats.receitas)}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase opacity-70">Despesas</p>
              <p className="text-lg font-bold">{formatCurrency(stats.despesas)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/receitas" className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-arrow-up text-xl"></i></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Receitas</span>
          </Link>
          <Link to="/despesas" className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><i className="fa-solid fa-arrow-down text-xl"></i></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Despesas</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-2">Desempenho Semanal</h4>
          <div className="h-48 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[]}>
                  <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#94a3b8'}} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
