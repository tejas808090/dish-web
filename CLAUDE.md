# CLAUDE.md - Dish Web App Context

## Project Overview
**Dish** is a premium, Tokyo Blue-themed restaurant explorer built with Next.js. It features live Google Places data, AI-powered menu extraction, and a multi-provider fallback system for resilience.

## Core Requirements
- **Live Data**: No mock data; all restaurant info comes from Google Places v2.
- **AI Menu Extraction**: Scrape restaurant websites and use LLMs to extract structured menu items.
- **Fan Favorites**: Identify trending dishes from customer reviews using AI.
- **Multi-Provider Fallback**: If an AI provider (OpenAI/Gemini/Claude) fails, automatically try the next one.
- **Tokyo Blue Aesthetic**: A cool, premium visual style using Tailwind CSS.

## Code Structure
- `/app`: Next.js App Router
  - `/api/search`: Google Places Text Search (with `includedType: 'restaurant'` filter)
  - `/api/nearby`: Google Places Nearby Search
  - `/api/restaurant/[id]`: Detailed restaurant data & reviews
  - `/api/menu/[id]`: AI-powered website scraping & menu extraction (accepts `?website=&name=` params)
  - `/api/menu/extract-popular`: AI analysis of reviews for "Fan Favorites"
  - `/api/identify-dish`: Vision API for identifying food from images
- `/components`:
  - `/search`: Restaurant cards and search UI
  - `/restaurant`: Tabs for Photos (with modal & AI identify), Menu, and Trends (Fan Favorites)
- `/lib/ai.ts`: The core AI fallback utility (`askAI` function)
- `/lib/utils.ts`: Shared utilities including `priceLevelToNumber`
- `/stores/appStore.ts`: Zustand state management for search results

## API Usage
- **Google Places API (New)**:
  - Uses Field Masking for cost efficiency.
  - Requires `GOOGLE_PLACES_API_KEY`.
- **OpenAI API**:
  - Primary provider for extraction and vision tasks (`gpt-4o-mini`).
- **Google Gemini API**:
  - Secondary fallback (`gemini-2.0-flash`).
- **Anthropic (Claude) API**:
  - Tertiary fallback (`claude-3-5-haiku`).

## Known Issues & API Errors
- **Quota Exhaustion**: The most common error is a 500 status from `/api/menu` or `/api/menu/extract-popular` due to empty credit balances on OpenAI or Claude.
- **Gemini Free Tier Limits**: The Gemini API sometimes returns a "limit: 0" error if the project isn't correctly configured in Google AI Studio or if usage is too high for the free tier.
- **Scraping Failures**: If a restaurant website blocks scrapers, the app automatically switches to **AI Estimation** mode based on the restaurant's name and type.
- **Firebase Deployment**: Next.js SSR requires the **Firebase Blaze** (paid) plan. For a 100% free hosting alternative, use **Vercel Hobby**.

## Commands
- `npm run dev`: Start local development server
- `npx vercel`: Deploy to production (Free)
- `npm run build`: Production build

## TODO List
- [x] **API Audit**: Removed redundant Google Places call from menu API, deduplicated `priceLevelToNumber`.
- [x] **Token Optimization**: Reduced `max_tokens` to 1024, condensed AI prompts, limited review text to 4KB.
- [x] **Search Filtering**: Added `includedType: 'restaurant'` to Text Search API.
- [x] **Unlimited Photos**: Removed 10-photo cap from restaurant detail API.
- [x] **Photo Modal**: Added full-screen lightbox with navigation and AI identify integration.
- [x] **Landing Page Cleanup**: Removed 'Food Photos' and 'LIVE MENUS' icons.
- [x] **Design Refresh**: Transitioned color palette from Sepia to **Tokyo Blue**.
- [x] **Identify Feature Fix**: Fixed PhotosTab to send actual photo data to the vision API.
