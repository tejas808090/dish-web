import { NextResponse } from 'next/server';
import { findDataId } from '@/lib/serpapi';

/**
 * Fetch restaurant photos via SerpAPI Google Maps Photos.
 * Uses the google_maps_photos engine which pulls photos from the
 * specific restaurant's Google Maps listing (not generic image search).
 *
 * Query params:
 *   ?name=Restaurant+Name&address=Full+Address&lat=40.7&lng=-74.0
 *   &next_page_token=xxx  (for pagination)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address') || '';
    const lat = searchParams.get('lat') || '';
    const lng = searchParams.get('lng') || '';
    const nextPageToken = searchParams.get('next_page_token') || '';
    const cachedDataId = searchParams.get('data_id') || '';

    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
    }

    if (!name) {
        return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    try {
        // Step 1: Use cached data_id or find it via shared utility
        const dataId = cachedDataId || await findDataId(name, address, lat, lng, apiKey);

        if (!dataId) {
            return NextResponse.json({
                images: [],
                hasMore: false,
                error: 'Could not find restaurant on Google Maps',
            });
        }

        // Step 2: Fetch photos using google_maps_photos engine
        const photosUrl = new URL('https://serpapi.com/search');
        photosUrl.searchParams.set('engine', 'google_maps_photos');
        photosUrl.searchParams.set('data_id', dataId);
        photosUrl.searchParams.set('api_key', apiKey);

        if (nextPageToken) {
            photosUrl.searchParams.set('next_page_token', nextPageToken);
        }

        const res = await fetch(photosUrl.toString());
        const data = await res.json();

        if (data.error) {
            console.error('SerpAPI photos error:', data.error);
            return NextResponse.json({ error: data.error }, { status: 400 });
        }

        const images = (data.photos || []).map((photo: any) => ({
            url: photo.image,
            thumbnail: photo.thumbnail,
        }));

        return NextResponse.json({
            images,
            hasMore: !!data.serpapi_pagination?.next_page_token,
            nextPageToken: data.serpapi_pagination?.next_page_token || null,
            dataId, // cache on client to avoid re-searching
            categories: data.categories || [],
        });
    } catch (error: any) {
        console.error('SerpAPI photos error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch photos' }, { status: 500 });
    }
}
