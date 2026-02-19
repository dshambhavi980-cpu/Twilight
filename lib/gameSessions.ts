import { supabase } from './supabase';

export async function endSession(sessionId: string) {
    if (!sessionId) return;
    try {
        await (supabase.from('game_sessions') as any)
            .update({ status: 'ended' })
            .eq('id', sessionId);
    } catch (err) {
        console.error('[gameSessions] endSession error', err);
    }
}

export default { endSession };
