import { create } from 'zustand';

interface WellnessState {
  score: number;
  streak: number;
  lastAssessment: string | null;
  setScore: (score: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  updateAssessment: (date: string) => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
  score: 0,
  streak: 0,
  lastAssessment: null,
  setScore: (score) => set({ score }),
  incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  updateAssessment: (lastAssessment) => set({ lastAssessment }),
}));
