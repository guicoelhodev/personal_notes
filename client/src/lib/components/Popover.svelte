<script lang="ts">
	import ThreeDots from '$lib/icons/ThreeDots.svelte';

	let { children, alwaysVisible = false }: { children: import('svelte').Snippet; alwaysVisible?: boolean } = $props();
	let menuRef: HTMLDivElement | undefined = $state();
	let isOpen = $state(false);

	function toggle(e: MouseEvent) {
		e.stopPropagation();
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}
</script>

<svelte:window onclick={close} />

<div class="relative inline-flex">
	<button
		type="button"
		aria-label="Options"
		class="popover-trigger p-1 rounded hover:bg-(--color-surface) transition-colors cursor-pointer text-(--color-muted) {!alwaysVisible && 'opacity-0 group-hover:opacity-100'}"
		onclick={toggle}
	>
		<ThreeDots />
	</button>
	{#if isOpen}
		<div
			bind:this={menuRef}
			class="popover-menu fixed bg-(--color-surface) border border-(--color-muted)/20 rounded-lg shadow-lg py-1 min-w-45 z-50 translate-x-8"
		>
			{@render children()}
		</div>
	{/if}
</div>
