'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { SearchResults } from '@/components/search/SearchResults';
import { GeoBanner } from '@/components/geo/GeoBanner';
import { useAppStore } from '@/stores/appStore';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { searchQuery, aiEnabled, setAiEnabled } = useAppStore();

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

            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                aiEnabled
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-foreground/5 text-foreground/30 border border-foreground/10'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Features
              <div
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  aiEnabled ? 'bg-accent' : 'bg-foreground/20'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    aiEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
