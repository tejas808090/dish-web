'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@/types';

export function SearchBar() {
    const { searchQuery, setSearchQuery, recentSearches, addRecentSearch } = useAppStore();
    const [inputValue, setInputValue] = useState(searchQuery);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search query updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(inputValue);
            if (inputValue.trim()) {
                addRecentSearch(inputValue.trim());
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue, setSearchQuery, addRecentSearch]);

    const clearSearch = () => {
        setInputValue('');
        inputRef.current?.focus();
    };

    return (
        <div className="sticky top-0 z-50 w-full px-4 py-3 bg-background/80 backdrop-blur-md">
            <div className="relative max-w-2xl mx-auto">
                <div className={cn(
                    "flex items-center w-full h-12 px-4 rounded-2xl transition-all duration-200",
                    isFocused ? "bg-black/5 ring-2 ring-accent" : "bg-black/[0.03]"
                )}>
                    <Search className="w-5 h-5 text-foreground/40 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Search restaurants, cuisines..."
                        className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-foreground/40"
                    />
                    {inputValue && (
                        <button
                            onClick={clearSearch}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-foreground/60" />
                        </button>
                    )}
                </div>

                {/* Recent Searches Dropdown */}
                {isFocused && !inputValue && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 py-2 rounded-2xl bg-[#E2E8F0] border border-black/5 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2 text-xs font-semibold text-foreground/40 uppercase tracking-wider">
                            Recent Searches
                        </div>
                        {recentSearches.map((search, i) => (
                            <button
                                key={i}
                                onClick={() => setInputValue(search)}
                                className="flex items-center w-full px-4 py-3 hover:bg-black/5 text-left transition-colors"
                            >
                                <Clock className="w-4 h-4 text-foreground/40 mr-3" />
                                <span className="text-foreground/80">{search}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
