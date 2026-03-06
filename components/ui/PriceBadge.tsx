import { cn } from '@/lib/utils';

export function PriceBadge({ level, className }: { level?: number, className?: string }) {
    if (!level) return null;

    return (
        <div className={cn("flex items-center text-sm font-bold tracking-widest", className)}>
            <span className="text-accent">{"$".repeat(level)}</span>
            <span className="text-foreground/20">{"$".repeat(4 - level)}</span>
        </div>
    );
}
