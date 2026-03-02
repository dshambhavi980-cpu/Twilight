import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, QrCode, Clipboard, X, Check, Camera, ShieldCheck, ShieldAlert } from 'lucide-react';
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
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState<'verified' | 'mismatch' | null>(null);
    const scannerRef = useRef<any>(null);
    const scannerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadKeys() {
            if (!isOpen || !user) return;
            
            console.log('[Security] Opening verification. PartnerPubKey from prop:', !!partnerPubKey);
            
            try {
                const pubKeyName = `${user.id}_public_key`;
                const { value: pubKey } = await Preferences.get({ key: pubKeyName });
                
                if (!pubKey) {
                    console.warn('[Security] Own public key missing from Preferences');
                    return;
                }

                if (!partnerPubKey) {
                    console.warn('[Security] Partner public key missing from prop');
                    return;
                }

                console.log('[Security] Generating fingerprint...');
                const fp = await generateVerificationFingerprint(pubKey, partnerPubKey);
                console.log('[Security] Fingerprint generated:', !!fp);
                setFingerprint(fp);
            } catch (err) {
                console.error('[Security] Failed to generate verification fingerprint:', err);
            }
        }
        loadKeys();
    }, [isOpen, partnerPubKey, user]);

    // Cleanup scanner on unmount or close
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    // Stop scanner when panel closes
    useEffect(() => {
        if (!isOpen) {
            stopScanner();
        }
    }, [isOpen]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                // Scanner may already be stopped
            }
            scannerRef.current = null;
        }
        setScanning(false);
    }, []);

    const startScanner = useCallback(async () => {
        if (!fingerprint) return;
        setScanResult(null);
        setScanning(true);

        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');
        
        // Wait a tick for the container to render
        await new Promise(r => setTimeout(r, 100));
        
        const containerId = 'tg-qr-scanner';
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('[Scanner] Container not found');
            setScanning(false);
            return;
        }

        try {
            const scanner = new Html5Qrcode(containerId);
            scannerRef.current = scanner;
            
            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText: string) => {
                    // Compare scanned text with local fingerprint
                    console.log('[Scanner] Scanned:', decodedText?.substring(0, 20) + '...');
                    if (decodedText === fingerprint) {
                        setScanResult('verified');
                    } else {
                        setScanResult('mismatch');
                    }
                    // Stop scanner after result
                    scanner.stop().catch(() => {});
                    scanner.clear();
                    scannerRef.current = null;
                    setScanning(false);
                },
                () => {
                    // Ignore scan failures (no QR detected yet)
                }
            );
        } catch (err: any) {
            console.error('[Scanner] Failed to start:', err);
            setScanning(false);
            // If camera permission denied, show an alert
            if (err?.message?.includes('Permission') || err?.message?.includes('NotAllowed')) {
                alert('Camera access is required to scan QR codes. Please allow camera permission and try again.');
            }
        }
    }, [fingerprint]);

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
                        <button onClick={() => { stopScanner(); onClose(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
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

                        {/* Scan Result Banner */}
                        <AnimatePresence>
                            {scanResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border ${
                                        scanResult === 'verified' 
                                            ? 'bg-green-500/10 border-green-500/20' 
                                            : 'bg-red-500/10 border-red-500/20'
                                    }`}
                                >
                                    {scanResult === 'verified' ? (
                                        <>
                                            <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                                            <div>
                                                <p className="font-bold text-green-600 dark:text-green-400">Verified! ✅</p>
                                                <p className="text-xs text-green-600/70 dark:text-green-400/70">
                                                    The security codes match. Your connection is secure.
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                                            <div>
                                                <p className="font-bold text-red-600 dark:text-red-400">Mismatch ❌</p>
                                                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                                                    The codes don't match. Make sure you're scanning your partner's code.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => setScanResult(null)} 
                                        className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="relative w-56 h-56 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-pink-500/10 border border-pink-100/50 overflow-hidden flex items-center justify-center">
                                {fingerprint ? (
                                    /* @ts-ignore */
                                    <QRCode 
                                        value={fingerprint} 
                                        size={256}
                                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                        viewBox={`0 0 256 256`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-50 rounded-2xl">
                                        <QrCode className="w-12 h-12 text-gray-200" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Your Security Code</p>
                        </div>

                        {/* Scan Partner's Code Button */}
                        {!scanning && (
                            <button
                                onClick={startScanner}
                                disabled={!fingerprint}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Camera size={20} />
                                <span>Scan Partner's Code</span>
                            </button>
                        )}

                        {/* Camera Scanner */}
                        {scanning && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Camera size={14} className="text-primary" />
                                        Scanning...
                                    </span>
                                    <button 
                                        onClick={stopScanner}
                                        className="text-xs font-bold text-red-500 hover:text-red-400 px-3 py-1 bg-red-500/10 rounded-full transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <div 
                                    id="tg-qr-scanner" 
                                    ref={scannerContainerRef}
                                    className="w-full rounded-2xl overflow-hidden border-2 border-primary/30"
                                    style={{ minHeight: 280 }}
                                />
                            </div>
                        )}

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
