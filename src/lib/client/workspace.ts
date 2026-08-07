import { HttpDocumentWorkspaceAdapter } from '$lib/client/adapters/http-document-workspace';
import { IndexedDbDocumentWorkspaceAdapter } from '$lib/client/adapters/indexeddb-document-workspace';
import type { DocumentWorkspacePort } from '$lib/client/ports/document-workspace';
import { accessState } from '$lib/stores/access.svelte';

const remoteWorkspace = new HttpDocumentWorkspaceAdapter();
const guestWorkspace = new IndexedDbDocumentWorkspaceAdapter(remoteWorkspace);

export async function currentWorkspace(): Promise<DocumentWorkspacePort> {
	await accessState.initialize();
	return accessState.mode === 'guest' ? guestWorkspace : remoteWorkspace;
}

export async function writableWorkspace(): Promise<DocumentWorkspacePort | null> {
	const mode = await accessState.ensureWriteAccess();
	if (!mode) return null;
	return mode === 'guest' ? guestWorkspace : remoteWorkspace;
}

export async function runWorkspaceWrite<T>(
	operation: (workspace: DocumentWorkspacePort) => Promise<T>
): Promise<T | null> {
	let workspace = await writableWorkspace();
	if (!workspace) return null;
	try {
		return await operation(workspace);
	} catch (error) {
		if (!isUnauthorized(error)) throw error;
		accessState.handleUnauthorized();
		const mode = await accessState.ensureWriteAccess();
		if (!mode) return null;
		workspace = mode === 'guest' ? guestWorkspace : remoteWorkspace;
		return operation(workspace);
	}
}

export function isUnauthorized(error: unknown): boolean {
	return (error as { status?: number })?.status === 401;
}
