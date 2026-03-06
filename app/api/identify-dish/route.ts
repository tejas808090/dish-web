import { NextResponse } from 'next/server';
import { askVisionAI } from '@/lib/vision';

export async function POST(request: Request) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const prompt = "What food dish is in this image? Respond with ONLY a JSON object in this exact format: {\"dishName\": \"Name of dish\", \"description\": \"One sentence description\"}. No other text.";

        const result = await askVisionAI(image, prompt, 300);

        return NextResponse.json(parseDishResponse(result.content, result.provider));
    } catch (error: any) {
        return NextResponse.json({
            error: error.message || 'AI Identification failed',
        }, { status: 500 });
    }
}

function parseDishResponse(content: string, provider: string) {
    try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return { ...parsed, provider };
    } catch {
        // Fallback: try to parse freeform text
        const lines = content.split('\n').filter(l => l.trim());
        return {
            dishName: lines[0]?.replace(/Dish Name:|Name:/i, '').trim() || 'Unknown Dish',
            description: lines.slice(1).join(' ').replace(/Description:/i, '').trim() || content,
            provider,
        };
    }
}
