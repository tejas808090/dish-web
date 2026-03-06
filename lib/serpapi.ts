/**
 * Shared SerpAPI Utilities
 *
 * - findDataId: Search Google Maps for a restaurant and return its data_id
 * - fetchMenuPhotos: Fetch menu-category photos from a restaurant's Google Maps listing
 * - fetchReviews: Fetch reviews from a restaurant's Google Maps listing (with pagination)
 */

/**
 * Strip emojis and special characters from a restaurant name for cleaner API searches.
 */
function cleanRestaurantName(name: string): string {
    return name
        .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]/gu, '')
        .trim();
}

/**
 * Search Google Maps for a restaurant and return its data_id.
 * Uses name + coordinates for precise matching.
 */
export async function findDataId(
    name: string,
    address: string,
    lat: string,
    lng: string,
    apiKey: string
): Promise<string | null> {
    const cleanName = cleanRestaurantName(name);

    const searchUrl = new URL('https://serpapi.com/search');
    searchUrl.searchParams.set('engine', 'google_maps');
    searchUrl.searchParams.set('q', cleanName);
    searchUrl.searchParams.set('type', 'search');
    searchUrl.searchParams.set('api_key', apiKey);

    // Use coordinates for precise location matching
    if (lat && lng) {
        searchUrl.searchParams.set('ll', `@${lat},${lng},17z`);
    }

    const res = await fetch(searchUrl.toString());
    const data = await res.json();

    if (data.error) {
        console.error('SerpAPI Maps search error:', data.error);
        return null;
    }

    // SerpAPI may return a single place match (place_results) or a list (local_results)
    const results = data.local_results || [];

    // If SerpAPI resolved to a single place directly, use its data_id
    if (results.length === 0 && data.place_results?.data_id) {
        return data.place_results.data_id;
    }

    if (results.length === 0) return null;

    // Try to find exact name match first (compare without emojis)
    const exactMatch = results.find(
        (r: any) => r.title?.toLowerCase() === cleanName.toLowerCase()
    );

    // Fall back to first result (closest match by location)
    const best = exactMatch || results[0];

    return best.data_id || null;
}

export interface MenuPhoto {
    url: string;
    thumbnail?: string;
}

/**
 * Fetch menu-category photos from a restaurant's Google Maps listing.
 *
 * Uses SerpAPI google_maps_photos engine with category_id=CgIYIQ (Menu).
 * Returns up to `limit` photo URLs suitable for OCR.
 *
 * @param name - Restaurant name (emojis will be stripped)
 * @param address - Restaurant address
 * @param lat - Latitude
 * @param lng - Longitude
 * @param limit - Max number of photos to return (default 5)
 */
export async function fetchMenuPhotos(
    name: string,
    address: string,
    lat: string,
    lng: string,
    limit: number = 5
): Promise<MenuPhoto[]> {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        console.warn('SerpAPI key not configured — skipping menu photo fetch');
        return [];
    }

    // Step 1: Find the restaurant's data_id
    const dataId = await findDataId(name, address, lat, lng, apiKey);

    if (!dataId) {
        console.warn(`Could not find data_id for "${name}" — skipping menu photos`);
        return [];
    }

    // Step 2: Fetch menu-category photos
    const photosUrl = new URL('https://serpapi.com/search');
    photosUrl.searchParams.set('engine', 'google_maps_photos');
    photosUrl.searchParams.set('data_id', dataId);
    photosUrl.searchParams.set('category_id', 'CgIYIQ'); // Menu category
    photosUrl.searchParams.set('api_key', apiKey);

    const res = await fetch(photosUrl.toString());
    const data = await res.json();

    if (data.error) {
        console.error('SerpAPI menu photos error:', data.error);
        return [];
    }

    const photos: MenuPhoto[] = (data.photos || [])
        .slice(0, limit)
        .map((photo: any) => ({
            url: photo.image,
            thumbnail: photo.thumbnail,
        }));

    console.log(`Found ${photos.length} menu photos for "${name}"`);

    return photos;
}

export interface SerpReview {
    text: string;
    rating: number;
    date: string;
    user: string;
}

/**
 * Fetch reviews from a restaurant's Google Maps listing via SerpAPI.
 * Paginates up to `maxPages` to collect as many reviews as possible.
 *
 * @param name - Restaurant name
 * @param address - Restaurant address
 * @param lat - Latitude
 * @param lng - Longitude
 * @param maxPages - Maximum pages to fetch (default 3, each ~10 reviews)
 */
export async function fetchReviews(
    name: string,
    address: string,
    lat: string,
    lng: string,
    maxPages: number = 3
): Promise<SerpReview[]> {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        console.warn('SerpAPI key not configured — skipping review fetch');
        return [];
    }

    const dataId = await findDataId(name, address, lat, lng, apiKey);

    if (!dataId) {
        console.warn(`Could not find data_id for "${name}" — skipping SerpAPI reviews`);
        return [];
    }

    const allReviews: SerpReview[] = [];
    let nextPageToken: string | null = null;

    for (let page = 0; page < maxPages; page++) {
        const reviewsUrl = new URL('https://serpapi.com/search');
        reviewsUrl.searchParams.set('engine', 'google_maps_reviews');
        reviewsUrl.searchParams.set('data_id', dataId);
        reviewsUrl.searchParams.set('sort_by', 'qualityScore');
        reviewsUrl.searchParams.set('api_key', apiKey);

        if (nextPageToken) {
            reviewsUrl.searchParams.set('next_page_token', nextPageToken);
        }

        const res = await fetch(reviewsUrl.toString());
        const data = await res.json();

        if (data.error) {
            console.error('SerpAPI reviews error:', data.error);
            break;
        }

        const reviews = (data.reviews || []).map((r: any) => ({
            text: r.snippet || r.text || '',
            rating: r.rating || 0,
            date: r.date || '',
            user: r.user?.name || 'Anonymous',
        }));

        allReviews.push(...reviews);

        nextPageToken = data.serpapi_pagination?.next_page_token || null;
        if (!nextPageToken) break;
    }

    console.log(`Fetched ${allReviews.length} SerpAPI reviews for "${name}"`);
    return allReviews;
}
