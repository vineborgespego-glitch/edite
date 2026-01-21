
import React, { useMemo, useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onLogout }) => {
  const [isMounted, setIsMounted] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const safeTransactions = transactions || [];
  const userTransactions = useMemo(() => {
    return user.role ? safeTransactions : safeTransactions.filter(t => t.user_id === user.id);
  }, [user, safeTransactions]);

  const stats = useMemo(() => {
    const receitas = userTransactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const despesas = userTransactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor || 0), 0);
    const balanco = receitas - despesas;
    return { receitas, despesas, balanco };
  }, [userTransactions]);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const weeks = [
      { name: 'S1', receitas: 0, despesas: 0 },
      { name: 'S2', receitas: 0, despesas: 0 },
      { name: 'S3', receitas: 0, despesas: 0 },
      { name: 'S4', receitas: 0, despesas: 0 },
    ];

    userTransactions.forEach(t => {
      const tDate = new Date(t.data);
      if (tDate.getMonth() === currentMonth) {
        const day = tDate.getDate();
        let weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
        if (t.tipo === 'receita') weeks[weekIndex].receitas += Number(t.valor);
        else weeks[weekIndex].despesas += Number(t.valor);
      }
    });
    return weeks;
  }, [userTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors pb-24 md:pb-6">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center space-x-3 text-left">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-gray-100">
            <i className="fa-solid fa-chevron-left text-gray-400"></i>
          </Link>
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-rose-50 overflow-hidden p-0.5">
            <img src="logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Financeiro</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Edite Borges</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={onLogout} className="text-gray-300 hover:text-red-500">
            <i className="fa-solid fa-power-off text-lg"></i>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* CARD PRINCIPAL ROSE */}
        <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-100 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 text-left">Saldo Atual</p>
          <h3 className="text-4xl font-black mb-6 text-left tracking-tight">{formatCurrency(stats.balanco)}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-left">
              <p className="text-[9px] font-black uppercase tracking-wider opacity-70">Entradas</p>
              <p className="text-lg font-bold">{formatCurrency(stats.receitas)}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 text-left">
              <p className="text-[9px] font-black uppercase tracking-wider opacity-70">Saídas</p>
              <p className="text-lg font-bold">{formatCurrency(stats.despesas)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/receitas" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-plus text-xl"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Receitas</span>
          </Link>
          <Link to="/despesas" className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-minus text-xl"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Despesas</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-left px-2">Movimentação Mensal</h4>
          <div className="h-48 w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
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
