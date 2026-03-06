import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
    searchQuery: string;
    recentSearches: string[];
    favorites: string[]; // Store IDs of favorite restaurants/dishes
    geoBannerDismissed: boolean;
    setSearchQuery: (query: string) => void;
    addRecentSearch: (search: string) => void;
    clearRecentSearches: () => void;
    toggleFavorite: (id: string) => void;
    dismissGeoBanner: () => void;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            searchQuery: '',
            recentSearches: [],
            favorites: [],
            geoBannerDismissed: false,
            setSearchQuery: (query) => set({ searchQuery: query }),
            addRecentSearch: (search) => set((state) => ({
                recentSearches: [search, ...state.recentSearches.filter((s) => s !== search)].slice(0, 5)
            })),
            clearRecentSearches: () => set({ recentSearches: [] }),
            toggleFavorite: (id) => set((state) => ({
                favorites: state.favorites.includes(id)
                    ? state.favorites.filter((f) => f !== id)
                    : [...state.favorites, id]
            })),
            dismissGeoBanner: () => set({ geoBannerDismissed: true }),
        }),
        {
            name: 'dish-app-storage',
        }
    )
);
