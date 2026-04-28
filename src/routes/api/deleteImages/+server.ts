import { json } from '@sveltejs/kit';
import { deleteImage } from '$lib/github';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request }) => {
	const { urls } = await request.json();

	if (!Array.isArray(urls) || urls.length === 0) {
		return json({ error: 'No images provided' }, { status: 400 });
	}

	const results = await Promise.allSettled(urls.map((url: string) => deleteImage(url)));

	const failed = results.filter((r) => r.status === 'rejected').map((r) => (r as PromiseRejectedResult).reason);

	if (failed.length > 0) {
		return json({ error: 'Some images failed to delete', details: failed }, { status: 500 });
	}

	return json({ success: true, deleted: urls.length });
};