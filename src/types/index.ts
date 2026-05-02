export type OrderStatus = 'new' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type Station = 'grill' | 'fry' | 'prep' | 'bar' | 'expo';

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  mods: string[];
  customizations: string;
  station: Station;
  status: 'pending' | 'fired' | 'ready';
}

export interface Order {
  id: string;
  table_number: string;
  customer_name: string;
  order_type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  special_requests: string;
  delivery_address?: string;
  priority: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffMessage {
  id: string;
  from_role: string;
  to_role: string;
  order_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
