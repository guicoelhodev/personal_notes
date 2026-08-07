import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { isAuthenticated } from './auth';
import {
	createEncryptedShareToken,
	verifyEncryptedShareToken,
	type ShareClaims
} from './share-token';

export type { ShareClaims, ShareMode } from './share-token';

function secret(): string {
	if (!env.SHARE_LINK_SECRET) throw new Error('SHARE_LINK_SECRET is not configured');
	return env.SHARE_LINK_SECRET;
}

export function createShareToken(claims: ShareClaims): string {
	return createEncryptedShareToken(secret(), claims);
}

export function verifyShareToken(token: string | undefined, now = Date.now()): ShareClaims | null {
	return verifyEncryptedShareToken(token, env.SHARE_LINK_SECRET || '', now);
}

export function shareTokenFrom(request: Request): string | undefined {
	return request.headers.get('x-share-token') || undefined;
}

export function canEditSharedDocument(cookies: Cookies, request: Request, path: string): boolean {
	if (isAuthenticated(cookies)) return true;
	const claims = verifyShareToken(shareTokenFrom(request));
	return claims?.mode === 'edit' && claims.path === path;
}

export function canEditSharedContent(cookies: Cookies, request: Request): boolean {
	if (isAuthenticated(cookies)) return true;
	return verifyShareToken(shareTokenFrom(request))?.mode === 'edit';
}
