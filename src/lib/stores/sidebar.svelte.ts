import type { TreeNode } from '$lib/types';
import { buildTree } from '$lib/utils/tree';
import { currentWorkspace } from '$lib/client/workspace';

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
			const entries: TreeEntry[] = await (await currentWorkspace()).list();

			const ids = entries
				.filter((e) => e.type === 'blob')
				.map((e) => e.path.replace(/\.md$/, ''))
				.filter((id) => id !== HOME_ID)
				.sort();

			this.tree = buildTree(ids);
		} catch {
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
