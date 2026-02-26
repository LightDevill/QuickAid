import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const normalizeRole = (role) => {
    const raw = String(role || '').toLowerCase().trim();
    if (!raw) return null;

    const normalized = raw.replace(/[-\s]/g, '_');

    if (['quickaid_admin', 'super_admin', 'root_admin', 'admin'].includes(normalized)) {
        return 'quickaid_admin';
    }

    return normalized;
};

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            login: (tokens, user) => {
                const accessToken = tokens?.access_token || tokens?.accessToken || tokens;
                const refreshToken = tokens?.refresh_token || tokens?.refreshToken || null;
                const normalizedUser = user
                    ? {
                        ...user,
                        role: normalizeRole(user.role),
                    }
                    : null;

                console.log('[STORE] login saving:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    userRole: normalizedUser?.role,
                });

                set({
                    user: normalizedUser,
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    isAuthenticated: true,
                });

                setTimeout(() => {
                    const saved = localStorage.getItem('auth-storage');
                    console.log('[STORE] localStorage after login:', saved);
                }, 200);
            },

            logout: () => {
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
                localStorage.removeItem('auth-storage');
            },

            refreshAccessToken: (newAccessToken) => {
                set({ accessToken: newAccessToken });
            },

            setUser: (user) => {
                set({ user });
            },

            getAccessToken: () => get().accessToken,
            getRefreshToken: () => get().refreshToken,
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useAuthStore;
