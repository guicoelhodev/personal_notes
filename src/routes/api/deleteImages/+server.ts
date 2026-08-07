import { json } from '@sveltejs/kit';
import { assets, documents } from '$lib/server/container';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request }) => {
	const { urls } = await request.json();

	if (!Array.isArray(urls) || urls.length === 0) {
		return json({ error: 'No images provided' }, { status: 400 });
	}

	let deleted: number;
	try {
		const remainingDocuments = await documents.readAll();
		deleted = await assets.deleteUnreferenced(
			urls,
			remainingDocuments.map((document) => document.content)
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Some images failed to delete';
		return json({ error: message }, { status: 500 });
	}

	return json({ success: true, deleted });
};
