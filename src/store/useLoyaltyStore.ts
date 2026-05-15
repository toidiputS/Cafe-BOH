import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { CustomerProfile, LoyaltyLedgerEntry } from '../types';

interface LoyaltyState {
  profile: CustomerProfile | null;
  history: LoyaltyLedgerEntry[];
  loading: boolean;
  initialized: boolean;
  fetchLoyaltyData: (userId: string) => Promise<void>;
  earnPoints: (userId: string, points: number, orderId: string, reason: string) => Promise<void>;
  redeemPoints: (userId: string, points: number, reason: string) => Promise<void>;
}

export const useLoyaltyStore = create<LoyaltyState>((set, get) => ({
  profile: null,
  history: [],
  loading: false,
  initialized: false,

  fetchLoyaltyData: async (userId) => {
    set({ loading: true });
    try {
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const { data: history } = await supabase
        .from('loyalty_ledger')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      set({ profile, history, loading: false, initialized: true });
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      set({ loading: false });
    }
  },

  earnPoints: async (userId, points, orderId, reason) => {
    const { error: ledgerError } = await supabase
      .from('loyalty_ledger')
      .insert({
        customer_id: userId,
        order_id: orderId,
        points_change: points,
        reason
      });

    if (ledgerError) throw ledgerError;

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    const newTotal = (profile?.total_points || 0) + points;
    
    await supabase
      .from('customer_profiles')
      .update({ total_points: newTotal })
      .eq('id', userId);

    get().fetchLoyaltyData(userId);
  },

  redeemPoints: async (userId, points, reason) => {
    const { profile } = get();
    if (!profile || profile.total_points < points) {
      throw new Error('Insufficient points');
    }

    const { error: ledgerError } = await supabase
      .from('loyalty_ledger')
      .insert({
        customer_id: userId,
        points_change: -points,
        reason
      });

    if (ledgerError) throw ledgerError;

    const newTotal = profile.total_points - points;
    
    await supabase
      .from('customer_profiles')
      .update({ total_points: newTotal })
      .eq('id', userId);

    get().fetchLoyaltyData(userId);
  }
}));
