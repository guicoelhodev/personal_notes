import { json } from '@sveltejs/kit';
import { documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { path, isFolder } = await request.json();

		if (!path) {
			return json({ error: 'path is required' }, { status: 400 });
		}

		if (isFolder) {
			await documents.deleteFolder(path);
		} else {
			await documents.delete(path + '.md');
		}

		return json({ success: true });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to delete');
	}
};
