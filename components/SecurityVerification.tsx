import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, Clipboard, HelpCircle, X, Check } from 'lucide-react';
import { generateVerificationFingerprint } from '../lib/encryption';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '../contexts/AuthContext';

interface SecurityVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    partnerPubKey: string | null;
}

export const SecurityVerification: React.FC<SecurityVerificationProps> = ({ isOpen, onClose, partnerPubKey }) => {
    const { user } = useAuth();
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function loadKeys() {
            if (!isOpen || !partnerPubKey || !user) return;
            const pubKeyName = `${user.id}_public_key`;
            const { value: pubKey } = await Preferences.get({ key: pubKeyName });
            if (pubKey && partnerPubKey) {
                const fp = await generateVerificationFingerprint(pubKey, partnerPubKey);
                setFingerprint(fp);
            }
        }
        loadKeys();
    }, [isOpen, partnerPubKey, user]);

    const handleCopy = () => {
        if (!fingerprint) return;
        navigator.clipboard.writeText(fingerprint);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatFingerprint = (fp: string) => {
        const groups = fp.match(/.{1,5}/g) || [];
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 font-mono text-[13px] sm:text-sm">
                {groups.map((group, i) => (
                    <div key={i} className="flex justify-center bg-gray-50 dark:bg-white/5 py-1.5 px-2 rounded-lg border dark:border-white/5 shadow-sm">
                        {group}
                    </div>
                ))}
            </div>
        );
    };

    const qrUrl = fingerprint 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${fingerprint}&color=FF69B4&bgcolor=FFFFFF` 
        : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[110] bg-white dark:bg-[#0F0E13] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 dark:bg-[#0F0E13]/80 backdrop-blur-md border-b dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Security Verification</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="max-w-md mx-auto p-6 space-y-8 pb-12">
                        {/* Info Section */}
                        <div className="text-center space-y-3">
                            <p className="text-gray-500 dark:text-gray-400 text-[14px] leading-relaxed">
                                Messages and calls in this chat are secured with end-to-end encryption. To verify this, compare the code below with your partner's device.
                            </p>
                            <div className="flex justify-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                                    <Shield className="w-3 h-3" />
                                    VERIFIED CONNECTION
                                </span>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-56 h-56 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-pink-500/10 border border-pink-100/50 overflow-hidden">
                                {qrUrl ? (
                                    <img src={qrUrl} alt="Security QR Code" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-50 rounded-2xl">
                                        <QrCode className="w-12 h-12 text-gray-200" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Scan to verify</p>
                        </div>

                        {/* 60-Digit Code */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Safety Numbers</span>
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center gap-1 text-[11px] font-black text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all active:scale-95"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                                    {copied ? 'COPIED' : 'COPY ALL'}
                                </button>
                            </div>
                            <div className="bg-white dark:bg-black/20 p-5 rounded-[2rem] border dark:border-white/5 shadow-inner">
                                {fingerprint ? formatFingerprint(fingerprint) : (
                                    <div className="h-32 bg-gray-50 dark:bg-white/5 animate-pulse rounded-2xl" />
                                )}
                            </div>
                        </div>

                        {/* Encryption Details */}
                        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-transparent rounded-[2.5rem] p-8 space-y-6 border dark:border-white/5">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                Technical Foundation
                            </h3>
                            <div className="space-y-5 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-blue-500 font-bold text-[10px]">ECDH</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-900 dark:text-white font-bold text-sm">P-256 Protocol</p>
                                        <p>Secure key exchange happens locally. Your private keys never touch our servers or the cloud.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-purple-500 font-bold text-[10px]">GCM</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-900 dark:text-white font-bold text-sm">AES-256-GCM</p>
                                        <p>Industry-standard authenticated encryption ensures your messages are tamper-proof and private.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-green-500 font-bold text-[10px]">ZERO</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-gray-900 dark:text-white font-bold text-sm">Zero Knowledge</p>
                                        <p>We provide the garden, but we don't have the keys. Only you and your partner can unlock your messages.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
