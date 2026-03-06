'use client';

import { useAppStore } from '@/stores/appStore';
import { useSearch } from '@/hooks/useSearch';
import { RestaurantCard } from './RestaurantCard';
import { Loader2 } from 'lucide-react';

export function SearchResults() {
    const { searchQuery } = useAppStore();
    const { data: results, isLoading, isError } = useSearch(searchQuery);

    if (!searchQuery) return null;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-foreground/40 font-medium italic">Finding the best spots...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="px-4 py-10 text-center">
                <p className="text-red-400">Something went wrong. Please try again.</p>
            </div>
        );
    }

    if (results?.length === 0) {
        return (
            <div className="px-4 py-20 text-center">
                <p className="text-foreground/40 text-lg font-playfair italic">No restaurants found for "{searchQuery}"</p>
                <p className="text-foreground/20 text-sm mt-2">Try searching for something else like "Sushi" or "Pizza"</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {results?.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
        </div>
    );
}
