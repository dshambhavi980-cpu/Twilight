import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCouples } from '../../contexts/CouplesContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendGameNotification } from '../../lib/notifications';

interface NHIEItem {
    id: number;
    category: string;
    statement: string;
}

interface NHIEState {
    phase: 'idle' | 'reveal';
    currentCard: NHIEItem | null;
    turn: string;
    history: number[];
    responses: Record<string, boolean | null>; // user_id -> true = "I Have", false = "Never", null = not answered
    scores: Record<string, number>; // matched answers count
    roundNumber: number;
}

interface GameSession {
    id: string;
    couple_id: string;
    game_type: 'never_have_i_ever';
    board_state: NHIEState;
    player_x: string;
    player_o: string | null;
    updated_at: string;
}

const loadData = async (): Promise<NHIEItem[]> => {
    const res = await fetch('/Games_data/never_have_i_ever.json');
    return await res.json();
};

const emptyState = (firstTurn: string): NHIEState => ({
    phase: 'idle',
    currentCard: null,
    turn: firstTurn,
    history: [],
    responses: {},
    scores: {},
    roundNumber: 0,
});

const CATEGORY_COLORS: Record<string, string> = {
    Fun: 'from-amber-500 to-yellow-500',
    Romantic: 'from-pink-500 to-rose-500',
    Spicy: 'from-red-500 to-orange-500',
    Embarrassing: 'from-purple-500 to-fuchsia-500',
    Adventure: 'from-emerald-500 to-teal-500',
    Deep: 'from-indigo-500 to-blue-500',
    Couple: 'from-rose-400 to-pink-500',
    Random: 'from-cyan-500 to-sky-500',
};

