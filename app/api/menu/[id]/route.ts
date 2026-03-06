import { NextResponse } from 'next/server';
import { askAI, parseJSONFromAI } from '@/lib/ai';
import { fetchMenuPhotos } from '@/lib/serpapi';
import { askVisionAI } from '@/lib/vision';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await params;
    const { searchParams } = new URL(request.url);

    // Accept website, name, lat, lng, address from the client
    const websiteUrl = searchParams.get('website') || '';
    const restaurantName = searchParams.get('name') || 'Unknown';
    const lat = searchParams.get('lat') || '';
    const lng = searchParams.get('lng') || '';
    const address = searchParams.get('address') || '';

    if (!websiteUrl && !lat && !lng) {
        return NextResponse.json({
            restaurantName,
            source: 'none',
            items: [],
            message: 'No website or location found for this restaurant.',
        });
    }

    try {
        // === Step 1: Try website scrape + AI text extraction ===
        let rawHtml = '';
        let pageText = '';
        if (websiteUrl) {
            try {
                const siteRes = await fetch(websiteUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; DishBot/1.0)',
                        'Accept': 'text/html',
                    },
                    signal: AbortSignal.timeout(8000),
                });
                rawHtml = await siteRes.text();

                // Strip HTML and extract text
                pageText = rawHtml
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 8000);
            } catch {
                rawHtml = '';
                pageText = '';
            }
        }

        if (pageText) {
            // Website text found — extract menu via AI
            const prompt = `Extract menu items from "${restaurantName}" website text. ONLY extract items that are clearly listed as menu items with names. Return JSON array only: [{"name":"...","price":12.99,"category":"..."},...]. Set price to null if unknown. Use category "Other" if unclear. Return [] if no menu items are found in the text.\n\n${pageText}`;
            const aiResponse = await askAI(prompt);
            const menuItems = parseJSONFromAI(aiResponse.content);

            // Only use website source if we actually found real menu items
            if (menuItems.length > 0) {
                return NextResponse.json({
                    restaurantName,
                    source: 'website',
                    aiProvider: aiResponse.provider,
                    websiteUrl,
                    items: menuItems,
                });
            }
            console.log(`Menu: Homepage had no menu items for "${restaurantName}", looking for menu links...`);
        }

        // === Step 1b: Try to find and follow menu links from the homepage ===
        if (rawHtml && websiteUrl) {
            const menuPageResult = await tryMenuLinks(rawHtml, websiteUrl, restaurantName);
            if (menuPageResult) {
                return NextResponse.json(menuPageResult);
            }
        }

        // === Step 2: Try menu photo OCR via SerpAPI + Vision AI ===
        if (lat && lng) {
            try {
                console.log(`Menu: Website scrape failed for "${restaurantName}", trying menu photo OCR...`);

                const menuPhotos = await fetchMenuPhotos(restaurantName, address, lat, lng, 5);

                if (menuPhotos.length > 0) {
                    const photosToOCR = menuPhotos.slice(0, 3);

                    const ocrPrompt = `This is a photo of a restaurant menu. Extract ALL visible menu items. Return ONLY a JSON array: [{"name":"...","price":12.99,"category":"..."},...]. Set price to null if not visible. Use appropriate category names (Appetizers, Mains, Desserts, Drinks, etc). Return [] if this is not a menu photo.`;

                    // OCR photos sequentially — stop early once we have enough items
                    const allItems: any[] = [];
                    for (const photo of photosToOCR) {
                        try {
                            const result = await askVisionAI(photo.url, ocrPrompt, 2048);
                            const items = parseJSONFromAI(result.content);
                            allItems.push(...items);
                            console.log(`OCR extracted ${items.length} items from a menu photo`);
                            // Stop early if we already have a good number of items
                            if (allItems.length >= 15) break;
                        } catch (err: any) {
                            console.warn(`Menu OCR failed for a photo:`, err.message);
                        }
                    }

                    const deduped = deduplicateMenuItems(allItems);

                    if (deduped.length > 0) {
                        console.log(`Menu OCR extracted ${deduped.length} items from ${photosToOCR.length} menu photos`);

                        return NextResponse.json({
                            restaurantName,
                            source: 'menu-photos',
                            websiteUrl: websiteUrl || undefined,
                            items: deduped,
                        });
                    }
                }
            } catch (err: any) {
                console.warn(`Menu photo OCR path failed:`, err.message);
            }
        }

        // === Step 3: Last resort — AI estimation ===
        console.log(`Menu: Falling back to AI estimation for "${restaurantName}"`);

        const estimationPrompt = `Estimate menu for "${restaurantName}". Return JSON array only: [{"name":"...","price":12.99,"category":"..."},...]. Include 8-15 items with realistic prices grouped by category.`;
        const aiResponse = await askAI(estimationPrompt);
        const menuItems = parseJSONFromAI(aiResponse.content);

        return NextResponse.json({
            restaurantName,
            source: 'estimated',
            aiProvider: aiResponse.provider,
            websiteUrl: websiteUrl || undefined,
            items: menuItems,
        });
    } catch (error: any) {
        console.error('Menu extraction error:', error);
        return NextResponse.json({ error: error.message || 'Failed to extract menu' }, { status: 500 });
    }
}

