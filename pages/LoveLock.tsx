import React, { useState, useEffect, useRef } from 'react';
import { useCouples } from '../contexts/CouplesContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import Toast from '../components/Toast';

const LoveLock: React.FC = () => {
    const { couple, notes, isLoading, createNote, generatePairingCode, joinCouple, addReaction, replyToNote } = useCouples();
    const { user } = useAuth();
    const { theme } = useTheme();

    const [inputCode, setInputCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Toast State
    const [toast, setToast] = useState<{ isVisible: boolean; message: string; subMessage?: string; type: 'success' | 'error' }>({ 
        isVisible: false, 
        message: '', 
        type: 'success' 
    });

    const showToast = (message: string, subMessage?: string, type: 'success' | 'error' = 'success') => {
        setToast({ isVisible: true, message, subMessage, type });
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };
    
    // For auto-scrolling
    const notesEndRef = useRef<HTMLDivElement>(null);

    const isBF = user?.email === 'adiroyboy2@gmail.com';

    useEffect(() => {
        if (couple?.pairing_code && isBF && couple.status === 'pending') {
             setGeneratedCode(couple.pairing_code);
        }
        scrollToBottom();
    }, [couple, notes, isBF]);

    const scrollToBottom = () => {
        notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleGenerateCode = async () => {
        try {
            const code = await generatePairingCode();
            setGeneratedCode(code);
            showToast('Code Generated', 'Share this code with your partner');
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to generate code', 'error');
        }
    };

    const handleJoinCouple = async () => {
        if (inputCode.length !== 6) {
            showToast('Invalid Code', 'Code must be 6 characters', 'error');
            return;
        }
        try {
            await joinCouple(inputCode.toUpperCase());
            showToast('Connected!', 'Welcome to your shared space');
        } catch (error) {
             console.error(error);
             showToast('Error', 'Invalid pairing code', 'error');
        }
    };

    const handleSendNote = async () => {
        if (!noteContent.trim()) return;
        setIsSubmitting(true);
        try {
            await createNote(noteContent);
            setNoteContent('');
            scrollToBottom();
        } catch (error) {
             console.error(error);
             showToast('Error', 'Failed to send note', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

     const handleReaction = async (noteId: string, emoji: string) => {
         try {
             await addReaction(noteId, emoji);
         } catch(error) {
             console.error(error);
         }
     }

    if (isLoading) {
         return <div className="p-8 text-center opacity-50">Loading our space...</div>;
    }

    // STATE: Not Paired
    if (!couple || couple.status === 'pending') {
        // If it's the specific BF account, show Generate State
        // Or if they already generated one (which is covered by couple check effectively if we assume couple creation upon generation)
        
        // Refined Logic:
        // If NO couple data exists:
        //   - If BF: Show "Generate Code"
        //   - If GF: Show "Enter Code"
        // If couple data exists but is PENDING:
        //   - If BF (Creator): Show "Waiting for partner..." + Code
        //   - If GF (Pending? No, GF won't have data usually until join, unless we query differently)
        //   Wait, GF won't have 'couple' data until they join because RLS prevents seeing it until they are in allowed users or we use a special RPC.
        //   Actually my fetch logic searches `or(partner_1... partner_2...)`. GF won't see it until joined.
        
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-8">
                <div className="relative w-24 h-24 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-pink-500">lock</span>
                    {/* Heart Animation */}
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 text-2xl"
                    >
                        ❤️
                    </motion.div>
                </div>

                <div className="text-center max-w-sm">
                    <h1 className="text-3xl font-bold mb-3 font-display">Love Lock</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        A private space for just the two of us. Share notes, secrets, and love.
                    </p>
                </div>

                <div className="w-full max-w-sm bg-white dark:bg-[#1E1C24] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                    {/* User specific logic */}
                    {isBF || (couple && couple.partner_1_id === user?.id) ? (
                        <div className="space-y-6 text-center">
                            {generatedCode || (couple?.pairing_code) ? (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-sm uppercase tracking-wider text-gray-400">Your Pairing Code</p>
                                        <div className="text-4xl font-mono font-bold text-pink-500 tracking-[0.2em] py-4 bg-pink-50 dark:bg-pink-900/10 rounded-xl">
                                            {generatedCode || couple?.pairing_code}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Share this code with her to unlock the space.</p>
                                    <div className="flex items-center justify-center space-x-2 text-pink-500 text-sm animate-pulse">
                                        <span className="material-symbols-outlined text-lg">sync</span>
                                        <span>Waiting for partner to join...</span>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={handleGenerateCode}
                                    className="w-full py-4 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30"
                                >
                                    Generate Access Code
                                </button>
                            )}
                        </div>
                    ) : (
                        // Logic for the Partner (GF)
                         <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter Access Code</label>
                                <input
                                    type="text"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                    placeholder="e.g. A1B2C3"
                                    maxLength={6}
                                    className="w-full text-center text-2xl font-mono tracking-widest py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-pink-500 outline-none bg-transparent"
                                />
                            </div>
                            <button
                                onClick={handleJoinCouple}
                                disabled={inputCode.length !== 6}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30"
                            >
                                Unlock My Heart 💖
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // STATE: Active (Chat Interface)
    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-80px)]">
             {/* Header */}
            <div className="p-4 bg-white/50 dark:bg-[#1E1C24]/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                     <h1 className="text-xl font-bold font-display">Us ❤️</h1>
                     <p className="text-xs text-gray-500">Shared Notes</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-pink-500 text-sm">favorite</span>
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">edit_note</span>
                        <p>Write your first note...</p>
                    </div>
                ) : (
                    notes.map((note) => {
                        const isMe = note.sender_id === user?.id;
                        return (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl p-4 ${
                                    isMe 
                                    ? 'bg-pink-500 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-[#1E1C24] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                    <div className={`text-[10px] mt-2 opacity-70 flex items-center justify-end gap-1 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                                        {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <span className="material-symbols-outlined text-[12px]">done_all</span>}
                                    </div>
                                </div>
                                
                                {/* Reactions */}
                                <div className="flex items-center gap-1 mt-1 px-1">
                                    {(note.reactions as any[])?.map((r: any, idx: number) => (
                                        <span key={idx} className="text-sm bg-white dark:bg-[#1E1C24] px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
                                            {r.emoji}
                                        </span>
                                    ))}
                                    {/* Add Reaction Button - Only visible for partner's notes or always? Usually partner's */}
                                    {!isMe && (
                                         <button 
                                            onClick={() => handleReaction(note.id, '❤️')}
                                            className="text-gray-400 hover:text-pink-500 transition-colors"
                                         >
                                            <span className="material-symbols-outlined text-base">add_reaction</span>
                                         </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={notesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-[#121014] border-t border-gray-100 dark:border-gray-800 pb-24 md:pb-4">
                <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#1E1C24] p-2 rounded-3xl border border-gray-200 dark:border-gray-700 focus-within:border-pink-500 transition-colors">
                     <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Leave a note..."
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-3 text-sm"
                        rows={1}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendNote();
                            }
                        }}
                     />
                     <button
                        onClick={handleSendNote}
                        disabled={!noteContent.trim() || isSubmitting}
                        className="p-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 active:bg-pink-700 disabled:opacity-50 disabled:scale-90 transition-all shadow-md shadow-pink-500/20"
                     >
                         <span className="material-symbols-outlined">send</span>
                     </button>
                </div>
            </div>
            
            <Toast 
                message={toast.message}
                subMessage={toast.subMessage}
                isVisible={toast.isVisible}
                onClose={closeToast}
                type={toast.type}
            />
        </div>
    );
};

export default LoveLock;
