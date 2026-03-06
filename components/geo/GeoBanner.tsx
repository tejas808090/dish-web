'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useAppStore } from '@/stores/appStore';
import { MapPin, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function GeoBanner() {
    const { nearbyRestaurants, isLoading } = useGeolocation();
    const { geoBannerDismissed, dismissGeoBanner } = useAppStore();

    if (geoBannerDismissed || isLoading || nearbyRestaurants.length === 0) return null;

    const restaurant = nearbyRestaurants[0];

    return (
        <div className="px-4 animate-in slide-in-from-top duration-500">
            <div className="max-w-2xl mx-auto clay-accent rounded-2xl p-4 flex items-center shadow-lg relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                <div className="bg-white/20 p-2 rounded-xl mr-4 shrink-0">
                    <MapPin className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 mr-8">
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-0.5">Detected nearby</p>
                    <h4 className="text-white font-bold text-lg leading-tight">You're at {restaurant.name}?</h4>
                    <Link
                        href={`/restaurant/${restaurant.id}`}
                        className="inline-flex items-center text-white font-bold text-sm mt-1 hover:underline"
                    >
                        Check the menu <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                <button
                    onClick={dismissGeoBanner}
                    className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded-full transition-colors text-white/60"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
