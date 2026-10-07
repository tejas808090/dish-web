'use client';

import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, Info, Sparkles, Camera } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface MenuItem {
    name: string;
    price: number | null;
    category: string;
}

interface MenuData {
    restaurantName: string;
    source: 'website' | 'menu-photos' | 'estimated' | 'none';
    websiteUrl?: string;
    items: MenuItem[];
    message?: string;
}

interface RestaurantWithDetails {
    id: string;
    name: string;
    priceLevel?: number;
    website?: string;
    lat?: number;
    lng?: number;
    address?: string;
}

export function MenuTab({ restaurant }: { restaurant: RestaurantWithDetails }) {
    const [menuData, setMenuData] = useState<MenuData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const aiEnabled = useAppStore((s) => s.aiEnabled);

    useEffect(() => {
        if (!aiEnabled) {
            setIsLoading(false);
            setError('AI features are disabled. Enable them from the home page to view menus.');
            return;
        }
        async function fetchMenu() {
            setIsLoading(true);
            setError(null);
            try {
                const menuParams = new URLSearchParams();
                if (restaurant.website) menuParams.set('website', restaurant.website);
                if (restaurant.name) menuParams.set('name', restaurant.name);
                if (restaurant.lat) menuParams.set('lat', String(restaurant.lat));
                if (restaurant.lng) menuParams.set('lng', String(restaurant.lng));
                if (restaurant.address) menuParams.set('address', restaurant.address);

                const res = await fetch(`/api/menu/${restaurant.id}?${menuParams}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to load menu');
                }
                const data = await res.json();
                setMenuData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
        fetchMenu();
    }, [restaurant.id, aiEnabled]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-sm text-foreground/40 italic">Scanning for menu items...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-foreground/40">
                <p className="text-sm">Couldn't load menu: {error}</p>
            </div>
        );
    }

    if (!menuData || menuData.items.length === 0) {
        return (
            <div className="space-y-4">
                <div className="text-center py-10 text-foreground/40">
                    <p className="text-sm">No menu items found for this restaurant.</p>
                </div>
                {(menuData?.websiteUrl || restaurant.website) && (
                    <a
                        href={menuData?.websiteUrl || restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-4 rounded-2xl bg-accent text-white font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Check Restaurant Website
                    </a>
                )}
            </div>
        );
    }

    // Group by category
    const categories = menuData.items.reduce((acc: Record<string, MenuItem[]>, item) => {
        const cat = item.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {});

    const sourceIcon = menuData.source === 'website'
        ? <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        : menuData.source === 'menu-photos'
        ? <Camera className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        : <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />;

    const sourceText = menuData.source === 'website'
        ? "Menu extracted from the restaurant's website. Prices may vary."
        : menuData.source === 'menu-photos'
        ? "Menu extracted from photos of the restaurant's physical menu via AI. Some items may be missing."
        : 'Menu estimated by AI based on restaurant type. Actual items may differ.';

    return (
        <div className="space-y-6">
            {/* Source indicator */}
            <div className="bg-accent/[0.03] rounded-2xl p-3 flex items-start gap-3 border border-accent/10">
                {sourceIcon}
                <p className="text-xs text-foreground/50">{sourceText}</p>
            </div>

            {/* Website link */}
            {menuData.websiteUrl && (
                <a
                    href={menuData.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl bg-accent text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                    <ExternalLink className="w-4 h-4" />
                    View Full Menu on Website
                </a>
            )}

            {/* Menu items grouped by category */}
            {Object.entries(categories).map(([category, items]) => (
                <div key={category}>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3">
                        {category}
                    </h4>
                    <div className="space-y-1">
                        {items.map((item, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-baseline py-2 border-b border-black/5 last:border-0"
                            >
                                <span className="text-sm text-foreground">{item.name}</span>
                                <span className="text-sm font-bold text-foreground/60 ml-4 shrink-0">
                                    {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
