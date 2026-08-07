import {
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	type S3Client
} from '@aws-sdk/client-s3';
import type { DocumentEntry, DocumentStoragePort, StoredDocument } from '$lib/server/ports/storage';
import { StorageAlreadyExistsError, StorageConflictError } from '$lib/server/ports/errors';
import { mapS3Error } from './errors';

export class S3DocumentStorageAdapter implements DocumentStoragePort {
	private static readonly RENAME_LOCK_TIMEOUT = 15 * 60 * 1000;

	constructor(
		private readonly client: S3Client,
		private readonly bucket: string,
		private readonly prefix = 'docs/'
	) {}

	async list(): Promise<DocumentEntry[]> {
		const entries: DocumentEntry[] = [];
		let continuationToken: string | undefined;

		do {
			try {
				const response = await this.client.send(
					new ListObjectsV2Command({
						Bucket: this.bucket,
						Prefix: this.prefix,
						ContinuationToken: continuationToken
					})
				);

				for (const object of response.Contents ?? []) {
					if (!object.Key || !object.Key.endsWith('.md')) continue;
					entries.push({
						path: object.Key.slice(this.prefix.length),
						version: object.ETag ?? ''
					});
				}
				continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
			} catch (error) {
				mapS3Error(error, 'Failed to list documents');
			}
		} while (continuationToken);

		return entries;
	}

	async read(path: string): Promise<StoredDocument> {
		try {
			const response = await this.client.send(
				new GetObjectCommand({ Bucket: this.bucket, Key: this.key(path) })
			);
			const content = (await response.Body?.transformToString()) ?? '';
			if (response.Metadata?.operation === 'rename') {
				const startedAt = Number(response.Metadata.startedat || 0);
				if (
					response.ETag &&
					Date.now() - startedAt > S3DocumentStorageAdapter.RENAME_LOCK_TIMEOUT
				) {
					await this.restore(path, this.removeRenameLock(content), response.ETag);
					return this.read(path);
				}
				throw new StorageConflictError(`Document is being renamed: ${path}`);
			}
			return {
				path,
				content,
				version: response.ETag ?? ''
			};
		} catch (error) {
			if (error instanceof StorageConflictError) throw error;
			mapS3Error(error, `Document not found: ${path}`);
		}
	}

