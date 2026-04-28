<script lang="ts">
	import Spinner from '$lib/icons/Spinner.svelte';

	let {
		isOpen,
		itemName,
		isFolder,
		onRename,
		onCancel
	}: {
		isOpen: boolean;
		itemName: string;
		isFolder: boolean;
		onRename: (newName: string) => Promise<void>;
		onCancel: () => void;
	} = $props();

	let isLoading = $state(false);
	let inputValue = $state('');
	let error = $state('');
	let inputRef: HTMLInputElement | undefined = $state();

	let displayName = $derived(itemName.replace(/_/g, ' '));
	const INVALID_CHARS = /[/\\]|\.\./;

	let isValid = $derived(
		inputValue.trim().length > 0 &&
			inputValue.trim() !== displayName &&
			!INVALID_CHARS.test(inputValue.trim())
	);

	let itemType = $derived(isFolder ? 'folder' : 'file');

	$effect(() => {
		if (isOpen) {
			inputValue = displayName;
			error = '';
		}
	});

	$effect(() => {
		if (isOpen && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	async function handleRename() {
		const trimmed = inputValue.trim();
		if (!isValid) return;

		isLoading = true;
		error = '';
		try {
			await onRename(trimmed.replaceAll(' ', '_'));
		} catch (err: unknown) {
			const e = err as { status?: number; message?: string };
			if (e.status === 409 || e.message?.includes('already exists')) {
				error = `A ${itemType} with this name already exists`;
			} else {
				error = e.message || `Failed to rename ${itemType}`;
			}
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !isLoading) {
			onCancel();
		} else if (e.key === 'Enter' && isValid && !isLoading) {
			e.preventDefault();
			handleRename();
		} else if (e.key === ',' || e.key === '.') {
			e.preventDefault();
		}
	}

	function handleOverlayClick() {
		if (!isLoading) {
			onCancel();
		}
	}

	function onInput(e: Event) {
		inputValue = (e.target as HTMLInputElement).value;
		error = '';
	}

	function registerInput(el: HTMLInputElement) {
		inputRef = el;
		return {
			update() {},
			destroy() {
				inputRef = undefined;
			}
		};
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
			<h3 class="mb-2 text-lg font-semibold text-(--color-heading)">
				Rename {isFolder ? 'Folder' : 'File'}
			</h3>
			<p class="mb-4 text-sm text-(--color-text)">
				Enter a new name for <span class="font-semibold">"{displayName}"</span>:
			</p>
			<input
				type="text"
				use:registerInput
				value={inputValue}
				oninput={onInput}
				disabled={isLoading}
				class="mb-2 w-full rounded border border-(--color-heading) bg-transparent px-3 py-1.5 text-sm text-(--color-text) outline-none disabled:opacity-50"
			/>
			{#if error}
				<p class="mb-4 text-xs text-red-500">{error}</p>
			{:else if inputValue.trim() && inputValue.trim() !== itemName && INVALID_CHARS.test(inputValue.trim())}
				<p class="mb-4 text-xs text-red-500">Name cannot contain /, \ or ..</p>
			{:else}
				<div class="mb-4 h-4"></div>
			{/if}
			<div class="flex justify-end gap-3">
				<button
					type="button"
					class="cursor-pointer rounded px-3 py-1.5 text-sm text-(--color-muted) transition-colors hover:bg-(--color-muted)/10"
					onclick={onCancel}
					disabled={isLoading}
				>
					Cancel
				</button>
				<button
					type="button"
					class="flex cursor-pointer items-center gap-2 rounded border border-(--color-heading) px-3 py-1.5 text-sm text-(--color-heading) transition-colors hover:bg-(--color-heading)/10 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!isValid || isLoading}
					onclick={handleRename}
				>
					{#if isLoading}
						<Spinner class="h-4 w-4 animate-spin" />
					{/if}
					Rename
				</button>
			</div>
		</div>
	</div>
{/if}
