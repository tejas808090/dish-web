import { http, HttpResponse } from 'msw';
import googleSearch from './fixtures/google_search.json';
import googlePlaceDetail from './fixtures/google_place_detail.json';
import yelpReviews from './fixtures/yelp_reviews.json';
import gpt4oVisionResponse from './fixtures/gpt4o_vision_response.json';

export const handlers = [
    // Mock Search API
    http.get('/api/search', ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');

        if (!query) {
            return HttpResponse.json([]);
        }

        // Filter by name or cuisine for a bit of realism
        const filtered = (googleSearch as any[]).filter(r =>
            r.name.toLowerCase().includes(query.toLowerCase()) ||
            r.cuisine.some((c: string) => c.toLowerCase().includes(query.toLowerCase()))
        );

        return HttpResponse.json(filtered);
    }),

    // Mock Restaurant Detail API
    http.get('/api/restaurant/:id', ({ params }) => {
        const { id } = params;
        // For demo, just return the Nobu fixture if id matches
        if (id === 'place_1') {
            return HttpResponse.json(googlePlaceDetail);
        }
        return new HttpResponse(null, { status: 404 });
    }),

    // Mock Nearby Restaurants API
    http.get('/api/nearby', () => {
        return HttpResponse.json(googleSearch);
    }),

    // Mock Dish Identification
    http.post('/api/identify-dish', () => {
        return HttpResponse.json(gpt4oVisionResponse);
    })
];
