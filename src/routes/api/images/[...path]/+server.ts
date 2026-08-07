import type { RequestHandler } from './$types';
import { assets } from '$lib/server/container';
import { storageErrorResponse } from '$lib/server/http';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const asset = await assets.read(params.path);
		const body = asset.data.buffer.slice(
			asset.data.byteOffset,
			asset.data.byteOffset + asset.data.byteLength
		) as ArrayBuffer;
		return new Response(body, {
			headers: {
				'Content-Type': asset.contentType,
				'Cache-Control': 'public, max-age=3600'
			}
		});
	} catch (error) {
		return storageErrorResponse(error, 'Failed to read image');
	}
};
