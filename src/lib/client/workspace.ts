import { HttpDocumentWorkspaceAdapter } from '$lib/client/adapters/http-document-workspace';
import { IndexedDbDocumentWorkspaceAdapter } from '$lib/client/adapters/indexeddb-document-workspace';
import type { DocumentWorkspacePort } from '$lib/client/ports/document-workspace';
import { accessState } from '$lib/stores/access.svelte';
import { localImageId } from '$lib/utils/images';

const remoteWorkspace = new HttpDocumentWorkspaceAdapter();
const guestWorkspace = new IndexedDbDocumentWorkspaceAdapter();

export async function currentWorkspace(): Promise<DocumentWorkspacePort> {
	await accessState.initialize();
	return accessState.mode === 'authenticated' ? remoteWorkspace : guestWorkspace;
}

export async function runWorkspaceWrite<T>(
	operation: (workspace: DocumentWorkspacePort) => Promise<T>
): Promise<T | null> {
	const workspace = await currentWorkspace();
	try {
		return await operation(workspace);
	} catch (error) {
		if (!isUnauthorized(error)) throw error;
		accessState.handleUnauthorized();
		return operation(guestWorkspace);
	}
}

export function readWorkspaceImage(url: string): Promise<Blob | null> {
	return guestWorkspace.readImage(url);
}

export async function deleteWorkspaceImages(urls: string[]): Promise<void> {
	const localUrls = urls.filter((url) => localImageId(url));
	const remoteUrls = urls.filter((url) => url.startsWith('/api/images/'));
	await Promise.all([
		guestWorkspace.deleteImages(localUrls),
		remoteUrls.length > 0 ? remoteWorkspace.deleteImages(remoteUrls) : Promise.resolve()
	]);
}

export function isUnauthorized(error: unknown): boolean {
	return (error as { status?: number })?.status === 401;
}
