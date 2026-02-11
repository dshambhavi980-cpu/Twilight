import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from '../../components/Toast';
import { sendGameNotification } from '../../lib/notifications';

interface TDItem {
    id: number;
    category: string;
    type: 'Truth' | 'Dare';
    question: string;
}

interface TDState {
    phase: 'setup' | 'playing';
    currentCard: TDItem | null;
    turn: string; // user_id
    history: number[];
}

interface GameSession {
    id: string;
    couple_id: string;
    game_type: 'truth_dare';
    board_state: TDState;
    player_x: string;
    player_o: string | null;
    updated_at: string;
}

const loadData = async (): Promise<TDItem[]> => {
    const res = await fetch('/Games_data/truth_or_dare.json');
    return await res.json();
};

const emptyState = (firstTurn: string): TDState => ({
    phase: 'setup',
    currentCard: null,
    turn: firstTurn,
    history: []
});

const TruthOrDare: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { couple } = useCouples();
    const { theme, primaryColor } = useTheme();
    const isDark = theme === 'dark';
    
    // Local State
    const [items, setItems] = useState<TDItem[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const [ringCooldown, setRingCooldown] = useState(false);

    // Load Data
    useEffect(() => {
        loadData().then(setItems).catch(console.error);
    }, []);

    // Sync Game Session
    useEffect(() => {
        if (!user || !couple) return;

        const fetchSession = async () => {
            const { data } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('couple_id', couple.id)
                .eq('game_type', 'truth_dare')
                .single();

            if (data) {
                setSession(data);
                setLoading(false);
            } else {
                // Create
                const newState = emptyState(user.id);
                const { data: newSession, error } = await supabase
                    .from('game_sessions')
                    .insert({
                        couple_id: couple.id,
                        game_type: 'truth_dare',
                        board_state: newState,
                        player_x: user.id,
                        status: 'active'
                    })
                    .select()
                    .single();
                
                if (newSession) setSession(newSession);
                setLoading(false);
                // Notify partner about new game
                sendGameNotification(couple, user.id, 'Truth or Dare', '/games/truth-dare', 'invite');
            }
        };

        fetchSession();

        const ch = supabase.channel(`game_td_${couple.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${couple.id}` }, 
            (payload) => {
                const newSess = payload.new as GameSession;
                if (newSess.game_type === 'truth_dare') setSession(newSess);
            })
            .subscribe();
            
        channelRef.current = ch;
        return () => { supabase.removeChannel(ch); };
    }, [user, couple]);

    const updateState = async (updates: Partial<TDState>) => {
        if (!session) return;
        const newState = { ...session.board_state, ...updates };
        await supabase.from('game_sessions').update({ board_state: newState }).eq('id', session.id);
    };

    const pickCard = (type: 'Truth' | 'Dare') => {
        if (!session) return;
        const available = items.filter(i => i.type === type && !session.board_state.history.includes(i.id));
        const pool = available.length > 0 ? available : items.filter(i => i.type === type); // Reset if exhausted
        const card = pool[Math.floor(Math.random() * pool.length)];

        updateState({
            currentCard: card,
            history: [...session.board_state.history, card.id],
            phase: 'playing'
        });
    };

    const nextTurn = () => {
        if (!session || !couple) return;
        const nextPlayer = session.board_state.turn === user?.id 
            ? (session.player_x === user?.id ? session.player_o || user.id : session.player_x)
            : user?.id || '';
            
        updateState({
            currentCard: null,
            phase: 'setup',
            turn: nextPlayer
        });
    };

    if (loading || !session) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>;

    const { board_state } = session;
    const isMyTurn = board_state.turn === user?.id;

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#121014] text-white' : 'bg-gray-50 text-gray-900'}`}>
             {/* Header */}
             <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Truth or Dare</h1>
                <button
                    onClick={async () => {
                        if (!couple || !user || ringCooldown) return;
                        setRingCooldown(true);
                        await sendGameNotification(couple, user.id, 'Truth or Dare', '/games/truth-dare', 'ring');
                        setTimeout(() => setRingCooldown(false), 30000);
                    }}
                    disabled={ringCooldown}
                    className={`p-2 rounded-full transition-all ${ringCooldown ? 'opacity-30' : 'hover:bg-white/10 active:scale-90'}`}
                    title="Ring Partner"
                >
                    <span className="material-symbols-outlined text-2xl">{ringCooldown ? 'notifications_off' : 'notifications_active'}</span>
                </button>
            </div>

            <main className="flex-1 p-6 pt-12 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    {board_state.currentCard ? (
                        <motion.div 
                            key="card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`w-full p-8 rounded-3xl text-center shadow-xl mb-8 relative overflow-hidden ${
                                board_state.currentCard.type === 'Truth' 
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white' 
                                    : 'bg-gradient-to-br from-rose-500 to-red-600 text-white'
                            }`}
                        >
                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block">
                                {board_state.currentCard.type.toUpperCase()}
                            </span>
                            <h2 className="text-2xl font-bold mb-4">{board_state.currentCard.question}</h2>
                            <p className="text-white/80 text-sm">{board_state.currentCard.category}</p>
                        </motion.div>
                    ) : (
                        <div className="text-center mb-12">
                            <motion.div 
                                className="text-6xl mb-4"
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                🎲
                            </motion.div>
                            <h2 className="text-xl font-medium opacity-80">
                                {isMyTurn ? "It's your turn!" : "Waiting for partner..."}
                            </h2>
                        </div>
                    )}
                </AnimatePresence>

                {isMyTurn && !board_state.currentCard && (
                    <div className="flex gap-4 w-full">
                        <button 
                            onClick={() => pickCard('Truth')}
                            className="flex-1 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                        >
                            Truth
                        </button>
                        <button 
                            onClick={() => pickCard('Dare')}
                            className="flex-1 py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                        >
                            Dare
                        </button>
                    </div>
                )}

                {board_state.currentCard && (
                    <button 
                        onClick={nextTurn}
                         className={`w-full px-6 py-4 rounded-2xl font-bold shadow-lg transition-transform active:scale-95 ${
                            isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        Next Turn
                    </button>
                )}
            </main>
        </div>
    );
};

export default TruthOrDare;
