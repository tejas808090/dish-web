import { NextResponse } from 'next/server';
import { priceLevelToNumber } from '@/lib/utils';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Google API Key missing' }, { status: 500 });
    }

    try {
        // Use the new Places API (v1) Place Details endpoint
        const url = `https://places.googleapis.com/v1/places/${id}`;

        const res = await fetch(url, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,priceLevel,types,location,photos,editorialSummary,reviews,websiteUri,nationalPhoneNumber',
            },
        });

        const p = await res.json();

        if (p.error) {
            console.error('Google Detail Error:', p.error);
            return NextResponse.json({ error: p.error.message || 'Google Detail Error' }, { status: p.error.code || 400 });
        }

        // Convert all photo names to real URLs (no limit)
        const photoUrls = (p.photos || []).map((ph: any) =>
            `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=800&key=${apiKey}`
        );

        const enrichedData = {
            id: id,
            name: p.displayName?.text || 'Unknown',
            address: p.formattedAddress || '',
            rating: p.rating || 0,
            priceLevel: priceLevelToNumber(p.priceLevel),
            cuisine: p.types?.filter((t: string) =>
                !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
            ).slice(0, 3) || [],
            lat: p.location?.latitude,
            lng: p.location?.longitude,
            photoReferences: photoUrls,
            summary: p.editorialSummary?.text || '',
            phone: p.nationalPhoneNumber || '',
            website: p.websiteUri || '',
            reviews: (p.reviews || []).map((r: any) => ({
                author: r.authorAttribution?.displayName || 'Anonymous',
                rating: r.rating,
                text: r.text?.text || '',
                time: r.relativePublishTimeDescription || '',
            })),
        };

        return NextResponse.json(enrichedData);
    } catch (error) {
        console.error('Restaurant detail error:', error);
        return NextResponse.json({ error: 'Failed to fetch restaurant details' }, { status: 500 });
    }
}
