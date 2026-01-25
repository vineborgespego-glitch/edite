
import React, { useState, useMemo, useEffect } from 'react';
import { User, Order, Client, OrderItem } from '../types';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface OrdersProps {
  user: User;
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  onAdd: (order: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[]) => Promise<any>;
  onAddClient: (c: { nome: string; numero: string }) => Promise<any>;
  onUpdateOrder: (id: number, updates: Partial<Order>) => void;
}

const Orders: React.FC<OrdersProps> = ({ user, orders, orderItems, clients, onAdd, onAddClient, onUpdateOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Order['status'] | 'Todos'>('Todos');
  const [isAutoPrinting, setIsAutoPrinting] = useState(false);
  
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [estaPago, setEstaPago] = useState(false);

  const [items, setItems] = useState<Omit<OrderItem, 'id_item' | 'id_pedido'>[]>([
    { descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }
  ]);

  // Efeito para disparar a impressão após garantir que o DOM está pronto
  useEffect(() => {
    if (printOrderId && isAutoPrinting) {
      // Pequeno timeout para garantir que o modal de impressão e os dados do pedido 
      // foram injetados no DOM e renderizados pelo React.
      const timer = setTimeout(() => {
        window.print();
        setIsAutoPrinting(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [printOrderId, isAutoPrinting]);

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
    if (!Array.isArray(orderItems)) return [];
    return orderItems.filter(item => {
      const itemPedidoId = item.id_pedido || (item as any).pedido_id;
      return Number(itemPedidoId) === Number(id_pedido);
    });
  };

  const calculateOrderTotal = (id_pedido: number) => {
    const matchedItems = getItemsForOrder(id_pedido);
    return matchedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  };

  const addItemRow = () => {
    setItems([...items, { descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }]);
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
      const addedClient = await onAddClient({ nome: newClientNome, numero: newClientNumero.replace(/\D/g, '') });
      finalClientId = String(addedClient?.id || '');
    }
    if (!finalClientId || items.some(i => !i.descreçao || !i.valor_unidade)) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    
    // Aguarda a confirmação do salvamento no Supabase
    const createdOrder = await onAdd({ 
      id_cliente: finalClientId, 
      entrega: dataEntrega, 
      status: 'em concerto', 
      pago: estaPago 
    }, items);

    if (createdOrder && createdOrder.id_pedido) {
      setPrintOrderId(createdOrder.id_pedido);
      setIsAutoPrinting(true); // Ativa o gatilho automático de impressão
    }
    
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setClientType('existing'); setSelectedClientId(''); setNewClientNome(''); setNewClientNumero('');
    setDataEntrega(''); setEstaPago(false);
    setItems([{ descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }]);
  };

  const statusColors = {
    'em concerto': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'pronto': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'entregue': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };

  const handleStatusUpdate = (order: Order) => {
    if (order.status === 'em concerto') {
      onUpdateOrder(order.id_pedido, { status: 'pronto' });
    } else if (order.status === 'pronto') {
      if (!order.pago) {
        alert("⚠️ O pedido precisa estar PAGO antes de ser entregue!");
        return;
      }
      onUpdateOrder(order.id_pedido, { status: 'entregue' });
    }
  };

  const renderReceiptContent = (id: number) => {
    const order = orders.find(o => o.id_pedido === id);
    if (!order) return <div className="p-10 text-center font-bold">Carregando dados da notinha...</div>;
    const itemsInOrder = getItemsForOrder(id);
    const totalVal = calculateOrderTotal(id);
    return (
      <div id="thermal-receipt" className="receipt-content-wrapper bg-white text-black p-4 font-mono w-full max-w-[300px] mx-auto border-2 border-black">
        <div className="text-center mb-4 border-b-2 border-dashed border-black pb-2">
          <h2 className="text-lg font-black uppercase leading-tight">Atelier Edite Borges</h2>
          <p className="text-[10px] font-bold">SERVIÇOS DE COSTURA E AJUSTES</p>
        </div>
        
        <div className="text-[11px] space-y-1 mb-4 font-bold uppercase">
          <div className="flex justify-between"><span>Pedido:</span><span>#{order.id_pedido}</span></div>
          <div className="flex justify-between"><span>Data:</span><span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span></div>
          <div className="flex justify-between"><span>Cliente:</span><span>{getClientName(order.id_cliente)}</span></div>
        </div>

        <div className="border-t-2 border-b-2 border-dashed border-black py-2 mb-4">
          {itemsInOrder.map((item, idx) => (
            <div key={idx} className="mb-2 text-[11px]">
              <div className="flex justify-between font-bold">
                <span className="uppercase">{item.quantidade}x {item.descreçao}</span>
                <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.total))}</span>
              </div>
              {item.obicervação && <p className="text-[9px] italic opacity-80 pl-2">-- {item.obicervação}</p>}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-black uppercase underline">Total:</span>
          <span className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}</span>
        </div>

        <div className="text-center py-1 px-4 border border-black rounded mb-4">
          <span className="text-xs font-black uppercase">{order.pago ? 'PAGO' : 'PAGAMENTO PENDENTE'}</span>
        </div>

        <div className="text-center border-t-2 border-dashed border-black pt-2">
          <p className="text-[10px] font-black uppercase">Entrega:</p>
          <p className="text-base font-black">{order.entrega ? new Date(order.entrega).toLocaleDateString('pt-BR') : 'A DEFINIR'}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors pb-24 relative print:hidden">
        <div className="absolute top-6 left-6 flex items-center space-x-3">
          <Link to="/" className="w-10 h-10 bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-200 rounded-xl flex items-center justify-center shadow-lg border border-rose-100 dark:border-slate-800 active:scale-90 transition-all">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <div className="hidden sm:block text-left">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-tighter leading-none">Atelier</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Edite Borges</p>
          </div>
        </div>
        
        <div className="absolute top-6 right-6 flex items-center space-x-3">
          <ThemeToggle />
          <button onClick={() => { resetForm(); setShowModal(true); }} className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>

        <main className="px-6 pt-24 space-y-4">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
            {['Todos', 'em concerto', 'pronto', 'entregue'].map((f) => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === f ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-400 border border-gray-100 dark:border-slate-800'}`}>
                {f === 'em concerto' ? 'Oficina' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredOrders.map(order => {
            const orderItemsList = getItemsForOrder(order.id_pedido);
            const orderTotal = calculateOrderTotal(order.id_pedido);
            
            return (
              <div key={order.id_pedido} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 text-left transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white truncate">{getClientName(order.id_cliente)}</h3>
                    <div className="mt-2 space-y-1.5 min-h-[1.5rem]">
                      {orderItemsList.length > 0 ? (
                        orderItemsList.slice(0, 5).map((item, idx) => (
                          <div key={idx}>
                            <p className="text-[11px] text-gray-700 dark:text-gray-200 font-bold leading-tight uppercase">• {item.descreçao} ({item.quantidade}x)</p>
                            {item.obicervação && <p className="text-[9px] italic text-rose-500 ml-3 opacity-90">Obs: {item.obicervação}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] text-gray-400 italic">Nenhum item vinculado...</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>{order.status}</span>
                    <button onClick={() => setPrintOrderId(order.id_pedido)} className="w-8 h-8 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-lg flex items-center justify-center shadow-sm"><i className="fa-solid fa-receipt text-xs"></i></button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
                  <div className="flex flex-col">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Total</p>
                    <p className="text-sm font-black text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderTotal)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onUpdateOrder(order.id_pedido, { pago: !order.pago })} className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${order.pago ? 'bg-green-50 text-green-600 border-green-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                      {order.pago ? 'Pago' : 'Pendente'}
                    </button>
                    {order.status !== 'entregue' && (
                      <button 
                        onClick={() => handleStatusUpdate(order)} 
                        className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        {order.status === 'em concerto' ? 'Pronto' : 'Entregar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end justify-center px-4 sm:px-0">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar transition-colors">
              <h2 className="text-xl font-black text-gray-900 dark:text-white text-left">Novo Pedido</h2>
              <form onSubmit={handleSubmit} className="space-y-6 pb-10 text-left">
                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                  <button type="button" onClick={() => setClientType('existing')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${clientType === 'existing' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-gray-400'}`}>Existente</button>
                  <button type="button" onClick={() => setClientType('new')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${clientType === 'new' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-gray-400'}`}>Novo</button>
                </div>

                {clientType === 'existing' ? (
                  <select required className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 text-sm font-bold" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                    <option value="">Buscar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                ) : (
                  <div className="space-y-4">
                    <input required className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100" placeholder="Nome do Cliente" value={newClientNome} onChange={e => setNewClientNome(e.target.value)} />
                    <input required className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100" placeholder="Telefone" value={newClientNumero} onChange={e => setNewClientNumero(e.target.value)} />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Serviços</h3>
                    <button type="button" onClick={addItemRow} className="text-rose-600 font-black text-[9px] uppercase bg-rose-50 px-3 py-1.5 rounded-full">+ Item</button>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-3xl space-y-3 relative border border-gray-100 dark:border-slate-800 transition-all">
                      <input required className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100" placeholder="Descrição (ex: Barra Calça)" value={item.descreçao} onChange={e => updateItem(index, 'descreçao', e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <input required type="number" className="w-full p-3 bg-white dark:bg-slate-900 text-xs rounded-xl border border-gray-100" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', e.target.value)} />
                        <input required type="number" step="0.01" className="w-full p-3 bg-white dark:bg-slate-900 text-xs rounded-xl border border-gray-100" placeholder="R$ Unit." value={item.valor_unidade} onChange={e => updateItem(index, 'valor_unidade', e.target.value)} />
                      </div>
                      <textarea 
                        className="w-full p-3 bg-white dark:bg-slate-900 text-[10px] text-gray-600 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-slate-800 outline-none focus:ring-1 focus:ring-rose-500 transition-all italic" 
                        placeholder="Observações do item (opcional)..." 
                        value={item.obicervação} 
                        onChange={e => updateItem(index, 'obicervação', e.target.value)}
                        rows={2}
                      />
                      {items.length > 1 && <button type="button" onClick={() => removeItemRow(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[10px]"><i className="fa-solid fa-trash"></i></button>}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-5 rounded-3xl">
                  <span className="text-[10px] font-black uppercase text-gray-500">Já está pago?</span>
                  <button type="button" onClick={() => setEstaPago(!estaPago)} className={`w-12 h-6 rounded-full relative transition-all ${estaPago ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${estaPago ? 'left-7' : 'left-1'}`}></div></button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full text-left">
                    <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 ml-1">Previsão Entrega</label>
                    <input required type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
                  </div>
                  <div className="w-full p-6 bg-rose-600 rounded-[2rem] text-white flex flex-col justify-center">
                    <p className="text-[9px] font-bold uppercase opacity-70">Total Pedido</p>
                    <p className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal)}</p>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Salvar Pedido</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {printOrderId && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 print:static print:block print:bg-white print:p-0 print:z-auto print:h-auto">
          <button onClick={() => setPrintOrderId(null)} className="absolute top-6 right-6 w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center transition-colors print:hidden hover:bg-rose-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
          
          <div className="mb-8 print:mb-0 print:w-full">
            {renderReceiptContent(printOrderId)}
          </div>
          
          <button onClick={() => window.print()} className="px-8 py-4 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center space-x-2 shadow-xl active:scale-95 transition-all print:hidden">
            <i className="fa-solid fa-print"></i>
            <span>Imprimir Recibo</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        
        @media print {
          /* GARANTIAS DE VISIBILIDADE PARA TERMICAS */
          body, html {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #root > div:first-child {
            display: none !important;
          }

          .fixed.inset-0 {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 9999 !important;
          }

          .receipt-content-wrapper {
            display: block !important;
            visibility: visible !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 300px !important;
            border: 2px solid black !important;
            background-color: white !important;
            color: black !important;
            box-shadow: none !important;
          }

          .receipt-content-wrapper * {
            visibility: visible !important;
            color: black !important;
            background: none !important;
          }

          button, i, .print-hidden {
            display: none !important;
          }

          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </>
  );
};

export default Orders;
