import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ rating, className }: { rating: number, className?: string }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <div className={cn("flex items-center text-[#FFC107]", className)}>
            {[...Array(fullStars)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
            ))}
            {hasHalfStar && <StarHalf className="w-4 h-4 fill-current" />}
            <span className="ml-1 text-sm font-medium text-foreground/80">{rating.toFixed(1)}</span>
        </div>
    );
}
