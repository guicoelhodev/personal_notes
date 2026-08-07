import { describe, expect, it } from 'vitest';
import { normalizeAssetPath, normalizeDocumentPath } from '../src/lib/server/application/paths';

describe('storage paths', () => {
	it('normalizes valid document paths', () => {
		expect(normalizeDocumentPath('/folder/note.md/')).toBe('folder/note.md');
		expect(normalizeDocumentPath('literal%2Fname.md')).toBe('literal%2Fname.md');
	});

	it.each(['../secret.md', 'folder/../secret.md', '.', 'folder//note.md'])(
		'rejects invalid document path %s',
		(path) => expect(() => normalizeDocumentPath(path)).toThrow('Invalid document path')
	);

	it('only accepts generated asset names', () => {
		expect(normalizeAssetPath('550e8400-e29b-41d4-a716-446655440000.png')).toBe(
			'550e8400-e29b-41d4-a716-446655440000.png'
		);
		expect(() => normalizeAssetPath('folder/image.png')).toThrow('Invalid asset path');
	});
});
