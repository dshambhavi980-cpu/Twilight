import { supabase } from './supabase';

const SUPABASE_URL = 'https://awijrkxrhlisixufiukw.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface WellnessContext {
    phase: string;
    cycleDay: number;
    moods: string[];
    symptoms: string[];
    sleepQuality?: string;
    energyLevel?: string;
    partnerName?: string;
}

export interface Product {
    title: string;
    link: string;
    image: string;
    price?: string;
    source: 'Amazon' | 'Flipkart' | 'Nykaa' | 'Myntra' | 'Other';
}

interface AIResult {
    text: string;
    error?: string;
}

async function callAI(customPrompt: string): Promise<AIResult> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        const res = await fetch(
            `${SUPABASE_URL}/functions/v1/ai-generate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': SUPABASE_ANON_KEY,
                },
                body: JSON.stringify({ mood: 'encouragement', customPrompt }),
                signal: controller.signal,
            }
        );

        clearTimeout(timeout);

        if (!res.ok) {
            const errText = await res.text();
            let errMsg = `HTTP ${res.status}`;
            try { const errJson = JSON.parse(errText); errMsg = errJson.error || errMsg; } catch { }
            throw new Error(errMsg);
        }

        const data = await res.json();
        return { text: data.text };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { text: '', error: 'Request timed out. Please try again.' };
        }
        return { text: '', error: error.message || 'Failed to generate' };
    }
}

export async function generateWellnessTips(ctx: WellnessContext): Promise<AIResult> {
    const prompt = `You are a compassionate women's health wellness advisor. Based on the following cycle data, generate 3 highly personalized, concise wellness tips. Each tip MUST start with a real emoji, followed by a bold title, and 1-2 sentences of advice.

Current Phase: ${ctx.phase} (Day ${ctx.cycleDay})
Moods: ${ctx.moods.length > 0 ? ctx.moods.join(', ') : 'Not logged'}
Symptoms: ${ctx.symptoms.length > 0 ? ctx.symptoms.join(', ') : 'None reported'}
Sleep Quality: ${ctx.sleepQuality || 'Not tracked'}
Energy Level: ${ctx.energyLevel || 'Not tracked'}

Format each tip as:
[emoji] **[Title]**
[Advice text]

Ensure each tip is fully completed and do not cut off mid-sentence. Focus on actionable, phase-specific advice.`;

    return callAI(prompt);
}

export async function generateEmpathyAlerts(ctx: WellnessContext): Promise<AIResult> {
    const prompt = `You are a relationship wellness advisor helping a partner understand and support their significant other. Generate 3 concise empathy alerts. Each alert MUST start with a real emoji, followed by a bold title, and 1-2 sentences of care advice.

Partner's Current Phase: ${ctx.phase} (Day ${ctx.cycleDay})
Their Moods: ${ctx.moods.length > 0 ? ctx.moods.join(', ') : 'Not logged'}
Their Symptoms: ${ctx.symptoms.length > 0 ? ctx.symptoms.join(', ') : 'None reported'}
Their Sleep Quality: ${ctx.sleepQuality || 'Not tracked'}
Their Energy Level: ${ctx.energyLevel || 'Not tracked'}

Format each alert as:
[emoji] **[Title]**
[How to react / what to do]

Ensure the text is fully completed. Be warm, specific, and practical.`;

    return callAI(prompt);
}

export async function generateGiftRecommendations(ctx: WellnessContext): Promise<AIResult> {
    const prompt = `You are a professional gift curator. Generate 3 specific, concise search terms for physical products available in India (Amazon, Flipkart, Nykaa) that help with ${ctx.phase} symptoms and ${ctx.moods.join(', ')} mood.

CRITICAL: Return ONLY a comma-separated list of 3 product names. 
DO NOT include any greeting, advice, or sentences like "You are strong". 
DO NOT include any introductory or concluding text.

Example format: "Period cramp relief patch, Dark chocolate gift box, Lavender sleep spray"`;

    return callAI(prompt);
}

export async function searchShoppingProducts(query: string): Promise<Product[]> {
    const API_KEY = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY;
    const CX = import.meta.env.VITE_GOOGLE_SEARCH_CX;

    if (!API_KEY || !CX) {
        console.error('Search API keys missing');
        return [];
    }

    try {
        const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&num=3`
        );
        const data = await res.json();

        if (!data.items) return [];

        return data.items.map((item: any) => {
            const link = item.link || '';
            let source: Product['source'] = 'Other';
            if (link.includes('amazon.in')) source = 'Amazon';
            else if (link.includes('flipkart.com')) source = 'Flipkart';
            else if (link.includes('nykaa.com')) source = 'Nykaa';
            else if (link.includes('myntra.com')) source = 'Myntra';

            // Try to extract price from snippet or pagemap
            let price = '';
            const offer = item.pagemap?.offer?.[0];
            if (offer?.price) {
                price = `${offer.priceCurrency === 'INR' || !offer.priceCurrency ? '₹' : offer.priceCurrency}${offer.price}`;
            } else {
                // Regex fallbacks for snippets like "Rs. 499" or "₹499"
                const priceMatch = item.snippet.match(/(?:Rs\.?|₹)\s?(\d+[,.]?\d*)/);
                if (priceMatch) price = `₹${priceMatch[1]}`;
            }

            return {
                title: item.title.split('-')[0].split('|')[0].trim(),
                link: item.link,
                image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'] || '',
                price: price || undefined,
                source
            };
        });
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

