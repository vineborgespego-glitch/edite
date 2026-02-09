
import React, { useState, useMemo, useEffect } from 'react';
import { User, Transaction } from '../types';
// Fixed: Using namespace import and destructuring to bypass environment type resolution errors for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link, useLocation } = ReactRouterDOM as any;

interface DespesasProps {
  user: User;
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: number) => void;
}

const Despesas: React.FC<DespesasProps> = ({ user, transactions, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Alimentação');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'true') {
      setShowModal(true);
    }
  }, [location]);

  const list = useMemo(() => {
    return transactions.filter(t => t.tipo === 'despesa' && (user.role || t.user_id === user.id))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, user]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      user_id: user.id,
      descricao,
      valor: parseFloat(valor),
      categoria,
      data: new Date(data).toISOString(),
      tipo: 'despesa'
    });
    setShowModal(false);
    setDescricao('');
    setValor('');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-slate-700">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Despesas</h1>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => setShowModal(true)}
            className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-100 dark:shadow-none active:scale-90 transition-all"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-600">
            <i className="fa-solid fa-receipt text-5xl mb-4 opacity-20"></i>
            <p className="font-medium">Nenhuma despesa registrada.</p>
          </div>
        ) : (
          list.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-arrow-down"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{t.descricao}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t.categoria} • {new Date(t.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(t.valor)}</p>
                <button onClick={() => onDelete(t.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up border-t border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Despesa</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Descrição</label>
                <input
                  required
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  placeholder="Ex: Mercado ou Aluguel"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Valor</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    placeholder="0.00"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Categoria</label>
                  <select
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Aluguel">Aluguel</option>
                    <option value="Educação">Educação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Data</label>
                <input
                  type="date"
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  value={data}
                  onChange={e => setData(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-700 active:scale-95 transition-all"
              >
                Salvar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Despesas;
