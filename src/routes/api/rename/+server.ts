import { json } from '@sveltejs/kit';
import { documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const { path, newName, isFolder } = await request.json();

		if (!path || !newName) {
			return json({ error: 'path and newName are required' }, { status: 400 });
		}

		const normalizedName = newName.replaceAll(' ', '_');
		if (normalizedName.includes('/') || normalizedName.includes('\\')) {
			return json({ error: 'Name cannot contain path separators' }, { status: 400 });
		}

		const pathParts = path.split('/');
		const parentPath = pathParts.slice(0, -1).join('/');
		const newPath = parentPath ? parentPath + '/' + normalizedName : normalizedName;

		if (isFolder) {
			await documents.renameFolder(path, newPath);
		} else {
			const newFilePath = newPath + '.md';
			await documents.rename(path + '.md', newFilePath);
		}

		return json({ success: true, newPath });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to rename');
	}
};
