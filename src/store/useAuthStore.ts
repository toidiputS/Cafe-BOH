import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 
  | 'waitress' 
  | 'head_chef' 
  | 'prep_cook' 
  | 'expeditor' 
  | 'manager' 
  | 'takeout_host' 
  | 'driver' 
  | 'bartender';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  profile: any | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  profile: null,
  loading: true,
  initialized: false,

  signIn: async (email) => {
    // Note: Implementing Magic Link as per brief
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, profile: null });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    
    let role: UserRole | null = null;
    let profile = null;

    if (user) {
      const { data } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        profile = data;
        role = data.role as UserRole;
      }
    }

    set({ user, role, profile, loading: false, initialized: true });

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      let role: UserRole | null = null;
      let profile = null;

      if (user) {
        const { data } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data) {
          profile = data;
          role = data.role as UserRole;
        }
      }
      
      set({ user, role, profile, loading: false });
    });
  },
}));
