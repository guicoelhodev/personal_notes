import { indexedDB } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbDocumentWorkspaceAdapter } from '../src/lib/client/adapters/indexeddb-document-workspace';
import type {
	DocumentWorkspacePort,
	WorkspaceDocument
} from '../src/lib/client/ports/document-workspace';

Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, configurable: true });

class PublicWorkspace implements DocumentWorkspacePort {
	async list() {
		return [{ path: 'remote.md', type: 'blob', sha: 'remote-v1' }];
	}
	async read(path: string): Promise<WorkspaceDocument> {
		if (path !== 'remote.md') throw new Error('Document not found');
		return { path, content: 'remote', version: 'remote-v1' };
	}
	async save(): Promise<{ version: string }> {
		throw new Error('Unexpected remote write');
	}
	async rename(): Promise<{ newPath: string }> {
		throw new Error('Unexpected remote write');
	}
	async delete() {
		throw new Error('Unexpected remote write');
	}
	async upload(): Promise<string> {
		throw new Error('Unexpected remote write');
	}
}

function deleteDatabase(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase('personal-notes-guest');
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

beforeEach(deleteDatabase);

describe('IndexedDbDocumentWorkspaceAdapter', () => {
	it('overlays local edits without writing to the public adapter', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter(new PublicWorkspace());
		await workspace.save({ path: 'remote.md', content: 'local edit', create: false });
		expect((await workspace.read('remote.md')).content).toBe('local edit');
		expect((await workspace.list()).map((entry) => entry.path)).toEqual(['remote.md']);
	});

	it('uses tombstones for local deletions', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter(new PublicWorkspace());
		await workspace.delete({ path: 'remote', isFolder: false });
		expect(await workspace.list()).toEqual([]);
		await expect(workspace.read('remote.md')).rejects.toThrow('Document not found');
	});

	it('prevents a document from also becoming a folder', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter(new PublicWorkspace());
		await workspace.save({ path: 'foo.md', content: 'file', create: true });
		await expect(
			workspace.save({ path: 'foo/nested.md', content: 'nested', create: true })
		).rejects.toThrow('Document or folder already exists');
	});
});
