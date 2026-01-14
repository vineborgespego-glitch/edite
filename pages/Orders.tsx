
import React, { useState, useMemo } from 'react';
import { User, Order, Client, OrderItem } from '../types';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface OrdersProps {
  user: User;
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  onAdd: (order: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[]) => void;
  onAddClient: (c: { nome: string; numero: string }) => Promise<any>;
  onUpdateOrder: (id: number, updates: Partial<Order>) => void;
}

const Orders: React.FC<OrdersProps> = ({ user, orders, orderItems, clients, onAdd, onAddClient, onUpdateOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<Order['status'] | 'Todos'>('Todos');
  
  // Estados do Formulário
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [estaPago, setEstaPago] = useState(false);

  // Lista dinâmica de itens
  const [items, setItems] = useState<Omit<OrderItem, 'id_item' | 'id_pedido'>[]>([
    { descreçao: '', quantidade: '1', valor_unidade: '', total: '0' }
  ]);

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];
    if (filter !== 'Todos') list = list.filter(o => o.status === filter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, filter]);

  const getClientName = (id_cliente: string) => {
    const client = clients.find(c => String(c.id) === id_cliente);
    return client ? client.nome : 'Cliente Desconhecido';
  };

  const getItemsForOrder = (id_pedido: number) => {
    return orderItems.filter(item => String(item.id_pedido) === String(id_pedido));
  };

  const calculateOrderTotal = (id_pedido: number) => {
    return getItemsForOrder(id_pedido).reduce((acc, item) => acc + parseFloat(item.total || '0'), 0);
  };

  const addItemRow = () => {
    setItems([...items, { descreçao: '', quantidade: '1', valor_unidade: '', total: '0' }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Omit<OrderItem, 'id_item' | 'id_pedido'>, value: string) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'quantidade' || field === 'valor_unidade') {
      const q = parseFloat(field === 'quantidade' ? value : item.quantidade) || 0;
      const v = parseFloat(field === 'valor_unidade' ? value : item.valor_unidade) || 0;
      item.total = String(q * v);
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const grandTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientId = selectedClientId;

    if (clientType === 'new') {
      const addedClient = await onAddClient({
        nome: newClientNome,
        numero: newClientNumero.replace(/\D/g, '')
      });
      finalClientId = String(addedClient?.id || '');
    }

    if (!finalClientId) {
      alert("Por favor, selecione ou cadastre um cliente.");
      return;
    }

    if (items.some(i => !i.descreçao || !i.valor_unidade)) {
      alert("Preencha a descrição e o valor de todos os itens.");
      return;
    }

    onAdd({
      id_cliente: finalClientId,
      entrega: dataEntrega,
      status: 'em concerto',
      pago: estaPago
    }, items);

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setClientType('existing');
    setSelectedClientId('');
    setNewClientNome('');
    setNewClientNumero('');
    setDataEntrega('');
    setEstaPago(false);
    setItems([{ descreçao: '', quantidade: '1', valor_unidade: '', total: '0' }]);
  };

  const statusColors = {
    'em concerto': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'pronto': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'entregue': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };

  const handleNextStatus = (order: Order) => {
    if (order.status === 'em concerto') {
      onUpdateOrder(order.id_pedido, { status: 'pronto' });
    } else if (order.status === 'pronto') {
      if (!order.pago) {
        alert("⚠️ ATENÇÃO: Este pedido não pode ser entregue pois ainda não foi PAGO.");
        return;
      }
      onUpdateOrder(order.id_pedido, { status: 'entregue' });
    }
  };

  const togglePago = (order: Order) => {
    onUpdateOrder(order.id_pedido, { pago: !order.pago });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Pedidos</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fluxo de Oficina</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none active:scale-95 transition-all"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </header>

      <div className="px-6 pt-4 flex space-x-2 overflow-x-auto no-scrollbar pb-2">
        {['Todos', 'em concerto', 'pronto', 'entregue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-500 border border-gray-100 dark:border-slate-800'}`}
          >
            {f === 'em concerto' ? 'Em Conserto' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <main className="px-6 py-4 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-gray-400 opacity-30">
            <i className="fa-solid fa-box-open text-6xl mb-4"></i>
            <p className="font-bold">Nenhum pedido nesta categoria.</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const itemsInOrder = getItemsForOrder(order.id_pedido);
            const totalVal = calculateOrderTotal(order.id_pedido);
            return (
              <div key={order.id_pedido} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden transition-all">
                {order.pago && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-12 -mt-12 flex items-end justify-start pl-4 pb-4">
                    <i className="fa-solid fa-circle-check text-green-500 text-xs"></i>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white truncate pr-2">{getClientName(order.id_cliente)}</h3>
                    <div className="mt-1 space-y-0.5">
                      {itemsInOrder.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-[10px] text-gray-500 font-medium truncate max-w-[180px]">
                          • {item.descreçao} ({item.quantidade}x)
                        </p>
                      ))}
                      {itemsInOrder.length > 3 && <p className="text-[10px] text-indigo-500 font-bold">+{itemsInOrder.length - 3} mais itens...</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>
                      {order.status === 'em concerto' ? 'Oficina' : order.status}
                    </span>
                    <button 
                      onClick={() => togglePago(order)}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center space-x-1 ${order.pago ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600'}`}
                    >
                      <i className={`fa-solid ${order.pago ? 'fa-check-circle' : 'fa-clock'}`}></i>
                      <span>{order.pago ? 'Pago' : 'Pendente'}</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Valor Total</p>
                    <p className="text-sm font-black text-violet-600 dark:text-violet-400">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {order.status !== 'entregue' && (
                      <button 
                        onClick={() => handleNextStatus(order)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${order.status === 'pronto' && !order.pago ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed opacity-50' : 'bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none'}`}
                      >
                        {order.status === 'em concerto' ? 'Pronto' : 'Entregar'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[8px] text-gray-400 font-bold">
                  <div className="flex items-center space-x-2">
                    <i className="fa-regular fa-calendar"></i>
                    <span>Entrega: {order.entrega ? new Date(order.entrega).toLocaleDateString('pt-BR') : 'A definir'}</span>
                  </div>
                  <span>PEDIDO #{order.id_pedido}</span>
                </div>
              </div>
            );
          })
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up border-t border-gray-100 dark:border-slate-800 overflow-y-auto max-h-[90vh] no-scrollbar transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Novo Pedido</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Informações de serviço</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
              <button 
                onClick={() => setClientType('existing')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${clientType === 'existing' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}
              >
                Cliente Existente
              </button>
              <button 
                onClick={() => setClientType('new')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${clientType === 'new' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}
              >
                Novo Cadastro
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {clientType === 'existing' ? (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Selecionar Cliente</label>
                  <div className="relative">
                    <select
                      required
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none pr-10"
                      value={selectedClientId}
                      onChange={e => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Buscar cliente...</option>
                      {clients.sort((a,b) => a.nome.localeCompare(b.nome)).map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-slide-in">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                    <input
                      required
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      placeholder="Ex: Maria Oliveira"
                      value={newClientNome}
                      onChange={e => setNewClientNome(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Celular (WhatsApp)</label>
                    <input
                      required
                      className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      placeholder="(00) 00000-0000"
                      value={newClientNumero}
                      onChange={e => setNewClientNumero(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lista de Consertos</h3>
                  <button type="button" onClick={addItemRow} className="text-violet-600 font-bold text-[10px] bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full flex items-center space-x-1">
                    <i className="fa-solid fa-plus text-[8px]"></i>
                    <span>Adicionar Serviço</span>
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-3xl space-y-3 relative border border-gray-100 dark:border-slate-800 group">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(index)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                    <div>
                      <input
                        required
                        className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="O que será feito? (Ex: Ajuste de barra)"
                        value={item.descreçao}
                        onChange={e => updateItem(index, 'descreçao', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <input
                          required
                          type="number"
                          className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all text-center"
                          placeholder="Qtd"
                          value={item.quantidade}
                          onChange={e => updateItem(index, 'quantidade', e.target.value)}
                        />
                      </div>
                      <div>
                        <input
                          required
                          type="number"
                          step="0.01"
                          className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          placeholder="Valor R$"
                          value={item.valor_unidade}
                          onChange={e => updateItem(index, 'valor_unidade', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-end px-1">
                        <span className="text-[11px] font-black text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.total))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-3xl flex items-center justify-between border border-gray-100 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${estaPago ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-200 dark:bg-slate-700 text-gray-400'}`}>
                    <i className={`fa-solid ${estaPago ? 'fa-wallet' : 'fa-hourglass'}`}></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Status Financeiro</p>
                    <p className={`text-[11px] font-black uppercase ${estaPago ? 'text-green-600' : 'text-red-500'}`}>
                      {estaPago ? 'Pago Agora' : 'Pagar na Entrega'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setEstaPago(!estaPago)}
                  className={`w-12 h-6 rounded-full transition-all relative ${estaPago ? 'bg-green-500 shadow-md shadow-green-100' : 'bg-gray-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${estaPago ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="bg-violet-600 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-violet-100 dark:shadow-none">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-0.5">Total Estimado</p>
                  <p className="text-2xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold uppercase opacity-70 mb-1.5 tracking-widest">Previsão</p>
                   <input
                    required
                    type="date"
                    className="bg-white/20 p-2.5 rounded-xl text-xs font-black outline-none border border-white/30 text-white placeholder-white"
                    value={dataEntrega}
                    onChange={e => setDataEntrega(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-5 bg-violet-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-violet-700 active:scale-95 transition-all mt-4"
              >
                {clientType === 'new' ? 'Cadastrar Cliente e Iniciar' : 'Iniciar Conserto'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Orders;
