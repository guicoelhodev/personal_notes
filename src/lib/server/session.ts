import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function hash(value: string): Buffer {
	return createHash('sha256').update(value).digest();
}

function signingKey(secret: string): Buffer {
	return createHash('sha256').update(`personal-notes-session:${secret}`).digest();
}

export function passwordMatches(candidate: string, password: string): boolean {
	if (!password) return false;
	return timingSafeEqual(hash(candidate), hash(password));
}

export function createSignedSession(secret: string, now = Date.now()): string {
	const expiresAt = Math.floor(now / 1000) + SESSION_MAX_AGE;
	const payload = String(expiresAt);
	const signature = createHmac('sha256', signingKey(secret)).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

export function verifySignedSession(
	token: string | undefined,
	secret: string,
	now = Date.now()
): boolean {
	if (!token || !secret) return false;
	const [payload, signature, extra] = token.split('.');
	if (!payload || !signature || extra || !/^\d+$/.test(payload)) return false;
	if (Number(payload) <= Math.floor(now / 1000)) return false;

	const expected = createHmac('sha256', signingKey(secret)).update(payload).digest();
	let received: Buffer;
	try {
		received = Buffer.from(signature, 'base64url');
	} catch {
		return false;
	}
	return received.length === expected.length && timingSafeEqual(received, expected);
}
