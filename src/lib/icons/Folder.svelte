<script lang="ts">
	let {
		class: className = 'w-4 h-4',
		filled = false
	}: { class?: string; filled?: boolean } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
	stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
	class={className}>
	{#if filled}
		<path
			fill="currentColor"
			stroke="none"
			opacity="0.55"
			d="M2.5 7A2.5 2.5 0 0 1 5 4.5h3.6c.66 0 1.3.26 1.77.73L12.14 7H19a2.5 2.5 0 0 1 2.5 2.5v7H2.5V7Z"
		/>
		<path
			fill="currentColor"
			stroke="none"
			d="M5.2 9h15.32a2 2 0 0 1 1.92 2.55l-2.02 7A2 2 0 0 1 18.5 20H3.48a2 2 0 0 1-1.92-2.55l2.02-7A2 2 0 0 1 5.2 9Z"
		/>
	{:else}
		<path d="M3 18.5V6.75A2.25 2.25 0 0 1 5.25 4.5H9l2.5 2.5h7.25A2.25 2.25 0 0 1 21 9.25v9.25A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5Z" />
	{/if}
</svg>
