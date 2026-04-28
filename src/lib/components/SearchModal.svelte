<script lang="ts">
	import { searchState } from '$lib/stores/search.svelte';
	import Search from '$lib/icons/Search.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';

	let inputEl: HTMLInputElement | undefined = $state();
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		searchState.loadItems();
	});

	function handleInput(e: Event) {
		const query = (e.target as HTMLInputElement).value;
		clearTimeout(debounceTimer!);
		debounceTimer = setTimeout(() => {
			searchState.search(query);
		}, 150);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			searchState.navigate('down', searchState.results.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			searchState.navigate('up', searchState.results.length);
		} else if (e.key === 'Enter' && searchState.activeIndex >= 0) {
			e.preventDefault();
			const item = searchState.results[searchState.activeIndex]?.item;
			if (item) {
				searchState.close();
				sidebarState.openFile(item.id);
				goto(`/file?path=${encodeURIComponent(item.id)}.md`);
			}
		} else if (e.key === 'Escape') {
			searchState.close();
		}
	}

	function handleOverlayClick() {
		searchState.close();
	}

	function escapeHtml(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function getHighlightedTitle(item: typeof searchState.results[number]): string {
		const title = item.item.title;
		const match = item.matches?.[0];
		if (!match?.indices?.length) return escapeHtml(title);

		let result = '';
		let last = 0;
		for (const [start, end] of match.indices) {
			result += escapeHtml(title.slice(last, start));
			result += `<mark class="bg-(--color-heading)/30 text-(--color-heading) rounded-sm">${escapeHtml(title.slice(start, end + 1))}</mark>`;
			last = end + 1;
		}
		result += escapeHtml(title.slice(last));
		return result;
	}

	function handleResultClick(item: { id: string; title: string }) {
		searchState.close();
		sidebarState.openFile(item.id);
		goto(`/file?path=${encodeURIComponent(item.id)}.md`);
	}

	$effect(() => {
		if (searchState.isOpen && inputEl) {
			const timer = setTimeout(() => inputEl?.focus(), 50);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchState.toggle();
		}
	}}
/>

{#if searchState.isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[20vh]"
		onclick={handleOverlayClick}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-lg mx-4 rounded-lg border border-(--color-muted)/30 bg-(--color-surface) shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<!-- Search input -->
			<div class="flex items-center gap-2 px-4 py-3 border-b border-(--color-muted)/20">
				<Search class="w-4 h-4 text-(--color-muted) shrink-0" />
				<input
					type="text"
					placeholder="Search notes..."
					autocomplete="off"
					spellcheck="false"
					class="flex-1 bg-transparent outline-none text-(--color-text) placeholder:text-(--color-muted)"
					bind:this={inputEl}
					value={searchState.query}
					oninput={handleInput}
					onkeydown={handleKeydown}
				/>
				<kbd class="text-xs text-(--color-muted) border border-(--color-muted)/30 rounded px-1.5 py-0.5">ESC</kbd>
			</div>

			<!-- Results -->
			<ul class="max-h-64 overflow-y-auto">
				{#if searchState.results.length === 0 && searchState.query.trim()}
					<li class="px-4 py-3 text-sm text-(--color-muted)">No results</li>
				{:else}
					{#each searchState.results as item, i (item.item.id)}
						<li data-index={i}>
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<a
								href="/file?path={encodeURIComponent(item.item.id)}.md"
								class="block px-4 py-2.5 text-sm text-(--color-text) hover:bg-(--color-heading)/10 cursor-pointer transition-colors
								{searchState.activeIndex === i ? 'bg-(--color-heading)/10' : ''}"
								onclick={(e) => {
									e.preventDefault();
									handleResultClick(item.item);
								}}
								onkeydown={() => {}}
							>
								{@html getHighlightedTitle(item)}
							</a>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</div>
{/if}
