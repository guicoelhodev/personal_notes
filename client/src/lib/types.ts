export interface TreeEntry {
	path: string;
	type: string;
	sha: string;
}

export interface TreeNode {
	label: string;
	slug?: string;
	children: TreeNode[];
	isFolder?: boolean;
}

export type FileAction = 'add' | 'createFolder' | 'createFile' | 'delete' | 'rename';

export interface SearchItem {
	id: string;
	title: string;
}

export interface SaveRequest {
	path: string;
	content: string;
}

export interface SaveResponse {
	success: boolean;
	error?: string;
}
