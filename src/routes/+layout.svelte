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
	import { accessState } from '$lib/stores/access.svelte';
	import AccessModal from '$lib/components/AccessModal.svelte';

	let { children } = $props();

	onMount(() => {
		themeState.sync();
		accessState.initialize();
	});
</script>

<div class="flex h-screen w-full">
	<aside
		class="fixed inset-y-0 left-0 z-40 w-full border-r border-(--color-muted)/20 bg-(--color-surface) md:static md:w-64 md:shrink-0 {sidebarState.isOpen
			? 'open'
			: ''}"
	>
		<Sidebar />
	</aside>

	{#if sidebarState.isOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-30 bg-black/50 md:hidden"
			onclick={() => (sidebarState.isOpen = false)}
			onkeydown={() => {}}
		></div>
	{/if}

	<main class="min-h-0 min-w-0 flex-1 overflow-hidden">
		<div class="fixed top-4 right-4 z-50 flex items-center gap-2">
			<button
				type="button"
				aria-label="Search"
				class="flex cursor-pointer items-center gap-2 rounded-lg bg-(--color-surface) p-2 text-(--color-muted) transition-opacity hover:opacity-80"
				onclick={() => searchState.open()}
			>
				<Search class="h-4 w-4" />
				<kbd class="hidden rounded border border-(--color-muted)/40 px-1.5 py-0.5 text-xs sm:inline"
					>Ctrl+K</kbd
				>
			</button>
			<ThemeToggle />
			<button
				class="cursor-pointer rounded-lg bg-(--color-surface) p-2 text-(--color-text) transition-opacity hover:opacity-80 md:hidden"
				aria-label="Toggle menu"
				onclick={() => (sidebarState.isOpen = !sidebarState.isOpen)}
			>
				<Menu class="h-5 w-5" />
			</button>
		</div>
		{@render children()}
	</main>
</div>

<SearchModal />
<Toast />
<AccessModal />

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
