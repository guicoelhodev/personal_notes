import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

export type ShareMode = 'view' | 'edit';

export interface ShareClaims {
	path: string;
	expireAt: number;
	mode: ShareMode;
	shareAll: boolean;
}

function encryptionKey(secret: string): Buffer {
	return createHash('sha256').update(`personal-notes-share:${secret}`).digest();
}

export function createEncryptedShareToken(secret: string, claims: ShareClaims): string {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, encryptionKey(secret), iv);
	const encrypted = Buffer.concat([
		cipher.update(JSON.stringify(claims), 'utf8'),
		cipher.final()
	]);
	const tag = cipher.getAuthTag();
	return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function verifyEncryptedShareToken(
	token: string | undefined,
	secret: string,
	now = Date.now()
): ShareClaims | null {
	if (!token || !secret) return null;
	const [ivValue, tagValue, encryptedValue, extra] = token.split('.');
	if (!ivValue || !tagValue || !encryptedValue || extra) return null;

	try {
		const iv = Buffer.from(ivValue, 'base64url');
		const tag = Buffer.from(tagValue, 'base64url');
		const encrypted = Buffer.from(encryptedValue, 'base64url');
		if (iv.length !== IV_LENGTH || tag.length !== 16 || encrypted.length === 0) return null;
		const decipher = createDecipheriv(ALGORITHM, encryptionKey(secret), iv);
		decipher.setAuthTag(tag);
		const value = JSON.parse(
			Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
		) as Partial<ShareClaims>;
		if (
			typeof value.path !== 'string' ||
			!value.path.endsWith('.md') ||
			typeof value.expireAt !== 'number' ||
			value.expireAt <= now ||
			(value.mode !== 'view' && value.mode !== 'edit') ||
			typeof value.shareAll !== 'boolean'
		) {
			return null;
		}
		return value as ShareClaims;
	} catch {
		return null;
	}
}
