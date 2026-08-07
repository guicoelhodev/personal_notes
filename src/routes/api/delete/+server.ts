import { json } from '@sveltejs/kit';
import { assets, documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import { extractManagedImageUrls } from '$lib/utils/images';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const { path, isFolder } = await request.json();

		if (!path) {
			return json({ error: 'path is required' }, { status: 400 });
		}

		const removedDocuments = isFolder
			? await documents.readFolder(path)
			: [await documents.read(path + '.md')];

		if (isFolder) {
			await documents.deleteFolder(path);
		} else {
			await documents.delete(path + '.md');
		}

		const remainingDocuments = await documents.readAll();
		await assets.deleteUnreferenced(
			removedDocuments.flatMap((document) => extractManagedImageUrls(document.content)),
			remainingDocuments.map((document) => document.content)
		);

		return json({ success: true });
	} catch (error) {
		return storageErrorResponse(error, 'Failed to delete');
	}
};
