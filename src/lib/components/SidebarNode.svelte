<script lang="ts">
	import type { TreeNode } from '$lib/types';
	import Folder from '$lib/icons/Folder.svelte';
	import FileActions from './FileActions.svelte';
	import SidebarNode from './SidebarNode.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { goto } from '$app/navigation';
	import { shareState } from '$lib/stores/share.svelte';

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
		goto(shareState.fileUrl(`${slug}.md`));
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
			<div class="group flex min-h-7 items-center rounded-md px-1 hover:bg-(--color-base)/45">
				<button
					class="folder-label flex min-w-0 flex-1 cursor-pointer items-center py-1"
					aria-expanded={isOpen}
					onclick={toggleFolder}
				>
					<Folder class="mr-2 h-[18px] w-[18px] shrink-0" />
					<span class="truncate">{formatLabel(node.label)}</span>
				</button>
				{#if !shareState.isActive}
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
				{/if}
			</div>
			{#if isOpen}
				<ul class="ml-3" data-folder-path={folderPath}>
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
		<div class="group flex min-h-7 items-center justify-between rounded-md px-1 hover:bg-(--color-base)/45">
			<a
				href={shareState.fileUrl(`${node.slug}.md`)}
				class="file-label block min-w-0 flex-1 truncate rounded-md px-1 py-1 {sidebarState.activeSlug ===
					node.slug
					? 'active'
					: ''}"
				onclick={(e) => {
					e.preventDefault();
					selectFile(node.slug || '');
				}}
			>
				{formatLabel(node.label)}
			</a>
			{#if !shareState.isActive}
			<FileActions
				{node}
				folderPath={node.slug || ''}
				actions={['rename', 'delete']}
				onFolderToggle={() => {}}
			/>
			{/if}
		</div>
	{/if}
</li>

<style>
	.folder-label {
		color: var(--color-heading);
		font-size: 14px;
		font-weight: 400;
		line-height: 20px;
		letter-spacing: -0.01em;
	}

	.file-label {
		color: var(--color-file);
		font-size: 14px;
		font-weight: 400;
		line-height: 20px;
		letter-spacing: -0.01em;
	}

	.file-label.active {
		font-weight: 700;
	}
</style>
