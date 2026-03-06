import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '@/types';
import { StarRating } from '../ui/StarRating';
import { PriceBadge } from '../ui/PriceBadge';
import { MapPin } from 'lucide-react';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
    return (
        <Link
            href={`/restaurant/${restaurant.id}`}
            className="group block overflow-hidden rounded-2xl bg-black/[0.03] border border-black/5 hover:bg-black/[0.05] hover:border-black/10 transition-all duration-300 transform active:scale-[0.98]"
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                {restaurant.photoReferences?.[0] ? (
                    <img
                        src={restaurant.photoReferences[0]}
                        alt={restaurant.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 bg-[#E2E8F0] flex items-center justify-center">
                        <span className="text-4xl font-bold tracking-tighter text-black/10">{restaurant.name[0]}</span>
                    </div>
                )}
                <div className="absolute bottom-3 left-4 z-20 flex flex-wrap gap-2">
                    {restaurant.cuisine.slice(0, 2).map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-accent/90 text-white text-[10px] font-bold uppercase tracking-wider">
                            {c}
                        </span>
                    ))}
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-bold group-hover:text-accent transition-colors">
                        {restaurant.name}
                    </h3>
                    <PriceBadge level={restaurant.priceLevel} />
                </div>

                <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={restaurant.rating} />
                </div>

                <div className="flex items-start text-sm text-foreground/40">
                    <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
                    <p className="line-clamp-1">{restaurant.address}</p>
                </div>
            </div>
        </Link>
    );
}
