
import React, { useState, useEffect, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { User, Transaction, Order, Client, OrderItem } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Receitas from './pages/Receitas';
import Despesas from './pages/Despesas';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import InstallPWA from './components/InstallPWA';

const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM as any;
const Router = HashRouter;

export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tzqtbezkqjodzhbptoky.supabase.co/rest/v1';
export const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cXRiZXprcWpvZHpoYnB0b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjIxNDEsImV4cCI6MjA4MzUzODE0MX0.G7IJ4BTy-lPmq1cIftZlkLH4rUMHpEMmzSKsy_LCQ6g';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ia_finance_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
      const [resR, resD, resO, resC, resI] = await Promise.all([
        fetch(`${SUPABASE_URL}/receitas?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/despesas?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/pedidos?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/clientes?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/Itens_Pedido?select=*`, { headers })
      ]);

      const dataR = await resR.json();
      const dataD = await resD.json();
      const dataO = await resO.json();
      const dataC = await resC.json();
      const dataI = await resI.json();

      setTransactions([
        ...(Array.isArray(dataR) ? dataR : []).map((r: any) => ({ ...r, tipo: 'receita', id: r.id, descricao: r.descriçao || r.descricao, valor: parseFloat(r.valor) || 0, data: r.data || r.created_at })),
        ...(Array.isArray(dataD) ? dataD : []).map((d: any) => ({ ...d, tipo: 'despesa', id: d.id, descricao: d.descricao || d.descriçao, valor: parseFloat(d.valor) || 0, data: d.data || d.created_at }))
      ]);

      setOrders(Array.isArray(dataO) ? dataO : []);
      setClients(Array.isArray(dataC) ? dataC : []);
      setOrderItems(Array.isArray(dataI) ? dataI : []);
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  const handleAddTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const table = tx.tipo === 'receita' ? 'receitas' : 'despesas';
    const payload = tx.tipo === 'receita' 
      ? { user_id: tx.user_id, descriçao: tx.descricao, valor: String(tx.valor), categoria: tx.categoria, data: tx.data }
      : { user_id: tx.user_id, descricao: tx.descricao, valor: String(tx.valor), categoria: tx.categoria, data: tx.data };

    try {
      await fetch(`${SUPABASE_URL}/${table}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteTransaction = async (id: number, tipo: 'receita' | 'despesa') => {
    if (!confirm('Deseja excluir este registro?')) return;
    const table = tipo === 'receita' ? 'receitas' : 'despesas';
    try {
      await fetch(`${SUPABASE_URL}/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleAddClient = async (client: { nome: string; numero: string }) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/clientes`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(client)
      });
      const data = await res.json();
      fetchData();
      return Array.isArray(data) ? data[0] : null;
    } catch (e) { console.error(e); return null; }
  };

  const handleAddOrder = async (order: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[]) => {
    try {
      const resOrder = await fetch(`${SUPABASE_URL}/pedidos`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(order)
      });
      const createdOrders = await resOrder.json();
      const createdOrder = Array.isArray(createdOrders) ? createdOrders[0] : null;

      if (createdOrder && items.length > 0) {
        const itemsPayload = items.map(item => ({ ...item, id_pedido: createdOrder.id_pedido }));
        await fetch(`${SUPABASE_URL}/Itens_Pedido`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsPayload)
        });
      }
      fetchData();
      return createdOrder;
    } catch (e) { console.error(e); return null; }
  };

  const handleUpdateOrder = async (id: number, updates: Partial<Order>) => {
    try {
      await fetch(`${SUPABASE_URL}/pedidos?id_pedido=eq.${id}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#fffafb] dark:bg-slate-950 transition-colors">
        {loading && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm"><div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div></div>}
        <InstallPWA />
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={(u) => { setUser(u); localStorage.setItem('ia_finance_user', JSON.stringify(u)); }} /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Selection user={user} onLogout={() => { setUser(null); localStorage.removeItem('ia_finance_user'); }} /> : <Navigate to="/login" />} />
          <Route path="/financeiro" element={user ? <Dashboard user={user} transactions={transactions} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
          <Route path="/receitas" element={user ? <Receitas user={user} transactions={transactions} onAdd={handleAddTransaction} onDelete={handleDeleteTransaction} /> : <Navigate to="/login" />} />
          <Route path="/despesas" element={user ? <Despesas user={user} transactions={transactions} onAdd={handleAddTransaction} onDelete={(id) => handleDeleteTransaction(id, 'despesa')} /> : <Navigate to="/login" />} />
          <Route path="/pedidos" element={user ? <Orders user={user} orders={orders} orderItems={orderItems} clients={clients} transactions={transactions} onAdd={handleAddOrder} onAddClient={handleAddClient} onUpdateOrder={handleUpdateOrder} /> : <Navigate to="/login" />} />
          <Route path="/clientes" element={user ? <Clients user={user} clients={clients} onAdd={handleAddClient} onDelete={() => fetchData()} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
