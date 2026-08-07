import type { TreeEntry } from '$lib/types';

export interface WorkspaceDocument {
	path: string;
	content: string;
	version: string;
}

export interface SaveDocumentInput {
	path: string;
	content: string;
	version?: string;
	create: boolean;
}

export interface RenameDocumentInput {
	path: string;
	newName: string;
	isFolder: boolean;
}

export interface DeleteDocumentInput {
	path: string;
	isFolder: boolean;
}

export interface DocumentWorkspacePort {
	list(): Promise<TreeEntry[]>;
	read(path: string): Promise<WorkspaceDocument>;
	save(input: SaveDocumentInput): Promise<{ version: string }>;
	rename(input: RenameDocumentInput): Promise<{ newPath: string }>;
	delete(input: DeleteDocumentInput): Promise<void>;
	uploadImage(file: File): Promise<string>;
	readImage(url: string): Promise<Blob | null>;
	deleteImages(urls: string[]): Promise<void>;
	consumeInitialDocument(): Promise<string | null>;
}
