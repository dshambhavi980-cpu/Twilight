import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendGameNotification } from '../../lib/notifications';

interface ECItem {
    id: number;
    emojis: string;
    answer: string;
    category: string;
}

interface ECState {
    currentCard: ECItem | null;
    isRevealed: boolean;
    history: number[];
}

interface GameSession {
    id: string;
    couple_id: string;
    game_type: 'emoji_charades';
    board_state: ECState;
}

const loadData = async (): Promise<ECItem[]> => {
    const res = await fetch('/Games_data/emoji_charades.json');
    return await res.json();
};

const emptyState = (): ECState => ({
    currentCard: null,
    isRevealed: false,
    history: []
});

const EmojiCharades: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { couple } = useCouples();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    const [items, setItems] = useState<ECItem[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [ringCooldown, setRingCooldown] = useState(false);

    useEffect(() => { loadData().then(setItems).catch(console.error); }, []);

    useEffect(() => {
        if (!user || !couple) return;

        const fetchSession = async () => {
            const { data } = await supabase.from('game_sessions').select('*')
                .eq('couple_id', couple.id).eq('game_type', 'emoji_charades').single();

            if (data) {
                setSession(data);
                setLoading(false);
                if (!data.board_state.currentCard && items.length > 0) pickNewCard(data.board_state, items);
            } else {
                const newState = emptyState();
                const { data: newSession } = await supabase.from('game_sessions')
                    .insert({ couple_id: couple.id, game_type: 'emoji_charades', board_state: newState, player_x: user.id, status: 'active' })
                    .select().single();
                if (newSession) setSession(newSession);
                setLoading(false);
                sendGameNotification(couple, user.id, 'Emoji Charades', '/games/emoji-charades', 'invite');
            }
        };

        if (items.length > 0) fetchSession();

        const ch = supabase.channel(`game_ec_${couple.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${couple.id}` }, 
            (payload) => setSession(payload.new as GameSession))
            .subscribe();
            
        return () => { supabase.removeChannel(ch); };
    }, [user, couple, items]);

    const pickNewCard = async (currentState: ECState, itemList: ECItem[]) => {
        const available = itemList.filter(i => !currentState.history.includes(i.id));
        const pool = available.length > 0 ? available : itemList;
        const nextCard = pool[Math.floor(Math.random() * pool.length)];
        
        const newState = {
            currentCard: nextCard,
            isRevealed: false,
            history: [...currentState.history, nextCard.id]
        };
        
        await supabase.from('game_sessions').update({ board_state: newState }).eq('couple_id', couple?.id).eq('game_type', 'emoji_charades');
    };

    const toggleReveal = async () => {
        if (!session) return;
        const newState = { ...session.board_state, isRevealed: !session.board_state.isRevealed };
        await supabase.from('game_sessions').update({ board_state: newState }).eq('id', session.id);
    };

    const nextCard = () => {
        if (!session) return;
        pickNewCard(session.board_state, items);
    };

    if (loading || !session?.board_state?.currentCard) return <Loading />;

    const { currentCard, isRevealed } = session.board_state;

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#121014] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                 <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Emoji Charades</h1>
                <button
                    onClick={async () => {
                        if (!couple || !user || ringCooldown) return;
                        setRingCooldown(true);
                        await sendGameNotification(couple, user.id, 'Emoji Charades', '/games/emoji-charades', 'ring');
                        setTimeout(() => setRingCooldown(false), 30000);
                    }}
                    disabled={ringCooldown}
                    className={`p-2 rounded-full transition-all ${ringCooldown ? 'opacity-30' : 'hover:bg-white/10 active:scale-90'}`}
                    title="Ring Partner"
                >
                    <span className="material-symbols-outlined text-2xl">{ringCooldown ? 'notifications_off' : 'notifications_active'}</span>
                </button>
            </div>

            <main className="flex-1 p-6 pt-12 flex flex-col justify-center items-center max-w-md mx-auto w-full text-center">
                <div className="mb-4 bg-orange-500/10 text-orange-500 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                    {currentCard.category}
                </div>

                <div className="w-full bg-white/5 rounded-3xl p-12 mb-8 border border-white/10">
                    <div className="text-6xl sm:text-7xl mb-6 tracking-widest leading-relaxed">
                        {currentCard.emojis}
                    </div>
                </div>

                <AnimatePresence>
                    {isRevealed ? (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-green-500 text-white rounded-2xl p-6 w-full mb-8"
                        >
                            <h2 className="text-2xl font-bold">{currentCard.answer}</h2>
                        </motion.div>
                    ) : (
                         <div className="h-20 mb-8 flex items-center justify-center text-gray-500 italic">
                            Tap below to reveal the answer...
                         </div>
                    )}
                </AnimatePresence>

                <div className="flex gap-4 w-full">
                    <button 
                         onClick={toggleReveal}
                         className={`flex-1 px-6 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all ${
                            isRevealed ? 'bg-gray-700 text-white' : 'bg-orange-500 text-white'
                        }`}
                    >
                        {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                    </button>
                    
                    <button 
                        onClick={nextCard}
                        className={`flex-1 px-6 py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all ${
                            isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        Next
                    </button>
                </div>
            </main>
        </div>
    );
};

const Loading = () => (
    <div className="flex h-screen items-center justify-center bg-[#121014]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
);

export default EmojiCharades;
