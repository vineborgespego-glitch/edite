
import React, { useState, useMemo, useEffect } from 'react';
import { User, Transaction } from '../types';
// Importação explícita para resolver erro de tipo no ambiente
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface ReceitasProps {
  user: User;
  transactions: Transaction[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onDelete: (id: number) => void;
}

type PagamentoTipo = 'dinheiro_pix' | 'cartao' | null;
type CartaoTipo = 'credito' | 'debito' | null;

const Receitas: React.FC<ReceitasProps> = ({ user, transactions, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('Barra Calça');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('open') === 'true') {
      setShowModal(true);
    }
  }, [location]);

  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>(null);
  const [cartaoSubtipo, setCartaoSubtipo] = useState<CartaoTipo>(null);

  const list = useMemo(() => {
    return transactions.filter(t => t.tipo === 'receita' && (user.role || t.user_id === user.id))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transactions, user]);

  const resetForm = () => {
    setDescricao('');
    setValor('');
    setCategoria('Barra Calça');
    setPagamentoTipo(null);
    setCartaoSubtipo(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    const labelPagamento = pagamentoTipo === 'dinheiro_pix' 
      ? '[PIX/Dinheiro]' 
      : `[Cartão ${cartaoSubtipo === 'credito' ? 'Crédito' : 'Débito'}]`;

    onAdd({
      user_id: user.id,
      descricao: `${descricao} ${labelPagamento}`,
      valor: parseFloat(valor),
      categoria,
      data: new Date(data).toISOString(),
      tipo: 'receita'
    });
    
    setShowModal(false);
    resetForm();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isValueVisible = pagamentoTipo === 'dinheiro_pix' || (pagamentoTipo === 'cartao' && cartaoSubtipo !== null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-slate-700">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Receitas</h1>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-100 dark:shadow-none active:scale-90 transition-all"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-4">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-600">
            <i className="fa-solid fa-wallet text-5xl mb-4 opacity-20"></i>
            <p className="font-medium">Nenhuma receita registrada.</p>
          </div>
        ) : (
          list.map(t => (
            <div key={t.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-arrow-up"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{t.descricao}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t.categoria} • {new Date(t.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(t.valor)}</p>
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Receita</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Descrição do Serviço</label>
                  <input
                    required
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="Ex: Conserto vestido Maria"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Tipo de Serviço</label>
                  <select
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all appearance-none"
                    value={categoria}
                    onChange={e => setCategoria(e.target.value)}
                  >
                    <option value="Barra Calça">Barra Calça</option>
                    <option value="Barra Vestido">Barra Vestido</option>
                    <option value="Ajuste Cintura">Ajuste Cintura</option>
                    <option value="Custurinha">Custurinha</option>
                    <option value="Cós">Cós</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Como foi pago?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setPagamentoTipo('dinheiro_pix'); setCartaoSubtipo(null); }}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${pagamentoTipo === 'dinheiro_pix' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    <i className="fa-solid fa-sack-dollar"></i>
                    <span className="font-bold text-sm">Dinheiro/PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagamentoTipo('cartao')}
                    className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${pagamentoTipo === 'cartao' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400'}`}
                  >
                    <i className="fa-solid fa-credit-card"></i>
                    <span className="font-bold text-sm">Cartão</span>
                  </button>
                </div>
              </div>

              {pagamentoTipo === 'cartao' && (
                <div className="space-y-3 animate-slide-in">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Tipo de Cartão</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCartaoSubtipo('credito')}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all ${cartaoSubtipo === 'credito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'bg-transparent border-gray-200 dark:border-slate-700 text-gray-500'}`}
                    >
                      CRÉDITO
                    </button>
                    <button
                      type="button"
                      onClick={() => setCartaoSubtipo('debito')}
                      className={`p-3 rounded-xl border font-bold text-xs transition-all ${cartaoSubtipo === 'debito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' : 'bg-transparent border-gray-200 dark:border-slate-700 text-gray-500'}`}
                    >
                      DÉBITO
                    </button>
                  </div>
                </div>
              )}

              {isValueVisible && (
                <div className="grid grid-cols-2 gap-4 animate-slide-in">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                      <input
                        required
                        type="number"
                        step="0.01"
                        autoFocus
                        className="w-full pl-10 pr-4 py-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all font-bold"
                        placeholder="0,00"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Data</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      value={data}
                      onChange={e => setData(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!isValueVisible || !valor || !descricao}
                className="w-full py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-green-100 dark:shadow-none hover:bg-green-700 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:scale-100"
              >
                Finalizar Receita
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
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Receitas;
