import { create } from 'zustand';
import { DEFAULT_SEARCH_LOCATION, DEFAULT_SEARCH_RADIUS } from '../utils/constants';

const useSearchStore = create((set) => ({
    results: [],
    filters: {
        lat: DEFAULT_SEARCH_LOCATION.lat,
        lng: DEFAULT_SEARCH_LOCATION.lng,
        bed_type: 'general',
        radius: DEFAULT_SEARCH_RADIUS,
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
