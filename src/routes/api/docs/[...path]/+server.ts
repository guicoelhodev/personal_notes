import { documents } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const { path } = params;

	try {
		if (!path) {
			const tree = (await documents.list()).map((entry) => ({
				path: entry.path,
				type: 'blob',
				sha: entry.version
			}));
			return new Response(JSON.stringify(tree), {
				status: 200,
				headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
			});
		}

		const document = await documents.read(path);
		return new Response(document.content, {
			status: 200,
			headers: {
				'Content-Type': 'text/markdown; charset=utf-8',
				'Cache-Control': 'no-cache',
				ETag: document.version
			}
		});
	} catch (error) {
		return storageErrorResponse(error, 'Failed to read documents');
	}
};
