'use client';

import { useParams } from 'next/navigation';
import { useRestaurant } from '@/hooks/useRestaurant';
import { RestaurantHeader } from '@/components/restaurant/RestaurantHeader';
import { TabNav } from '@/components/restaurant/TabNav';
import { PhotosTab } from '@/components/restaurant/PhotosTab';
import { MenuTab } from '@/components/restaurant/MenuTab';
import { PopularTab } from '@/components/restaurant/PopularTab';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function RestaurantPage() {
    const { id } = useParams() as { id: string };
    const { data: restaurant, isLoading, isError } = useRestaurant(id);
    const [activeTab, setActiveTab] = useState<'photos' | 'menu' | 'popular'>('photos');

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
                <p className="text-foreground/40 italic text-lg text-center px-4">Preparing your table...</p>
            </div>
        );
    }

    if (isError || !restaurant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
                <h2 className="text-2xl font-bold mb-2">Oops! We couldn't find that spot.</h2>
                <p className="text-foreground/40 mb-6">It might have closed or the link is broken.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="clay-accent text-white px-8 py-3 rounded-2xl font-bold"
                >
                    Back to Search
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-background pb-20">
            <RestaurantHeader restaurant={restaurant} />

            <div className="max-w-4xl mx-auto mt-4">
                <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="px-4 py-6">
                    {activeTab === 'photos' && <PhotosTab restaurant={restaurant} />}
                    {activeTab === 'menu' && <MenuTab restaurant={restaurant} />}
                    {activeTab === 'popular' && <PopularTab restaurant={restaurant} />}
                </div>
            </div>
        </main>
    );
}
