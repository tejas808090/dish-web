/**
 * Multi-Provider Vision AI Utility
 *
 * Sends an image + text prompt to vision AI with automatic fallback.
 * Tries providers in order: OpenAI → Gemini → Claude
 */

type VisionProvider = 'openai' | 'gemini' | 'claude';

interface VisionResponse {
    content: string;
    provider: VisionProvider;
}

const providers: { name: VisionProvider; envKey: string }[] = [
    // { name: 'openai', envKey: 'OPENAI_API_KEY' },
    // { name: 'gemini', envKey: 'GEMINI_API_KEY' },
    { name: 'claude', envKey: 'CLAUDE_API_KEY' },
];

/**
 * Convert an image URL to a base64 data URL.
 */
export async function urlToBase64(url: string): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}

async function callOpenAIVision(image: string, prompt: string, apiKey: string, maxTokens: number): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: image } },
                ],
            }],
            max_tokens: maxTokens,
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(`OpenAI: ${data.error.message}`);
    return data.choices?.[0]?.message?.content || '';
}

async function callGeminiVision(image: string, prompt: string, apiKey: string): Promise<string> {
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mimeType = match?.[1] || 'image/jpeg';
    const base64Data = match?.[2] || image;

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType, data: base64Data } },
                    ],
                }],
            }),
        }
    );

    const data = await res.json();
    if (data.error) throw new Error(`Gemini: ${data.error.message}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaudeVision(image: string, prompt: string, apiKey: string, maxTokens: number): Promise<string> {
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    const mediaType = match?.[1] || 'image/jpeg';
    const base64Data = match?.[2] || image;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: maxTokens,
            messages: [{
                role: 'user',
                content: [
                    { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
                    { type: 'text', text: prompt },
                ],
            }],
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(`Claude: ${data.error.message}`);
    return data.content?.[0]?.text || '';
}

/**
 * Send an image + text prompt to vision AI with automatic fallback.
 * Tries: OpenAI (gpt-4o-mini) → Gemini (gemini-2.0-flash) → Claude (claude-3-5-haiku)
 *
 * @param image - Data URL (data:image/jpeg;base64,...) or HTTPS URL (will be fetched & converted)
 * @param prompt - Text instruction for the vision model
 * @param maxTokens - Max response tokens (default: 1024)
 */
export async function askVisionAI(
    image: string,
    prompt: string,
    maxTokens: number = 1024
): Promise<VisionResponse> {
    // Convert HTTPS URLs to base64 data URLs
    const imageData = image.startsWith('http') ? await urlToBase64(image) : image;

    const errors: string[] = [];

    for (const provider of providers) {
        const apiKey = process.env[provider.envKey];
        if (!apiKey || apiKey.includes('PASTE_YOUR')) continue;

        try {
            let content: string;
            switch (provider.name) {
                case 'openai':
                    content = await callOpenAIVision(imageData, prompt, apiKey, maxTokens);
                    break;
                case 'gemini':
                    content = await callGeminiVision(imageData, prompt, apiKey);
                    break;
                case 'claude':
                    content = await callClaudeVision(imageData, prompt, apiKey, maxTokens);
                    break;
                default:
                    throw new Error('Unknown provider');
            }
            return { content, provider: provider.name };
        } catch (err: any) {
            errors.push(`${provider.name}: ${err.message}`);
            console.warn(`Vision fallback — ${provider.name} failed:`, err.message);
        }
    }

    throw new Error(`All vision AI providers failed:\n${errors.join('\n')}`);
}
