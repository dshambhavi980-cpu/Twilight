import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PreviewType = 'tictactoe' | 'connectfour' | 'cards' | 'chat' | 'truthdare' | 'trivia' | 'drawing';

interface PreviewProps {
    type: PreviewType;
    step: number;
    primaryColor: string;
    isDark: boolean;
}

export const GamePreviews: React.FC<PreviewProps> = ({ type, step, primaryColor, isDark }) => {
    // Determine preview to show
    switch (type) {
        case 'tictactoe':
            return <GridPreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        case 'connectfour':
            return <ConnectFourPreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        case 'cards':
        case 'trivia':
            return <CardPreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        case 'chat':
            return <ChatPreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        case 'truthdare':
            return <TruthDarePreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        case 'drawing':
            return <DrawingPreview step={step} primaryColor={primaryColor} isDark={isDark} />;
        default:
            return <div className="w-full h-full flex items-center justify-center text-gray-400">Preview coming soon</div>;
    }
};

/* ───── 1. Tic Tac Toe / Grid Preview ───── */
const GridPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const states = [
        [null, null, null, null, null, null, null, null, null], // Step 0: Empty
        [null, null, null, null, 'X', null, null, null, null], // Step 1: User moves
        ['O', null, null, null, 'X', null, null, null, null], // Step 2: Partner moves
        ['O', null, 'X', null, 'X', null, 'X', null, 'O'], // Step 3: Win
    ];
    const board = states[Math.min(step, states.length - 1)];
    const showStrike = step >= 3;

    return (
        <div className={`relative w-32 h-32 grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-opacity-50 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
            {board.map((cell, i) => (
                <div key={i} className={`rounded-md flex items-center justify-center font-black text-xl ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                    <AnimatePresence>
                        {cell && (
                            <motion.span
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className={cell === 'X' ? '' : (isDark ? 'text-pink-400' : 'text-pink-500')}
                                style={cell === 'X' ? { color: primaryColor } : {}}
                            >
                                {cell}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            ))}
            {/* Strike line */}
            <AnimatePresence>
                {showStrike && (
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }}
                        className="absolute h-1 top-1/2 left-0 -translate-y-1/2 rounded-full rotate-45 transform origin-center z-10"
                        style={{ backgroundColor: primaryColor }} />
                )}
            </AnimatePresence>
        </div>
    );
};

/* ───── 2. Connect Four Preview ───── */
const ConnectFourPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    // 6 rows x 7 cols
    const grid = Array.from({ length: 6 }).map(() => Array(7).fill(null));
    if (step >= 1) grid[5][3] = 'p1';
    if (step >= 2) grid[5][2] = 'p2';
    if (step >= 3) {
        grid[5][3] = 'p1'; grid[4][3] = 'p1'; grid[3][3] = 'p1'; grid[2][3] = 'p1';
    }

    return (
        <div className={`w-40 p-2 rounded-xl grid grid-rows-6 gap-1 ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
            {grid.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-7 gap-1">
                    {row.map((cell, cIdx) => (
                        <div key={cIdx} className={`w-full aspect-square rounded-full flex items-center justify-center ${isDark ? 'bg-background-dark' : 'bg-white'}`}>
                            <AnimatePresence>
                                {cell && (
                                    <motion.div
                                        initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        className="w-[80%] h-[80%] rounded-full shadow-inner"
                                        style={{ backgroundColor: cell === 'p1' ? primaryColor : '#EC4899' }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

/* ───── 3. Card/Trivia Preview ───── */
const CardPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    return (
        <div className="relative w-40 h-28 flex items-center justify-center perspective-[1000px]">
            <motion.div
                className="w-24 h-32 rounded-xl overflow-hidden shadow-xl"
                initial={false}
                animate={{ rotateY: step >= 2 ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Front */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center p-3 backface-hidden ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                    <span className="text-xl mb-2">❓</span>
                    <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-1.5 rounded-full mt-1.5 ${isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
                </div>
                {/* Back */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 backface-hidden text-white"
                    style={{ backgroundColor: primaryColor, transform: 'rotateY(180deg)' }}>
                    <span className="text-2xl font-bold bg-white/20 w-8 h-8 rounded-full flex items-center justify-center mb-2">!</span>
                    <div className="w-12 h-1.5 rounded-full bg-white/50" />
                </div>
            </motion.div>
        </div>
    );
};

/* ───── 4. Chat Preview (Story Builder/Rapid Fire) ───── */
const ChatPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    const messages = [
        { id: 1, text: 'Once upon a time...', sender: 'p1' },
        { id: 2, text: 'A giant cat appeared!', sender: 'p2' },
        { id: 3, text: 'It demanded treats...', sender: 'p1' },
    ];

    const visibleMsgs = messages.slice(0, step + 1);

    return (
        <div className={`w-40 h-32 rounded-2xl p-3 flex flex-col justify-end overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <AnimatePresence>
                {visibleMsgs.map((msg, i) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`text-[8px] px-2 py-1.5 rounded-xl max-w-[80%] mb-1.5 ${
                            msg.sender === 'p1' 
                                ? 'self-end text-white rounded-br-sm' 
                                : `self-start ${isDark ? 'bg-white/10 text-white' : 'bg-white shadow-sm text-gray-700'} rounded-bl-sm`
                        }`}
                        style={msg.sender === 'p1' ? { backgroundColor: primaryColor } : {}}
                    >
                        {msg.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

/* ───── 5. Truth or Dare Preview ───── */
const TruthDarePreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    return (
        <div className="relative w-40 flex items-center justify-center gap-2">
            <motion.div 
                animate={{ 
                    scale: step === 1 ? 1.1 : 1, 
                    opacity: step === 2 ? 0.3 : 1 
                }}
                className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${isDark ? 'bg-white/10 text-white' : 'bg-white shadow text-gray-800'}`}
            >
                😇<br/>Truth
            </motion.div>
            <motion.div 
                animate={{ 
                    scale: step === 2 ? 1.1 : 1,
                    opacity: step === 1 ? 0.3 : 1 
                }}
                className="flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: primaryColor }}
            >
                🔥<br/>Dare
            </motion.div>
        </div>
    );
};

/* ───── 6. Drawing Preview (Hangman) ───── */
const DrawingPreview: React.FC<any> = ({ step, primaryColor, isDark }) => {
    return (
        <div className="w-32 h-32 relative flex items-center justify-center">
            {/* Scaffold */}
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-50 stroke-current" fill="none" strokeWidth="4">
                <path d="M 20 90 L 80 90 M 40 90 L 40 10 L 70 10 L 70 20" />
            </svg>
            
            {/* Hangman parts based on step */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full stroke-current" style={{ color: primaryColor }} fill="none" strokeWidth="4">
                <AnimatePresence>
                    {step >= 1 && <motion.circle initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} cx="70" cy="30" r="10" />}
                    {step >= 2 && <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="70" y1="40" x2="70" y2="60" />}
                    {step >= 3 && (
                        <>
                            <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="70" y1="45" x2="55" y2="55" />
                            <motion.line initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} x1="70" y1="45" x2="85" y2="55" />
                        </>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
};
