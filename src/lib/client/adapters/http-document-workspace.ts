import type {
	DeleteDocumentInput,
	DocumentWorkspacePort,
	RenameDocumentInput,
	SaveDocumentInput,
	WorkspaceDocument
} from '$lib/client/ports/document-workspace';
import type { TreeEntry } from '$lib/types';

async function responseError(response: Response, fallback: string): Promise<Error> {
	const data = await response.json().catch(() => null);
	const error = new Error(data?.error || fallback) as Error & { status?: number };
	error.status = response.status;
	return error;
}

export class HttpDocumentWorkspaceAdapter implements DocumentWorkspacePort {
	async list(): Promise<TreeEntry[]> {
		const response = await fetch('/api/docs');
		if (!response.ok) throw await responseError(response, 'Failed to load documents');
		return response.json();
	}

	async read(path: string): Promise<WorkspaceDocument> {
		const response = await fetch(`/api/docs/${encodeURIComponent(path)}`);
		if (!response.ok) throw await responseError(response, 'Document not found');
		return {
			path,
			content: await response.text(),
			version: response.headers.get('etag') || ''
		};
	}

	async save(input: SaveDocumentInput): Promise<{ version: string }> {
		const response = await fetch(input.create ? '/api/save?mode=create' : '/api/save', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				path: input.path,
				content: input.content,
				version: input.version
			})
		});
		if (!response.ok) throw await responseError(response, 'Failed to save document');
		return response.json();
	}

	async rename(input: RenameDocumentInput): Promise<{ newPath: string }> {
		const response = await fetch('/api/rename', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(input)
		});
		if (!response.ok) throw await responseError(response, 'Failed to rename document');
		return response.json();
	}

	async delete(input: DeleteDocumentInput): Promise<void> {
		const response = await fetch('/api/delete', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(input)
		});
		if (!response.ok) throw await responseError(response, 'Failed to delete document');
	}

	async uploadImage(file: File): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);
		const response = await fetch('/api/upload', { method: 'POST', body: formData });
		if (!response.ok) throw await responseError(response, 'Upload failed');
		const data = await response.json();
		return data.url;
	}

	async readImage(): Promise<Blob | null> {
		return null;
	}

	async deleteImages(urls: string[]): Promise<void> {
		if (urls.length === 0) return;
		const response = await fetch('/api/deleteImages', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ urls }),
			keepalive: true
		});
		if (!response.ok) throw await responseError(response, 'Failed to delete images');
	}

	async consumeInitialDocument(): Promise<string | null> {
		return null;
	}
}
