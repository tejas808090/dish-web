import { NextResponse } from 'next/server';
import { priceLevelToNumber } from '@/lib/utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'Google Places API Key not configured. Add GOOGLE_PLACES_API_KEY to .env.local' }, { status: 500 });
    }

    if (!query && !lat) {
        return NextResponse.json([]);
    }

    try {
        // Use the new Places API (v1) Text Search endpoint
        const url = 'https://places.googleapis.com/v1/places:searchText';

        const body: any = {
            textQuery: query || 'restaurant',
            includedType: 'restaurant',
            maxResultCount: 10,
        };

        // If we have coordinates, bias the search to that location
        if (lat && lng) {
            body.locationBias = {
                circle: {
                    center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
                    radius: 5000.0,
                },
            };
        }

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
            console.error('Google API Error:', data.error);
            return NextResponse.json({ error: data.error.message || 'Google API Error' }, { status: data.error.code || 400 });
        }

        // Map the new API response to our Restaurant type
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
            // Convert photo names to real URLs via the Places Photo API
            photoReferences: p.photos?.slice(0, 5).map((ph: any) =>
                `https://places.googleapis.com/v1/${ph.name}/media?maxWidthPx=800&key=${apiKey}`
            ) || [],
        }));

        return NextResponse.json(restaurants);
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
