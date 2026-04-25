import type { TreeNode } from '$lib/types';
import { buildTree } from '$lib/utils/tree';
import { env } from '$env/dynamic/public';

const HOME_ID = 'home';

interface TreeEntry {
	path: string;
	type: string;
	sha: string;
}

class SidebarState {
	isOpen = $state(false);
	tree = $state<TreeNode[]>([]);
	activeSlug = $state('');
	isLoading = $state(true);

	async loadTree() {
		this.isLoading = true;
		try {
			const apiBase = env.PUBLIC_READ_ONLY === 'true' ? '/api/local-docs' : '/api/docs';
			const res = await fetch(apiBase);
			if (!res.ok) throw new Error('Failed to load docs tree');
			const entries: TreeEntry[] = await res.json();

			const ids = entries
				.filter((e) => e.type === 'blob')
				.map((e) => e.path.replace(/\.md$/, ''))
				.filter((id) => id !== HOME_ID)
				.sort();

			this.tree = buildTree(ids);
		} catch (err: any) {
			this.tree = [];
		} finally {
			this.isLoading = false;
		}
	}

	openFile(slug: string) {
		this.activeSlug = slug;
		this.isOpen = false;
	}

	toggle() {
		this.isOpen = !this.isOpen;
	}
}

export const sidebarState = new SidebarState();
