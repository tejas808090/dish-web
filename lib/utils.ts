import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function priceLevelToNumber(priceLevel: string | undefined): number {
    switch (priceLevel) {
        case 'PRICE_LEVEL_FREE': return 0;
        case 'PRICE_LEVEL_INEXPENSIVE': return 1;
        case 'PRICE_LEVEL_MODERATE': return 2;
        case 'PRICE_LEVEL_EXPENSIVE': return 3;
        case 'PRICE_LEVEL_VERY_EXPENSIVE': return 4;
        default: return 2;
    }
}
