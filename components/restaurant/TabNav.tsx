'use client';

import { cn } from '@/lib/utils';
import { Camera, UtensilsCrossed, TrendingUp } from 'lucide-react';

interface TabNavProps {
    activeTab: 'photos' | 'menu' | 'popular';
    onTabChange: (tab: 'photos' | 'menu' | 'popular') => void;
}

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
    const tabs = [
        { id: 'photos', label: 'Photos', icon: Camera },
        { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
        { id: 'popular', label: 'Trends', icon: TrendingUp },
    ] as const;

    return (
        <div className="flex px-4 border-b border-white/10 sticky top-[0] bg-background z-30">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                        "flex-1 flex flex-col items-center py-3 border-b-2 transition-all duration-300",
                        activeTab === tab.id
                            ? "border-accent text-accent"
                            : "border-transparent text-foreground/40 hover:text-foreground/60"
                    )}
                >
                    <tab.icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
