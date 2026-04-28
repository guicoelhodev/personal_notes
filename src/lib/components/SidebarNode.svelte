<script lang="ts">
	import type { TreeNode } from '$lib/types';
	import ChevronDown from '$lib/icons/ChevronDown.svelte';
	import FileActions from './FileActions.svelte';
	import SidebarNode from './SidebarNode.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { goto } from '$app/navigation';

	let {
		node,
		depth = 0,
		parentPath = ''
	}: { node: TreeNode; depth?: number; parentPath?: string } = $props();

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

	interface FileActionsInstance {
		isCreating: boolean;
		inputValue: string;
		registerInput: (el: HTMLInputElement) => { update(): void; destroy(): void };
		setInput: (v: string) => void;
		confirmCreate: () => void;
		handleKeydown: (e: KeyboardEvent) => void;
	}

	let manuallyToggled = $state(false);
	let manuallyClosed = $state(false);
	let folderActions = $state<FileActionsInstance>();

	let isOpen = $derived(
		manuallyClosed
			? false
			: manuallyToggled || depth === 0 || hasActiveChild(node) || folderActions?.isCreating
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
			<div
				class="group flex items-center rounded py-1 transition-colors hover:bg-(--color-surface)"
			>
				<button
					class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm font-semibold text-(--color-heading)"
					aria-expanded={isOpen}
					onclick={toggleFolder}
				>
					<span
						class="arrow inline-block h-3 w-3 shrink-0 transition-transform"
						style={isOpen ? '' : 'transform: rotate(-90deg)'}
					>
						<ChevronDown />
					</span>
					<span class="truncate">{formatLabel(node.label)}</span>
				</button>
				<FileActions
					bind:this={folderActions}
					{node}
					{folderPath}
					actions={['add', 'createFolder', 'createFile', 'rename', 'delete']}
					onFolderToggle={() => {
						manuallyClosed = false;
						manuallyToggled = true;
					}}
				/>
			</div>
			{#if isOpen}
				<ul class="mt-1 ml-3 space-y-1" data-folder-path={folderPath}>
					{#if folderActions?.isCreating}
						{@const fa = folderActions}
						<li>
							<input
								type="text"
								use:fa.registerInput
								value={fa.inputValue}
								oninput={(e) => fa.setInput((e.target as HTMLInputElement).value)}
								class="w-full rounded border border-(--color-heading) bg-transparent px-2 py-1 text-sm text-(--color-text) outline-none"
								onblur={() => fa.confirmCreate()}
								onkeydown={(e) => fa.handleKeydown(e)}
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
		<div
			class="group flex items-center justify-between rounded py-1 transition-colors hover:bg-(--color-surface)"
		>
			<a
				href="/file?path={node.slug}.md"
				class:list={[
					'block min-w-0 flex-1 text-sm py-1 px-2 rounded transition-colors text-(--color-text)',
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
			<FileActions
				{node}
				folderPath={node.slug || ''}
				actions={['rename', 'delete']}
				onFolderToggle={() => {}}
			/>
		</div>
	{/if}
</li>
