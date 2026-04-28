<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import Moon from '$lib/icons/Moon.svelte';
	import Sun from '$lib/icons/Sun.svelte';
</script>

<button
	type="button"
	aria-label="Toggle theme"
	class="grid place-content-center p-2 rounded-lg bg-(--color-surface) hover:opacity-80 transition-opacity cursor-pointer"
	onclick={() => {
		themeState.toggleVariant();
		themeState.sync();
	}}
>
	{#if themeState.variant === 'light'}
		<Sun class="w-5 h-5" />
	{:else}
		<Moon class="w-5 h-5" />
	{/if}
</button>