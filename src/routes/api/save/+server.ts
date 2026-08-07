import { json } from '@sveltejs/kit';
import { documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import { canEditSharedDocument } from '$lib/server/share';
import { isAuthenticated } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const { path, content, version } = await request.json();

		if (!path || content === undefined) {
			return json({ error: 'path and content are required' }, { status: 400 });
		}
		if (!canEditSharedDocument(cookies, request, path)) {
			return json({ error: 'Editing is not allowed for this document' }, { status: 401 });
		}

		const mode = url.searchParams.get('mode');
		if (mode === 'create' && !isAuthenticated(cookies)) {
			return json({ error: 'Creating documents is not allowed' }, { status: 401 });
		}

		const saved =
			mode === 'create'
				? await documents.create(path, content)
				: await documents.update(path, content, typeof version === 'string' ? version : undefined);

		return json({ success: true, version: saved.version });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to save file');
	}
};
