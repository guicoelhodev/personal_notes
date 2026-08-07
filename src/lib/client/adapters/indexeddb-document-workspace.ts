import type {
	DeleteDocumentInput,
	DocumentWorkspacePort,
	RenameDocumentInput,
	SaveDocumentInput,
	WorkspaceDocument
} from '$lib/client/ports/document-workspace';
import { GETTING_STARTED_CONTENT, GETTING_STARTED_PATH } from '$lib/client/getting-started';
import type { TreeEntry } from '$lib/types';
import {
	extractManagedImageUrls,
	LOCAL_IMAGE_URL_PREFIX,
	localImageId
} from '$lib/utils/images';

interface LocalDocument extends WorkspaceDocument {
	updatedAt: number;
}

interface LocalImage {
	id: string;
	data: Blob;
	createdAt: number;
}

interface LocalMetadata {
	key: string;
	value: string;
}

const DATABASE_NAME = 'personal-notes-guest';
const DATABASE_VERSION = 3;
const INITIAL_DOCUMENT_KEY = 'initial-document';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'image/avif'
]);

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
		request.onupgradeneeded = (event) => {
			const database = request.result;
			let documents: IDBObjectStore;
			if (!database.objectStoreNames.contains('documents')) {
				documents = database.createObjectStore('documents', { keyPath: 'path' });
			} else {
				documents = request.transaction!.objectStore('documents');
			}
			if (!database.objectStoreNames.contains('images')) {
				database.createObjectStore('images', { keyPath: 'id' });
			}
			let metadata: IDBObjectStore;
			if (!database.objectStoreNames.contains('metadata')) {
				metadata = database.createObjectStore('metadata', { keyPath: 'key' });
			} else {
				metadata = request.transaction!.objectStore('metadata');
			}
			if (event.oldVersion === 0) {
				documents.put({
					path: GETTING_STARTED_PATH,
					content: GETTING_STARTED_CONTENT,
					version: `local-${Date.now()}`,
					updatedAt: Date.now()
				} satisfies LocalDocument);
				metadata.put({
					key: INITIAL_DOCUMENT_KEY,
					value: GETTING_STARTED_PATH
				} satisfies LocalMetadata);
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
		const documents = await this.getAllDocuments();
		const removedDocuments = input.isFolder
			? documents.filter((document) => document.path.startsWith(input.path + '/'))
			: documents.filter((document) => document.path === input.path + '.md');

		if (input.isFolder) {
			await this.removeLocalPrefix(input.path + '/');
		} else {
			const path = input.path + '.md';
			await this.removeLocalDocument(path);
		}

		await this.deleteImages(removedDocuments.flatMap((document) => extractManagedImageUrls(document.content)));
	}

	async uploadImage(file: File): Promise<string> {
		if (file.size > MAX_IMAGE_SIZE) throw new Error('File too large (max 5MB)');
		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			throw new Error('Unsupported image type. Use PNG, JPEG, GIF, WebP, or AVIF.');
		}

		const image: LocalImage = {
			id: crypto.randomUUID(),
			data: file,
			createdAt: Date.now()
		};
		const database = await openDatabase();
		const transaction = database.transaction('images', 'readwrite');
		transaction.objectStore('images').put(image);
		await transactionDone(transaction);
		database.close();
		return LOCAL_IMAGE_URL_PREFIX + image.id;
	}

	async readImage(url: string): Promise<Blob | null> {
		const id = localImageId(url);
		if (!id) return null;
		const database = await openDatabase();
		const transaction = database.transaction('images', 'readonly');
		const image = await requestResult<LocalImage | undefined>(
			transaction.objectStore('images').get(id)
		);
		database.close();
		return image?.data ?? null;
	}

	async deleteImages(urls: string[]): Promise<void> {
		const ids = urls.flatMap((url) => {
			const id = localImageId(url);
			return id ? [id] : [];
		});
		if (ids.length === 0) return;

		const referenced = new Set(
			(await this.getAllDocuments()).flatMap((document) =>
				extractManagedImageUrls(document.content).flatMap((url) => {
					const id = localImageId(url);
					return id ? [id] : [];
				})
			)
		);
		const deletable = ids.filter((id) => !referenced.has(id));
		if (deletable.length === 0) return;

		const database = await openDatabase();
		const transaction = database.transaction('images', 'readwrite');
		for (const id of deletable) transaction.objectStore('images').delete(id);
		await transactionDone(transaction);
		database.close();
	}

	async consumeInitialDocument(): Promise<string | null> {
		const database = await openDatabase();
		const transaction = database.transaction('metadata', 'readwrite');
		const store = transaction.objectStore('metadata');
		const request = store.get(INITIAL_DOCUMENT_KEY) as IDBRequest<LocalMetadata | undefined>;
		const metadata = await new Promise<LocalMetadata | undefined>((resolve, reject) => {
			request.onsuccess = () => {
				if (request.result) store.delete(INITIAL_DOCUMENT_KEY);
				resolve(request.result);
			};
			request.onerror = () => reject(request.error);
		});
		await transactionDone(transaction);
		database.close();
		return metadata?.value ?? null;
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
