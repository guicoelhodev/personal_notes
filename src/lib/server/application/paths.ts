import { InvalidStoragePathError } from '$lib/server/ports/errors';

export function normalizeDocumentPath(path: string): string {
	const normalized = path.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
	if (
		!normalized ||
		normalized.includes('\0') ||
		normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')
	) {
		throw new InvalidStoragePathError('Invalid document path');
	}
	return normalized;
}

export function normalizeDocumentFilePath(path: string): string {
	const normalized = normalizeDocumentPath(path);
	if (!normalized.endsWith('.md')) throw new InvalidStoragePathError('Document must use .md');
	return normalized;
}

export function normalizeAssetPath(path: string): string {
	const normalized = path.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
	if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(normalized)) {
		throw new InvalidStoragePathError('Invalid asset path');
	}
	return normalized;
}
