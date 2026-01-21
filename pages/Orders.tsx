
import React, { useState, useMemo } from 'react';
import { User, Order, Client, OrderItem } from '../types';
// Importação explícita para resolver erro de tipo no ambiente
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
  const [printOrderId, setPrintOrderId] = useState<number | null>(null);
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

  const getClientPhone = (id_cliente: string) => {
    const client = clients.find(c => String(c.id) === id_cliente);
    return client ? client.numero : '';
  };

  const getItemsForOrder = (id_pedido: number) => {
    return orderItems.filter(item => String(item.id_pedido) === String(id_pedido));
  };

  const calculateOrderTotal = (id_pedido: number) => {
    return getItemsForOrder(id_pedido).reduce((acc, item) => acc + parseFloat(item.total || '0'), 0);
  };

  const triggerPrint = () => {
    window.print();
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

  // Renderiza o preview do recibo para o modal
  const renderReceiptPreview = (id: number) => {
    const order = orders.find(o => o.id_pedido === id);
    if (!order) return null;
    
    const itemsInOrder = getItemsForOrder(id);
    const totalVal = calculateOrderTotal(id);
    const clientName = getClientName(order.id_cliente);
    const clientPhone = getClientPhone(order.id_cliente);

    return (
      <div id="receipt-printable-content" className="receipt-paper bg-white text-black p-6 shadow-inner mx-auto max-w-[320px] font-mono border-t-8 border-black">
        <div className="text-center mb-6 border-b-4 border-dashed border-black pb-4">
          <h2 className="text-2xl font-black mb-1 tracking-tighter text-black uppercase leading-none">ATELIER EDITE BORGES</h2>
          <p className="text-[11px] font-black uppercase text-black">SERVIÇOS DE COSTURA E AJUSTES</p>
        </div>
        
        <div className="text-[12px] space-y-1 mb-4 text-black font-bold">
          <div className="flex justify-between">
            <span className="font-black">PEDIDO:</span>
            <span className="font-black">#{order.id_pedido}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">DATA:</span>
            <span>{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-black">CLIENTE:</span>
            <span className="truncate max-w-[150px] uppercase">{clientName}</span>
          </div>
          {clientPhone && (
            <div className="flex justify-between">
              <span className="font-black">TEL:</span>
              <span>{clientPhone}</span>
            </div>
          )}
        </div>

        <div className="border-t-2 border-b-2 border-dashed border-black py-3 mb-4">
          <p className="text-[11px] font-black uppercase mb-2 text-black underline">Itens do Pedido:</p>
          {itemsInOrder.map((item, idx) => (
            <div key={idx} className="flex justify-between text-[12px] mb-1 text-black font-bold">
              <span className="flex-1 pr-2 uppercase">{item.quantidade}x {item.descreçao}</span>
              <span className="font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(item.total))}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4 text-black">
          <span className="text-[12px] font-black">TOTAL A PAGAR:</span>
          <span className="text-2xl font-black underline decoration-2">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal)}</span>
        </div>

        <div className={`text-center py-3 px-4 border-4 border-black rounded-lg mb-6 bg-white`}>
          <span className="text-lg font-black tracking-[0.2em] uppercase text-black">{order.pago ? '*** PAGO ***' : '--- PENDENTE ---'}</span>
        </div>

        <div className="text-center border-t-2 border-dashed border-black pt-4 text-black mb-6">
          <p className="text-[11px] font-black uppercase mb-1">Previsão de Entrega:</p>
          <p className="text-xl font-black">{order.entrega ? new Date(order.entrega).toLocaleDateString('pt-BR') : 'A DEFINIR'}</p>
        </div>

        {/* NOVA SEÇÃO DE INSTRUÇÕES E CONTATO CONFORME IMAGEM */}
        <div className="space-y-4 text-black pt-2 border-t border-black">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-center uppercase underline mb-2">Instruções</p>
            <p className="text-[9px] font-bold leading-tight">1 - O pagamento pode ser realizado via PIX, em dinheiro ou no cartão à vista.</p>
            <p className="text-[9px] font-bold leading-tight">2 - Caso o pedido não seja retirado em até 3 meses, ele poderá ser vendido, configurando desistência por parte do cliente.</p>
            <p className="text-[9px] font-bold leading-tight">3 - O prazo para reconserto é de 15 dias após a data de entrega.</p>
            <p className="text-[9px] font-bold leading-tight">4 - Em casos onde o cliente trouxer a peça já marcada, não será realizado reconserto.</p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-[10px] font-black uppercase">Contato e Localização</p>
            <p className="text-[9px] font-bold">Endereço: Desembargador Otávio do Amaral, 547 - Bigorrilho</p>
          </div>

          <div className="text-center space-y-1 bg-black/5 p-2 rounded">
            <p className="text-[10px] font-black uppercase">Horário de Funcionamento:</p>
            <p className="text-[9px] font-bold">Segunda à Sexta: 09:00 - 18:00</p>
          </div>

          <div className="text-center pt-2 border-t border-dashed border-black">
            <p className="text-xl font-black tracking-tighter">(41) 99593-7861 PIX</p>
            <p className="text-[10px] font-bold mt-1 uppercase">Instagram: <span className="font-black">@borgesmariaedite</span></p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-[9px] font-black text-black opacity-40">
          <p>OBRIGADO PELA CONFIANÇA!</p>
          <p>atelierediteborges.cloud</p>
        </div>
      </div>
    );
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
            const clientName = getClientName(order.id_cliente);

            return (
              <div key={order.id_pedido} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden transition-all">
                {order.pago && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-12 -mt-12 flex items-end justify-start pl-4 pb-4">
                    <i className="fa-solid fa-circle-check text-green-500 text-xs"></i>
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-black text-gray-900 dark:text-white truncate pr-2">{clientName}</h3>
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
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setPrintOrderId(order.id_pedido)}
                        className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center hover:bg-violet-600 hover:text-white transition-all shadow-sm"
                        title="Ver Recibo"
                      >
                        <i className="fa-solid fa-receipt text-sm"></i>
                      </button>
                      <button 
                        onClick={() => togglePago(order)}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border flex items-center space-x-1 ${order.pago ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-600' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600'}`}
                      >
                        <i className={`fa-solid ${order.pago ? 'fa-check-circle' : 'fa-clock'}`}></i>
                        <span>{order.pago ? 'Pago' : 'Pendente'}</span>
                      </button>
                    </div>
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

      {/* MODAL DE NOVO PEDIDO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-end justify-center px-4 sm:px-0">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-6 sm:p-8 space-y-6 animate-slide-up border-t border-gray-100 dark:border-slate-800 overflow-y-auto max-h-[92vh] no-scrollbar shadow-2xl transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Novo Pedido</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Informações de serviço</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
              <button 
                type="button"
                onClick={() => setClientType('existing')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${clientType === 'existing' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}
              >
                Existente
              </button>
              <button 
                type="button"
                onClick={() => setClientType('new')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${clientType === 'new' ? 'bg-white dark:bg-slate-700 text-violet-600 shadow-sm' : 'text-gray-500'}`}
              >
                Novo Cadastro
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-12">
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
                  <button type="button" onClick={addItemRow} className="text-violet-600 font-bold text-[10px] bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-full flex items-center space-x-1 hover:bg-violet-100 transition-colors">
                    <i className="fa-solid fa-plus text-[8px]"></i>
                    <span>Adicionar Item</span>
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-3xl space-y-3 relative border border-gray-100 dark:border-slate-800 group transition-all">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(index)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-red-500 hover:text-white transition-all">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                    <div>
                      <input
                        required
                        className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                        placeholder="Descrição do serviço"
                        value={item.descreçao}
                        onChange={e => updateItem(index, 'descreçao', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <input
                          required
                          type="number"
                          className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all text-center"
                          placeholder="Qtd"
                          value={item.quantidade}
                          onChange={e => updateItem(index, 'quantidade', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          required
                          type="number"
                          step="0.01"
                          className="w-full p-3 bg-white dark:bg-slate-900 text-xs text-gray-900 dark:text-white rounded-xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                          placeholder="R$ Uni"
                          value={item.valor_unidade}
                          onChange={e => updateItem(index, 'valor_unidade', e.target.value)}
                        />
                      </div>
                      <div className="col-span-5 flex items-center justify-end px-1">
                        <span className="text-[11px] font-black text-gray-900 dark:text-white truncate">
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
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Financeiro</p>
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

              <div className="bg-violet-600 p-6 rounded-[2.5rem] text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl shadow-violet-100 dark:shadow-none">
                <div className="w-full text-center sm:text-left">
                  <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest mb-0.5">Total Estimado</p>
                  <p className="text-2xl font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal)}</p>
                </div>
                <div className="w-full text-center sm:text-right">
                   <p className="text-[10px] font-bold uppercase opacity-70 mb-1.5 tracking-widest">Data de Previsão</p>
                   <input
                    required
                    type="date"
                    className="w-full sm:w-auto bg-white/20 p-2.5 rounded-xl text-xs font-black outline-none border border-white/30 text-white placeholder-white"
                    value={dataEntrega}
                    onChange={e => setDataEntrega(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-5 bg-violet-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:bg-violet-700 active:scale-95 transition-all mt-4"
              >
                {clientType === 'new' ? 'Cadastrar e Salvar Pedido' : 'Finalizar e Salvar Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE RECIBO */}
      {printOrderId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto no-scrollbar">
          <div className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6 text-white px-2">
              <div>
                <h3 className="text-xl font-black">Pré-visualização</h3>
                <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Confira os dados antes de imprimir</p>
              </div>
              <button onClick={() => setPrintOrderId(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="animate-in fade-in zoom-in duration-300 w-full">
              {renderReceiptPreview(printOrderId)}
            </div>

            <div className="grid grid-cols-1 w-full gap-3 mt-8">
              <button 
                onClick={triggerPrint}
                className="w-full py-5 bg-violet-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-900/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                <i className="fa-solid fa-print"></i>
                <span>Imprimir Agora</span>
              </button>
              <button 
                onClick={() => setPrintOrderId(null)}
                className="w-full py-4 text-white/60 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors"
              >
                Voltar aos Pedidos
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        
        .receipt-paper {
          position: relative;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3));
        }
        
        /* Efeito de papel serrilhado na base */
        .receipt-paper::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 0;
          width: 100%;
          height: 10px;
          background: linear-gradient(-135deg, white 5px, transparent 0) 0 5px, linear-gradient(135deg, white 5px, transparent 0) 0 5px;
          background-size: 10px 10px;
          background-repeat: repeat-x;
        }

        @media print {
          /* Esconde tudo exceto o conteúdo do recibo */
          body * { visibility: hidden !important; background: transparent !important; }
          #receipt-printable-content, #receipt-printable-content * { 
            visibility: visible !important; 
            color: #000 !important;
            opacity: 1 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: 900 !important;
          }
          #receipt-printable-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
          /* Remove decorações de preview na impressão real */
          .receipt-paper::after { display: none; }
          @page { margin: 0; size: auto; }
        }
      `}</style>
    </div>
  );
};

export default Orders;
