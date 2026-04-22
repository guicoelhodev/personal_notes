<script lang="ts">
	let { class: className = 'w-4 h-4' }: { class?: string } = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
	class={className}>
	<circle cx="12" cy="5" r="2" />
	<circle cx="12" cy="12" r="2" />
	<circle cx="12" cy="19" r="2" />
</svg>
