import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import {
	createSignedSession,
	passwordMatches,
	SESSION_MAX_AGE,
	verifySignedSession
} from './session';

export const SESSION_COOKIE = 'personal_notes_session';
export { SESSION_MAX_AGE };

export function verifyPassword(password: string): boolean {
	return passwordMatches(password, env.PASSWORD_ACCESS || '');
}

export function createSessionToken(now = Date.now()): string {
	if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured');
	return createSignedSession(env.SESSION_SECRET, now);
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
	return verifySignedSession(token, env.SESSION_SECRET || '', now);
}

export function isAuthenticated(cookies: Cookies): boolean {
	return verifySessionToken(cookies.get(SESSION_COOKIE));
}