// Client-side sleep/energy correlation analysis
export function analyzeSleepEnergyCorrelations(logs: any[]) {
    const validLogs = logs.filter(l => l.sleepQuality || l.sleep_quality || l.energyLevel || l.energy_level);

    // Normalize field names (DB uses snake_case, app uses camelCase)
    const normalized = validLogs.map(l => ({
        date: l.date,
        sleep: l.sleepQuality || l.sleep_quality || null,
        energy: l.energyLevel || l.energy_level || null,
        moods: l.moods || [],
        flow: l.flow || null,
    }));

    // Sleep distribution
    const sleepCounts = { good: 0, fair: 0, poor: 0 };
    normalized.forEach(l => {
        if (l.sleep && sleepCounts.hasOwnProperty(l.sleep)) {
            sleepCounts[l.sleep as keyof typeof sleepCounts]++;
        }
    });

    // Energy distribution
    const energyCounts = { high: 0, medium: 0, low: 0 };
    normalized.forEach(l => {
        if (l.energy && energyCounts.hasOwnProperty(l.energy)) {
            energyCounts[l.energy as keyof typeof energyCounts]++;
        }
    });

    // Correlation: sleep quality → energy level
    const sleepEnergyMap: Record<string, Record<string, number>> = {
        good: { high: 0, medium: 0, low: 0 },
        fair: { high: 0, medium: 0, low: 0 },
        poor: { high: 0, medium: 0, low: 0 },
    };

    normalized.forEach(l => {
        if (l.sleep && l.energy && sleepEnergyMap[l.sleep]) {
            sleepEnergyMap[l.sleep][l.energy]++;
        }
    });

    // Generate insights
    const insights: string[] = [];
    const totalWithBoth = normalized.filter(l => l.sleep && l.energy).length;

    if (totalWithBoth >= 3) {
        const goodSleepHighEnergy = sleepEnergyMap.good.high;
        const poorSleepLowEnergy = sleepEnergyMap.poor.low;
        const goodSleepTotal = sleepCounts.good;
        const poorSleepTotal = sleepCounts.poor;

        if (goodSleepTotal > 0) {
            const highEnergyRate = Math.round((goodSleepHighEnergy / goodSleepTotal) * 100);
            if (highEnergyRate > 30) {
                insights.push(`On days with good sleep, you have high energy ${highEnergyRate}% of the time ✨`);
            }
        }

        if (poorSleepTotal > 0) {
            const lowEnergyRate = Math.round((poorSleepLowEnergy / poorSleepTotal) * 100);
            if (lowEnergyRate > 30) {
                insights.push(`Poor sleep correlates with low energy ${lowEnergyRate}% of the time 😴`);
            }
        }

        // Flow impact on sleep
        const flowDays = normalized.filter(l => l.flow && l.sleep);
        const nonFlowDays = normalized.filter(l => !l.flow && l.sleep);
        if (flowDays.length >= 2 && nonFlowDays.length >= 2) {
            const flowPoorRate = flowDays.filter(l => l.sleep === 'poor').length / flowDays.length;
            const nonFlowPoorRate = nonFlowDays.filter(l => l.sleep === 'poor').length / nonFlowDays.length;
            if (flowPoorRate > nonFlowPoorRate * 1.3) {
                insights.push(`Your sleep quality tends to decrease during your period 🌙`);
            }
        }
    }

    if (insights.length === 0) {
        insights.push('Keep logging your sleep and energy to unlock personalized correlations! 📊');
    }

    return {
        sleepCounts,
        energyCounts,
        sleepEnergyMap,
        insights,
        totalLogs: normalized.length,
        totalWithBoth,
    };
}
