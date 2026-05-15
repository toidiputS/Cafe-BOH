import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

import { sendNotification } from '../lib/notifications';

interface OrderState {
  orders: Order[];
  loading: boolean;
  initialized: boolean;
  subscribeToOrders: () => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateItemStatus: (orderId: string, itemIdx: number, status: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: true,
  initialized: false,

  subscribeToOrders: () => {
    if (get().initialized) return;
    
    // Mark as initialized immediately to prevent concurrent setup
    set({ initialized: true });

    // Initial fetch
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) set({ orders: data, loading: false });
      });

    // Subscribe to changes
    const channel = supabase.channel('orders-live');
    
    // Remove if exists to avoid "cannot add callbacks" error
    supabase.removeChannel(channel).then(() => {
      supabase.channel('orders-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            const { eventType, new: newOrder, old: oldOrder } = payload;
            const currentOrders = get().orders;

            if (eventType === 'INSERT') {
              set({ orders: [newOrder as Order, ...currentOrders] });
              sendNotification('INCOMING TICKET', {
                body: `New ${newOrder.order_type} order for ${newOrder.customer_name || 'Guest'}`,
                tag: 'new-order'
              });
            } else if (eventType === 'UPDATE') {
              set({
                orders: currentOrders.map((o) =>
                  o.id === (newOrder as Order).id ? (newOrder as Order) : o
                ),
              });
            } else if (eventType === 'DELETE') {
              set({
                orders: currentOrders.filter((o) => o.id !== oldOrder.id),
              });
            }
          }
        )
        .subscribe();
    });
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    
    if (error) throw error;
  },

  updateItemStatus: async (orderId, itemIdx, status) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = [...order.items];
    newItems[itemIdx] = { ...newItems[itemIdx], status: status as any };

    const { error } = await supabase
      .from('orders')
      .update({ items: newItems, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw error;
  }
}));
