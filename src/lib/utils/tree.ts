import type { TreeNode, SearchItem } from '../types';

/**
 * Builds a tree structure from an array of slash-separated paths.
 * Only leaf nodes (files) receive a `slug`.
 */
export function buildTree(paths: string[]): TreeNode[] {
	const root: TreeNode[] = [];

	for (const path of paths) {
		const parts = path.split('/');
		let current = root;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			let node = current.find((n) => n.label === part);

			if (!node) {
				const isFile = i === parts.length - 1;
				node = {
					label: part,
					slug: isFile ? path : undefined,
					children: [],
				};
				current.push(node);
			}

			current = node.children;
		}
	}

	sortNodes(root);
	return root;
}

function sortNodes(nodes: TreeNode[]): void {
	for (const node of nodes) {
		if (node.children.length > 0) {
			sortNodes(node.children);
		}
	}
	nodes.sort((a, b) => {
		const aIsFolder = a.isFolder || a.children.length > 0;
		const bIsFolder = b.isFolder || b.children.length > 0;
		if (aIsFolder && !bIsFolder) return -1;
		if (!aIsFolder && bIsFolder) return 1;
		return a.label.localeCompare(b.label);
	});
}

/**
 * Formats a raw label into a human-readable title.
 * Converts dashes/underscores to spaces, title-cases words,
 * and strips markdown extensions.
 */
export function formatLabel(label: string): string {
	return label
		.replace(/[-_]/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase())
		.replace(/\.(md|mdx)$/, '');
}

/**
 * Recursively extracts all leaf nodes from a tree into a flat
 * array of { id, title } suitable for search indexing.
 */
export function flattenTree(nodes: TreeNode[]): SearchItem[] {
	const items: SearchItem[] = [];

	for (const node of nodes) {
		if (node.slug) {
			items.push({ id: node.slug, title: formatLabel(node.label) });
		}
		if (node.children.length > 0) {
			items.push(...flattenTree(node.children));
		}
	}

	return items;
}

export function extractImageUrls(originalData: string, newData: string): { original: string[]; new: string[]; removed: string[] } {
	const regex = /https:\/\/raw\.githubusercontent\.com\/[^\s\)]+/g;

	const originalUrls = (originalData.match(regex) || []);
	const newUrls = (newData.match(regex) || []);

	const removed = originalUrls.filter((url) => !newUrls.includes(url));

	return { original: originalUrls, new: newUrls, removed };
}
