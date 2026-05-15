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
  status: 'pending' | 'fired' | 'ready' | 'unavailable';
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
  total_price: number;
  customer_id?: string;
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

export interface CustomerMessage {
  id: string;
  order_id?: string;
  customer_id?: string;
  customer_name: string;
  guest_id?: string;
  sender_type: 'customer' | 'staff';
  staff_id?: string;
  staff_role?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  total_points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  created_at: string;
}

export interface LoyaltyLedgerEntry {
  id: string;
  customer_id: string;
  order_id?: string;
  points_change: number;
  reason: string;
  created_at: string;
}
