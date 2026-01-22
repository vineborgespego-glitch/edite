
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

export interface Order {
  id_pedido: number;
  id_cliente: string;
  entrega: string;
  status: 'em concerto' | 'pronto' | 'entregue';
  pago: boolean;
  created_at: string;
}

export interface OrderItem {
  id_item: number;
  descreçao: string; // Conforme seu SQL
  quantidade: string;
  valor_unidade: string;
  total: string;
  id_pedido: string | number;
  obicervação?: string; // Conforme seu SQL
}

export interface Client {
  id: number;
  nome: string;
  numero: string;
  created_at: string;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  transactions: Transaction[];
  orders: Order[];
  orderItems: OrderItem[];
  clients: Client[];
  users: User[];
}
