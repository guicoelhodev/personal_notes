import { json } from '@sveltejs/kit';
import { uploadImage } from '$lib/github';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	try {
		const MAX_SIZE = 5 * 1024 * 1024;

		if (!file) {
			throw { status: 400, message: 'No file provided' };
		}

		if (file.size > MAX_SIZE) {
			throw { status: 400, message: 'File too large (max 5MB)' };
		}

		const url = await uploadImage(file);
		return json({ url });
	} catch (err: any) {
		return json({ error: err.message || 'Upload failed' }, { status: err.status || 500 });
	}
};
