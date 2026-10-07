import { NextResponse } from 'next/server';
import { askAI, parseJSONFromAI } from '@/lib/ai';
import { fetchReviews } from '@/lib/serpapi';

interface GoogleReview {
    author: string;
    rating: number;
    text: string;
    time: string;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.name) {
            return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
        }

        // Fetch SerpAPI reviews (server-side, API key stays hidden)
        const serpReviews = await fetchReviews(
            body.name,
            body.address || '',
            String(body.lat || ''),
            String(body.lng || ''),
            3
        );

        // Format Google Places reviews with star prefix
        const googleTexts = ((body.googleReviews || []) as GoogleReview[])
            .filter((r) => r.text && r.text.length > 20)
            .map((r) => `[${r.rating}★] ${r.text}`);

        // Format SerpAPI reviews with star prefix
        const serpTexts = serpReviews
            .filter((r) => r.text && r.text.length > 20)
            .map((r) => `[${r.rating}★] ${r.text}`);

        // Deduplicate by first 60 chars (Google Places and SerpAPI may overlap)
        const seen = new Set<string>();
        const allTexts: string[] = [];

        for (const t of [...googleTexts, ...serpTexts]) {
            const key = t.slice(0, 60).toLowerCase().replace(/\s+/g, ' ');
            if (!seen.has(key)) {
                seen.add(key);
                allTexts.push(t);
            }
        }

        const totalReviewCount = allTexts.length;

        // Token budget: ~8KB of review text, 300 chars per review
        const reviewsText = allTexts
            .map((t) => t.slice(0, 300))
            .join('\n')
            .slice(0, 8000);

        const prompt = `From these ${totalReviewCount} customer reviews for "${body.name}", identify ALL dishes or menu items mentioned. For each dish, count how many reviews mention it and rate it 1-5 based on sentiment (5=loved, 3=neutral, 1=disliked). Return JSON array sorted by mentions desc: [{"name":"...","mentions":N,"rating":4.5,"description":"5-8 words"}]. Include every dish mentioned, no limit.

${reviewsText}`;

        const aiResponse = await askAI(prompt);
        const items = parseJSONFromAI(aiResponse.content);

        return NextResponse.json({
            items,
            provider: aiResponse.provider,
            reviewCount: totalReviewCount,
        });
    } catch (error: any) {
        console.error('Popular extraction error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to extract',
            details: error.stack || 'No stack trace available'
        }, { status: 500 });
    }
}
