import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendGameNotification } from '../../lib/notifications';

interface TTItem {
    id: number;
    optionA: string;
    optionB: string;
}

interface TTState {
    currentCard: TTItem | null;
    votes: Record<string, 'A' | 'B'>; // user_id -> choice
    history: number[];
}

interface GameSession {
    id: string;
    couple_id: string;
    game_type: 'this_or_that';
    board_state: TTState;
    player_x: string;
    player_o: string | null;
    updated_at: string;
}

const loadData = async (): Promise<TTItem[]> => {
    const res = await fetch('/Games_data/this_or_that.json');
    return await res.json();
};

const emptyState = (): TTState => ({
    currentCard: null,
    votes: {},
    history: []
});

const ThisOrThat: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { couple } = useCouples();
    const { theme, primaryColor } = useTheme();
    const isDark = theme === 'dark';
    
    const [items, setItems] = useState<TTItem[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const [ringCooldown, setRingCooldown] = useState(false);

    useEffect(() => { loadData().then(setItems).catch(console.error); }, []);

    useEffect(() => {
        if (!user || !couple) return;

        const fetchSession = async () => {
            const { data } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('couple_id', couple.id)
                .eq('game_type', 'this_or_that')
                .single();

            if (data) {
                setSession(data);
                setLoading(false);
                // If no card, pick one
                if (!data.board_state.currentCard && items.length > 0) {
                     pickNewCard(data.board_state, items);
                }
            } else {
                const newState = emptyState();
                const { data: newSession } = await supabase
                    .from('game_sessions')
                    .insert({
                        couple_id: couple.id,
                        game_type: 'this_or_that',
                        board_state: newState,
                        player_x: user.id,
                        status: 'active'
                    })
                    .select()
                    .single();
                
                if (newSession) setSession(newSession);
                setLoading(false);
                sendGameNotification(couple, user.id, 'This or That', '/games/this-or-that', 'invite');
            }
        };

        if (items.length > 0) fetchSession();

        const ch = supabase.channel(`game_tt_${couple.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${couple.id}` }, 
            (payload) => setSession(payload.new as GameSession))
            .subscribe();
            
        return () => { supabase.removeChannel(ch); };
    }, [user, couple, items]);

    const pickNewCard = async (currentState: TTState, itemList: TTItem[]) => {
        // Only player X should pick to avoid race conditions usually, but simple random pick is fine
        const available = itemList.filter(i => !currentState.history.includes(i.id));
        const pool = available.length > 0 ? available : itemList;
        const nextCard = pool[Math.floor(Math.random() * pool.length)];
        
        const newState = {
            currentCard: nextCard,
            votes: {},
            history: [...currentState.history, nextCard.id]
        };
        
        await supabase.from('game_sessions').update({ board_state: newState }).eq('couple_id', couple?.id).eq('game_type', 'this_or_that');
    };

    const vote = async (choice: 'A' | 'B') => {
        if (!session || !user) return;
        const newVotes = { ...session.board_state.votes, [user.id]: choice };
        const newState = { ...session.board_state, votes: newVotes };
        await supabase.from('game_sessions').update({ board_state: newState }).eq('id', session.id);
    };

    const nextRound = () => {
        if (!session) return;
        pickNewCard(session.board_state, items);
    };

    if (loading || !session || !session.board_state.currentCard) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>;

    const { currentCard, votes } = session.board_state;
    const myVote = votes[user?.id || ''];
    const partnerId = session.player_x === user?.id ? session.player_o : session.player_x;
    const partnerVote = partnerId ? votes[partnerId] : null;

    const showResult = myVote && partnerVote;
    const match = showResult && myVote === partnerVote;

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#121014] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                 <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">This or That</h1>
                <button
                    onClick={async () => {
                        if (!couple || !user || ringCooldown) return;
                        setRingCooldown(true);
                        await sendGameNotification(couple, user.id, 'This or That', '/games/this-or-that', 'ring');
                        setTimeout(() => setRingCooldown(false), 30000);
                    }}
                    disabled={ringCooldown}
                    className={`p-2 rounded-full transition-all ${ringCooldown ? 'opacity-30' : 'hover:bg-white/10 active:scale-90'}`}
                    title="Ring Partner"
                >
                    <span className="material-symbols-outlined text-2xl">{ringCooldown ? 'notifications_off' : 'notifications_active'}</span>
                </button>
            </div>

            <main className="flex-1 p-6 pt-12 flex flex-col justify-center items-center max-w-md mx-auto w-full gap-6">
                
                {/* Status or Result Header */}
                <div className="h-12 flex items-center justify-center">
                    {showResult ? (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className={`px-6 py-2 rounded-full font-bold flex items-center gap-2 ${match ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                        >
                            {match ? '✨ It\'s a Match!' : '❌ Ops! Different Vibes'}
                        </motion.div>
                    ) : (myVote && !partnerVote) ? (
                         <div className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-lg text-sm font-medium">
                            ✅ You picked! Waiting for partner...
                        </div>
                    ) : (
                         <div className="text-gray-500 text-sm">Pick your favorite!</div>
                    )}
                </div>

                {/* Option A */}
                <button
                    onClick={() => !myVote && vote('A')}
                    disabled={!!myVote}
                    className={`w-full py-8 rounded-3xl border-2 transition-all relative overflow-hidden group ${
                        myVote === 'A' ? 'border-blue-500 bg-blue-500/10' : 
                        isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                    }`}
                >
                    <span className="text-2xl font-bold block mb-2">{currentCard.optionA}</span>
                    {showResult && partnerVote === 'A' && (
                        <div className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Partner</div>
                    )}
                </button>

                <div className="flex items-center justify-center w-full">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-gray-400">OR</span>
                </div>

                {/* Option B */}
                <button
                    onClick={() => !myVote && vote('B')}
                    disabled={!!myVote}
                    className={`w-full py-8 rounded-3xl border-2 transition-all relative overflow-hidden group ${
                        myVote === 'B' ? 'border-purple-500 bg-purple-500/10' : 
                        isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'
                    }`}
                >
                    <span className="text-2xl font-bold block mb-2">{currentCard.optionB}</span>
                    {showResult && partnerVote === 'B' && (
                        <div className="absolute top-2 right-2 text-xs bg-purple-500 text-white px-2 py-1 rounded-full">Partner</div>
                    )}
                </button>

                {showResult && (
                    <button 
                        onClick={nextRound}
                        className={`w-full px-6 py-4 rounded-2xl font-bold shadow-lg mt-8 ${
                            isDark ? 'bg-white text-black' : 'bg-black text-white'
                        }`}
                    >
                        Next Round
                    </button>
                )}
            </main>
        </div>
    );
};

export default ThisOrThat;
