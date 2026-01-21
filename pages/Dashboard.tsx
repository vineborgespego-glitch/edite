
import React, { useMemo, useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LabelList } from 'recharts';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onLogout }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [logoSrc, setLogoSrc] = useState('logo.jpeg');
  const [hasError, setHasError] = useState(false);
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoError = () => {
    if (logoSrc === 'logo.jpeg') setLogoSrc('logo.png');
    else if (logoSrc === 'logo.png') setLogoSrc('logo.jpg');
    else setHasError(true);
  };

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
    const currentYear = now.getFullYear();

    const weeks = [
      { name: 'Sem 1', receitas: 0, despesas: 0 },
      { name: 'Sem 2', receitas: 0, despesas: 0 },
      { name: 'Sem 3', receitas: 0, despesas: 0 },
      { name: 'Sem 4', receitas: 0, despesas: 0 },
    ];

    userTransactions.forEach(t => {
      const tDate = new Date(t.data);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        const day = tDate.getDate();
        let weekIndex = 0;
        if (day <= 7) weekIndex = 0;
        else if (day <= 14) weekIndex = 1;
        else if (day <= 21) weekIndex = 2;
        else weekIndex = 3;

        if (t.tipo === 'receita') weeks[weekIndex].receitas += Number(t.valor);
        else weeks[weekIndex].despesas += Number(t.valor);
      }
    });

    return weeks;
  }, [userTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatCompactNumber = (number: number) => {
    return Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(number);
  };

  const iaInsight = useMemo(() => {
    if (stats.receitas === 0) return "Comece a registrar suas receitas para que eu possa analisar sua saúde financeira.";
    const comprometimento = (stats.despesas / stats.receitas);
    if (comprometimento > 0.5) {
      const percentStr = Math.round(comprometimento * 100);
      if (comprometimento > 1) return "AVISO CRÍTICO: Seus gastos ultrapassaram 100% da sua receita! Você está operando no prejuízo este mês.";
      return `Aviso: Seus gastos atingiram ${percentStr}% da sua receita total. Recomenda-se manter abaixo de 50% para estabilidade.`;
    }
    return "Tudo sob controle! Seus gastos estão abaixo de 50% da sua receita. Continue com essa disciplina.";
  }, [stats]);

  return (
    <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors duration-300 pb-24 md:pb-6 text-left">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center space-x-3">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-slate-700">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md p-0.5 border border-rose-50 overflow-hidden">
            {!hasError ? (
              <img 
                src={logoSrc} 
                alt="Logo" 
                className="w-full h-full object-contain" 
                onError={handleLogoError}
              />
            ) : (
              <i className="fa-solid fa-scissors text-rose-500 text-sm"></i>
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.nome ? user.nome.split(' ')[0] : 'Usuário'}</h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Atelier Edite</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-right-from-bracket text-xl"></i>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        <div className="bg-rose-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-rose-100 dark:shadow-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mb-1">Saldo em Caixa</p>
                <h3 className="text-4xl font-black">{formatCurrency(stats.balanco)}</h3>
              </div>
              <i className="fa-solid fa-scissors text-3xl opacity-30"></i>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] text-rose-100 uppercase tracking-wider font-bold mb-1">Entradas</p>
                <p className="text-lg font-bold">{formatCurrency(stats.receitas)}</p>
              </div>
              <div className="w-full flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] text-rose-100 uppercase tracking-wider font-bold mb-1">Saídas</p>
                <p className="text-lg font-bold">{formatCurrency(stats.despesas)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl border shadow-sm flex items-start space-x-4 transition-colors ${stats.despesas > stats.receitas * 0.5 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'}`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${stats.despesas > stats.receitas * 0.5 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
            <i className={`fa-solid ${stats.despesas > stats.receitas * 0.5 ? 'fa-triangle-exclamation animate-pulse' : 'fa-wand-magic-sparkles'} text-xl`}></i>
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${stats.despesas > stats.receitas * 0.5 ? 'text-amber-800' : 'text-rose-800 dark:text-rose-300'}`}>Sugestão do Atelier</h4>
            <p className="text-sm font-medium leading-relaxed text-gray-800 dark:text-slate-300">{iaInsight}</p>
          </div>
        </div>

        <div className={`grid gap-4 ${user.role ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
          <Link to="/receitas" className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all shadow-sm group">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-plus text-xl"></i>
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Nova Receita</span>
          </Link>
          <Link to="/despesas" className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 active:scale-95 transition-all shadow-sm group">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <i className="fa-solid fa-minus text-xl"></i>
            </div>
            <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Nova Despesa</span>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-gray-800 dark:text-slate-300 uppercase tracking-widest">Fluxo Mensal</h4>
            <i className="fa-solid fa-chart-simple text-rose-500 opacity-30"></i>
          </div>
          <div className="w-full h-64 flex flex-col items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f3f4f6"} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: isDarkMode ? '#64748b' : '#9ca3af', fontWeight: 600}} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} tick={{fill: isDarkMode ? '#475569' : '#94a3b8'}} tickFormatter={(val) => `R$ ${formatCompactNumber(val)}`} />
                  <Tooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#1e293b' : '#fff' }} formatter={(value: number) => [formatCurrency(value), '']} />
                  <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="w-full h-full bg-gray-50 dark:bg-slate-800 animate-pulse rounded-2xl"></div>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
