import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY');
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY') || Deno.env.get('VITE_SERPER_API');
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Product {
    title: string;
    link: string;
    image: string;
    price?: string;
    source: string;
}

function detectSource(link: string): string {
    const l = link.toLowerCase();
    if (l.includes('amazon')) return 'Amazon';
    if (l.includes('flipkart')) return 'Flipkart';
    if (l.includes('nykaa')) return 'Nykaa';
    if (l.includes('myntra')) return 'Myntra';
    if (l.includes('blinkit')) return 'Blinkit';
    if (l.includes('bigbasket')) return 'Blinkit';
    if (l.includes('swiggy')) return 'Blinkit';
    return 'Other';
}

async function searchProducts(query: string): Promise<Product[]> {
    if (!SERPER_API_KEY) return [];

    try {
        // Try shopping search first
        const shoppingRes = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, gl: 'in', hl: 'en', num: 5 }),
        });

        if (shoppingRes.ok) {
            const data = await shoppingRes.json();
            const items = data.shopping || [];
            if (items.length > 0) {
                return items.map((item: any) => ({
                    title: item.title || '',
                    link: item.link || '',
                    image: item.imageUrl || item.thumbnail || '',
                    price: item.price || '',
                    source: detectSource(item.link || item.source || ''),
                }));
            }
        }

        // Fallback: regular search (works better for Blinkit/quick-commerce)
        const searchRes = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query + ' buy India', gl: 'in', hl: 'en', num: 5 }),
        });

        if (searchRes.ok) {
            const data = await searchRes.json();
            const organic = data.organic || [];
            return organic
                .filter((r: any) => r.link && (
                    r.link.includes('amazon') || r.link.includes('flipkart') ||
                    r.link.includes('myntra') || r.link.includes('nykaa') ||
                    r.link.includes('blinkit') || r.link.includes('bigbasket') ||
                    r.link.includes('swiggy')
                ))
                .slice(0, 5)
                .map((r: any) => ({
                    title: r.title || '',
                    link: r.link || '',
                    image: r.thumbnail || r.imageUrl || '',
                    price: '',
                    source: detectSource(r.link || ''),
                }));
        }

        return [];
    } catch (err) {
        console.error('Search failed:', err);
        return [];
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { mood, customPrompt, search_query } = await req.json();

        // ── Product Search Mode ──
        if (mood === 'search' && search_query) {
            const products = await searchProducts(search_query);
            return new Response(JSON.stringify({ products }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ── Places Search Mode ──
        if (mood === 'places') {
            if (!SERPER_API_KEY) throw new Error('SERPER_API_KEY is not set');

            const { lat, lon } = await req.clone().json().catch(() => ({}));

            const placesBody: any = { 
                q: search_query || 'pharmacy medical store', 
                gl: 'in', 
                hl: 'en', 
                num: 20 // Increase to fetch more results to find the closest ones
            };

            // Use Serper's ll parameter with a precise zoom level. 
            // 14z is roughly city/neighborhood level, which works best for finding local places
            if (lat && lon) {
                // By combining "near me" with the ll parameter, Serper correctly geolocates
                placesBody.q = (search_query || 'pharmacy medical store') + ' near me';
                placesBody.ll = `@${lat},${lon},14z`;
            }

            const placesRes = await fetch('https://google.serper.dev/places', {
                method: 'POST',
                headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify(placesBody),
            });

            if (!placesRes.ok) {
                const errText = await placesRes.text();
                throw new Error(`Serper Places error ${placesRes.status}: ${errText}`);
            }

            const data = await placesRes.json();
            return new Response(JSON.stringify({ places: data.places || [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // ── AI Text Generation Mode ──
        if (!NVIDIA_API_KEY) {
            throw new Error('NVIDIA_API_KEY is not set');
        }

        const prompt = customPrompt || search_query || '';

        const response = await fetch(NVIDIA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'meta/llama-3.1-8b-instruct',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 1024,
                temperature: 0.7,
                top_p: 0.9,
                stream: false,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`NVIDIA API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
