import { Preferences } from '@capacitor/preferences';

/**
 * End-to-End Encryption (E2EE) Utility
 * Uses Web Crypto API (ECDH P-256 for key exchange, AES-GCM for encryption)
 */

const KEYS_NAMESPACE = 'twilight_e2ee_keys';
// Note: We now use dynamic keys prefixed with userId: `${userId}_private_key`

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generates a new P-256 key pair for the user
 */
export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true,
        ['deriveKey', 'deriveBits']
    );

    const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: window.btoa(JSON.stringify(publicKeyJwk)),
        privateKey: window.btoa(JSON.stringify(privateKeyJwk))
    };
}

/**
 * Initializes keys locally for a specific user and returns the public key for server upload
 */
export async function initializeEncryptionKeys(userId: string): Promise<string> {
    const pubKeyName = `${userId}_public_key`;
    const privKeyName = `${userId}_private_key`;

    const { value: existingPubKey } = await Preferences.get({ key: pubKeyName });
    const { value: existingPrivKey } = await Preferences.get({ key: privKeyName });

    if (existingPubKey && existingPrivKey) {
        console.log(`[E2EE] Keys already exist locally for user: ${userId}`);
        cachedPrivateKey = existingPrivKey;
        return existingPubKey;
    }

    console.log(`[E2EE] Generating new key pair for user: ${userId}...`);
    const { publicKey, privateKey } = await generateKeyPair();

    await Preferences.set({ key: pubKeyName, value: publicKey });
    await Preferences.set({ key: privKeyName, value: privateKey });

    cachedPrivateKey = privateKey;
    return publicKey;
}

export function clearEncryptionCache() {
    cachedPrivateKey = null;
}

/**
 * Derives a shared secret between the current user and their partner
 */
async function deriveSharedSecret(ownPrivateKeyB64: string, partnerPublicKeyB64: string): Promise<CryptoKey> {
    const privateKeyJwk = JSON.parse(window.atob(ownPrivateKeyB64));
    const partnerPublicKeyJwk = JSON.parse(window.atob(partnerPublicKeyB64));

    const ownPrivateKey = await window.crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey']
    );

    const partnerPublicKey = await window.crypto.subtle.importKey(
        'jwk',
        partnerPublicKeyJwk,
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
    );

    return await window.crypto.subtle.deriveKey(
        {
            name: 'ECDH',
            public: partnerPublicKey,
        },
        ownPrivateKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts a message using a shared secret
 */
export async function encryptMessage(text: string, partnerPublicKeyB64: string): Promise<string> {
    if (!cachedPrivateKey) {
        const { value } = await Preferences.get({ key: PRIVATE_KEY_KEY });
        cachedPrivateKey = value;
    }
    const ownPrivateKeyB64 = cachedPrivateKey;
    if (!ownPrivateKeyB64) throw new Error('Private key missing');

    const sharedKey = await deriveSharedSecret(ownPrivateKeyB64, partnerPublicKeyB64);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        sharedKey,
        encoded
    );

    // Combine IV (12 bytes) + Ciphertext for storage
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypts a message using a shared secret
 */
let cachedPrivateKey: string | null = null;
export async function decryptMessage(encryptedB64: string, partnerPublicKeyB64: string, userId?: string): Promise<string> {
    try {
        if (userId) {
            const privKeyName = `${userId}_private_key`;
            const { value } = await Preferences.get({ key: privKeyName });
            cachedPrivateKey = value;
        } else if (!cachedPrivateKey) {
            // Fallback for missing userId (not recommended for production)
            console.warn('[E2EE] userId missing in decryptMessage, searching for any key...');
            const allKeys = await Preferences.keys();
            const privKey = allKeys.keys.find(k => k.endsWith('_private_key'));
            if (privKey) {
                const { value } = await Preferences.get({ key: privKey });
                cachedPrivateKey = value;
            }
        }

        const ownPrivateKeyB64 = cachedPrivateKey;
        if (!ownPrivateKeyB64) throw new Error('Private key missing');

        const sharedKey = await deriveSharedSecret(ownPrivateKeyB64, partnerPublicKeyB64);
        
        const combined = new Uint8Array(base64ToArrayBuffer(encryptedB64));
        const iv = combined.slice(0, 12);
        const ciphertext = combined.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            sharedKey,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.warn('[E2EE] Decryption failed, likely a legacy message or missing key');
        // If it looks like a long Base64 string, it's a failed decryption, not a legacy plain text
        const noSpaces = !/\s/.test(encryptedB64);
        const onlyBase64Chars = /^[A-Za-z0-9+/=]+$/.test(encryptedB64);
        if (encryptedB64.length > 30 && noSpaces && onlyBase64Chars) {
            return "🔐 Message locked (Keys changed)";
        }
        return encryptedB64; 
    }
}

/**
 * Encrypts any JSON-serializable data
 */
export async function encryptData(data: any, partnerPublicKeyB64: string): Promise<string> {
    const json = JSON.stringify(data);
    return await encryptMessage(json, partnerPublicKeyB64);
}

/**
 * Decrypts and parses JSON-encoded data
 */
export async function decryptData<T>(encryptedB64: string, partnerPublicKeyB64: string, userId?: string): Promise<T | null> {
    try {
        const decrypted = await decryptMessage(encryptedB64, partnerPublicKeyB64, userId);
        if (decrypted === encryptedB64) return null; // Likely decryption failed (legacy or corrupted)
        return JSON.parse(decrypted) as T;
    } catch (e) {
        console.warn('[E2EE] Data decryption/parse failed:', e);
        return null;
    }
}
/**
 * Encrypts a binary blob (ArrayBuffer)
 */
export async function encryptBlob(data: ArrayBuffer, partnerPublicKeyB64: string): Promise<ArrayBuffer> {
    if (!cachedPrivateKey) {
        const { value } = await Preferences.get({ key: PRIVATE_KEY_KEY });
        cachedPrivateKey = value;
    }
    const ownPrivateKeyB64 = cachedPrivateKey;
    if (!ownPrivateKeyB64) throw new Error('Private key missing');

    const sharedKey = await deriveSharedSecret(ownPrivateKeyB64, partnerPublicKeyB64);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        sharedKey,
        data
    );

    // Combine IV (12 bytes) + Ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return combined.buffer;
}

/**
 * Decrypts a binary blob (ArrayBuffer)
 */
export async function decryptBlob(encryptedData: ArrayBuffer, partnerPublicKeyB64: string): Promise<ArrayBuffer> {
    if (!cachedPrivateKey) {
        const { value } = await Preferences.get({ key: PRIVATE_KEY_KEY });
        cachedPrivateKey = value;
    }
    const ownPrivateKeyB64 = cachedPrivateKey;
    if (!ownPrivateKeyB64) throw new Error('Private key missing');

    const sharedKey = await deriveSharedSecret(ownPrivateKeyB64, partnerPublicKeyB64);
    
    const combined = new Uint8Array(encryptedData);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    return await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        sharedKey,
        ciphertext
    );
}

/**
 * Generates a 60-digit fingerprint for manual verification (WhatsApp style)
 */
export async function generateVerificationFingerprint(ownPubKey: string, partnerPubKey: string): Promise<string> {
    const sortedKeys = [ownPubKey, partnerPubKey].sort();
    const combined = sortedKeys.join('');
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert hash bytes to a 60-digit numeric string
    // 12 groups of 5 digits = 60 digits
    let digits = "";
    for (let i = 0; i < 24; i += 2) { // 12 iterations
        const val = ((hashArray[i] << 8) | hashArray[i + 1]) % 100000;
        digits += val.toString().padStart(5, '0');
    }
    return digits;
}
