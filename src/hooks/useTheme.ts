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
  }
};

export const useTheme = () => {
  const theme = useAuthStore((s) => s.theme);
  const setTheme = useAuthStore((s) => s.setTheme);
  const colors = COLORS[theme];

  return { theme, setTheme, colors };
};
