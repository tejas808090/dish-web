import { cn } from '@/lib/utils';

export function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-pulse bg-white/5 rounded-lg overflow-hidden relative",
                "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/[0.03] after:to-transparent after:animate-[shimmer_2s_infinite]",
                className
            )}
        />
    );
}
