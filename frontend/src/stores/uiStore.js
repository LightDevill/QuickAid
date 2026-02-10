import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
    persist(
        (set) => ({
            darkMode: false,
            sosModalOpen: false,
            mobileMenuOpen: false,

            toggleDarkMode: () => {
                set((state) => {
                    const newDarkMode = !state.darkMode;
                    // Update document class for Tailwind dark mode
                    if (newDarkMode) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { darkMode: newDarkMode };
                });
            },

            setDarkMode: (darkMode) => {
                set({ darkMode });
                if (darkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            openSosModal: () => {
                set({ sosModalOpen: true });
            },

            closeSosModal: () => {
                set({ sosModalOpen: false });
            },

            toggleMobileMenu: () => {
                set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
            },

            closeMobileMenu: () => {
                set({ mobileMenuOpen: false });
            },
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({
                darkMode: state.darkMode,
            }),
        }
    )
);

export default useUIStore;
