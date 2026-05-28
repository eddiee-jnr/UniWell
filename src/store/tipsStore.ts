import { create } from 'zustand';
import { WellnessTip } from '../types';
import tipsData from '../data/tips.json';

interface TipsState {
  tips: WellnessTip[];
  readTips: string[];
  markAsRead: (id: string) => void;
  setReadTips: (ids: string[]) => void;  // Used by rehydration to restore read state
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
  getTipsByCategory: (category) => {
    if (category === 'All') return get().tips;
    return get().tips.filter(tip => tip.category === category);
  }
}));
