<script lang="ts">
	let { class: className = 'w-4 h-4' }: { class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
	stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
	class={className}>
	<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
	<polyline points="17 21 17 13 7 13 7 21" />
	<polyline points="7 3 7 8 15 8" />
</svg>
