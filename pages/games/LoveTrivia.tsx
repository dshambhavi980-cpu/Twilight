import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendGameNotification } from '../../lib/notifications';

interface LTItem {
    id: number;
    category: string;
    question: string;
}

interface LTState {
    currentCard: LTItem | null;
    history: number[];
}

interface GameSession {
    id: string;
    couple_id: string;
    game_type: 'love_trivia';
    board_state: LTState;
    updated_at: string;
}

const loadData = async (): Promise<LTItem[]> => {
    const res = await fetch('/Games_data/love_trivia.json');
    return await res.json();
};

const emptyState = (): LTState => ({
    currentCard: null,
    history: []
});

const LoveTrivia: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { couple } = useCouples();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [items, setItems] = useState<LTItem[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [ringCooldown, setRingCooldown] = useState(false);

    useEffect(() => { loadData().then(setItems).catch(console.error); }, []);

    useEffect(() => {
        if (!user || !couple) return;

        const fetchSession = async () => {
            const { data } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('couple_id', couple.id)
                .eq('game_type', 'love_trivia')
                .single();

            if (data) {
                setSession(data);
                setLoading(false);
                if (!data.board_state.currentCard && items.length > 0) {
                     pickNewCard(data.board_state, items);
                }
            } else {
                const newState = emptyState();
                const { data: newSession } = await supabase
                    .from('game_sessions')
                    .insert({
                        couple_id: couple.id,
                        game_type: 'love_trivia',
                        board_state: newState,
                        player_x: user.id,
                        status: 'active'
                    })
                    .select()
                    .single();
                if (newSession) setSession(newSession);
                setLoading(false);
                sendGameNotification(couple, user.id, 'Love Trivia', '/games/trivia', 'invite');
            }
        };

        if (items.length > 0) fetchSession();

        const ch = supabase.channel(`game_lt_${couple.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${couple.id}` }, 
            (payload) => setSession(payload.new as GameSession))
            .subscribe();
            
        return () => { supabase.removeChannel(ch); };
    }, [user, couple, items]);

    const pickNewCard = async (currentState: LTState, itemList: LTItem[]) => {
        const available = itemList.filter(i => !currentState.history.includes(i.id));
        const pool = available.length > 0 ? available : itemList;
        const nextCard = pool[Math.floor(Math.random() * pool.length)];
        
        const newState = {
            currentCard: nextCard,
            history: [...currentState.history, nextCard.id]
        };
        
        await supabase.from('game_sessions').update({ board_state: newState }).eq('couple_id', couple?.id).eq('game_type', 'love_trivia');
    };

    const nextCard = () => {
        if (!session) return;
        pickNewCard(session.board_state, items);
    };

    if (loading || !session?.board_state?.currentCard) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>;

    const { currentCard } = session.board_state;

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#121014] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                 <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Love Trivia</h1>
                <button
                    onClick={async () => {
                        if (!couple || !user || ringCooldown) return;
                        setRingCooldown(true);
                        await sendGameNotification(couple, user.id, 'Love Trivia', '/games/trivia', 'ring');
                        setTimeout(() => setRingCooldown(false), 30000);
                    }}
                    disabled={ringCooldown}
                    className={`p-2 rounded-full transition-all ${ringCooldown ? 'opacity-30' : 'hover:bg-white/10 active:scale-90'}`}
                    title="Ring Partner"
                >
                    <span className="material-symbols-outlined text-2xl">{ringCooldown ? 'notifications_off' : 'notifications_active'}</span>
                </button>
            </div>

            <main className="flex-1 p-6 pt-12 flex flex-col justify-center items-center max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentCard.id}
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        className="w-full aspect-[3/4] max-h-[500px] rounded-3xl shadow-2xl p-8 flex flex-col items-center justify-center text-center relative bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                    >
                        <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-medium mb-8">
                            {currentCard.category}
                        </span>
                        <h2 className="text-3xl font-bold leading-tight mb-6">{currentCard.question}</h2>
                        
                        <div className="bg-black/20 p-4 rounded-xl text-sm backdrop-blur-sm">
                            <p className="opacity-90">
                                <b>How to play:</b> <br/>
                                1. Ask your partner this question.<br/>
                                2. See if they know the answer!<br/>
                                3. Or both verify the answer.
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button 
                    onClick={nextCard}
                    className={`mt-8 w-full px-6 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all ${
                        isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                >
                    Next Question
                </button>
            </main>
        </div>
    );
};

export default LoveTrivia;
