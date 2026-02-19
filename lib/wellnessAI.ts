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
    const prompt = `You are a compassionate women's health wellness advisor. Based on the following cycle data, generate 4-5 personalized wellness tips. Each tip should have an emoji, a short title, and 1-2 sentences of advice.

Current Phase: ${ctx.phase} (Day ${ctx.cycleDay})
Moods: ${ctx.moods.length > 0 ? ctx.moods.join(', ') : 'Not logged'}
Symptoms: ${ctx.symptoms.length > 0 ? ctx.symptoms.join(', ') : 'None reported'}
Sleep Quality: ${ctx.sleepQuality || 'Not tracked'}
Energy Level: ${ctx.energyLevel || 'Not tracked'}

Format each tip as:
[emoji] **[Title]**
[Advice text]

Focus on actionable, phase-specific advice covering nutrition, exercise, self-care, and emotional wellness. Be warm and supportive.`;

    return callAI(prompt);
}

export async function generateEmpathyAlerts(ctx: WellnessContext): Promise<AIResult> {
    const prompt = `You are a relationship wellness advisor helping a partner understand and support their significant other during their menstrual cycle. Generate 4-5 empathy alerts with care advice.

Partner's Current Phase: ${ctx.phase} (Day ${ctx.cycleDay})
Their Moods: ${ctx.moods.length > 0 ? ctx.moods.join(', ') : 'Not logged'}
Their Symptoms: ${ctx.symptoms.length > 0 ? ctx.symptoms.join(', ') : 'None reported'}
Their Sleep Quality: ${ctx.sleepQuality || 'Not tracked'}
Their Energy Level: ${ctx.energyLevel || 'Not tracked'}

Format each alert as:
[emoji] **[Title]**
[How to react / what to do — 1-2 sentences]

Cover: emotional support, physical comfort ideas, things to avoid saying, and small gestures that help. Be warm, specific, and practical.`;

    return callAI(prompt);
}

export async function generateGiftRecommendations(ctx: WellnessContext): Promise<AIResult> {
    const prompt = `You are a thoughtful gift advisor helping a partner choose gifts/gestures for their significant other based on their current menstrual cycle phase and wellbeing.

Partner's Current Phase: ${ctx.phase} (Day ${ctx.cycleDay})
Their Moods: ${ctx.moods.length > 0 ? ctx.moods.join(', ') : 'Not logged'}
Their Symptoms: ${ctx.symptoms.length > 0 ? ctx.symptoms.join(', ') : 'None reported'}
Their Energy Level: ${ctx.energyLevel || 'Not tracked'}

Generate 5-6 gift/gesture recommendations. Mix affordable small gestures with thoughtful gifts. Format each as:
[emoji] **[Gift/Gesture Name]** — [Why this is perfect right now, 1 sentence]

Include a mix of: comfort items, food/drink, experiences, and romantic gestures. Be creative and phase-aware.`;

    return callAI(prompt);
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
