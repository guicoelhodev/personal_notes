<script lang="ts">
	let {
		options,
		value,
		onchange
	}: {
		options: { id: string; label: string; color: string }[];
		value: string;
		onchange: (id: string) => void;
	} = $props();

	let isOpen = $state(false);
	let containerRef: HTMLDivElement | undefined = $state();

	function handleSelect(id: string) {
		onchange(id);
		isOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	const selectedOption = $derived(options.find((o) => o.id === value));
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative" bind:this={containerRef}>
	<button
		type="button"
		class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-(--color-surface) hover:bg-(--color-surface)/80 transition-colors cursor-pointer border border-(--color-muted)/20 w-full justify-between"
		onclick={() => (isOpen = !isOpen)}
	>
		<span
			class="w-3 h-3 rounded-full shrink-0"
			style="background-color: {selectedOption?.color}"
		></span>
		<span class="text-xs text-(--color-text)">{selectedOption?.label}</span>
		<svg
			class="w-3 h-3 text-(--color-muted) transition-transform shrink-0"
			class:rotate-180={isOpen}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if isOpen}
		<div class="absolute left-auto right-0 top-full mt-1 py-1 w-full min-w-40 max-h-48 overflow-y-auto rounded-lg border border-(--color-muted)/20 bg-(--color-surface) shadow-lg z-50">
			{#each options as option}
				<button
					type="button"
					class="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-(--color-base) transition-colors cursor-pointer"
					class:bg-(--color-base)={option.id === value}
					onclick={() => handleSelect(option.id)}
				>
					<span
						class="w-3 h-3 rounded-full shrink-0"
						style="background-color: {option.color}"
					></span>
					<span class="text-xs text-(--color-text)">{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>