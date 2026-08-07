import { json } from '@sveltejs/kit';
import { assets } from '$lib/server/container';
import { canEditSharedContent } from '$lib/server/share';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (!canEditSharedContent(cookies, request)) {
		return json({ error: 'Image uploads are not allowed' }, { status: 401 });
	}
	const formData = await request.formData();
	const file = formData.get('file');

	try {
		if (!(file instanceof File)) {
			throw { status: 400, message: 'No file provided' };
		}
		const url = await assets.upload(file);
		return json({ url });
	} catch (error: unknown) {
		const value = error as { message?: string; status?: number };
		return json({ error: value.message || 'Upload failed' }, { status: value.status || 500 });
	}
};
