import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { StaffMessage } from '../types';

interface MessageState {
  messages: StaffMessage[];
  loading: boolean;
  subscribeToMessages: (role: string) => void;
  sendMessage: (to: string, from: string, message: string, orderId?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  loading: true,

  subscribeToMessages: (role) => {
    // Initial fetch
    supabase
      .from('staff_messages')
      .select('*')
      .or(`to_role.eq.${role},from_role.eq.${role},to_role.eq.manager`)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) set({ messages: data, loading: false });
      });

    // Realtime
    supabase
      .channel('messages-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'staff_messages' },
        (payload) => {
          const newMessage = payload.new as StaffMessage;
          if (newMessage.to_role === role || newMessage.to_role === 'manager' || newMessage.from_role === role) {
            set((state) => ({ messages: [newMessage, ...state.messages] }));
          }
        }
      )
      .subscribe();
  },

  sendMessage: async (to, from, message, orderId) => {
    const { error } = await supabase
      .from('staff_messages')
      .insert({
        to_role: to,
        from_role: from,
        message,
        order_id: orderId,
        is_read: false
      });
    
    if (error) throw error;
  },

  markAsRead: async (messageId) => {
    const { error } = await supabase
      .from('staff_messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    if (error) throw error;
    
    set((state) => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, is_read: true } : m)
    }));
  }
}));
