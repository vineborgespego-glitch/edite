
import React, { useState, useMemo, useEffect } from 'react';
import { User, Order, Client, OrderItem, Transaction } from '../types';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface OrdersProps {
  user: User;
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  transactions: Transaction[];
  onAdd: (order: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[], paymentLabel?: string) => Promise<any>;
  onAddClient: (c: { nome: string; numero: string }) => Promise<any>;
  onUpdateOrder: (id: number, updates: Partial<Order>, paymentLabel?: string) => void;
}

type PagamentoTipo = 'dinheiro_pix' | 'cartao' | null;
type CartaoTipo = 'credito' | 'debito' | null;

const Orders: React.FC<OrdersProps> = ({ user, orders, orderItems, clients, transactions, onAdd, onAddClient, onUpdateOrder }) => {
  const [showModal, setShowModal] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Order['status'] | 'Todos'>('Todos');
  
  // States for new order
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [estaPago, setEstaPago] = useState(false);
  const [pagamentoTipo, setPagamentoTipo] = useState<PagamentoTipo>(null);
  const [cartaoSubtipo, setCartaoSubtipo] = useState<CartaoTipo>(null);

  // State for updating status to Paid
  const [pendingPaymentOrderId, setPendingPaymentOrderId] = useState<number | null>(null);

  const [items, setItems] = useState<Omit<OrderItem, 'id_item' | 'id_pedido'>[]>([
    { descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }
  ]);

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];
    if (filter !== 'Todos') list = list.filter(o => o.status === filter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, filter]);

  const getClientData = (id_cliente: string) => {
    return clients.find(c => String(c.id) === id_cliente);
  };

  const getClientName = (id_cliente: string) => {
    const client = getClientData(id_cliente);
    return client ? client.nome : 'Cliente Desconhecido';
  };

  const handleWhatsApp = (id_cliente: string) => {
    const client = getClientData(id_cliente);
    if (!client || !client.numero) return;
    const cleanPhone = client.numero.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
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

  // --- LÓGICA DE IMPRESSÃO VIA IFRAME (COM FORMA DE PAGAMENTO) ---
  const executeIframePrint = (orderId: number) => {
    const order = orders.find(o => o.id_pedido === orderId);
    if (!order) return;

    const itemsInOrder = getItemsForOrder(orderId);
    const totalVal = calculateOrderTotal(orderId);
    const clientName = getClientName(order.id_cliente);
    const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR');
    const entregaDate = order.entrega ? new Date(order.entrega).toLocaleDateString('pt-BR') : 'A DEFINIR';

    const getDetailedPaymentMethod = () => {
      if (!order.pago) return 'PAGAMENTO PENDENTE';
      const tx = transactions.find(t => t.tipo === 'receita' && t.descricao.includes(`Pedido #${orderId}`));
      if (tx) {
        const match = tx.descricao.match(/\[(.*?)\]/);
        return match ? match[1].toUpperCase() : 'PAGO';
      }
      return 'PAGO';
    };

    const paymentInfo = getDetailedPaymentMethod();

    const receiptHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 280px; 
              margin: 0; 
              padding: 20px 10px 150px 10px;
              color: #000; 
              background: #fff;
              -webkit-print-color-adjust: exact;
              font-weight: bold;
            }
            .text-center { text-align: center; }
            .header { border-bottom: 3px solid #000; padding-bottom: 12px; margin-bottom: 15px; }
            .header h2 { margin: 0; font-size: 22px; text-transform: uppercase; font-weight: 900; }
            .header p { margin: 5px 0; font-size: 12px; font-weight: 900; }
            .info { font-size: 14px; text-transform: uppercase; margin-bottom: 12px; }
            .info div { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .dashed { border-top: 2px dashed #000; margin: 12px 0; }
            .item { font-size: 14px; margin-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; font-weight: 900; }
            .obs { font-size: 12px; font-style: italic; margin-left: 12px; margin-top: 2px; color: #000; }
            .total { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; border-top: 3px solid #000; padding-top: 12px; }
            .total-lbl { font-size: 16px; font-weight: 900; }
            .total-val { font-size: 26px; font-weight: 900; }
            .pago-box { border: 3px solid #000; padding: 12px; text-align: center; font-weight: 900; font-size: 16px; margin: 20px 0; text-transform: uppercase; }
            .payment-detail { text-align: center; font-size: 12px; margin-top: -15px; margin-bottom: 15px; }
            .delivery { text-align: center; border: 2px solid #000; padding: 12px; border-radius: 4px; }
            .delivery p { margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; }
            .delivery h3 { margin: 8px 0; font-size: 22px; font-weight: 900; }
            .footer-msg { margin-top: 40px; font-size: 10px; text-transform: uppercase; }
            .cut-area { height: 180px; }
          </style>
        </head>
        <body onload="window.focus(); window.print();">
          <div class="header text-center">
            <h2>EDITE BORGES</h2>
            <p>ATELIER DE COSTURA</p>
          </div>
          <div class="info">
            <div><span>Pedido:</span><span>#${orderId}</span></div>
            <div><span>Data:</span><span>${orderDate}</span></div>
            <div><span>Cliente:</span><span>${clientName}</span></div>
          </div>
          <div class="dashed"></div>
          <div class="items-list">
            ${itemsInOrder.map(item => `
              <div class="item">
                <div class="item-row">
                  <span>${item.quantidade}x ${item.descreçao}</span>
                  <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.total))}</span>
                </div>
                ${item.obicervação ? `<div class="obs">>> ${item.obicervação}</div>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span class="total-lbl">TOTAL:</span>
            <span class="total-val">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}</span>
          </div>
          
          <div class="pago-box">
            ${order.pago ? '*** PAGO ***' : '!!! PENDENTE !!!'}
          </div>
          ${order.pago ? `<div class="payment-detail">FORMA: ${paymentInfo}</div>` : ''}
          
          <div class="delivery">
            <p>Previsão de Retirada:</p>
            <h3>${entregaDate}</h3>
          </div>
          <div class="footer-msg text-center">
            Obrigado pela preferência!<br>
            Deus abençoe seu dia.
          </div>
          <div class="cut-area"></div>
          <div class="text-center">.</div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(receiptHtml);
      doc.close();
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 10000);
    }
  };

  const getPaymentLabel = (tipo: PagamentoTipo, subtipo: CartaoTipo) => {
    if (tipo === 'dinheiro_pix') return '[PIX/Dinheiro]';
    if (tipo === 'cartao') return `[Cartão ${subtipo === 'credito' ? 'Crédito' : 'Débito'}]`;
    return '';
  };

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

    if (estaPago && !pagamentoTipo) {
      alert("Selecione a forma de pagamento!");
      return;
    }
    
    const createdOrder = await onAdd({ 
      id_cliente: finalClientId, 
      entrega: dataEntrega, 
      status: 'em concerto', 
      pago: estaPago 
    }, items, estaPago ? getPaymentLabel(pagamentoTipo, cartaoSubtipo) : undefined);

    if (createdOrder && createdOrder.id_pedido) {
      setPrintOrderId(createdOrder.id_pedido);
    }
    
    setShowModal(false);
    resetForm();
  };

  const handleUpdateToPaid = (orderId: number) => {
    if (!pagamentoTipo) {
      alert("Selecione a forma de pagamento!");
      return;
    }
    onUpdateOrder(orderId, { pago: true }, getPaymentLabel(pagamentoTipo, cartaoSubtipo));
    setPendingPaymentOrderId(null);
    setPagamentoTipo(null);
    setCartaoSubtipo(null);
  };

  const resetForm = () => {
    setClientType('existing'); setSelectedClientId(''); setNewClientNome(''); setNewClientNumero('');
    setDataEntrega(''); setEstaPago(false); setPagamentoTipo(null); setCartaoSubtipo(null);
    setItems([{ descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }]);
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

  const statusColors = {
    'em concerto': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'pronto': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'entregue': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors pb-24 relative">
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

          {filteredOrders.map(order => (
            <div key={order.id_pedido} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 text-left">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-gray-900 dark:text-white truncate">{getClientName(order.id_cliente)}</h3>
                    <button 
                      onClick={() => handleWhatsApp(order.id_cliente)}
                      className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center active:scale-90 transition-all"
                    >
                      <i className="fa-brands fa-whatsapp text-[10px]"></i>
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {getItemsForOrder(order.id_pedido).slice(0, 3).map((item, idx) => (
                      <p key={idx} className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">• {item.descreçao}</p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[order.status]}`}>{order.status}</span>
                  <button onClick={() => setPrintOrderId(order.id_pedido)} className="w-8 h-8 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-lg flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-receipt text-xs"></i>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
                <div className="flex flex-col">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Total</p>
                  <p className="text-sm font-black text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(order.id_pedido))}</p>
                </div>
                <div className="flex space-x-2">
                  {order.pago ? (
                    <span className="px-3 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-[9px] font-black uppercase tracking-widest">Pago</span>
                  ) : (
                    <button 
                      onClick={() => { setPagamentoTipo(null); setCartaoSubtipo(null); setPendingPaymentOrderId(order.id_pedido); }} 
                      className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-[9px] font-black uppercase tracking-widest"
                    >
                      Pendente
                    </button>
                  )}
                  {order.status !== 'entregue' && (
                    <button onClick={() => onUpdateOrder(order.id_pedido, { status: order.status === 'em concerto' ? 'pronto' : 'entregue' })} className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                      {order.status === 'em concerto' ? 'Pronto' : 'Entregar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end justify-center px-4 sm:px-0">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar transition-colors">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Novo Pedido</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6 pb-10">
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
                    <button type="button" onClick={() => setItems([...items, { descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }])} className="text-rose-600 font-black text-[9px] uppercase bg-rose-50 px-3 py-1.5 rounded-full">+ Item</button>
                  </div>
                  {items.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-3xl space-y-3 relative border border-gray-100 dark:border-slate-800">
                      <input required className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100" placeholder="Descrição (ex: Barra Calça)" value={item.descreçao} onChange={e => updateItem(index, 'descreçao', e.target.value)} />
                      <div className="grid grid-cols-2 gap-3">
                        <input required type="number" className="w-full p-3 bg-white dark:bg-slate-900 text-xs rounded-xl border border-gray-100" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', e.target.value)} />
                        <input required type="number" step="0.01" className="w-full p-3 bg-white dark:bg-slate-900 text-xs rounded-xl border border-gray-100" placeholder="R$ Unit." value={item.valor_unidade} onChange={e => updateItem(index, 'valor_unidade', e.target.value)} />
                      </div>
                      <textarea className="w-full p-3 bg-white dark:bg-slate-900 text-[10px] text-gray-600 dark:text-gray-300 rounded-xl border border-gray-100 dark:border-slate-800 italic" placeholder="Observações..." value={item.obicervação} onChange={e => updateItem(index, 'obicervação', e.target.value)} rows={2} />
                      {items.length > 1 && <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-[10px]"><i className="fa-solid fa-trash"></i></button>}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-5 rounded-3xl">
                    <span className="text-[10px] font-black uppercase text-gray-500">Já está pago?</span>
                    <button type="button" onClick={() => { setEstaPago(!estaPago); if(estaPago) { setPagamentoTipo(null); setCartaoSubtipo(null); } }} className={`w-12 h-6 rounded-full relative transition-all ${estaPago ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${estaPago ? 'left-7' : 'left-1'}`}></div></button>
                  </div>

                  {estaPago && (
                    <div className="space-y-4 animate-slide-in">
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { setPagamentoTipo('dinheiro_pix'); setCartaoSubtipo(null); }} className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${pagamentoTipo === 'dinheiro_pix' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 text-gray-600 dark:text-gray-400'}`}>
                          <i className="fa-solid fa-sack-dollar text-xs"></i>
                          <span className="font-bold text-[10px] uppercase">PIX/Dinheiro</span>
                        </button>
                        <button type="button" onClick={() => setPagamentoTipo('cartao')} className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${pagamentoTipo === 'cartao' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 text-gray-600 dark:text-gray-400'}`}>
                          <i className="fa-solid fa-credit-card text-xs"></i>
                          <span className="font-bold text-[10px] uppercase">Cartão</span>
                        </button>
                      </div>

                      {pagamentoTipo === 'cartao' && (
                        <div className="grid grid-cols-2 gap-3 animate-slide-in">
                          <button type="button" onClick={() => setCartaoSubtipo('credito')} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${cartaoSubtipo === 'credito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}>Crédito</button>
                          <button type="button" onClick={() => setCartaoSubtipo('debito')} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${cartaoSubtipo === 'debito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}>Débito</button>
                        </div>
                      )}
                    </div>
                  )}
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

        {/* --- MODAL DE CONFIRMAÇÃO DE PAGAMENTO (PEDIDO EXISTENTE) --- */}
        {pendingPaymentOrderId && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-slide-up text-center">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Confirmar Pagamento</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Pedido #{pendingPaymentOrderId}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => { setPagamentoTipo('dinheiro_pix'); setCartaoSubtipo(null); }} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${pagamentoTipo === 'dinheiro_pix' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600'}`}>
                    <i className="fa-solid fa-sack-dollar mb-2"></i>
                    <span className="font-black text-[9px] uppercase">PIX/Dinheiro</span>
                  </button>
                  <button type="button" onClick={() => setPagamentoTipo('cartao')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${pagamentoTipo === 'cartao' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-600'}`}>
                    <i className="fa-solid fa-credit-card mb-2"></i>
                    <span className="font-black text-[9px] uppercase tracking-tighter">Cartão</span>
                  </button>
                </div>

                {pagamentoTipo === 'cartao' && (
                  <div className="grid grid-cols-2 gap-3 animate-slide-in">
                    <button type="button" onClick={() => setCartaoSubtipo('credito')} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${cartaoSubtipo === 'credito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}>Crédito</button>
                    <button type="button" onClick={() => setCartaoSubtipo('debito')} className={`p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${cartaoSubtipo === 'debito' ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}>Débito</button>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => handleUpdateToPaid(pendingPaymentOrderId)}
                  disabled={!pagamentoTipo || (pagamentoTipo === 'cartao' && !cartaoSubtipo)}
                  className="w-full py-4 bg-green-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-30"
                >
                  Confirmar e Receber
                </button>
                <button onClick={() => setPendingPaymentOrderId(null)} className="py-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- OVERLAY DE PRÉ-VISUALIZAÇÃO --- */}
        {printOrderId && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-6 transition-all animate-fade-in">
            <button onClick={() => setPrintOrderId(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-[320px] mb-8 overflow-hidden font-mono text-black scale-100 sm:scale-110">
              <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                <h2 className="text-lg font-black uppercase leading-tight">Edite Borges</h2>
                <p className="text-[10px] font-bold uppercase">Atelier de Costura</p>
              </div>
              <div className="text-[11px] space-y-1 uppercase mb-4">
                <div className="flex justify-between"><span>Pedido:</span><span>#{printOrderId}</span></div>
                <div className="flex justify-between"><span>Data:</span><span>{new Date(orders.find(o => o.id_pedido === printOrderId)?.created_at || '').toLocaleDateString('pt-BR')}</span></div>
                <div className="flex justify-between items-center">
                  <span>Cliente:</span>
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-[120px]">{getClientName(orders.find(o => o.id_pedido === printOrderId)?.id_cliente || '')}</span>
                    <button 
                      onClick={() => handleWhatsApp(orders.find(o => o.id_pedido === printOrderId)?.id_cliente || '')}
                      className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center"
                    >
                      <i className="fa-brands fa-whatsapp text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="border-y border-dashed border-gray-300 py-3 mb-4 max-h-48 overflow-y-auto">
                {getItemsForOrder(printOrderId).map((item, i) => (
                  <div key={i} className="text-[11px] mb-2">
                    <div className="flex justify-between font-bold">
                      <span className="uppercase">{item.quantidade}x {item.descreçao}</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.total))}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase">Total:</span>
                <span className="text-xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(printOrderId))}</span>
              </div>
              <div className="text-center py-1 border border-black rounded text-[10px] font-black uppercase">
                {orders.find(o => o.id_pedido === printOrderId)?.pago ? '*** PAGO ***' : '!!! PENDENTE !!!'}
              </div>
              {orders.find(o => o.id_pedido === printOrderId)?.pago && (
                 <div className="text-center text-[9px] font-black uppercase mt-1 opacity-60">
                   FORMA: {(() => {
                     const tx = transactions.find(t => t.tipo === 'receita' && t.descricao.includes(`Pedido #${printOrderId}`));
                     if (tx) {
                       const match = tx.descricao.match(/\[(.*?)\]/);
                       return match ? match[1].toUpperCase() : 'PAGO';
                     }
                     return 'PAGO';
                   })()}
                 </div>
              )}
            </div>

            <button onClick={() => executeIframePrint(printOrderId)} className="px-10 py-5 bg-rose-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-2xl flex items-center space-x-3 active:scale-95 transition-all">
              <i className="fa-solid fa-print"></i>
              <span>Imprimir Recibo</span>
            </button>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-widest opacity-60">Pré-visualização da Via do Cliente</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
      `}</style>
    </>
  );
};

export default Orders;
