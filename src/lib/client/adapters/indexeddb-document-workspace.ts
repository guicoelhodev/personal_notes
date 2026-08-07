import type {
	DeleteDocumentInput,
	DocumentWorkspacePort,
	RenameDocumentInput,
	SaveDocumentInput,
	WorkspaceDocument
} from '$lib/client/ports/document-workspace';
import type { TreeEntry } from '$lib/types';

interface LocalDocument extends WorkspaceDocument {
	updatedAt: number;
}

const DATABASE_NAME = 'personal-notes-guest';
const DATABASE_VERSION = 1;

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error);
		transaction.onabort = () => reject(transaction.error);
	});
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains('documents')) {
				database.createObjectStore('documents', { keyPath: 'path' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export class IndexedDbDocumentWorkspaceAdapter implements DocumentWorkspacePort {
	async list(): Promise<TreeEntry[]> {
		return (await this.getAllDocuments()).map((document) => ({
			path: document.path,
			type: 'blob',
			sha: document.version
		}));
	}

	async read(path: string): Promise<WorkspaceDocument> {
		const local = await this.getDocument(path);
		if (local) return local;
		throw new Error('Document not found');
	}

	async save(input: SaveDocumentInput): Promise<{ version: string }> {
		if (input.create) {
			const entries = await this.list();
			const folderPrefix = input.path.endsWith('.md') ? input.path.slice(0, -3) + '/' : '';
			const pathWithoutExtension = input.path.endsWith('.md')
				? input.path.slice(0, -3)
				: input.path;
			const segments = pathWithoutExtension.split('/');
			const ancestorDocuments = segments
				.slice(0, -1)
				.map((_, index) => segments.slice(0, index + 1).join('/') + '.md');
			if (
				entries.some(
					(entry) =>
						entry.path === input.path ||
						(!!folderPrefix && entry.path.startsWith(folderPrefix)) ||
						ancestorDocuments.includes(entry.path)
				)
			) {
				throw new Error(`Document or folder already exists: ${input.path}`);
			}
		}
		const version = `local-${Date.now()}`;
		const database = await openDatabase();
		const transaction = database.transaction('documents', 'readwrite');
		transaction.objectStore('documents').put({
			path: input.path,
			content: input.content,
			version,
			updatedAt: Date.now()
		} satisfies LocalDocument);
		await transactionDone(transaction);
		database.close();
		return { version };
	}

	async rename(input: RenameDocumentInput): Promise<{ newPath: string }> {
		const normalizedName = input.newName.replaceAll(' ', '_');
		if (normalizedName.includes('/') || normalizedName.includes('\\')) {
			throw new Error('Name cannot contain path separators');
		}
		const parts = input.path.split('/');
		const parent = parts.slice(0, -1).join('/');
		const newPath = parent ? `${parent}/${normalizedName}` : normalizedName;
		const entries = await this.list();
		const destinationPath = input.isFolder ? newPath + '/' : newPath + '.md';
		if (
			entries.some((entry) =>
				input.isFolder
					? entry.path.startsWith(destinationPath) || entry.path === newPath + '.md'
					: entry.path === destinationPath || entry.path.startsWith(newPath + '/')
			)
		) {
			throw new Error(`${input.isFolder ? 'Folder' : 'Document'} already exists: ${newPath}`);
		}

		if (input.isFolder) {
			const folderEntries = entries.filter(
				(entry) => entry.type === 'blob' && entry.path.startsWith(input.path + '/')
			);
			for (const entry of folderEntries) {
				const document = await this.read(entry.path);
				await this.save({
					path: newPath + entry.path.slice(input.path.length),
					content: document.content,
					create: true
				});
			}
			await this.removeLocalPrefix(input.path + '/');
		} else {
			const sourcePath = input.path + '.md';
			const destinationPath = newPath + '.md';
			const document = await this.read(sourcePath);
			await this.save({ path: destinationPath, content: document.content, create: true });
			await this.removeLocalDocument(sourcePath);
		}

		return { newPath };
	}

	async delete(input: DeleteDocumentInput): Promise<void> {
		if (input.isFolder) {
			await this.removeLocalPrefix(input.path + '/');
		} else {
			const path = input.path + '.md';
			await this.removeLocalDocument(path);
		}
	}

	async upload(file: File): Promise<string> {
		if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');
		if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'].includes(file.type)) {
			throw new Error('Unsupported image type');
		}
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(file);
		});
	}

	private async getDocument(path: string): Promise<LocalDocument | undefined> {
		const database = await openDatabase();
		const transaction = database.transaction('documents', 'readonly');
		const result = await requestResult<LocalDocument | undefined>(
			transaction.objectStore('documents').get(path)
		);
		database.close();
		return result;
	}

	private async getAllDocuments(): Promise<LocalDocument[]> {
		const database = await openDatabase();
		const transaction = database.transaction('documents', 'readonly');
		const result = await requestResult<LocalDocument[]>(
			transaction.objectStore('documents').getAll()
		);
		database.close();
		return result;
	}

	private async removeLocalDocument(path: string): Promise<void> {
		const database = await openDatabase();
		const transaction = database.transaction('documents', 'readwrite');
		transaction.objectStore('documents').delete(path);
		await transactionDone(transaction);
		database.close();
	}

	private async removeLocalPrefix(prefix: string): Promise<void> {
		const documents = (await this.getAllDocuments()).filter((document) =>
			document.path.startsWith(prefix)
		);
		if (documents.length === 0) return;
		const database = await openDatabase();
		const transaction = database.transaction('documents', 'readwrite');
		for (const document of documents) transaction.objectStore('documents').delete(document.path);
		await transactionDone(transaction);
		database.close();
	}
}
