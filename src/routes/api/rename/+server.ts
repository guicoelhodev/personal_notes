import { json } from '@sveltejs/kit';
import { renameFile, renameFolder, listDocsTree } from '$lib/github';
import type { TreeEntry } from '$lib/types';

export async function PUT({ request }) {
	try {
		const { path, newName, isFolder } = await request.json();

		if (!path || !newName) {
			return json({ error: 'path and newName are required' }, { status: 400 });
		}

		const normalizedName = newName.replaceAll(' ', '_');

		const pathParts = path.split('/');
		const parentPath = pathParts.slice(0, -1).join('/');
		const newPath = parentPath ? parentPath + '/' + normalizedName : normalizedName;

		const tree = await listDocsTree();

		if (isFolder) {
			const exists = tree.some(
				(entry: TreeEntry) => entry.path === newPath || entry.path.startsWith(newPath + '/')
			);
			if (exists) {
				return json({ error: 'A folder with this name already exists' }, { status: 409 });
			}
			await renameFolder(path, newPath);
		} else {
			const newFilePath = newPath + '.md';
			const exists = tree.some((entry: TreeEntry) => entry.path === newFilePath);
			if (exists) {
				return json({ error: 'A file with this name already exists' }, { status: 409 });
			}
			await renameFile(path + '.md', newFilePath);
		}

		return json({ success: true, newPath });
	} catch (error: unknown) {
		const status = (error as { status?: number })?.status || 500;
		const message = (error as { message?: string })?.message || 'Failed to rename';
		return json({ error: message }, { status });
	}
}
