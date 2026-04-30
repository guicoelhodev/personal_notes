<script lang="ts">
	import { onMount } from 'svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import SidebarNode from './SidebarNode.svelte';
	import FileActions from './FileActions.svelte';
	import Settings from './Settings.svelte';
	import type { TreeNode } from '$lib/types';

	let homeNode: TreeNode = $derived({ label: '', children: sidebarState.tree });

	interface FileActionsInstance {
		isCreating: boolean;
		inputValue: string;
		registerInput: (el: HTMLInputElement) => { update(): void; destroy(): void };
		setInput: (v: string) => void;
		confirmCreate: () => void;
		handleKeydown: (e: KeyboardEvent) => void;
	}

	let homeActions = $state<FileActionsInstance>();

	onMount(() => {
		sidebarState.loadTree();
	});
</script>

<nav class="flex h-full flex-col p-4">
	<div class="flex-1 overflow-y-auto">
		<a href="/" class="mb-4 block text-lg font-bold text-(--color-heading)">Personal Notes</a>

		{#if sidebarState.isLoading}
			<p class="text-sm text-(--color-muted)">Loading...</p>
		{:else}
			<ul class="space-y-1">
				<li>
					<div>
						<div
							class="group flex justify-between items-center rounded py-1 transition-colors hover:bg-(--color-surface)"
						>
							<a
								href="/"
								class:list={[
									'block min-w-0 flex-1 text-sm py-1 px-2 rounded transition-colors font-medium text-(--color-text)',
									sidebarState.activeSlug === 'home' && 'bg-(--color-heading)/20',
									sidebarState.activeSlug !== 'home' && 'hover:bg-(--color-surface)'
								]}
							>
								Home
							</a>
							<FileActions
								bind:this={homeActions}
								node={homeNode}
								folderPath=""
								actions={['createFolder', 'createFile']}
								onFolderToggle={() => {}}
								alwaysVisible={true}
							/>
						</div>
						<ul class="space-y-1">
							{#if homeActions?.isCreating}
								{@const fa = homeActions}
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
							{#each sidebarState.tree as node (node.label)}
								<SidebarNode {node} />
							{/each}
						</ul>
					</div>
				</li>
			</ul>
		{/if}
	</div>
	<Settings />
</nav>
