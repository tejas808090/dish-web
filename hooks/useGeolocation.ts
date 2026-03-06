'use client';

import { useState, useEffect } from 'react';
import { Restaurant } from '@/types';

export function useGeolocation() {
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude: lat, longitude: lng } = position.coords;
                setCoords({ lat, lng });

                try {
                    const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}`);
                    if (res.ok) {
                        const data = await res.json();
                        setNearbyRestaurants(data);
                    }
                } catch (err) {
                    console.error('Failed to fetch nearby restaurants', err);
                } finally {
                    setIsLoading(false);
                }
            },
            (err) => {
                setError(err.message);
                setIsLoading(false);
            }
        );
    }, []);

    return { coords, nearbyRestaurants, isLoading, error };
}
