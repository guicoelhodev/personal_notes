import {
	StorageAlreadyExistsError,
	StorageConflictError,
	StorageNotFoundError,
	StorageUnavailableError
} from '$lib/server/ports/errors';

export function mapS3Error(error: unknown, message: string): never {
	const value = error as {
		name?: string;
		code?: string;
		Code?: string;
		$fault?: string;
		$retryable?: unknown;
		$metadata?: {
			httpStatusCode?: number;
			requestId?: string;
			extendedRequestId?: string;
			cfId?: string;
			attempts?: number;
			totalRetryDelay?: number;
		};
		message?: string;
	};
	const status = value.$metadata?.httpStatusCode;
	console.error('S3 request failed', {
		operation: message,
		name: value.name,
		code: value.code || value.Code,
		status,
		message: value.message,
		requestId: value.$metadata?.requestId,
		extendedRequestId: value.$metadata?.extendedRequestId,
		cfId: value.$metadata?.cfId,
		attempts: value.$metadata?.attempts,
		totalRetryDelay: value.$metadata?.totalRetryDelay,
		fault: value.$fault,
		retryable: value.$retryable
	});

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
