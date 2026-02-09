
import React, { useState, useMemo } from 'react';
import { User, Client } from '../types';
// Fixed: Using namespace import and destructuring to bypass environment type resolution errors for react-router-dom
import * as ReactRouterDOM from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

const { Link } = ReactRouterDOM as any;

interface ClientsProps {
  user: User;
  clients: Client[];
  onAdd: (c: { nome: string; numero: string }) => void;
  onDelete: (id: number) => void;
}

const Clients: React.FC<ClientsProps> = ({ user, clients, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states (matching DB schema: nome, numero)
  const [nome, setNome] = useState('');
  const [numero, setNumero] = useState('');

  const filteredClients = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    return clients
      .filter(c => c.nome?.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.nome?.localeCompare(b.nome));
  }, [clients, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      nome,
      numero: numero.replace(/\D/g, '')
    });
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setNome('');
    setNumero('');
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-24">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Clientes</h1>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button 
            onClick={() => setShowModal(true)}
            className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-100 dark:shadow-none active:scale-95 transition-all"
          >
            <i className="fa-solid fa-user-plus"></i>
          </button>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm text-gray-700 dark:text-white"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <main className="px-6 space-y-3">
        {filteredClients.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-gray-300 opacity-30">
            <i className="fa-solid fa-users-slash text-6xl mb-4"></i>
            <p className="font-bold">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center font-black text-lg">
                  {client.nome?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{client.nome}</h3>
                  <p className="text-[10px] text-gray-500 font-bold">{client.numero}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleWhatsApp(client.numero)}
                  className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <i className="fa-brands fa-whatsapp text-lg"></i>
                </button>
                <button 
                  onClick={() => onDelete(client.id)}
                  className="w-10 h-10 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[2.5rem] p-8 space-y-6 animate-slide-up border-t border-gray-100 dark:border-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Novo Cliente</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
                <input
                  required
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="Nome do cliente"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Número (WhatsApp)</label>
                <input
                  required
                  className="w-full p-4 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white rounded-2xl border border-gray-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  placeholder="(00) 00000-0000"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-teal-100 dark:shadow-none hover:bg-teal-700 active:scale-95 transition-all"
              >
                Cadastrar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Clients;
