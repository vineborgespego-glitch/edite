
import React from 'react';
import { User } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../App';
// Importação explícita para resolver erro de tipo no ambiente
import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface UsuariosProps {
  users: User[];
  onDelete: () => void;
}

const Usuarios: React.FC<UsuariosProps> = ({ users, onDelete }) => {
  
  const handleDelete = async (id: number, email: string) => {
    if (email === 'admin@admin.com') return;
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await fetch(`${SUPABASE_URL}/users?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      onDelete();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors pb-20">
      <header className="bg-white dark:bg-slate-900 px-6 pt-12 pb-6 sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-4">
          <Link to="/" className="w-10 h-10 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-gray-100 dark:border-slate-700">
            <i className="fa-solid fa-chevron-left"></i>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="px-6 py-6 space-y-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">Controle direto da base de dados Supabase</p>
        
        {users.map(u => (
          <div key={u.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${u.role ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'}`}>
                {u.nome?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{u.nome} {u.role && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full ml-1 uppercase">Admin</span>}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(u.id, u.email)}
              disabled={u.email === 'admin@admin.com'}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${u.email === 'admin@admin.com' ? 'text-gray-200 dark:text-slate-800' : 'text-gray-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'}`}
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        ))}

        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 transition-colors">
          <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Segurança de Dados</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
            As alterações feitas nesta página refletem instantaneamente no Supabase. Usuários administradores têm visibilidade total das transações de outros membros.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Usuarios;
