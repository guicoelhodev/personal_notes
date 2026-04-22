export interface TreeEntry {
	path: string;
	type: string;
	sha: string;
}

export interface TreeNode {
	label: string;
	slug?: string;
	children: TreeNode[];
}

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
