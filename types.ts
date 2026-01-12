
export interface User {
  id: number;
  nome: string;
  email: string;
  role: boolean; // true = admin, false = user
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: 'receita' | 'despesa';
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  transactions: Transaction[];
  users: User[];
}
