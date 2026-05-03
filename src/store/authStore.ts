import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isGuest: boolean;
  theme: 'dark' | 'light';
  userProfile: { name: string; bio: string };
  setSession: (session: Session | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateProfile: (profile: { name: string; bio: string }) => void;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isGuest: false,
  theme: 'dark',
  userProfile: { name: 'Julian Vance', bio: 'Graduate Student • Psychology' },
  setSession: (session) => {
    const profile = session?.user?.user_metadata;
    set({ 
      session,
      userProfile: {
        name: profile?.full_name || session?.user?.email?.split('@')[0] || 'Julian Vance',
        bio: profile?.bio || 'Graduate Student • Psychology'
      }
    });
  },
  setIsGuest: (isGuest) => set({ isGuest }),
  setTheme: (theme) => set({ theme }),
  updateProfile: (userProfile) => set({ userProfile }),
  signInAnonymously: async () => {
    set({ isGuest: true });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, isGuest: false });
  },
}));
