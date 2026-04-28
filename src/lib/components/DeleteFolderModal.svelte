<script lang="ts">
	import Spinner from '$lib/icons/Spinner.svelte';

	let {
		isOpen,
		folderName,
		onDelete,
		onCancel
	}: {
		isOpen: boolean;
		folderName: string;
		onDelete: () => Promise<void>;
		onCancel: () => void;
	} = $props();

	let isLoading = $state(false);

	async function handleDelete() {
		isLoading = true;
		try {
			await onDelete();
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isLoading) {
			onCancel();
		}
	}

	function handleOverlayClick() {
		if (!isLoading) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={isOpen ? handleKeydown : undefined} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={handleOverlayClick}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="mx-4 w-full max-w-sm rounded-lg border border-(--color-muted)/30 bg-(--color-surface) p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<h3 class="mb-2 text-lg font-semibold text-(--color-heading)">Delete Folder</h3>
			<p class="mb-6 text-sm text-(--color-text)">
				Are you sure you want to delete
				<span class="font-semibold">"{folderName}"</span> and all its files?
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="cursor-pointer rounded px-3 py-1.5 text-sm text-(--color-muted) transition-colors hover:bg-(--color-muted)/10"
					onclick={onCancel}
				>
					Cancel
				</button>
				<button
					type="button"
					class="flex cursor-pointer items-center gap-2 rounded border border-red-600 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={isLoading}
					onclick={handleDelete}
				>
					{#if isLoading}
						<Spinner class="h-4 w-4 animate-spin" />
					{/if}
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
