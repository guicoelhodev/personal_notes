import type { SearchItem } from '../types';
import Fuse, { type FuseResult } from 'fuse.js';

class SearchState {
	isOpen = $state(false);
	query = $state('');
	results = $state<FuseResult<SearchItem>[]>([]);
	activeIndex = $state(-1);
	allItems = $state<SearchItem[]>([]);
	private fuse: Fuse<SearchItem> | null = null;

	async loadItems() {
		try {
			const res = await fetch('/api/docs');
			if (!res.ok) return;
			const entries: { path: string; type: string }[] = await res.json();
			const blobs = entries.filter((e) => e.type === 'blob');
			this.allItems = blobs.map((e) => ({
				id: e.path.replace(/\.md$/, ''),
				title: e.path
					.split('/')
					.pop()!
					.replace(/[-_]/g, ' ')
					.replace(/\b\w/g, (c) => c.toUpperCase())
					.replace(/\.(md|mdx)$/, ''),
			}));
			this.fuse = new Fuse(this.allItems, {
				keys: ['title'],
				threshold: 0.2,
				includeMatches: true,
				ignoreLocation: true,
				isCaseSensitive: false,
			});
		} catch {
			// silently fail
		}
	}

	search(query: string) {
		this.query = query;
		if (!query.trim() || !this.fuse) {
			this.results = [];
			this.activeIndex = -1;
			return;
		}
		this.results = this.fuse.search(query.trim());
		this.activeIndex = -1;
	}

	open() {
		this.isOpen = true;
		this.query = '';
		this.results = [];
		this.activeIndex = -1;
	}

	close() {
		this.isOpen = false;
	}

	toggle() {
		if (this.isOpen) this.close();
		else this.open();
	}

	navigate(direction: 'up' | 'down', total: number) {
		if (direction === 'down') {
			this.activeIndex = Math.min(this.activeIndex + 1, total - 1);
		} else {
			this.activeIndex = Math.max(this.activeIndex - 1, 0);
		}
	}
}

export const searchState = new SearchState();
