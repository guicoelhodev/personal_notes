<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import Save from '$lib/icons/Save.svelte';
	import CopyContext from '$lib/icons/CopyContext.svelte';
	import Spinner from '$lib/icons/Spinner.svelte';

	let isCopied = $state(false);

	async function handleSave() {
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

<div class="sticky bottom-0 flex w-full items-center justify-between bg-transparent px-4 py-3">
	<h1
		class="truncate rounded-md bg-(--color-muted)/10 px-3 py-1.5 text-sm font-medium text-(--color-text)"
	>
		{editorState.path || 'No file selected'}
	</h1>

	<div class="flex items-center gap-2">
		<button
			type="button"
			aria-label="Copy context"
			class="flex cursor-pointer items-center gap-2 rounded-lg bg-(--color-surface) p-2 text-(--color-muted) transition-opacity hover:opacity-80 sm:min-w-[120px]"
			onclick={handleCopyContext}
		>
			<CopyContext class="h-4 w-4" />
			{#if isCopied}
				<span class="hidden text-sm text-(--color-heading) sm:inline">Copied to clipboard!</span>
			{:else}
				<span class="hidden text-sm sm:inline">Copy context</span>
			{/if}
		</button>

		<button
			type="button"
			aria-label="Save"
			class="flex cursor-pointer items-center gap-2 rounded-lg bg-(--color-surface) p-2 text-(--color-muted) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={editorState.isSaving}
			onclick={handleSave}
		>
			{#if editorState.isSaving}
				<Spinner class="h-4 w-4 animate-spin" />
			{:else}
				<Save class="h-4 w-4" />
			{/if}
			<kbd class="hidden rounded border border-(--color-muted)/40 px-1.5 py-0.5 text-xs sm:inline"
				>Ctrl+S</kbd
			>
		</button>
	</div>
</div>
