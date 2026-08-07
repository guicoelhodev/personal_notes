import type { DocumentStoragePort } from '$lib/server/ports/storage';
import { normalizeDocumentFilePath, normalizeDocumentPath } from './paths';

export class DocumentService {
	constructor(private readonly storage: DocumentStoragePort) {}

	list() {
		return this.storage.list();
	}

	read(path: string) {
		return this.storage.read(normalizeDocumentFilePath(path));
	}

	async readAll() {
		const entries = await this.storage.list();
		return Promise.all(entries.map((entry) => this.storage.read(entry.path)));
	}

	async readFolder(path: string) {
		const prefix = normalizeDocumentPath(path) + '/';
		return (await this.readAll()).filter((document) => document.path.startsWith(prefix));
	}

	create(path: string, content: string) {
		return this.storage.create(normalizeDocumentFilePath(path), content);
	}

	update(path: string, content: string, expectedVersion?: string) {
		return this.storage.update(normalizeDocumentFilePath(path), content, expectedVersion);
	}

	delete(path: string) {
		return this.storage.delete(normalizeDocumentFilePath(path));
	}

	deleteFolder(path: string) {
		return this.storage.deleteFolder(normalizeDocumentPath(path));
	}

	rename(source: string, destination: string) {
		return this.storage.rename(
			normalizeDocumentFilePath(source),
			normalizeDocumentFilePath(destination)
		);
	}

	renameFolder(source: string, destination: string) {
		return this.storage.renameFolder(
			normalizeDocumentPath(source),
			normalizeDocumentPath(destination)
		);
	}
}
