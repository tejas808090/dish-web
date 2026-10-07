# Dish

**Find a restaurant, then find out what to order there.**

Dish is a restaurant explorer built with Next.js. Search or browse nearby, open a restaurant,
and Dish works out three things that map apps don't give you directly:

- **The menu.** It builds the menu even when the restaurant doesn't publish a clean one.
- **Fan favorites.** It reads customer reviews and pulls out which dishes people actually
  rave about.
- **"What is this dish?"** Tap any food photo and a vision model names the dish and
  describes it.

All restaurant data is live from Google Places. There is no mock data in the running app.

## How the menu is found

Most restaurant menus live in PDFs, images or messy HTML, so `/api/menu/[id]` tries
progressively harder sources and stops at the first one that returns real items:

1. **Website scrape.** It fetches the restaurant's homepage, strips the HTML, and has an LLM
   extract structured items (name, price, category). It only accepts the result if real
   items come back.
2. **Menu-link discovery.** If the homepage isn't the menu, it finds same-domain links
   containing "menu" (up to 3) and repeats the extraction on those pages.
3. **Menu-photo OCR.** If the site blocks scrapers or has no text menu, it pulls the
   *menu* photos from the restaurant's Google Maps listing (via SerpAPI) and OCRs up to
   three of them with a vision model. It stops early once it has enough items and
   de-duplicates across photos.
4. **AI estimate, clearly labeled.** As a last resort it estimates a plausible menu from the
   restaurant's name and type, and the response is tagged `source: "estimated"` so the UI
   never passes off a guess as the real menu.

Every response carries its `source` (`website`, `menu-photos` or `estimated`), so the user
can see where the menu came from.

## Engineering notes

- **Provider-agnostic AI layer** (`lib/ai.ts`, `lib/vision.ts`). One `askAI()` /
  `askVisionAI()` call walks an ordered provider chain (OpenAI → Gemini → Claude) and falls
  through on quota, auth or network errors, collecting the reasons for each failure. Providers
  are enabled by configuration; the current build runs on Claude (Haiku 4.5).
- **Cost control on paid APIs:**
  - Google Places calls use field masks, so only the fields the UI renders are billed.
  - Review text is deduplicated across Google and SerpAPI, then capped (about 300
    characters per review and 8 KB in total) before it reaches the model.
  - Model output is capped at 1,024 tokens.
- **Keys stay on the server.** Every third-party call (Places, SerpAPI, LLMs) goes through a
  Next.js route handler, so no API key ever reaches the browser. Image identification
  sends a photo URL to the server rather than the image bytes.
- **Defensive handling of model output.** Code fences are stripped before JSON parsing, and a
  bad reply degrades to an empty result rather than an error. Menu items are de-duplicated
  by name, and the version with a price wins.
- **User control over AI spend.** A global AI toggle (Zustand store) turns off menu extraction,
  fan favorites and dish identification, which leaves a plain, free restaurant browser.
- **UX details:**
  - Geolocation-aware nearby search.
  - Shimmer loading states.
  - A full-screen photo lightbox with an "identify this dish" action.
  - Search results cached with TanStack Query.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · TanStack Query · Zustand ·
Framer Motion · Google Places API (New) · SerpAPI (Google Maps photos and reviews) ·
Anthropic / OpenAI / Gemini APIs · MSW fixtures for offline UI development

## Project layout

```
app/
  api/search             Google Places text search (restaurants only)
  api/nearby             Google Places nearby search
  api/restaurant/[id]    Place details + reviews
  api/photos             Restaurant photos via SerpAPI (key stays server-side)
  api/menu/[id]          The 4-step menu pipeline above
  api/menu/extract-popular   Fan favorites from reviews
  api/identify-dish      Vision: name the dish in a photo
  restaurant/[id]        Detail page: Photos / Menu / Fan Favorites tabs
components/              search, restaurant tabs, UI primitives
lib/ai.ts, lib/vision.ts Provider fallback chains (text and vision)
lib/serpapi.ts           Google Maps data_id lookup, menu photos, paginated reviews
stores/appStore.ts       Zustand state (search results, AI toggle)
tests/                   MSW handlers + JSON fixtures
```

## Run it locally

```bash
npm install
```

Create `.env.local`:

```bash
GOOGLE_PLACES_API_KEY=...   # required
SERPAPI_KEY=...             # menu photos + extra reviews
CLAUDE_API_KEY=...          # AI features (or OPENAI_API_KEY / GEMINI_API_KEY, see lib/ai.ts)
```

Then start the dev server:

```bash
npm run dev                 # http://localhost:3000
```

Without the AI keys the app still works as a restaurant browser; turn the AI toggle off.
