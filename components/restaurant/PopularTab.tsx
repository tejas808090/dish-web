'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Sparkles } from 'lucide-react';

interface PopularDish {
    name: string;
    mentions: number;
    rating: number;
    description: string;
}

export function PopularTab({ restaurant }: { restaurant: any }) {
    const [popularDishes, setPopularDishes] = useState<PopularDish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reviewCount, setReviewCount] = useState<number>(0);

    useEffect(() => {
        async function extractPopularDishes() {
            setIsLoading(true);
            try {
                const res = await fetch('/api/menu/extract-popular', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: restaurant.name,
                        address: restaurant.address,
                        lat: restaurant.lat,
                        lng: restaurant.lng,
                        googleReviews: restaurant.reviews || [],
                    }),
                });

                const data = await res.json();
                setPopularDishes(data.items || []);
                setReviewCount(data.reviewCount || 0);
            } catch (err) {
                console.error("Failed to extract popular dishes", err);
            } finally {
                setIsLoading(false);
            }
        }

        extractPopularDishes();
    }, [restaurant.id, restaurant.name]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-sm text-foreground/40 italic text-center">Identifying fan favorites from reviews...</p>
            </div>
        );
    }

    if (popularDishes.length === 0) {
        return (
            <div className="text-center py-20 text-foreground/40">
                <p>No clear dish mentions found in recent reviews.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent/10 text-accent mb-2">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black tracking-tight">Fan Favorites</h3>
                <p className="text-foreground/40 text-sm max-w-xs mx-auto">
                    {reviewCount > 0
                        ? `The most talked-about dishes based on ${reviewCount} customer reviews.`
                        : 'The most talked-about dishes based on customer reviews.'}
                </p>
            </div>

            <div className="space-y-3">
                {[...popularDishes]
                    .sort((a, b) => b.mentions - a.mentions)
                    .map((dish, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/[0.03] hover:bg-black/[0.04] transition-all"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold capitalize">{dish.name}</span>
                                    {i === 0 && (
                                        <Sparkles className="w-3 h-3 text-accent fill-accent" />
                                    )}
                                </div>
                                <p className="text-xs text-foreground/50">{dish.description}</p>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                                <div className="text-sm font-black text-accent">
                                    {dish.mentions}
                                </div>
                                <div className="text-[10px] font-bold text-foreground/40">
                                    {dish.mentions === 1 ? 'mention' : 'mentions'}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
