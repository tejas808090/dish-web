'use client';

export function MSWProvider({ children }: { children: React.ReactNode }) {
    // MSW disabled — app now uses live API routes.
    // To re-enable mocking, uncomment the original code in this file.
    return <>{children}</>;
}
