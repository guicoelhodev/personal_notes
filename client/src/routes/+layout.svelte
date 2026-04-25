<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import Search from '$lib/icons/Search.svelte';
	import Menu from '$lib/icons/Menu.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { searchState } from '$lib/stores/search.svelte';
	import { themeState } from '$lib/stores/theme.svelte';

	let { children } = $props();

	onMount(() => {
		themeState.sync();
	});
</script>

<div class="flex h-screen w-full">
	<aside
		class="fixed inset-y-0 left-0 z-40 w-full md:w-64 md:static md:shrink-0 border-r border-(--color-muted)/20 bg-(--color-surface) {sidebarState.isOpen ? 'open' : ''}"
	>
		<Sidebar />
	</aside>

	{#if sidebarState.isOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 z-30 md:hidden"
			onclick={() => sidebarState.isOpen = false}
			onkeydown={() => {}}
		></div>
	{/if}

	<main class="flex-1 min-w-0 min-h-0 overflow-hidden">
		<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
			<button
				type="button"
				aria-label="Search"
				class="flex items-center gap-2 p-2 rounded-lg bg-(--color-surface) hover:opacity-80 transition-opacity cursor-pointer text-(--color-muted)"
				onclick={() => searchState.open()}
			>
				<Search class="w-4 h-4" />
				<kbd class="text-xs border border-(--color-muted)/40 rounded px-1.5 py-0.5 hidden sm:inline">Ctrl+K</kbd>
			</button>
			<ThemeToggle />
			<button
				class="md:hidden p-2 rounded-lg bg-(--color-surface) hover:opacity-80 transition-opacity cursor-pointer text-(--color-text)"
				aria-label="Toggle menu"
				onclick={() => sidebarState.isOpen = !sidebarState.isOpen}
			>
				<Menu class="w-5 h-5" />
			</button>
		</div>
		{@render children()}
	</main>
</div>

<SearchModal />
<Toast />

<style>
	@media (max-width: 767px) {
		aside {
			transform: translateX(-100%);
			transition: transform 0.2s ease;
		}
		aside.open {
			transform: translateX(0);
		}
	}
</style>
