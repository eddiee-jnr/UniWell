import { create } from 'zustand';
import { MoodEntry } from '../types';
import { saveMoodLocally, getLocalMoodEntries, deleteLocalEntry } from '../services/storage';
import { syncPendingEntries } from '../services/syncService';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

interface MoodState {
  entries: MoodEntry[];
  loading: boolean;
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'created_at'>) => Promise<void>;
  loadEntries: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  entries: [],
  loading: false,

  loadEntries: async () => {
    set({ loading: true });
    try {
      const userId = useAuthStore.getState().session?.user.id || 'guest';
      const localEntries = await getLocalMoodEntries(userId);
      set({ entries: localEntries });
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      set({ loading: false });
    }
  },

  addMoodEntry: async (entryData) => {
    const newEntry: MoodEntry = {
      ...entryData,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
    };

    // Save locally first
    await saveMoodLocally(newEntry);
    
    // Update UI immediately
    set({ entries: [newEntry, ...get().entries] });

    // Attempt to sync if not a guest
    const { isGuest } = useAuthStore.getState();
    if (!isGuest) {
      try {
        await syncPendingEntries();
      } catch (e) {
        console.error('Sync failed', e);
      }
    }
  },

  deleteEntry: async (id) => {
    await deleteLocalEntry(id);
    
    // Also delete from Supabase if online
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('mood_logs').delete().eq('id', id);
    }

    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
}));
