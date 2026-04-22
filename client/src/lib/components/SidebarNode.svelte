<script lang="ts">
	import type { TreeNode } from '$lib/types';
	import ChevronDown from '$lib/icons/ChevronDown.svelte';
	import FileActions from './FileActions.svelte';
	import SidebarNode from './SidebarNode.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { goto } from '$app/navigation';

	let { node, depth = 0, parentPath = '' }: { node: TreeNode; depth?: number; parentPath?: string } = $props();

	function formatLabel(label: string): string {
		return label
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase())
			.replace(/\.(md|mdx)$/, '');
	}

	function hasActiveChild(n: TreeNode): boolean {
		if (n.slug === sidebarState.activeSlug) return true;
		return n.children.some((c) => hasActiveChild(c));
	}

	let manuallyToggled = $state(false);
	let manuallyClosed = $state(false);
	let isCreating = $state(false);
	let creatingType = $state<'file' | 'folder'>('file');
	let inputValue = $state('');
	let inputRef: HTMLInputElement | undefined = $state();

	let isOpen = $derived(
		manuallyClosed
			? false
			: manuallyToggled || depth === 0 || hasActiveChild(node) || isCreating
	);

	function toggleFolder() {
		if (isOpen) {
			manuallyToggled = false;
			manuallyClosed = true;
		} else {
			manuallyClosed = false;
			manuallyToggled = true;
		}
	}

	function selectFile(slug: string) {
		sidebarState.openFile(slug);
		sidebarState.isOpen = false;
		goto(`/file?path=${encodeURIComponent(slug)}.md`);
	}

	function startCreate(type: 'file' | 'folder') {
		manuallyClosed = false;
		isCreating = true;
		creatingType = type;
		inputValue = type === 'file' ? 'New File' : 'New Folder';
	}

	function confirmCreate() {
		const value = inputValue.trim();
		if (!value || value === 'New File' || value === 'New Folder') {
			isCreating = false;
			return;
		}

		if (creatingType === 'file') {
			const filePath = folderPath + '/' + value + '.md';
			const formattedName = value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			editorState.path = filePath;
			editorState.mode = 'create';
			editorState.setContent('# ' + formattedName + '\n\n<br />\n\n');
			editorState.setOriginalContent('');
			goto(`/file?path=${encodeURIComponent(filePath)}&mode=create`);
		} else if (creatingType === 'folder') {
			const newFolder: TreeNode = {
				label: value,
				children: [],
				isFolder: true
			};
			node.children.push(newFolder);
			node.children.sort((a, b) => {
				if (a.isFolder && !b.isFolder) return -1;
				if (!a.isFolder && b.isFolder) return 1;
				return a.label.localeCompare(b.label);
			});
			manuallyToggled = true;
		}

		isCreating = false;
	}

	function handleInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			confirmCreate();
		} else if (e.key === 'Escape') {
			isCreating = false;
		} else if ([',', '.'].includes(e.key)) {
			e.preventDefault();
		}
	}

	$effect(() => {
		if (isCreating && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	let folderPath = $derived(parentPath ? parentPath + '/' + node.label : node.label);

	$effect(() => {
		if (sidebarState.activeSlug && hasActiveChild(node)) {
			manuallyClosed = false;
		}
	});
</script>

<li>
	{#if node.children.length > 0 || node.isFolder}
		<div>
			<div class="flex items-center py-1 rounded hover:bg-(--color-surface) transition-colors group">
				<button
					class="flex items-center gap-2 flex-1 min-w-0 text-sm font-semibold text-(--color-heading) cursor-pointer"
					aria-expanded={isOpen}
					onclick={toggleFolder}
				>
					<span
						class="arrow w-3 h-3 transition-transform shrink-0 inline-block"
						style={isOpen ? '' : 'transform: rotate(-90deg)'}
					>
						<ChevronDown />
					</span>
					<span class="truncate">{formatLabel(node.label)}</span>
				</button>
				<FileActions {folderPath} onCreate={startCreate} />
			</div>
			{#if isOpen}
				<ul class="space-y-1 ml-3 mt-1" data-folder-path={folderPath}>
					{#if isCreating}
						<li>
							<input
								bind:this={inputRef}
								type="text"
								bind:value={inputValue}
								class="w-full text-sm py-1 px-2 rounded border border-(--color-heading) bg-transparent text-(--color-text) outline-none"
								onblur={confirmCreate}
								onkeydown={handleInputKeydown}
							/>
						</li>
					{/if}
					{#each node.children as child (child.label + child.slug)}
						<SidebarNode node={child} depth={depth + 1} parentPath={folderPath} />
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<a
			href="/file?path={node.slug}.md"
			class:list={[
				'block text-sm py-1 px-2 rounded transition-colors text-(--color-text)',
				sidebarState.activeSlug === node.slug && 'bg-(--color-heading)/20 font-medium',
				sidebarState.activeSlug !== node.slug && 'hover:bg-(--color-surface)'
			]}
			onclick={(e) => {
				e.preventDefault();
				selectFile(node.slug || '');
			}}
		>
			{formatLabel(node.label)}
		</a>
	{/if}
</li>
