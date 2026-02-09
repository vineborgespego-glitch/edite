
import React, { useState, useEffect, useCallback } from 'react';
// Fixed: Using namespace import and destructuring to bypass environment type resolution errors for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import { User, Transaction, Order, Client, OrderItem } from './types';
import Login from './pages/Login';
import Register from './pages/Register';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Receitas from './pages/Receitas';
import Despesas from './pages/Despesas';
import Usuarios from './pages/Usuarios';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import InstallPWA from './components/InstallPWA';

const { HashRouter, Routes, Route, Navigate, Link, useLocation } = ReactRouterDOM as any;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const userTheme = localStorage.getItem(`ia_finance_theme_user_${user.id}`);
      if (userTheme) {
        if (userTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    }
  }, [user]);

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

      const combinedTransactions: Transaction[] = [
        ...(Array.isArray(dataR) ? dataR.map((r: any) => ({ ...r, tipo: 'receita' as const, descricao: r.descriçao || r.descricao || "Sem título", valor: parseFloat(r.valor) || 0 })) : []),
        ...(Array.isArray(dataD) ? dataD.map((d: any) => ({ ...d, tipo: 'despesa' as const, descricao: d.descricao || d.descriçao || "Sem título", valor: parseFloat(d.valor) || 0 })) : [])
      ];

      setTransactions(combinedTransactions);
      if (Array.isArray(dataO)) setOrders(dataO);
      if (Array.isArray(dataC)) setClients(dataC);
      
      if (Array.isArray(dataI)) {
        const normalizedItems = dataI.map((item: any) => ({
          ...item,
          id_pedido: item.id_pedido || item.pedido_id,
          descreçao: item.descreçao || item.descriçao || item.descricao || "Sem descrição",
          obicervação: item.obicervação || item.observacao || item.obs || ""
        }));
        setOrderItems(normalizedItems);
      }

      if (user.role) {
        const resU = await fetch(`${SUPABASE_URL}/users?select=*`, { headers });
        const usersData = await resU.json();
        if (Array.isArray(usersData)) setAllUsers(usersData);
      }
    } catch (error) {
      console.error("Erro ao sincronizar dados:", error);
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
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    try {
      const table = t.tipo === 'receita' ? 'receitas' : 'despesas';
      const descField = t.tipo === 'receita' ? 'descriçao' : 'descricao';
      await fetch(`${SUPABASE_URL}/${table}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: String(t.user_id), [descField]: t.descricao, valor: String(t.valor), categoria: t.categoria, data: t.data })
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const updateOrder = async (id: number, updates: Partial<Order>, paymentLabel?: string) => {
    try {
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
      
      if (updates.pago === true && user) {
        const orderIdentifier = `Pagamento Pedido #${id}`;
        const alreadyPaid = transactions.some(t => t.tipo === 'receita' && t.descricao.includes(orderIdentifier));

        if (!alreadyPaid) {
          const itemsOfOrder = orderItems.filter(i => Number(i.id_pedido) === Number(id));
          const totalOrder = itemsOfOrder.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
          
          if (totalOrder > 0) {
            await addTransaction({
              user_id: user.id,
              descricao: `${orderIdentifier} ${paymentLabel || ''}`,
              valor: totalOrder,
              categoria: 'Serviços',
              data: new Date().toISOString(),
              tipo: 'receita'
            });
          }
        }
      }

      await fetch(`${SUPABASE_URL}/pedidos?id_pedido=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const addOrderWithItems = async (orderData: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[], paymentLabel?: string) => {
    try {
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
      const resOrder = await fetch(`${SUPABASE_URL}/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      
      const createdOrderData = await resOrder.json();
      const createdOrder = Array.isArray(createdOrderData) ? createdOrderData[0] : createdOrderData;
      
      if (!createdOrder || !createdOrder.id_pedido) {
         console.error("Falha ao criar pedido.");
         return null;
      }

      const newOrderId = createdOrder.id_pedido;

      if (items.length > 0) {
        const itemsToSave = items.map(item => ({ 
          descreçao: item.descreçao,
          quantidade: item.quantidade,
          valor_unidade: item.valor_unidade,
          total: item.total,
          obicervação: item.obicervação || "",
          id_pedido: String(newOrderId) 
        }));

        await fetch(`${SUPABASE_URL}/Itens_Pedido`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsToSave)
        });
        
        if (orderData.pago && user) {
          const totalOrder = items.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0);
          await addTransaction({ 
            user_id: user.id, 
            descricao: `Pagamento Pedido #${newOrderId} ${paymentLabel || ''}`, 
            valor: totalOrder, 
            categoria: 'Serviços', 
            data: new Date().toISOString(), 
            tipo: 'receita' 
          });
        }
      }
      await fetchData();
      return createdOrder;
    } catch (e) { 
      console.error(e); 
      return null;
    }
  };

  const addClient = async (c: { nome: string; numero: string }) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/clientes`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({ nome: c.nome, numero: c.numero })
      });
      const data = await res.json();
      fetchData();
      return Array.isArray(data) ? data[0] : data;
    } catch (e) { console.error(e); return null; }
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#fffafb] dark:bg-slate-950 transition-colors">
        {loading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <InstallPWA />
        <Routes>
          <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register onRegister={() => fetchData()} /> : <Navigate to="/login" />} />
          <Route path="/" element={user ? <Selection user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/financeiro" element={user ? <Dashboard user={user} transactions={transactions} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/receitas" element={user ? <Receitas user={user} transactions={transactions} onAdd={addTransaction} onDelete={() => {}} /> : <Navigate to="/login" />} />
          <Route path="/despesas" element={user ? <Despesas user={user} transactions={transactions} onAdd={addTransaction} onDelete={() => {}} /> : <Navigate to="/login" />} />
          <Route path="/pedidos" element={user ? <Orders user={user} orders={orders} orderItems={orderItems} clients={clients} transactions={transactions} onAdd={addOrderWithItems} onAddClient={addClient} onUpdateOrder={updateOrder} /> : <Navigate to="/login" />} />
          <Route path="/clientes" element={user ? <Clients user={user} clients={clients} onAdd={addClient} onDelete={() => {}} /> : <Navigate to="/login" />} />
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
  if (location.pathname === '/' || location.pathname === '/login') return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-rose-100 dark:border-slate-800 h-20 flex items-center justify-around px-2 md:hidden z-50 transition-colors shadow-[0_-10px_20px_rgba(225,29,72,0.05)]">
      <Link to="/" className="flex-1 flex flex-col items-center justify-center h-full text-gray-400">
        <i className="fa-solid fa-layer-group text-lg"></i>
        <span className="text-[10px] mt-1 font-bold">Portal</span>
      </Link>
      <Link to="/financeiro" className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${location.pathname.includes('financeiro') ? 'text-rose-600' : 'text-gray-400'}`}>
        <i className="fa-solid fa-chart-pie text-lg"></i>
        <span className="text-[10px] mt-1 font-bold">Finanças</span>
      </Link>
      <Link to="/pedidos" className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${location.pathname === '/pedidos' ? 'text-rose-600' : 'text-gray-400'}`}>
        <i className="fa-solid fa-scissors text-lg"></i>
        <span className="text-[10px] mt-1 font-bold">Pedidos</span>
      </Link>
      <Link to="/clientes" className={`flex-1 flex flex-col items-center justify-center h-full transition-all ${location.pathname === '/clientes' ? 'text-rose-600' : 'text-gray-400'}`}>
        <i className="fa-solid fa-address-book text-lg"></i>
        <span className="text-[10px] mt-1 font-bold">Clientes</span>
      </Link>
    </nav>
  );
};

export default App;
