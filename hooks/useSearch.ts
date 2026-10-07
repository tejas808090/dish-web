import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@/types';

export function useSearch(query: string) {
    return useQuery<Restaurant[]>({
        queryKey: ['search', query],
        queryFn: async () => {
            if (!query.trim()) return [];
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Search failed');
            return res.json();
        },
        enabled: query.length > 0,
    });
}