	async create(path: string, content: string): Promise<StoredDocument> {
		await this.assertNoFolderCollision(path);
		try {
			const response = await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.key(path),
					Body: content,
					ContentType: 'text/markdown; charset=utf-8',
					IfNoneMatch: '*'
				})
			);
			return { path, content, version: response.ETag ?? '' };
		} catch (error) {
			const value = error as { $metadata?: { httpStatusCode?: number }; name?: string };
			if (value.$metadata?.httpStatusCode === 412 || value.name === 'PreconditionFailed') {
				throw new StorageAlreadyExistsError(`Document already exists: ${path}`);
			}
			mapS3Error(error, `Failed to create document: ${path}`);
		}
	}

	async update(path: string, content: string, expectedVersion?: string): Promise<StoredDocument> {
		if (!expectedVersion) throw new StorageConflictError('Document version is required');
		try {
			const response = await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.key(path),
					Body: content,
					ContentType: 'text/markdown; charset=utf-8',
					IfMatch: expectedVersion
				})
			);
			return { path, content, version: response.ETag ?? '' };
		} catch (error) {
			mapS3Error(error, `Failed to update document: ${path}`);
		}
	}

	async delete(path: string): Promise<void> {
		try {
			await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key(path) }));
		} catch (error) {
			mapS3Error(error, `Failed to delete document: ${path}`);
		}
	}

	async deleteFolder(path: string): Promise<void> {
		const objects = await this.listPrefix(path + '/');
		for (let index = 0; index < objects.length; index += 1000) {
			try {
				const response = await this.client.send(
					new DeleteObjectsCommand({
						Bucket: this.bucket,
						Delete: {
							Objects: objects.slice(index, index + 1000).map(({ key: Key }) => ({ Key }))
						}
					})
				);
				if (response.Errors?.length) throw new Error('Some documents could not be deleted');
			} catch (error) {
				mapS3Error(error, `Failed to delete folder: ${path}`);
			}
		}
	}

	async rename(source: string, destination: string): Promise<void> {
		const document = await this.read(source);
		const claimedVersion = await this.claim(source, document);
		let destinationDocument: StoredDocument;
		try {
			destinationDocument = await this.create(destination, document.content);
		} catch (error) {
			await this.restore(source, document.content, claimedVersion);
			throw error;
		}
		try {
			await this.delete(source);
		} catch (error) {
			try {
				await this.restore(source, document.content, claimedVersion);
				await this.removeCreated([destinationDocument]);
			} catch {
				// An ambiguous delete may mean the rename completed; keep the destination as the safe copy.
			}
			throw error;
		}
	}

	async renameFolder(source: string, destination: string): Promise<void> {
		const sourceObjects = await this.listPrefix(source + '/');
		const destinationObjects = await this.listPrefix(destination + '/');
		if (destinationObjects.length > 0 || (await this.exists(destination + '.md'))) {
			throw new StorageAlreadyExistsError(`Folder already exists: ${destination}`);
		}

		const claimed: Array<{ path: string; content: string; claimedVersion: string }> = [];
		try {
			for (const sourceObject of sourceObjects) {
				const sourcePath = sourceObject.key.slice(this.prefix.length);
				const document = await this.read(sourcePath);
				claimed.push({
					path: sourcePath,
					content: document.content,
					claimedVersion: await this.claim(sourcePath, document)
				});
			}
		} catch (error) {
			await this.restoreAll(claimed);
			throw error;
		}

		const created: StoredDocument[] = [];
		try {
			for (const sourceDocument of claimed) {
				const destinationPath = destination + sourceDocument.path.slice(source.length);
				created.push(await this.create(destinationPath, sourceDocument.content));
			}
		} catch (error) {
			await Promise.allSettled([this.restoreAll(claimed), this.removeCreated(created)]);
			throw error;
		}

		for (let index = 0; index < claimed.length; index += 1) {
			try {
				await this.delete(claimed[index].path);
			} catch (error) {
				await this.restoreAll(claimed.slice(index));
				throw error;
			}
		}
	}

	private key(path: string): string {
		return this.prefix + path;
	}

	private async exists(path: string): Promise<boolean> {
		try {
			await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.key(path) }));
			return true;
		} catch (error) {
			const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
				?.httpStatusCode;
			if (status === 404) return false;
			mapS3Error(error, `Failed to check document: ${path}`);
		}
	}

	private async assertNoFolderCollision(path: string): Promise<void> {
		if (!path.endsWith('.md')) return;
		const pathWithoutExtension = path.slice(0, -3);
		const folderPath = pathWithoutExtension + '/';
		if ((await this.listPrefix(folderPath)).length > 0) {
			throw new StorageAlreadyExistsError(`Folder already exists: ${pathWithoutExtension}`);
		}
		const segments = pathWithoutExtension.split('/');
		for (let index = 1; index < segments.length; index += 1) {
			const ancestor = segments.slice(0, index).join('/') + '.md';
			if (await this.exists(ancestor)) {
				throw new StorageAlreadyExistsError(`Document blocks folder: ${ancestor}`);
			}
		}
	}

	private async claim(path: string, document: StoredDocument): Promise<string> {
		try {
			const lockContent = `${document.content}\n<!-- rename-lock:${crypto.randomUUID()} -->`;
			const response = await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.key(path),
					Body: lockContent,
					ContentType: 'text/markdown; charset=utf-8',
					Metadata: { operation: 'rename', startedat: String(Date.now()) },
					IfMatch: document.version
				})
			);
			return response.ETag ?? '';
		} catch (error) {
			mapS3Error(error, `Document changed during rename: ${path}`);
		}
	}

	private async restore(path: string, content: string, claimedVersion: string): Promise<void> {
		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: this.key(path),
					Body: content,
					ContentType: 'text/markdown; charset=utf-8',
					IfMatch: claimedVersion
				})
			);
		} catch (error) {
			mapS3Error(error, `Failed to restore document after rename: ${path}`);
		}
	}

	private async restoreAll(
		documents: Array<{ path: string; content: string; claimedVersion: string }>
	): Promise<void> {
		let firstError: unknown;
		for (const document of documents) {
			try {
				await this.restore(document.path, document.content, document.claimedVersion);
			} catch (error) {
				firstError ??= error;
			}
		}
		if (firstError) throw firstError;
	}

	private async removeCreated(documents: StoredDocument[]): Promise<void> {
		for (const document of documents) {
			try {
				await this.claim(document.path, document);
				await this.delete(document.path);
			} catch {
				// Never delete a destination that another request changed after it was created.
			}
		}
	}

	private removeRenameLock(content: string): string {
		return content.replace(/\n<!-- rename-lock:[a-f0-9-]+ -->$/, '');
	}

	private async listPrefix(path: string): Promise<Array<{ key: string; version: string }>> {
		const objects: Array<{ key: string; version: string }> = [];
		let continuationToken: string | undefined;
		do {
			try {
				const response = await this.client.send(
					new ListObjectsV2Command({
						Bucket: this.bucket,
						Prefix: this.key(path),
						ContinuationToken: continuationToken
					})
				);
				objects.push(
					...(response.Contents ?? []).flatMap((object) =>
						object.Key ? [{ key: object.Key, version: object.ETag ?? '' }] : []
					)
				);
				continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
			} catch (error) {
				mapS3Error(error, `Failed to list folder: ${path}`);
			}
		} while (continuationToken);
		return objects;
	}
}
