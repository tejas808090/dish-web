/**
 * Multi-Provider AI Utility
 * 
 * Tries providers in order: OpenAI → Gemini → Claude
 * Automatically falls back if a provider fails (quota, auth, etc.)
 */

type AIProvider = 'openai' | 'gemini' | 'claude';

interface AIResponse {
    content: string;
    provider: AIProvider;
}

const providers: { name: AIProvider; envKey: string }[] = [
    { name: 'openai', envKey: 'OPENAI_API_KEY' },
    { name: 'gemini', envKey: 'GEMINI_API_KEY' },
    { name: 'claude', envKey: 'CLAUDE_API_KEY' },
];

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
    console.log('Trying OpenAI...');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1024,
        }),
    });

    const data = await res.json();
    if (data.error) {
        console.error('OpenAI Error Details:', JSON.stringify(data.error));
        throw new Error(`OpenAI: ${data.error.message || 'Unknown error'}`);
    }
    return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
    console.log('Trying Gemini...');
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                },
            }),
        }
    );

    const data = await res.json();
    if (data.error) {
        console.error('Gemini Error Details:', JSON.stringify(data.error));
        throw new Error(`Gemini: ${data.error.message || 'Unknown error'}`);
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(prompt: string, apiKey: string): Promise<string> {
    console.log('Trying Claude...');
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    const data = await res.json();
    if (data.error) {
        console.error('Claude Error Details:', JSON.stringify(data.error));
        throw new Error(`Claude: ${data.error.message || 'Unknown error'}`);
    }
    return data.content?.[0]?.text || '';
}

/**
 * Send a prompt to AI with automatic fallback across providers.
 * Tries: OpenAI → Gemini → Claude
 */
export async function askAI(prompt: string): Promise<AIResponse> {
    const errors: string[] = [];

    for (const provider of providers) {
        const apiKey = process.env[provider.envKey];
        if (!apiKey || apiKey.includes('PASTE_YOUR')) {
            errors.push(`${provider.name}: no valid API key`);
            continue;
        }

        try {
            let content: string;
            switch (provider.name) {
                case 'openai':
                    content = await callOpenAI(prompt, apiKey);
                    break;
                case 'gemini':
                    content = await callGemini(prompt, apiKey);
                    break;
                case 'claude':
                    content = await callClaude(prompt, apiKey);
                    break;
                default:
                    throw new Error('Unknown provider');
            }
            console.log(`AI response from: ${provider.name}`);
            return { content, provider: provider.name };
        } catch (err: any) {
            errors.push(`${provider.name}: ${err.message}`);
            console.warn(`AI fallback — ${provider.name} failed:`, err.message);
            continue;
        }
    }

    throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

/**
 * Parse a JSON array from AI response text (handles markdown code blocks).
 */
export function parseJSONFromAI(text: string): any[] {
    try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        console.error('Failed to parse AI JSON:', text.slice(0, 200));
        return [];
    }
}
