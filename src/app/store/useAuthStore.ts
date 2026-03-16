import { create } from 'zustand';
import { supabase } from '@/shared/api/supabase';
import { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  
  signIn: (email: string) => Promise<void>; // Magic Link or Social
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  initialized: false,

  signIn: async (email: string) => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      set({ error: error.message, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, session: null, isLoading: false });
  },

  initialize: async () => {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set({ 
      session, 
      user: session?.user ?? null, 
      isLoading: false,
      initialized: true 
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      set({ session, user: session?.user ?? null });
    });
  }
}));
