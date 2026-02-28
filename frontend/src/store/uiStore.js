import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI state store
 * Manages UI-related state like sidebar, theme, etc.
 */
export const useUIStore = create(
  persist(
    (set) => ({
      // Sidebar state
      sidebarOpen: true,
      sidebarCollapsed: false,

      // Theme
      theme: 'light',

      // Mobile menu
      mobileMenuOpen: false,

      // Actions
      toggleSidebar: () => set((state) => ({ 
        sidebarOpen: !state.sidebarOpen 
      })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),

      setTheme: (theme) => {
        // Update document class for dark mode
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        return { theme: newTheme };
      }),

      toggleMobileMenu: () => set((state) => ({ 
        mobileMenuOpen: !state.mobileMenuOpen 
      })),

      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    }),
    {
      name: 'ui-storage',
      getStorage: () => localStorage,
    }
  )
);
