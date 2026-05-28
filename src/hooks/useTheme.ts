import { useAuthStore } from '../store/authStore';

export const COLORS = {
  dark: {
    background: '#0A0F1E',
    surface: '#111827',
    border: '#1F2D45',
    text: '#F0F4FF',
    muted: '#6B7A99',
    primary: '#7C6FEB',
    secondary: '#A78BFA',
    accent: '#38BDF8',
    // Swarbrick Dimension Colors
    dimPhysical: '#10B981',     // Green
    dimEmotional: '#3B82F6',    // Blue
    dimSocial: '#8B5CF6',       // Purple
    dimIntellectual: '#F59E0B', // Amber
    dimOccupational: '#F97316', // Orange
    dimSpiritual: '#14B8A6',    // Teal
    dimEnvironmental: '#84CC16',// Lime
    dimFinancial: '#F43F5E',    // Rose
  },
  light: {
    background: '#F1F5F9',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    primary: '#6366F1',
    secondary: '#818CF8',
    accent: '#0EA5E9',
    // Swarbrick Dimension Colors
    dimPhysical: '#059669',     // Slightly darker for light mode
    dimEmotional: '#2563EB',
    dimSocial: '#7C3AED',
    dimIntellectual: '#D97706',
    dimOccupational: '#EA580C',
    dimSpiritual: '#0D9488',
    dimEnvironmental: '#65A30D',
    dimFinancial: '#E11D48',
  }
};

export const useTheme = () => {
  const theme = useAuthStore((s) => s.theme);
  const setTheme = useAuthStore((s) => s.setTheme);
  const colors = COLORS[theme];

  return { theme, setTheme, colors };
};
