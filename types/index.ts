export interface Restaurant {
  id: string;                       // Google Place ID
  name: string;
  address: string;
  rating: number;
  priceLevel?: 1 | 2 | 3 | 4;     // 1=$ 2=$$ 3=$$$ 4=$$$$
  cuisine: string[];
  lat: number;
  lng: number;
  photoReferences: string[];
  yelpId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  category: string;
  imageUrl?: string;
}

export interface PopularDish {
  id: string;
  dishName: string;
  mentionCount: number;
  averageSentiment: number;          // 0.0–1.0
  reviewSnippets: string[];
  rank: number;
}

export interface FoodPhoto {
  id: string;
  imageUrl: string;
  dishName?: string;
  dishNameSource?: 'tagged' | 'review-inferred' | 'ai-identified';
  identificationConfidence?: number; // 0.0–1.0, only for ai-identified
  source: 'google' | 'yelp';
}

export interface SearchState {
  query: string;
  results: Restaurant[];
  isSearching: boolean;
  recentSearches: string[];
}
