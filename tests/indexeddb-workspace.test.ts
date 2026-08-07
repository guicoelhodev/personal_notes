import { indexedDB } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { IndexedDbDocumentWorkspaceAdapter } from '../src/lib/client/adapters/indexeddb-document-workspace';

Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, configurable: true });

function deleteDatabase(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase('personal-notes-guest');
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

beforeEach(deleteDatabase);

describe('IndexedDbDocumentWorkspaceAdapter', () => {
	it('stores and lists local documents', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		await workspace.save({ path: 'local.md', content: 'local edit', create: true });
		expect((await workspace.read('local.md')).content).toBe('local edit');
		expect((await workspace.list()).map((entry) => entry.path)).toEqual(['local.md']);
	});

	it('deletes local documents', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		await workspace.save({ path: 'local.md', content: 'local', create: true });
		await workspace.delete({ path: 'local', isFolder: false });
		expect(await workspace.list()).toEqual([]);
		await expect(workspace.read('local.md')).rejects.toThrow('Document not found');
	});

	it('prevents a document from also becoming a folder', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		await workspace.save({ path: 'foo.md', content: 'file', create: true });
		await expect(
			workspace.save({ path: 'foo/nested.md', content: 'nested', create: true })
		).rejects.toThrow('Document or folder already exists');
	});
});
