import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CustomerMessage } from '../types';
import { sendNotification } from '../lib/notifications';

interface CustomerMessageState {
  messages: CustomerMessage[];
  loading: boolean;
  initialized: boolean;
  subscribeToCustomerMessages: () => void;
  sendCustomerMessage: (message: string, customerName: string, orderId?: string, guestId?: string) => Promise<void>;
  replyToCustomer: (message: string, customerName: string, staffId: string, staffRole: string, orderId?: string, guestId?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export const useCustomerMessageStore = create<CustomerMessageState>((set, get) => ({
  messages: [],
  loading: true,
  initialized: false,

  subscribeToCustomerMessages: () => {
    if (get().initialized) return;
    set({ initialized: true });

    // Initial fetch
    supabase
      .from('customer_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) set({ messages: data, loading: false });
      });

    // Realtime
    const channel = supabase.channel('customer-messages-live');
    
    supabase.removeChannel(channel).then(() => {
      supabase.channel('customer-messages-live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'customer_messages' },
          (payload) => {
            const newMessage = payload.new as CustomerMessage;
            set((state) => ({ messages: [newMessage, ...state.messages] }));
            
            // Notify BOH if it's from a customer
            if (newMessage.sender_type === 'customer') {
              sendNotification(`GUEST INQUIRY: ${newMessage.customer_name}`, {
                body: newMessage.message,
                tag: 'customer-message'
              });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'customer_messages' },
          (payload) => {
            const updated = payload.new as CustomerMessage;
            set((state) => ({
              messages: state.messages.map(m => m.id === updated.id ? updated : m)
            }));
          }
        )
        .subscribe();
    });
  },

  sendCustomerMessage: async (message, customerName, orderId, guestId) => {
    const { error } = await supabase
      .from('customer_messages')
      .insert({
        message,
        customer_name: customerName,
        order_id: orderId,
        guest_id: guestId,
        sender_type: 'customer'
      });
    if (error) throw error;
  },

  replyToCustomer: async (message, customerName, staffId, staffRole, orderId, guestId) => {
    const { error } = await supabase
      .from('customer_messages')
      .insert({
        message,
        customer_name: customerName,
        order_id: orderId,
        guest_id: guestId,
        sender_type: 'staff',
        staff_id: staffId,
        staff_role: staffRole
      });
    if (error) throw error;
  },

  markAsRead: async (messageId) => {
    await supabase
      .from('customer_messages')
      .update({ is_read: true })
      .eq('id', messageId);
  }
}));