/**
 * Extract menu-related links from homepage HTML and try scraping them.
 * Returns menu data if successful, null otherwise.
 */
async function tryMenuLinks(html: string, baseUrl: string, restaurantName: string) {
    // Find href values containing "menu" (simple regex — avoids backtracking on large HTML)
    const hrefRegex = /href="([^"]*menu[^"]*)"/gi;
    const base = new URL(baseUrl);

    const menuLinks: string[] = [];
    let match;
    while ((match = hrefRegex.exec(html)) !== null) {
        try {
            const fullUrl = new URL(match[1], base).toString();
            // Only follow links on the same domain (strip www.), skip root path
            const parsed = new URL(fullUrl);
            const baseHost = base.hostname.replace(/^www\./, '');
            const linkHost = parsed.hostname.replace(/^www\./, '');
            if (linkHost === baseHost && parsed.pathname !== '/' && !menuLinks.includes(fullUrl)) {
                menuLinks.push(fullUrl);
            }
        } catch {
            // Invalid URL, skip
        }
    }

    if (menuLinks.length === 0) return null;

    console.log(`Menu: Found ${menuLinks.length} menu link(s): ${menuLinks.join(', ')}`);

    // Try each menu link (up to 3)
    for (const menuUrl of menuLinks.slice(0, 3)) {
        try {
            const res = await fetch(menuUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DishBot/1.0)',
                    'Accept': 'text/html',
                },
                signal: AbortSignal.timeout(8000),
            });
            const menuHtml = await res.text();
            const menuText = menuHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 8000);

            if (!menuText || menuText.length < 100) continue;

            const prompt = `Extract menu items from "${restaurantName}" website text. ONLY extract items that are clearly listed as menu items with names. Return JSON array only: [{"name":"...","price":12.99,"category":"..."},...]. Set price to null if unknown. Use category "Other" if unclear. Return [] if no menu items are found in the text.\n\n${menuText}`;
            const aiResponse = await askAI(prompt);
            const menuItems = parseJSONFromAI(aiResponse.content);

            if (menuItems.length > 0) {
                console.log(`Menu: Found ${menuItems.length} items from menu link: ${menuUrl}`);
                return {
                    restaurantName,
                    source: 'website' as const,
                    aiProvider: aiResponse.provider,
                    websiteUrl: menuUrl,
                    items: menuItems,
                };
            }
        } catch (err: any) {
            console.warn(`Menu: Failed to scrape menu link ${menuUrl}:`, err.message);
        }
    }

    return null;
}

/**
 * Deduplicate menu items by name (case-insensitive).
 * Keeps the version with the most info (has price, longer name).
 */
function deduplicateMenuItems(items: any[]): any[] {
    const map = new Map<string, any>();

    for (const item of items) {
        if (!item?.name) continue;
        const key = item.name.toLowerCase().trim();

        const existing = map.get(key);
        if (!existing) {
            map.set(key, item);
        } else {
            // Prefer the item that has a price
            if (item.price != null && existing.price == null) {
                map.set(key, item);
            }
        }
    }

    return Array.from(map.values());
}
