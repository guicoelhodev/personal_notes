import { HttpDocumentWorkspaceAdapter } from '$lib/client/adapters/http-document-workspace';
import { IndexedDbDocumentWorkspaceAdapter } from '$lib/client/adapters/indexeddb-document-workspace';
import type { DocumentWorkspacePort } from '$lib/client/ports/document-workspace';
import { accessState } from '$lib/stores/access.svelte';

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

export function isUnauthorized(error: unknown): boolean {
	return (error as { status?: number })?.status === 401;
}
