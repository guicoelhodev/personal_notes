export interface DocumentEntry {
	path: string;
	version: string;
}

export interface StoredDocument extends DocumentEntry {
	content: string;
}

export interface DocumentStoragePort {
	list(): Promise<DocumentEntry[]>;
	read(path: string): Promise<StoredDocument>;
	create(path: string, content: string): Promise<StoredDocument>;
	update(path: string, content: string, expectedVersion?: string): Promise<StoredDocument>;
	delete(path: string): Promise<void>;
	deleteFolder(path: string): Promise<void>;
	rename(source: string, destination: string): Promise<void>;
	renameFolder(source: string, destination: string): Promise<void>;
}

export interface AssetUpload {
	name: string;
	contentType: string;
	data: Uint8Array;
}

export interface StoredAsset {
	path: string;
	contentType: string;
	data: Uint8Array;
}

export interface AssetStoragePort {
	upload(asset: AssetUpload): Promise<string>;
	read(path: string): Promise<StoredAsset>;
	delete(path: string): Promise<void>;
}
