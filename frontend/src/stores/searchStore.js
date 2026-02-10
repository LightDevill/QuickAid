import { create } from 'zustand';

const useSearchStore = create((set) => ({
    results: [],
    filters: {
        lat: null,
        lng: null,
        bed_type: 'general',
        radius: 10,
    },
    loading: false,
    sortBy: 'score', // score, distance, availability

    setResults: (results) => {
        set({ results });
    },

    setFilters: (filters) => {
        set((state) => ({
            filters: { ...state.filters, ...filters },
        }));
    },

    setLoading: (loading) => {
        set({ loading });
    },

    setSortBy: (sortBy) => {
        set({ sortBy });
    },

    clearResults: () => {
        set({ results: [] });
    },
}));

export default useSearchStore;
