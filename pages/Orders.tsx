
import React, { useState, useMemo } from 'react';
import { User, Order, Client, OrderItem, Transaction } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface OrdersProps {
  user: User;
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  transactions: Transaction[];
  onAdd: (order: Omit<Order, 'id_pedido' | 'created_at'>, items: Omit<OrderItem, 'id_item' | 'id_pedido'>[]) => Promise<any>;
  onAddClient: (c: { nome: string; numero: string }) => Promise<any>;
  onUpdateOrder: (id: number, updates: Partial<Order>) => void;
}

export default function Orders({ user, orders, orderItems, clients, onAdd, onAddClient, onUpdateOrder }: OrdersProps) {
  const [showModal, setShowModal] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Order['status'] | 'Todos'>('Todos');
  
  const [clientType, setClientType] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientNome, setNewClientNome] = useState('');
  const [newClientNumero, setNewClientNumero] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [estaPago, setEstaPago] = useState(false);

  const [items, setItems] = useState<Omit<OrderItem, 'id_item' | 'id_pedido'>[]>([
    { descreçao: '', quantidade: '1', valor_unidade: '', total: '0', obicervação: '' }
  ]);

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];
    if (filter !== 'Todos') list = list.filter(o => o.status === filter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, filter]);

  const getClientData = (id_cliente: string) => {
    const client = clients.find(c => String(c.id) === id_cliente);
    return client || { nome: 'Cliente Desconhecido', numero: 'N/A' };
  };

  const getItemsForOrder = (id_pedido: number) => {
    if (!Array.isArray(orderItems)) return [];
    return orderItems.filter(item => Number(item.id_pedido || (item as any).pedido_id) === Number(id_pedido));
  };

  const calculateOrderTotal = (id_pedido: number) => {
    const matchedItems = getItemsForOrder(id_pedido);
    return matchedItems.reduce((acc, item) => acc + (parseFloat(item.total) || 0), 0);
  };

  const executeIframePrint = (orderId: number) => {
    const order = orders.find(o => o.id_pedido === orderId);
    if (!order) return;
    const itemsInOrder = getItemsForOrder(orderId);
    const totalVal = calculateOrderTotal(orderId);
    const clientData = getClientData(order.id_cliente);
    const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR');
    const entregaDate = order.entrega ? new Date(order.entrega).toLocaleDateString('pt-BR') : 'A DEFINIR';

    const receiptHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Courier New', monospace; width: 280px; margin: 0; padding: 10px; font-weight: bold; font-size: 12px; line-height: 1.2; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .items { margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { display: flex; justify-content: space-between; border-top: 1px dashed #000; padding-top: 10px; margin-top: 5px; font-size: 16px; font-weight: 900; }
            .payment-status { text-align: center; border: 1px solid #000; padding: 5px; margin: 10px 0; font-weight: 900; }
            .footer { margin-top: 15px; font-size: 9px; text-align: center; border-top: 1px dashed #000; padding-top: 10px; }
            .instructions { text-align: center; font-size: 8px; margin-top: 10px; text-transform: uppercase; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h2 style="margin:0">EDITE BORGES</h2>
            <p style="margin:0; font-size:10px">ATELIER DE COSTURA</p>
          </div>
          <p style="margin:2px 0">PEDIDO: #${orderId}</p>
          <p style="margin:2px 0">DATA: ${orderDate}</p>
          <p style="margin:2px 0">CLIENTE: ${clientData.nome}</p>
          <p style="margin:2px 0">TEL: ${clientData.numero}</p>
          <hr style="border:none; border-top: 1px dashed #000">
          <div class="items">
            ${itemsInOrder.map(i => `
              <div class="item">
                <span>${i.quantidade}x ${i.descreçao}</span>
                <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(i.total))}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>TOTAL:</span>
            <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}</span>
          </div>
          <div class="payment-status">${order.pago ? 'PAGO' : 'PENDENTE'}</div>
          <p style="margin:5px 0; text-align:center">ENTREGA: ${entregaDate}</p>
          
          <div class="footer">
            R. Des. Otávio do Amaral, 547 - Bigorrilho<br>
            (41) 99593-7861 PIX
          </div>
          
          <div class="instructions">
            OBRIGADO PELA PREFERÊNCIA!<br><br>
            NÃO NOS RESPONSABILIZAMOS POR PEÇAS<br>
            DEIXADAS POR MAIS DE 90 DIAS.<br><br>
            CONFIRA SUAS PEÇAS NO ATO DA RETIRADA.
          </div>
        </body>
      </html>
    `;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.contentWindow?.document.write(receiptHtml);
    iframe.contentWindow?.document.close();
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalClientId = selectedClientId;
    if (clientType === 'new') {
      const addedClient = await onAddClient({ nome: newClientNome, numero: newClientNumero.replace(/\D/g, '') });
      finalClientId = String(addedClient?.id || '');
    }
    const createdOrder = await onAdd({ id_cliente: finalClientId, entrega: dataEntrega, status: 'em concerto', pago: estaPago }, items);
    if (createdOrder?.id_pedido) setPrintOrderId(createdOrder.id_pedido);
    setShowModal(false); resetForm();
  };

  const resetForm = () => {
    setClientType('existing'); setSelectedClientId(''); setNewClientNome(''); setNewClientNumero('');
    setDataEntrega(''); setEstaPago(false);
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
    newItems[index] = item; setItems(newItems);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fffafb] dark:bg-slate-950 transition-colors pb-24 relative">
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <Link to="/" className="w-10 h-10 bg-white dark:bg-slate-800 text-gray-400 rounded-xl flex items-center justify-center shadow-lg border border-rose-100 dark:border-slate-800"><i className="fa-solid fa-chevron-left"></i></Link>
        <div className="hidden sm:block text-left">
          <p className="text-[10px] font-black text-rose-600 uppercase">Atelier</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Edite Borges</p>
        </div>
      </div>
      
      <div className="absolute top-6 right-6 flex items-center space-x-3">
        <ThemeToggle />
        <button onClick={() => { resetForm(); setShowModal(true); }} className="w-10 h-10 bg-rose-600 text-white rounded-xl shadow-lg"><i className="fa-solid fa-plus"></i></button>
      </div>

      <main className="px-6 pt-32 space-y-4">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
          {['Todos', 'em concerto', 'pronto', 'entregue'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${filter === f ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-400 border border-gray-100 dark:border-slate-800'}`}>
              {f === 'em concerto' ? 'Oficina' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredOrders.map(order => (
          <div key={order.id_pedido} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white">{getClientData(order.id_cliente).nome}</h3>
                <div className="mt-2 space-y-1">
                  {getItemsForOrder(order.id_pedido).slice(0, 2).map((item, idx) => (
                    <p key={idx} className="text-[10px] text-gray-500 font-bold uppercase">• {item.descreçao}</p>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'em concerto' ? 'bg-amber-100 text-amber-700' : order.status === 'pronto' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{order.status}</span>
                <button onClick={() => setPrintOrderId(order.id_pedido)} className="w-8 h-8 bg-gray-50 dark:bg-slate-800 text-gray-400 rounded-lg"><i className="fa-solid fa-receipt text-xs"></i></button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800">
              <p className="text-sm font-black text-rose-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(order.id_pedido))}</p>
              <div className="flex space-x-2">
                <button onClick={() => onUpdateOrder(order.id_pedido, { pago: !order.pago })} className={`px-3 py-2 border rounded-xl text-[9px] font-black uppercase ${order.pago ? 'bg-green-50 text-green-600 border-green-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>{order.pago ? 'Pago' : 'Pendente'}</button>
                {order.status !== 'entregue' && (
                  <button onClick={() => onUpdateOrder(order.id_pedido, { status: order.status === 'em concerto' ? 'pronto' : 'entregue' })} className="px-3 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase">
                    {order.status === 'em concerto' ? 'Pronto' : 'Entregar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end justify-center px-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar pb-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Novo Pedido</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                <button type="button" onClick={() => setClientType('existing')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${clientType === 'existing' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Existente</button>
                <button type="button" onClick={() => setClientType('new')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl ${clientType === 'new' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}>Novo</button>
              </div>
              {clientType === 'existing' ? (
                <select required className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 font-bold" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                  <option value="">Buscar cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              ) : (
                <div className="space-y-4">
                  <input required className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" placeholder="Nome do Cliente" value={newClientNome} onChange={e => setNewClientNome(e.target.value)} />
                  <input required className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" placeholder="Telefone" value={newClientNumero} onChange={e => setNewClientNumero(e.target.value)} />
                </div>
              )}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-3xl space-y-3 relative border border-gray-100 dark:border-slate-800">
                    <input required className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl text-xs" placeholder="Descrição" value={item.descreçao} onChange={e => updateItem(index, 'descreçao', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <input required type="number" className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', e.target.value)} />
                      <input required type="number" step="0.01" className="p-3 bg-white dark:bg-slate-900 rounded-xl text-xs" placeholder="R$ Unit." value={item.valor_unidade} onChange={e => updateItem(index, 'valor_unidade', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
                <div className="bg-rose-600 p-4 rounded-2xl text-white text-right">
                  <p className="text-[9px] font-black opacity-70 uppercase tracking-widest">Total</p>
                  <p className="text-lg font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(items.reduce((acc, i) => acc + (parseFloat(i.total) || 0), 0))}</p>
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-rose-600 text-white font-black uppercase rounded-2xl shadow-xl">Salvar Pedido</button>
            </form>
          </div>
        </div>
      )}

      {printOrderId && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6">
          <button onClick={() => setPrintOrderId(null)} className="absolute top-6 right-6 text-white text-xl"><i className="fa-solid fa-xmark"></i></button>
          <div className="bg-white p-6 rounded-xl w-full max-w-[300px] font-mono text-black scale-95 shadow-2xl">
            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h2 className="font-black uppercase text-sm">Edite Borges</h2>
              <p className="text-[10px]">Atelier de Costura</p>
            </div>
            <div className="text-[10px] space-y-1 mb-4">
              <p>PEDIDO: #${printOrderId}</p>
              <p>DATA: {new Date(orders.find(o => o.id_pedido === printOrderId)?.created_at || '').toLocaleDateString('pt-BR')}</p>
              <p>CLIENTE: {getClientData(orders.find(o => o.id_pedido === printOrderId)?.id_cliente || '').nome}</p>
              <p>TEL: {getClientData(orders.find(o => o.id_pedido === printOrderId)?.id_cliente || '').numero}</p>
            </div>
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-2">
              {getItemsForOrder(printOrderId).map((i, idx) => (
                <div key={idx} className="flex justify-between text-[10px]">
                  <span>{i.quantidade}x {i.descreçao}</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(i.total))}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-gray-300 pt-3 mt-3 flex justify-between font-black text-sm">
              <span>TOTAL:</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateOrderTotal(printOrderId))}</span>
            </div>
            <div className="text-center py-2 border border-black mt-4 font-black uppercase text-xs">*** {orders.find(o => o.id_pedido === printOrderId)?.pago ? 'PAGO' : 'PENDENTE'} ***</div>
            <div className="mt-4 text-[8px] text-center border-t border-dashed border-gray-300 pt-3 uppercase leading-tight">
              R. Des. Otávio do Amaral, 547 - Bigorrilho<br/>(41) 99593-7861 PIX<br/><br/>
              <b>OBRIGADO PELA PREFERÊNCIA!</b><br/><br/>
              NÃO NOS RESPONSABILIZAMOS POR PEÇAS<br/>DEIXADAS POR MAIS DE 90 DIAS.<br/><br/>
              CONFIRA SUAS PEÇAS NO ATO DA RETIRADA.
            </div>
          </div>
          <button onClick={() => executeIframePrint(printOrderId)} className="mt-8 px-10 py-5 bg-rose-600 text-white font-black rounded-2xl shadow-xl"><i className="fa-solid fa-print mr-2"></i>Imprimir Recibo</button>
        </div>
      )}
    </div>
  );
}
