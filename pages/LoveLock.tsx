import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouples } from '../contexts/CouplesContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import Toast from '../components/Toast';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { AudioPlayer } from '../components/ui/AudioPlayer';
import { AudioRecorder } from '../components/AudioRecorder';
import { generateLoveNote, AI_MOODS, AIMood } from '../lib/ai';

// Check if running natively (Capacitor)
const isNative = () => {
    try {
        return (window as any).Capacitor?.isNativePlatform?.() ?? false;
    } catch { return false; }
};

const LoveLock: React.FC = () => {
    const navigate = useNavigate(); // Added navigate
    const { couple, notes, isLoading, createNote, generatePairingCode, joinCouple, addReaction, replyToNote, markAsRead, setIsChatOpen, uploadMedia, isSupporter, disconnectCouple, hasMoreNotes, loadingOlder, loadOlderNotes } = useCouples();
    const { user } = useAuth();
    const { theme } = useTheme();

    const [inputCode, setInputCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emojiPickerNoteId, setEmojiPickerNoteId] = useState<string | null>(null);
    const [showRecorder, setShowRecorder] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Love Note state
    const [showAISheet, setShowAISheet] = useState(false);
    const [aiMood, setAIMood] = useState<AIMood | null>(null);
    const [aiCustomPrompt, setAICustomPrompt] = useState('');
    const [aiGenerating, setAIGenerating] = useState(false);
    
    // Available emojis for reactions
    const reactionEmojis = ['❤️', '😍', '😂', '😢', '😮', '🔥', '👍', '💋', '🥰', '😘', '💕', '✨'];
    
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
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.role === 'admin';
    const isBF = user?.email === 'adiroyboy2@gmail.com' || isAdmin;

    // Track if chat is open
    useEffect(() => {
        setIsChatOpen(true);
        return () => setIsChatOpen(false);
    }, []);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
             if (emojiPickerNoteId) {
                 setEmojiPickerNoteId(null);
             }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [emojiPickerNoteId]);

    // Mark messages as read when viewing
    useEffect(() => {
        if (!user || !notes?.length) return;
        
        // Find messages sent by partner that are not yet read
        const unreadNotes = notes
            .filter(n => n.sender_id !== user.id && n.status !== 'read')
            .map(n => n.id);
            
        if (unreadNotes.length > 0) {
            console.log('Marking as read:', unreadNotes); // Debug log
            markAsRead(unreadNotes);
        }
    }, [notes, user]);

    // Load older notes when scrolling to top
    const handleChatScroll = () => {
        const el = chatContainerRef.current;
        if (!el || loadingOlder || !hasMoreNotes) return;
        if (el.scrollTop < 80) {
            const prevHeight = el.scrollHeight;
            loadOlderNotes().then(() => {
                // Preserve scroll position after prepending older messages
                requestAnimationFrame(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - prevHeight;
                    }
                });
            });
        }
    };

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
            showToast('Error', error instanceof Error ? error.message : 'Failed to generate code', 'error');
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

    const handleAudioSend = async (blob: Blob) => {
        setShowRecorder(false);
        setIsSubmitting(true);
        try {
            const audioFile = new File([blob], "voice_message.webm", { type: 'audio/webm' });
            const mediaUrl = await uploadMedia(audioFile);
            await createNote('Voice Message', 'audio', mediaUrl);
            scrollToBottom();
        } catch (error) {
             console.error(error);
             showToast('Error', 'Failed to send audio', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePickImage = async () => {
        // On native, use Capacitor Camera plugin
        if (isNative()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 80,
                    allowEditing: false,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Prompt
                });

                if (image.webPath) {
                    const response = await fetch(image.webPath);
                    const blob = await response.blob();
                    const file = new File([blob], `image_${Date.now()}.${image.format}`, { type: blob.type });

                    setIsSubmitting(true);
                    showToast('Uploading...', 'Please wait', 'success');

                    try {
                        const mediaUrl = await uploadMedia(file);
                        await createNote('Image', 'image', mediaUrl);
                        scrollToBottom();
                        showToast('Sent!', 'Image uploaded successfully');
                    } catch (error) {
                        console.error(error);
                        showToast('Error', 'Failed to upload image', 'error');
                    } finally {
                        setIsSubmitting(false);
                    }
                }
            } catch (error) {
                if (String(error).includes('cancelled')) return;
                console.error('Camera error:', error);
                showToast('Error', 'Could not access camera/photos', 'error');
            }
        } else {
            // On browser, use file input fallback
            fileInputRef.current?.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so same file can be selected again
        e.target.value = '';

        setIsSubmitting(true);
        showToast('Uploading...', 'Please wait', 'success');
        try {
            const mediaUrl = await uploadMedia(file);
            await createNote('Image', 'image', mediaUrl);
            scrollToBottom();
            showToast('Sent!', 'Image uploaded successfully');
        } catch (error) {
            console.error(error);
            showToast('Error', 'Failed to upload image', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Simplified Send Text
    const handleSendText = async () => {
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

    // AI Love Note Generator
    const handleAIGenerate = async () => {
        if (!aiMood) return;
        setAIGenerating(true);
        try {
            const result = await generateLoveNote(aiMood, aiCustomPrompt.trim() || undefined);
            if (result.error) {
                showToast('AI Error', result.error, 'error');
            } else {
                setNoteContent(result.text);
                setShowAISheet(false);
                setAIMood(null);
                setAICustomPrompt('');
            }
        } catch (error) {
            showToast('Error', 'Failed to generate message', 'error');
        } finally {
            setAIGenerating(false);
        }
    };

    const handleDownloadImage = async (url: string) => {
        const toastId = showToast('Downloading...', 'Please wait', 'success');
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `love_lock_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            showToast('Saved!', 'Image saved to gallery');
        } catch (error) {
            console.error('Download failed', error);
            showToast('Error', 'Failed to download image', 'error');
            // Fallback
            window.open(url, '_blank');
        }
    };

    // Removed old recording functions (replaced by AudioRecorder component)

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

    // Updated Disconnect Logic
    const handleDisconnect = async () => {
        if (confirm("Are you sure you want to disconnect? This will lock the dashboard and reset the connection. You can reconnect later.")) {
            try {
                await disconnectCouple();
                showToast('Disconnected', 'You have been depaired.');
            } catch (error) {
                showToast('Error', error instanceof Error ? error.message : 'Failed to disconnect', 'error');
            }
        }
    };

    // Stage 1: Initial Pairing (Partner 1 generates code, Partner 2 enters it)
    if (!couple || couple.status === 'pending') {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-8">
                <div className="relative w-24 h-24 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-5xl text-pink-500">lock</span>
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 text-2xl">❤️</motion.div>
                </div>

                <div className="text-center max-w-sm">
                    <h1 className="text-3xl font-bold mb-3 font-display">Love Lock</h1>
                    <p className="text-gray-500 dark:text-gray-400">A private space for just the two of us.</p>
                </div>

                <div className="w-full max-w-sm bg-white dark:bg-[#1E1C24] p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
                    {/* BF/Admin generates the code, GF/User enters it */}
                    {isBF ? (
                    /* If user is BF/Admin (partner_1) -> Generate/Show Code */
                        <div className="space-y-6 text-center">
                            {generatedCode || (couple?.pairing_code) ? (
                                <>
                                    <div className="space-y-2">
                                        <p className="text-sm uppercase tracking-wider text-gray-400">Your Pairing Code</p>
                                        <div className="text-4xl font-mono font-bold text-pink-500 tracking-[0.2em] py-4 bg-pink-50 dark:bg-pink-900/10 rounded-xl">
                                            {generatedCode || couple?.pairing_code}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Share this with her to unlock the space.</p>
                                    <div className="flex items-center justify-center space-x-2 text-pink-500 text-sm animate-pulse">
                                        <span className="material-symbols-outlined text-lg">sync</span>
                                        <span>Waiting for partner...</span>
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
                    /* GF/User (partner_2) -> Enter Code */
                         <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enter Partner's Code</label>
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

    // STATE: Active (Chat Interface) — couple is paired and active, show chat directly
    return (
        <div className="flex flex-col h-[100dvh] max-h-[100dvh] relative">
             {/* Header - Fixed at top */}
            <div className="fixed top-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#1E1C24]/95 backdrop-blur-md z-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                     <h1 className="text-xl font-bold font-display">Us ❤️</h1>
                     <p className="text-xs text-gray-500">Shared Notes</p>
                </div>
                <div className="flex gap-2">
                    <button 
                         onClick={() => {
                             handleDisconnect();
                         }}
                         className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">link_off</span>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-pink-500 text-sm">favorite</span>
                    </div>
                </div>
            </div>

            {/* Notes List - Add padding top for fixed header */}
            <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto p-4 space-y-4 pt-20 pb-44">
                {/* Load older messages indicator */}
                {hasMoreNotes && (
                    <div className="text-center py-2">
                        {loadingOlder ? (
                            <span className="text-xs text-gray-400 animate-pulse">Loading older messages...</span>
                        ) : (
                            <button onClick={() => loadOlderNotes()} className="text-xs text-pink-400 hover:text-pink-500 transition-colors">
                                ↑ Load older messages
                            </button>
                        )}
                    </div>
                )}
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
                                    ? 'bg-primary text-white rounded-br-none shadow-sm' 
                                    : 'bg-white dark:bg-[#1E1C24] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                    {note.type === 'image' && note.media_url ? (
                                        <div className="mb-1">
                                            <img 
                                                src={note.media_url} 
                                                alt="Shared image" 
                                                className="rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                                onClick={() => setSelectedImage(note.media_url)}
                                            />
                                        </div>
                                    ) : note.type === 'audio' && note.media_url ? (
                                        <AudioPlayer src={note.media_url} isMe={isMe} />
                                    ) : (
                                        <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                    )}
                                    <div className={`text-[10px] mt-2 opacity-70 flex items-center justify-end gap-1 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                                        {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && (
                                            <span className={`material-symbols-outlined text-[16px] ${note.status === 'read' ? '!text-[#00ffff] font-bold' : ''}`}>
                                                {note.status === 'sent' ? 'check' : 'done_all'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Reactions */}
                                <div className="flex items-center gap-1 mt-1 px-1 relative">
                                    {(note.reactions as any[])?.map((r: any, idx: number) => (
                                        <span key={idx} className="text-sm bg-white dark:bg-[#1E1C24] px-1.5 py-0.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
                                            {r.emoji}
                                        </span>
                                    ))}
                                    {/* Add Reaction Button with Emoji Picker */}
                                    {!isMe && (
                                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => setEmojiPickerNoteId(emojiPickerNoteId === note.id ? null : note.id)}
                                                className="text-gray-400 hover:text-pink-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">add_reaction</span>
                                            </button>
                                            
                                            {/* Emoji Picker Popup */}
                                            <AnimatePresence>
                                                {emojiPickerNoteId === note.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-[#1E1C24] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50"
                                                        style={{ minWidth: '200px' }}
                                                    >
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                                                            {reactionEmojis.map((emoji) => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        handleReaction(note.id, emoji);
                                                                        setEmojiPickerNoteId(null);
                                                                    }}
                                                                    style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', borderRadius: '6px' }}
                                                                    className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hover:scale-110"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={notesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            {/* Hidden file input for browser image picking */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
            />
            <div className="fixed bottom-[66px] left-0 right-0 p-4 pb-4 bg-white dark:bg-[#121014] border-t border-gray-100 dark:border-gray-800 z-40 max-w-md mx-auto">
                <AnimatePresence mode="wait">
                {showRecorder ? (
                    <motion.div
                        key="recorder"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full"
                    >
                        <AudioRecorder
                            onSend={handleAudioSend}
                            onCancel={() => setShowRecorder(false)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-end gap-2"
                    >
                        <button 
                            onClick={handlePickImage}
                            className="p-3 text-gray-400 hover:text-pink-500 transition-colors"
                        >
                            <span className="material-symbols-outlined">add_a_photo</span>
                        </button>

                        <button 
                            onClick={() => setShowAISheet(true)}
                            className="p-3 text-gray-400 hover:text-violet-500 transition-colors"
                            title="AI Love Note"
                        >
                            <span className="material-symbols-outlined">auto_awesome</span>
                        </button>
                        
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            placeholder="Leave a note..."
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-3 px-0 text-sm outline-none"
                            rows={1}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendText();
                                }
                            }}
                        />
                        
                        {noteContent.trim() ? (
                            <button
                                onClick={handleSendText}
                                disabled={isSubmitting}
                                className="p-3 bg-primary text-white rounded-full hover:brightness-110 active:brightness-90 disabled:opacity-50 transition-all shadow-md shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowRecorder(true)}
                                className="p-3 text-gray-400 hover:text-pink-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">mic</span>
                            </button>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            
            <Toast 
                message={toast.message}
                subMessage={toast.subMessage}
                isVisible={toast.isVisible}
                onClose={closeToast}
                type={toast.type}
            />

            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative max-w-full max-h-[90vh] flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img 
                                src={selectedImage} 
                                alt="Full preview"
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                            />
                            
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                <button
                                    onClick={() => handleDownloadImage(selectedImage)}
                                    className="px-8 py-3 bg-primary hover:brightness-110 active:scale-95 text-white rounded-full font-bold shadow-lg shadow-primary/30 flex items-center gap-2 transition-all"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    <span>Download</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Love Note Bottom Sheet */}
            <AnimatePresence>
                {showAISheet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => !aiGenerating && setShowAISheet(false)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-white dark:bg-[#1a1720] rounded-t-3xl p-6 pb-8"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle bar */}
                            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-5" />

                            <div className="flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-violet-500">auto_awesome</span>
                                <h3 className="text-lg font-bold">AI Love Note</h3>
                            </div>

                            {/* Mood chips */}
                            <p className="text-sm opacity-50 mb-3">Pick a mood</p>
                            <div className="grid grid-cols-3 gap-2 mb-5">
                                {AI_MOODS.map((m) => (
                                    <button
                                        key={m.key}
                                        onClick={() => setAIMood(m.key)}
                                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                                            aiMood === m.key
                                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                                : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {m.emoji} {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Optional custom prompt */}
                            <p className="text-sm opacity-50 mb-2">Add context <span className="text-xs">(optional)</span></p>
                            <input
                                type="text"
                                value={aiCustomPrompt}
                                onChange={(e) => setAICustomPrompt(e.target.value)}
                                placeholder='e.g. "about our trip last weekend"'
                                className="w-full px-4 py-3 rounded-xl text-sm bg-gray-100 dark:bg-white/5 border border-transparent focus:border-violet-500 outline-none transition-colors mb-5"
                            />

                            {/* Generate button */}
                            <button
                                onClick={handleAIGenerate}
                                disabled={!aiMood || aiGenerating}
                                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-[0.98] ${
                                    !aiMood || aiGenerating
                                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30 hover:brightness-110'
                                }`}
                            >
                                {aiGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                            className="material-symbols-outlined text-lg"
                                        >progress_activity</motion.span>
                                        Generating...
                                    </span>
                                ) : (
                                    '✨ Generate Message'
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoveLock;
