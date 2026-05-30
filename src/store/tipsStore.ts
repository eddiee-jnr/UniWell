import { create } from 'zustand';
import { WellnessTip } from '../types';
import tipsData from '../data/tips.json';

interface TipsState {
  tips: WellnessTip[];
  readTips: string[];
  markAsRead: (id: string) => void;
  setReadTips: (ids: string[]) => void;  // Used by rehydration to restore read state
  loadReadTips: () => Promise<void>;     // Load read tips from SQLite database
  getTipsByCategory: (category: string) => WellnessTip[];
}

export const useTipsStore = create<TipsState>((set, get) => ({
  tips: tipsData as WellnessTip[],
  readTips: [],
  markAsRead: (id) => set((state) => ({
    readTips: state.readTips.includes(id) ? state.readTips : [...state.readTips, id]
  })),
  // Replaces the readTips array wholesale — used during post-login rehydration
  // so already-read tips appear with the ✓ checkmark immediately on load.
  setReadTips: (ids) => set({ readTips: ids }),
  
  loadReadTips: async () => {
    try {
      const { useAuthStore } = await import('./authStore');
      const { getLocalTipEngagements } = await import('../services/storage');
      const userId = useAuthStore.getState().session?.user.id || 'guest';
      const localReadIds = await getLocalTipEngagements(userId);
      set({ readTips: localReadIds });
      console.log(`[TipsStore] Loaded ${localReadIds.length} read tips from local database.`);
    } catch (error) {
      console.error('[TipsStore] Failed to load read tips from SQLite:', error);
    }
  },

  getTipsByCategory: (category) => {
    if (category === 'All') return get().tips;
    return get().tips.filter(tip => tip.category === category);
  }
}));
