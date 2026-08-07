import { describe, expect, it, vi } from 'vitest';
import { DocumentService } from '../src/lib/server/application/documents';
import type { DocumentStoragePort } from '../src/lib/server/ports/storage';

function storage(): DocumentStoragePort {
	return {
		list: vi.fn().mockResolvedValue([]),
		read: vi.fn().mockResolvedValue({ path: 'note.md', content: 'note', version: 'v1' }),
		create: vi.fn().mockResolvedValue({ path: 'note.md', content: 'note', version: 'v1' }),
		update: vi.fn().mockResolvedValue({ path: 'note.md', content: 'note', version: 'v2' }),
		delete: vi.fn().mockResolvedValue(undefined),
		deleteFolder: vi.fn().mockResolvedValue(undefined),
		rename: vi.fn().mockResolvedValue(undefined),
		renameFolder: vi.fn().mockResolvedValue(undefined)
	};
}

describe('DocumentService', () => {
	it('keeps provider details behind the storage port', async () => {
		const adapter = storage();
		const service = new DocumentService(adapter);
		await service.update('/folder/note.md/', 'changed', 'opaque-version');
		expect(adapter.update).toHaveBeenCalledWith('folder/note.md', 'changed', 'opaque-version');
	});

	it('rejects traversal before calling the adapter', async () => {
		const adapter = storage();
		const service = new DocumentService(adapter);
		expect(() => service.read('../secret.md')).toThrow('Invalid document path');
		expect(adapter.read).not.toHaveBeenCalled();
	});
});
