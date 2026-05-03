import { create } from 'zustand';
import { WellnessTip } from '../types';
import tipsData from '../data/tips.json';

interface TipsState {
  tips: WellnessTip[];
  readTips: string[];
  markAsRead: (id: string) => void;
  getTipsByCategory: (category: string) => WellnessTip[];
}

export const useTipsStore = create<TipsState>((set, get) => ({
  tips: tipsData as WellnessTip[],
  readTips: [],
  markAsRead: (id) => set((state) => ({
    readTips: state.readTips.includes(id) ? state.readTips : [...state.readTips, id]
  })),
  getTipsByCategory: (category) => {
    if (category === 'All') return get().tips;
    return get().tips.filter(tip => tip.category === category);
  }
}));
