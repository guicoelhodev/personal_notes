<script lang="ts">
	import { page } from '$app/state';
	import { accessState } from '$lib/stores/access.svelte';
	import { scale } from 'svelte/transition';

	let isOpen = $state(false);
	let shareAll = $state(false);
	let allowEdit = $state(false);
	let expiresIn = $state(60 * 60 * 24 * 7);
	let link = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let copied = $state(false);

	const path = $derived(page.url.searchParams.get('path') || '');
	const canShare = $derived(accessState.mode === 'authenticated' && path && page.url.searchParams.get('mode') !== 'create');

	async function createLink() {
		if (!path) return;
		isLoading = true;
		error = '';
		try {
			const response = await fetch('/api/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					path,
					mode: allowEdit ? 'edit' : 'view',
					shareAll,
					expiresIn
				})
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.error || 'Could not create share link');
			}
			const { token } = await response.json();
			link = `${window.location.origin}/file?path=${encodeURIComponent(path)}&token=${token}`;
		} catch (value) {
			error = value instanceof Error ? value.message : 'Could not create share link';
		} finally {
			isLoading = false;
		}
	}

	function toggle() {
		isOpen = !isOpen;
		if (isOpen) void createLink();
	}

	function updateOptions() {
		if (isOpen) void createLink();
	}

	async function copyLink() {
		if (!link) return;
		await navigator.clipboard.writeText(link);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

{#if canShare}
	<div class="relative">
		<button
			type="button"
			aria-label="Share document"
			aria-expanded={isOpen}
			class="flex cursor-pointer items-center gap-2 rounded-lg bg-(--color-surface) p-2 text-(--color-muted) transition-opacity hover:opacity-80"
			onclick={toggle}
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
				<circle cx="18" cy="5" r="3" />
				<circle cx="6" cy="12" r="3" />
				<circle cx="18" cy="19" r="3" />
				<path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
			</svg>
			<span class="hidden text-sm sm:inline">Share</span>
		</button>

		{#if isOpen}
			<div
				class="absolute top-full right-0 mt-2 w-80 rounded-lg border border-(--color-muted)/20 bg-(--color-surface) p-4 shadow-xl"
				transition:scale={{ duration: 180, start: 0.94 }}
			>
				<div class="space-y-3">
					<label class="flex cursor-pointer items-center justify-between gap-4 text-sm text-(--color-text)">
						<span>Share all files?</span>
						<input type="checkbox" class="sr-only peer" bind:checked={shareAll} onchange={updateOptions} />
						<span class="h-5 w-9 rounded-full bg-(--color-muted)/40 transition-colors peer-checked:bg-(--color-heading) after:block after:h-4 after:w-4 after:translate-x-0.5 after:translate-y-0.5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"></span>
					</label>
					<label class="flex cursor-pointer items-center justify-between gap-4 text-sm text-(--color-text)">
						<span>Allow editing current page</span>
						<input type="checkbox" class="sr-only peer" bind:checked={allowEdit} onchange={updateOptions} />
						<span class="h-5 w-9 rounded-full bg-(--color-muted)/40 transition-colors peer-checked:bg-(--color-heading) after:block after:h-4 after:w-4 after:translate-x-0.5 after:translate-y-0.5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"></span>
					</label>
					<div class="flex items-end gap-2">
						<label class="block flex-1 text-sm text-(--color-text)">
							<span class="mb-1 block">Expires in</span>
							<select class="w-full rounded border border-(--color-muted)/30 bg-transparent px-2 py-1.5" bind:value={expiresIn} onchange={updateOptions}>
								<option value={60 * 60}>1 hour</option>
								<option value={60 * 60 * 24}>1 day</option>
								<option value={60 * 60 * 24 * 7}>7 days</option>
								<option value={60 * 60 * 24 * 30}>30 days</option>
							</select>
						</label>
						<button
							type="button"
							aria-label="Copy share link"
							class="cursor-pointer rounded border border-(--color-muted)/30 p-2 text-(--color-muted) transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
							disabled={!link || isLoading}
							onclick={copyLink}
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
								<rect x="9" y="9" width="11" height="11" rx="2" />
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
							</svg>
						</button>
					</div>
					{#if error}
						<p class="text-sm text-red-500">{error}</p>
					{:else if copied}
						<p class="text-xs text-(--color-muted)">Link copied!</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
