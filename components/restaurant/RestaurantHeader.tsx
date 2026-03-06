'use client';

import { Restaurant } from '@/types';
import { StarRating } from '../ui/StarRating';
import { PriceBadge } from '../ui/PriceBadge';
import { ChevronLeft, Share2, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';

export function RestaurantHeader({ restaurant }: { restaurant: Restaurant }) {
    const router = useRouter();
    const { favorites, toggleFavorite } = useAppStore();
    const isFavorite = favorites.includes(restaurant.id);

    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 300], [0, 150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

    return (
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden">
            {/* Parallax Background */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 bg-[#E2E8F0]"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20 z-10" />
                {restaurant.photoReferences?.[0] ? (
                    <img
                        src={restaurant.photoReferences[0]}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-8xl font-black tracking-tighter text-black/5 select-none">
                        {restaurant.name}
                    </div>
                )}
            </motion.div>

            {/* Nav Actions */}
            <div className="absolute top-0 left-0 w-full p-4 z-30 flex justify-between items-center">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full bg-black/5 backdrop-blur-md border border-black/5 text-foreground"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-black/5 backdrop-blur-md border border-black/5 text-foreground">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => toggleFavorite(restaurant.id)}
                        className={cn(
                            "p-2 rounded-full backdrop-blur-md border transition-all duration-300",
                            isFavorite
                                ? "bg-accent/20 border-accent text-accent"
                                : "bg-black/5 border-black/5 text-foreground"
                        )}
                    >
                        <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                    </button>
                </div>
            </div>

            {/* Title & Info Overlay */}
            <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-2 mb-2">
                        {restaurant.cuisine.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-accent/90 text-white text-[10px] font-bold uppercase tracking-wider">
                                {c}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-foreground mb-2 leading-tight tracking-tight">
                        {restaurant.name}
                    </h1>
                    <div className="flex items-center gap-4 flex-wrap">
                        <StarRating rating={restaurant.rating} className="text-accent" />
                        <PriceBadge level={restaurant.priceLevel} />
                    </div>
                </div>
            </div>
        </div>
    );
}
