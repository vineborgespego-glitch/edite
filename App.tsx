
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, Transaction } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Receitas from './pages/Receitas';
import Despesas from './pages/Despesas';
import Usuarios from './pages/Usuarios';

export const SUPABASE_URL = 'https://tzqtbezkqjodzhbptoky.supabase.co/rest/v1';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cXRiZXprcWpvZHpoYnB0b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIxNDEsImV4cCI6MjA4MzUzODE0MX0.G7IJ4BTy-lPmq1cIftZlkLH4rUMHpEMmzSKsy_LCQ6g';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ia_finance_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      };

      const [resR, resD] = await Promise.all([
        fetch(`${SUPABASE_URL}/receitas?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/despesas?select=*`, { headers })
      ]);

      const dataR = await resR.json();
      const dataD = await resD.json();

      const combined: Transaction[] = [
        ...(Array.isArray(dataR) ? dataR.map((r: any) => ({ 
          ...r, 
          tipo: 'receita' as const, 
          descricao: r.descriçao || r.descricao || "Sem título", 
          valor: parseFloat(r.valor) || 0 
        })) : []),
        ...(Array.isArray(dataD) ? dataD.map((d: any) => ({ 
          ...d, 
          tipo: 'despesa' as const, 
          descricao: d.descricao || d.descriçao || "Sem título", 
          valor: parseFloat(d.valor) || 0 
        })) : [])
      ];

      setTransactions(combined);

      if (user.role === true) {
        const resU = await fetch(`${SUPABASE_URL}/users?select=*`, { headers });
        const usersData = await resU.json();
        if (Array.isArray(usersData)) setAllUsers(usersData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do Supabase:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ia_finance_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ia_finance_user');
    setTransactions([]);
    setAllUsers([]);
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    const table = t.tipo === 'receita' ? 'receitas' : 'despesas';
    const descField = t.tipo === 'receita' ? 'descriçao' : 'descricao';

    try {
      const response = await fetch(`${SUPABASE_URL}/${table}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: String(t.user_id),
          [descField]: t.descricao,
          valor: String(t.valor),
          categoria: t.categoria,
          data: t.data
        })
      });
      if (response.ok) fetchData();
    } catch (e) {
      console.error("Erro ao adicionar transação:", e);
    }
  };

  const deleteTransaction = async (id: number, tipo: 'receita' | 'despesa') => {
    const table = tipo === 'receita' ? 'receitas' : 'despesas';
    try {
      const response = await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (response.ok) fetchData();
    } catch (e) {
      console.error("Erro ao excluir transação:", e);
    }
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-gray-50 dark:bg-slate-950 transition-colors">
        {loading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm animate-pulse">Sincronizando...</p>
            </div>
          </div>
        )}
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onRegister={() => fetchData()} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard user={user} transactions={transactions} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/receitas" element={user ? <Receitas user={user} transactions={transactions} onAdd={addTransaction} onDelete={(id) => deleteTransaction(id, 'receita')} /> : <Navigate to="/login" />} />
          <Route path="/despesas" element={user ? <Despesas user={user} transactions={transactions} onAdd={addTransaction} onDelete={(id) => deleteTransaction(id, 'despesa')} /> : <Navigate to="/login" />} />
          <Route path="/usuarios" element={user && user.role ? <Usuarios users={allUsers} onDelete={() => fetchData()} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {user && <BottomNav isAdmin={user.role} />}
      </div>
    </Router>
  );
};

const BottomNav: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 h-16 flex items-center justify-around px-4 md:hidden app-shadow z-50 transition-colors">
      <Link to="/" className={`flex flex-col items-center justify-center w-full h-full transition-all ${isActive('/') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
        <i className={`fa-solid fa-house ${isActive('/') ? 'text-xl' : 'text-lg'}`}></i>
        <span className="text-[10px] mt-1 font-bold">Início</span>
      </Link>
      <Link to="/receitas" className={`flex flex-col items-center justify-center w-full h-full transition-all ${isActive('/receitas') ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
        <i className={`fa-solid fa-arrow-up-long ${isActive('/receitas') ? 'text-xl' : 'text-lg'}`}></i>
        <span className="text-[10px] mt-1 font-bold">Receitas</span>
      </Link>
      <Link to="/despesas" className={`flex flex-col items-center justify-center w-full h-full transition-all ${isActive('/despesas') ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-500'}`}>
        <i className={`fa-solid fa-arrow-down-long ${isActive('/despesas') ? 'text-xl' : 'text-lg'}`}></i>
        <span className="text-[10px] mt-1 font-bold">Despesas</span>
      </Link>
      {isAdmin && (
        <Link to="/usuarios" className={`flex flex-col items-center justify-center w-full h-full transition-all ${isActive('/usuarios') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}>
          <i className={`fa-solid fa-users ${isActive('/usuarios') ? 'text-xl' : 'text-lg'}`}></i>
          <span className="text-[10px] mt-1 font-bold">Usuários</span>
        </Link>
      )}
    </nav>
  );
};

export default App;
