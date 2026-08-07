import { json } from '@sveltejs/kit';
import { documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, url }) => {
	try {
		const { path, content, version } = await request.json();

		if (!path || content === undefined) {
			return json({ error: 'path and content are required' }, { status: 400 });
		}

		const mode = url.searchParams.get('mode');

		const saved =
			mode === 'create'
				? await documents.create(path, content)
				: await documents.update(path, content, typeof version === 'string' ? version : undefined);

		return json({ success: true, version: saved.version });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to save file');
	}
};
