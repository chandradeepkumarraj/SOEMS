import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
// Use an environment variable for the secret key. Fallback for development ONLY.
const SECRET_KEY = process.env.ENCRYPTION_KEY || '67c7e1b5d6f3b4a2e8c5d1a8f9b0c2e3d4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9';

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a colon-separated string: iv:authTag:encryptedContent
 */
export function encrypt(text: string): string {
    if (!text) return '';

    // Check if text is already masked (prevent double encryption of masks)
    if (text.startsWith('sk-') && text.includes('...')) return text;
    if (text === '********') return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with the encrypt function above.
 */
export function decrypt(text: string): string {
    if (!text) return '';

    const parts = text.split(':');
    if (parts.length !== 3) return text; // Probably not encrypted or legacy format

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Masks a sensitive string for UI display.
 */
export function maskKey(key: string): string {
    if (!key) return '';
    if (key.length < 12) return '********';
    return `${key.substring(0, 8)}...${key.slice(-4)}`;
}
