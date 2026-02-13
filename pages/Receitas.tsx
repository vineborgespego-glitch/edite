
import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface ReceitasProps {
  user: User;
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: number, tipo: 'receita') => void;
}

const Receitas: React.FC<ReceitasProps> = ({ user, transactions, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Serviços');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);

  const list = useMemo(() => {
    return transactions.filter(t => t.tipo === 'receita' && (user.role || t.user_id === user.id))
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
      tipo: 'receita'
    });
    setShowModal(false);
    setDescricao('');
    setValor('');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/financeiro" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 rounded-xl flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Receitas</h1>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button onClick={() => setShowModal(true)} className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-plus"></i></button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-4">
        {list.map(t => (
          <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-arrow-up"></i></div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{t.descricao}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black">{new Date(t.data).toLocaleDateString('pt-BR')} • {t.categoria}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-sm font-black text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}</p>
              <button onClick={() => onDelete(t.id, 'receita')} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><i className="fa-solid fa-trash-can text-[10px]"></i></button>
            </div>
          </div>
        ))}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up border-t border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase">Adicionar Receita</h2>
              <button onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark text-xl text-gray-400"></i></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Descrição</label>
                <input required className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="Ex: Ajuste Vestido" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Valor</label>
                  <input required type="number" step="0.01" className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Categoria</label>
                  <select className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-green-500 transition-all" value={categoria} onChange={e => setCategoria(e.target.value)}>
                    <option value="Serviços">Serviços</option>
                    <option value="Venda Peças">Venda Peças</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-green-600 text-white font-black uppercase rounded-2xl shadow-lg">Salvar Receita</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Receitas;
