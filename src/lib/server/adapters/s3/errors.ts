import {
	StorageAlreadyExistsError,
	StorageConflictError,
	StorageNotFoundError,
	StorageUnavailableError
} from '$lib/server/ports/errors';

export function mapS3Error(error: unknown, message: string): never {
	const value = error as {
		name?: string;
		$metadata?: { httpStatusCode?: number };
		message?: string;
	};
	const status = value.$metadata?.httpStatusCode;

	if (status === 404 || value.name === 'NoSuchKey' || value.name === 'NotFound') {
		throw new StorageNotFoundError(message);
	}
	if (status === 412 || value.name === 'PreconditionFailed') {
		throw new StorageConflictError(message);
	}
	if (status === 409 || value.name === 'Conflict') {
		throw new StorageAlreadyExistsError(message);
	}

	throw new StorageUnavailableError(value.message || message);
}
