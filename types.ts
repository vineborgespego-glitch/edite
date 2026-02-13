
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

export interface TotalDiario {
  created_at: string; // Usado como PK (data do dia)
  valor_total: string;
  descrições_serviços: string;
  clientes: string;
  pedidos_ids?: string;
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
  descreçao: string;
  quantidade: string;
  valor_unidade: string;
  total: string;
  id_pedido: string | number;
  obicervação?: string;
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
  totalDiario: TotalDiario[];
}
