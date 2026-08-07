import { json } from '@sveltejs/kit';
import {
	InvalidStoragePathError,
	StorageAlreadyExistsError,
	StorageConflictError,
	StorageNotFoundError,
	StorageUnavailableError
} from '$lib/server/ports/errors';

export function storageErrorResponse(error: unknown, fallback: string): Response {
	if (error instanceof InvalidStoragePathError)
		return json({ error: error.message }, { status: 400 });
	if (error instanceof StorageNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof StorageAlreadyExistsError)
		return json({ error: error.message }, { status: 409 });
	if (error instanceof StorageConflictError) return json({ error: error.message }, { status: 412 });
	if (error instanceof StorageUnavailableError)
		return json({ error: error.message }, { status: 503 });
	return json({ error: error instanceof Error ? error.message : fallback }, { status: 500 });
}
