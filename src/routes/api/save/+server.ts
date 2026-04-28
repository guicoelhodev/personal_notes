import { json } from '@sveltejs/kit';
import { updateFile, createFile } from '$lib/github';

export async function PUT({ request, url }) {
	try {
		const { path, content } = await request.json();

		if (!path || content === undefined) {
			return json({ error: 'path and content are required' }, { status: 400 });
		}

		const mode = url.searchParams.get('mode');

		if (mode === 'create') {
			await createFile(path, content);
		} else {
			await updateFile(path, content);
		}

		return json({ success: true });
	} catch (error: any) {
		const status = error?.status || 500;
		return json({ error: error.message || 'Failed to save file' }, { status });
	}
}
