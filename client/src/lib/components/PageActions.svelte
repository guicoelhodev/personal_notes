<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import Save from '$lib/icons/Save.svelte';
	import CopyContext from '$lib/icons/CopyContext.svelte';
	import Spinner from '$lib/icons/Spinner.svelte';
	import FeatureBlockedModal from './FeatureBlockedModal.svelte';
	import { env } from '$env/dynamic/public';

	let isCopied = $state(false);
	let showBlockedModal = $state(false);

	async function handleSave() {
		if (env.PUBLIC_READ_ONLY === 'true') {
			showBlockedModal = true;
			return;
		}
		const saved = await editorState.save();
		if (saved) {
			await sidebarState.loadTree();
		}
	}

	async function handleCopyContext() {
		await navigator.clipboard.writeText(editorState.currentContent);
		isCopied = true;
		setTimeout(() => {
			isCopied = false;
		}, 1000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's') {
			e.preventDefault();
			handleSave();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="sticky bottom-0 flex items-center justify-between px-4 py-3 w-full bg-transparent">
	<h1 class="text-sm font-medium text-(--color-text) truncate px-3 py-1.5 rounded-md bg-(--color-muted)/10">
		{editorState.path || 'No file selected'}
	</h1>

	<div class="flex items-center gap-2">
		<button
			type="button"
			aria-label="Copy context"
			class="flex items-center gap-2 p-2 rounded-lg bg-(--color-surface) hover:opacity-80 transition-opacity cursor-pointer text-(--color-muted) min-w-[120px]"
			onclick={handleCopyContext}
		>
			<CopyContext class="w-4 h-4" />
			{#if isCopied}
				<span class="text-sm text-(--color-heading)">Copied to clipboard!</span>
			{:else}
				<span class="text-sm">Copy context</span>
			{/if}
		</button>

		<button
			type="button"
			aria-label="Save"
			class="flex items-center gap-2 p-2 rounded-lg bg-(--color-surface) hover:opacity-80 transition-opacity cursor-pointer text-(--color-muted) disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={editorState.isSaving}
			onclick={handleSave}
		>
			{#if editorState.isSaving}
				<Spinner class="w-4 h-4 animate-spin" />
			{:else}
				<Save class="w-4 h-4" />
			{/if}
			<kbd class="text-xs border border-(--color-muted)/40 rounded px-1.5 py-0.5 hidden sm:inline">Ctrl+S</kbd>
		</button>
	</div>
</div>

<FeatureBlockedModal bind:isOpen={showBlockedModal} onClose={() => showBlockedModal = false} />
