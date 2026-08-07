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
		expect((await workspace.list()).map((entry) => entry.path).sort()).toEqual([
			'Getting Started.md',
			'local.md'
		]);
	});

	it('deletes local documents', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		await workspace.save({ path: 'local.md', content: 'local', create: true });
		await workspace.delete({ path: 'local', isFolder: false });
		expect((await workspace.list()).map((entry) => entry.path)).toEqual(['Getting Started.md']);
		await expect(workspace.read('local.md')).rejects.toThrow('Document not found');
	});

	it('creates and opens the getting started document only once', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		const document = await workspace.read('Getting Started.md');

		expect(document.content).toContain('# Welcome to Personal Notes');
		expect(await workspace.consumeInitialDocument()).toBe('Getting Started.md');
		expect(await workspace.consumeInitialDocument()).toBeNull();

		await workspace.delete({ path: 'Getting Started', isFolder: false });
		expect(await workspace.list()).toEqual([]);
	});

	it('prevents a document from also becoming a folder', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		await workspace.save({ path: 'foo.md', content: 'file', create: true });
		await expect(
			workspace.save({ path: 'foo/nested.md', content: 'nested', create: true })
		).rejects.toThrow('Document or folder already exists');
	});

	it('stores image blobs separately and deletes them after their last reference', async () => {
		const workspace = new IndexedDbDocumentWorkspaceAdapter();
		const image = new Blob(['image-data'], { type: 'image/png' }) as File;
		const url = await workspace.uploadImage(image);

		expect(url).toMatch(/^indexeddb:\/\/images\/[a-f0-9-]+$/);
		expect(await (await workspace.readImage(url))?.text()).toBe('image-data');

		await workspace.save({ path: 'local.md', content: `![image](${url})`, create: true });
		await workspace.deleteImages([url]);
		expect(await workspace.readImage(url)).not.toBeNull();

		await workspace.save({ path: 'local.md', content: 'image removed', create: false });
		await workspace.deleteImages([url]);
		expect(await workspace.readImage(url)).toBeNull();
	});
});
