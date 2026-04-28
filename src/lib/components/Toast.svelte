<script lang="ts">
	import { editorState } from '$lib/stores/editor.svelte';
</script>

{#if editorState.toast}
	<div
		class="fixed bottom-16 right-4 px-4 py-2 rounded-lg bg-(--color-surface) border border-(--color-muted)/20 text-(--color-text) text-sm transition-opacity duration-300"
		role="status"
		aria-live="polite"
	>
		{editorState.toast.message}
	</div>
{/if}
