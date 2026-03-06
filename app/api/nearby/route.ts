import { NextResponse } from 'next/server';
import { priceLevelToNumber } from '@/lib/utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '1500';

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Google API Key not configured' }, { status: 500 });
    }

    if (!lat || !lng) {
        return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    try {
        // Use the new Places API (v1) Nearby Search endpoint
        const url = 'https://places.googleapis.com/v1/places:searchNearby';

        const body = {
            includedTypes: ['restaurant'],
            maxResultCount: 10,
            locationRestriction: {
                circle: {
                    center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
                    radius: parseFloat(radius),
                },
            },
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location,places.photos',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.error) {
            console.error('Google Nearby Error:', data.error);
            return NextResponse.json({ error: data.error.message || 'Google API Error' }, { status: data.error.code || 400 });
        }

        const restaurants = (data.places || []).map((p: any) => ({
            id: p.id,
            name: p.displayName?.text || 'Unknown',
            address: p.formattedAddress || '',
            rating: p.rating || 0,
            priceLevel: priceLevelToNumber(p.priceLevel),
            cuisine: p.types?.filter((t: string) =>
                !['restaurant', 'food', 'point_of_interest', 'establishment'].includes(t)
            ).slice(0, 3) || [],
            lat: p.location?.latitude,
            lng: p.location?.longitude,
            photoReferences: p.photos?.slice(0, 5).map((ph: any) =>
                `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=800&key=${apiKey}`
            ) || [],
        }));

        return NextResponse.json(restaurants);
    } catch (error) {
        console.error('Nearby API error:', error);
        return NextResponse.json({ error: 'Failed to fetch nearby restaurants' }, { status: 500 });
    }
}
