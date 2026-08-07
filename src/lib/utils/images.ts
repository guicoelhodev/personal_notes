export const LOCAL_IMAGE_URL_PREFIX = 'indexeddb://images/';

const MANAGED_IMAGE_URL_PATTERN =
	/(?:indexeddb:\/\/images\/[a-f0-9-]+|\/api\/images\/[a-zA-Z0-9_.%-]+)/g;

export function extractManagedImageUrls(content: string): string[] {
	return [...new Set(content.match(MANAGED_IMAGE_URL_PATTERN) ?? [])];
}

export function removedManagedImageUrls(originalContent: string, currentContent: string): string[] {
	const current = new Set(extractManagedImageUrls(currentContent));
	return extractManagedImageUrls(originalContent).filter((url) => !current.has(url));
}

export function localImageId(url: string): string | null {
	if (!url.startsWith(LOCAL_IMAGE_URL_PREFIX)) return null;
	const id = url.slice(LOCAL_IMAGE_URL_PREFIX.length);
	return /^[a-f0-9-]+$/.test(id) ? id : null;
}
