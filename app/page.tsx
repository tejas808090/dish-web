'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { GeoBanner } from '@/components/geo/GeoBanner';
import { useAppStore } from '@/stores/appStore';

export default function Home() {
  const { searchQuery } = useAppStore();

  return (
    <main className="min-h-screen bg-background pb-20">
      <SearchBar />

      {!searchQuery && <GeoBanner />}

      <div className="pt-4">
        <SearchResults />

        {!searchQuery && (
          <div className="flex flex-col items-center justify-center px-4 py-20 text-center animate-in fade-in duration-1000">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              Hungry? <span className="text-accent underline decoration-4 underline-offset-8">Dish</span> it out.
            </h1>
            <p className="max-w-md text-foreground/40 text-lg leading-relaxed">
              Find the best food near you, explore menus, and see what's trending at your favorite spots.
            </p>

          </div>
        )}
      </div>
    </main>
  );
}
