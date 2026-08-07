import { json } from '@sveltejs/kit';
import { documents } from '$lib/server/container';
import { createShareToken, verifyShareToken, type ShareMode } from '$lib/server/share';
import { storageErrorResponse } from '$lib/server/http';
import type { RequestHandler } from './$types';

const EXPIRATIONS = new Set([60 * 60, 60 * 60 * 24, 60 * 60 * 24 * 7, 60 * 60 * 24 * 30]);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { path, mode, shareAll, expiresIn } = await request.json();
		if (
			typeof path !== 'string' ||
			(mode !== 'view' && mode !== 'edit') ||
			typeof shareAll !== 'boolean' ||
			typeof expiresIn !== 'number' ||
			!EXPIRATIONS.has(expiresIn)
		) {
			return json({ error: 'Invalid share options' }, { status: 400 });
		}

		await documents.read(path);
		const expireAt = Date.now() + expiresIn * 1000;
		const token = createShareToken({ path, mode: mode as ShareMode, shareAll, expireAt });
		return json({ token, expireAt });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to create share link');
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	const { token } = await request.json().catch(() => ({}));
	const claims = verifyShareToken(typeof token === 'string' ? token : undefined);
	if (!claims) return json({ error: 'Invalid or expired share link' }, { status: 401 });
	return json(claims);
};
