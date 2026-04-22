import { json } from '@sveltejs/kit';
import { deleteFile, deleteFolder } from '$lib/github';

export async function DELETE({ request }) {
	try {
		const { path, isFolder } = await request.json();

		if (!path) {
			return json({ error: 'path is required' }, { status: 400 });
		}

		if (isFolder) {
			await deleteFolder(path);
		} else {
			await deleteFile(path + '.md');
		}

		return json({ success: true });
	} catch (error: any) {
		const status = error?.status || 500;
		return json({ error: error.message || 'Failed to delete' }, { status });
	}
}
