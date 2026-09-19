import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>(() => ({
  isDarkMode: false,

  // Dark mode disabled for consistent light UI
  toggleTheme: () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  },

  initTheme: () => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  },
}));