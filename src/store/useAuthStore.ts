import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export type UserRole = 
  | 'waitress' 
  | 'head_chef' 
  | 'prep_cook' 
  | 'grill_cook'
  | 'fry_cook'
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
    const initStart = performance.now();
    console.log('[AuthStore Trace] initialize() started...');
    
    try {
      // Race getSession with a 3-second timeout to prevent hanging forever if Supabase is unreachable
      const sessionStart = performance.now();
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((resolve) => {
        setTimeout(() => {
          console.warn('[AuthStore Trace] supabase.auth.getSession() timed out after 3000ms, proceeding as logged-out');
          resolve({ data: { session: null }, error: new Error('Session fetch timed out') });
        }, 3000);
      });

      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      const sessionDuration = (performance.now() - sessionStart).toFixed(2);
      console.log(`[AuthStore Trace] getSession() resolved in ${sessionDuration}ms. Session present: ${Boolean(session)}`);

      const user = session?.user ?? null;
      let role: UserRole | null = null;
      let profile = null;

      if (user) {
        const profileStart = performance.now();
        console.log(`[AuthStore Trace] Fetching staff profile for user ${user.id}...`);
        const { data } = await supabase
          .from('staff_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        const profileDuration = (performance.now() - profileStart).toFixed(2);
        
        if (data) {
          profile = data;
          role = data.role as UserRole;
          console.log(`[AuthStore Trace] Staff profile fetched in ${profileDuration}ms. Role: ${role}`);
        } else {
          console.log(`[AuthStore Trace] Staff profile lookup returned no data in ${profileDuration}ms.`);
        }
      }

      const totalDuration = (performance.now() - initStart).toFixed(2);
      console.log(`[AuthStore Trace] initialize() finished successfully in ${totalDuration}ms.`);
      set({ user, role, profile, loading: false, initialized: true });
    } catch (err) {
      const errorDuration = (performance.now() - initStart).toFixed(2);
      console.error(`[AuthStore Trace] initialize() failed after ${errorDuration}ms:`, err);
      // Guarantee loading is completed and initialized is set so app startup does not lock up on blank screen
      set({ user: null, role: null, profile: null, loading: false, initialized: true });
      throw err;
    }

    // Listen for auth changes
    try {
      supabase.auth.onAuthStateChange(async (_event, session) => {
        try {
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
        } catch (authChangeErr) {
          console.error('[useAuthStore] Auth state change listener error:', authChangeErr);
        }
      });
    } catch (listenerErr) {
      console.warn('[useAuthStore] Failed to subscribe to onAuthStateChange:', listenerErr);
    }
  },
}));
