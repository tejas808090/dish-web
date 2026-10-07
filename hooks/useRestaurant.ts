import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@/types';

export function useRestaurant(id: string) {
    return useQuery<Restaurant>({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const res = await fetch(`/api/restaurant/${id}`);
            if (!res.ok) throw new Error('Restaurant not found');
            return res.json();
        },
        enabled: !!id,
    });
}
