import React, { useState, useEffect } from 'react';
import { decryptBlob } from '../lib/encryption';
import { AudioPlayer } from './ui/AudioPlayer';

interface SecureMediaProps {
    src: string;
    partnerPubKey: string | null;
}

/**
 * A secure image component that fetches an encrypted blob, decrypts it in memory,
 * and renders it via a local object URL.
 */
export const SecureImage: React.FC<SecureMediaProps & { alt?: string, className?: string, onClick?: () => void }> = ({ src, partnerPubKey, alt, className, onClick }) => {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        let isMounted = true;

        async function loadAndDecrypt() {
            try {
                if (!partnerPubKey) {
                    if (isMounted) setDecryptedUrl(src);
                    return;
                }

                const response = await fetch(src);
                if (!response.ok) throw new Error('Fetch failed');

                const encryptedArrayBuffer = await response.arrayBuffer();
                
                try {
                    const decryptedArrayBuffer = await decryptBlob(encryptedArrayBuffer, partnerPubKey);
                    const blob = new Blob([decryptedArrayBuffer]);
                    objectUrl = URL.createObjectURL(blob);
                    if (isMounted) setDecryptedUrl(objectUrl);
                } catch (e) {
                    console.warn('[SecureImage] Decryption failed, likely legacy or error. Showing raw.', e);
                    if (isMounted) setDecryptedUrl(src); 
                }
            } catch (e) {
                console.error('[SecureImage] Load error:', e);
                if (isMounted) setError(true);
            }
        }

        loadAndDecrypt();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, partnerPubKey]);

    if (error) return <div className="p-4 bg-red-100/10 text-red-500 rounded-lg text-xs">🔒 Error loading secure image</div>;
    if (!decryptedUrl) return <div className={`animate-pulse bg-gray-100 dark:bg-white/5 rounded-lg ${className}`} style={{ minHeight: '100px' }} />;

    return (
        <img 
            src={decryptedUrl} 
            alt={alt} 
            className={className} 
            onClick={onClick} 
            loading="lazy"
            onError={() => {
                console.warn('[SecureImage] Image failed to render. Falling back to raw URL.');
                if (decryptedUrl !== src) setDecryptedUrl(src);
            }}
        />
    );
};

/**
 * A secure audio player component that fetches an encrypted blob, decrypts it,
 * and passes it to the standard AudioPlayer.
 */
export const SecureAudio: React.FC<SecureMediaProps & { isMe: boolean }> = ({ src, partnerPubKey, isMe }) => {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl: string | null = null;
        let isMounted = true;

        async function loadAndDecrypt() {
            try {
                if (!partnerPubKey) {
                    if (isMounted) {
                        setDecryptedUrl(src);
                        setLoading(false);
                    }
                    return;
                }

                const response = await fetch(src);
                const encryptedArrayBuffer = await response.arrayBuffer();
                
                try {
                    const decryptedArrayBuffer = await decryptBlob(encryptedArrayBuffer, partnerPubKey);
                    const blob = new Blob([decryptedArrayBuffer], { type: 'audio/webm' }); // Audio is usually webm/opus
                    objectUrl = URL.createObjectURL(blob);
                    if (isMounted) setDecryptedUrl(objectUrl);
                } catch (e) {
                    console.warn('[SecureAudio] Decryption failed, showing raw', e);
                    if (isMounted) setDecryptedUrl(src);
                }
            } catch (e) {
                console.error('[SecureAudio] Load failed', e);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadAndDecrypt();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, partnerPubKey]);

    if (loading) return <div className="h-14 w-60 animate-pulse bg-gray-100 dark:bg-white/5 rounded-xl" />;
    if (!decryptedUrl) return null;

    return <AudioPlayer src={decryptedUrl} isMe={isMe} />;
};
