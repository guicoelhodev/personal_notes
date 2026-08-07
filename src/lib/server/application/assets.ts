import type { AssetStoragePort } from '$lib/server/ports/storage';
import { normalizeAssetPath } from './paths';

const MAX_ASSET_SIZE = 5 * 1024 * 1024;
const ALLOWED_ASSET_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'image/avif'
]);

export class AssetService {
	constructor(private readonly storage: AssetStoragePort) {}

	async upload(file: File): Promise<string> {
		if (file.size > MAX_ASSET_SIZE)
			throw Object.assign(new Error('File too large (max 5MB)'), { status: 400 });
		if (!ALLOWED_ASSET_TYPES.has(file.type)) {
			throw Object.assign(new Error('Unsupported image type'), { status: 400 });
		}
		const path = await this.storage.upload({
			name: file.name,
			contentType: file.type,
			data: new Uint8Array(await file.arrayBuffer())
		});
		return `/api/images/${encodeURIComponent(path)}`;
	}

	read(path: string) {
		return this.storage.read(normalizeAssetPath(path));
	}

	deleteUrl(url: string) {
		const value = new URL(url, 'http://localhost');
		if (!value.pathname.startsWith('/api/images/')) throw new Error('Invalid asset URL');
		return this.storage.delete(normalizeAssetPath(value.pathname.slice('/api/images/'.length)));
	}
}