const NeverHaveIEver: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { couple } = useCouples();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [items, setItems] = useState<NHIEItem[]>([]);
    const [session, setSession] = useState<GameSession | null>(null);
    const [loading, setLoading] = useState(true);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const [ringCooldown, setRingCooldown] = useState(false);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        loadData().then(setItems).catch(console.error);
    }, []);

    useEffect(() => {
        if (!user || !couple) return;

        const fetchSession = async () => {
            const { data } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('couple_id', couple.id)
                .eq('game_type', 'never_have_i_ever')
                .single();

            if (data) {
                setSession(data);
                setLoading(false);
            } else {
                const newState = emptyState(user.id);
                const { data: newSession } = await supabase
                    .from('game_sessions')
                    .insert({
                        couple_id: couple.id,
                        game_type: 'never_have_i_ever',
                        board_state: newState as any,
                        player_x: user.id,
                        status: 'active'
                    } as any)
                    .select()
                    .single();

                if (newSession) setSession(newSession);
                setLoading(false);
                sendGameNotification(couple, user.id, 'Never Have I Ever', '/games/never-have-i-ever', 'invite');
            }
        };

        fetchSession();

        const ch = supabase.channel(`game_nhie_${couple.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions', filter: `couple_id=eq.${couple.id}` },
            (payload) => {
                const newSess = payload.new as GameSession;
                if (newSess.game_type === 'never_have_i_ever') setSession(newSess);
            })
            .subscribe();

        channelRef.current = ch;
        return () => { supabase.removeChannel(ch); };
    }, [user, couple]);

    const updateState = async (updates: Partial<NHIEState>) => {
        if (!session) return;
        const newState = { ...session.board_state, ...updates };
        // @ts-ignore - Supabase generated types don't include dynamic game_type columns
        await supabase.from('game_sessions').update({ board_state: newState } as any).eq('id', session.id);
    };

    const drawCard = () => {
        if (!session || items.length === 0) return;
        const available = items.filter(i => !session.board_state.history.includes(i.id));
        const pool = available.length > 0 ? available : items;
        const card = pool[Math.floor(Math.random() * pool.length)];

        updateState({
            currentCard: card,
            history: [...session.board_state.history, card.id],
            phase: 'reveal',
            responses: {},
            roundNumber: session.board_state.roundNumber + 1,
        });
    };

    const respond = (answer: boolean) => {
        if (!session || !user) return;
        const newResponses = { ...session.board_state.responses, [user.id]: answer };
        updateState({ responses: newResponses });
    };

    const nextRound = () => {
        if (!session || !couple || !user) return;
        const nextTurn = session.board_state.turn === user.id
            ? (session.player_x === user.id ? session.player_o || user.id : session.player_x)
            : user.id;

        updateState({
            currentCard: null,
            phase: 'idle',
            turn: nextTurn,
            responses: {},
        });
        setShowResult(false);
    };

    if (loading || !session) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div></div>;

    const { board_state } = session;
    const isMyTurn = board_state.turn === user?.id;
    const myResponse = user ? board_state.responses[user.id] : null;
    const partnerId = session.player_x === user?.id ? session.player_o : session.player_x;
    const partnerResponse = partnerId ? board_state.responses[partnerId] : null;
    const bothAnswered = myResponse !== null && myResponse !== undefined && partnerResponse !== null && partnerResponse !== undefined;

    // Auto-show result when both have answered
    React.useEffect(() => {
        if (bothAnswered && !showResult) {
            setTimeout(() => setShowResult(true), 500);
        }
    }, [bothAnswered]);

    const gradient = board_state.currentCard ? (CATEGORY_COLORS[board_state.currentCard.category] || 'from-violet-500 to-purple-600') : 'from-violet-500 to-purple-600';

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#121014] text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <button onClick={() => navigate('/games')} className="p-2 -ml-2 rounded-full hover:bg-white/10">
                    <span className="material-symbols-rounded text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Never Have I Ever</h1>
                <button
                    onClick={async () => {
                        if (!couple || !user || ringCooldown) return;
                        setRingCooldown(true);
                        await sendGameNotification(couple, user.id, 'Never Have I Ever', '/games/never-have-i-ever', 'ring');
                        setTimeout(() => setRingCooldown(false), 30000);
                    }}
                    disabled={ringCooldown}
                    className={`p-2 rounded-full transition-all ${ringCooldown ? 'opacity-30' : 'hover:bg-white/10 active:scale-90'}`}
                    title="Ring Partner"
                >
                    <span className="material-symbols-outlined text-2xl">{ringCooldown ? 'notifications_off' : 'notifications_active'}</span>
                </button>
            </div>

            {/* Score Bar */}
            <div className={`px-4 py-2 flex items-center justify-center gap-6 text-sm ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <span className="font-medium">Round {board_state.roundNumber}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    {board_state.history.length} played
                </span>
            </div>

            <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                <AnimatePresence mode="wait">
                    {board_state.currentCard ? (
                        <motion.div
                            key={`card-${board_state.currentCard.id}`}
                            initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="w-full mb-8"
                        >
                            {/* Card */}
                            <div className={`w-full p-8 rounded-3xl text-center shadow-2xl bg-gradient-to-br ${gradient} text-white relative overflow-hidden`}>
                                {/* Decorative circles */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />

                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium mb-4 inline-block relative z-10">
                                    {board_state.currentCard.category}
                                </span>
                                <h2 className="text-2xl font-bold mb-2 relative z-10 leading-relaxed">
                                    {board_state.currentCard.statement}
                                </h2>
                            </div>

                            {/* Response buttons */}
                            {myResponse === null || myResponse === undefined ? (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex gap-4 mt-6"
                                >
                                    <button
                                        onClick={() => respond(true)}
                                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                                    >
                                        ✋ I Have
                                    </button>
                                    <button
                                        onClick={() => respond(false)}
                                        className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                                    >
                                        😇 Never
                                    </button>
                                </motion.div>
                            ) : !showResult ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-6 text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <motion.div
                                            className="w-3 h-3 rounded-full bg-violet-400"
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                        />
                                        <p className="opacity-70 font-medium">
                                            {bothAnswered ? 'Revealing...' : 'Waiting for partner...'}
                                        </p>
                                    </div>
                                    <p className={`mt-2 text-sm px-3 py-1 rounded-full inline-block ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                        You answered: {myResponse ? '✋ I Have' : '😇 Never'}
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mt-6"
                                >
                                    <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/10' : 'bg-white shadow-lg'}`}>
                                        <div className="flex justify-around mb-4">
                                            <div className="text-center">
                                                <p className="text-sm opacity-60 mb-1">You</p>
                                                <p className="text-2xl">{myResponse ? '✋' : '😇'}</p>
                                                <p className="text-sm font-medium mt-1">{myResponse ? 'I Have' : 'Never'}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm opacity-60 mb-1">Partner</p>
                                                <p className="text-2xl">{partnerResponse ? '✋' : '😇'}</p>
                                                <p className="text-sm font-medium mt-1">{partnerResponse ? 'I Have' : 'Never'}</p>
                                            </div>
                                        </div>
                                        <div className={`text-center py-2 rounded-xl font-bold ${
                                            myResponse === partnerResponse
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                            {myResponse === partnerResponse ? '🎉 You matched!' : '😮 Different answers!'}
                                        </div>
                                    </div>

                                    <button
                                        onClick={nextRound}
                                        className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold shadow-lg active:scale-95 transition-transform"
                                    >
                                        Next Statement →
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center w-full"
                        >
                            <motion.div
                                className="text-7xl mb-6"
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            >
                                🙅
                            </motion.div>
                            <h2 className="text-2xl font-bold mb-2">Never Have I Ever</h2>
                            <p className="opacity-60 mb-8">
                                {isMyTurn ? "Your turn to draw a statement!" : "Waiting for partner to draw..."}
                            </p>

                            {isMyTurn && (
                                <button
                                    onClick={drawCard}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
                                >
                                    🎴 Draw Statement
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default NeverHaveIEver;
