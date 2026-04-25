<script lang="ts">
	import Lock from '$lib/icons/Lock.svelte';

	let { isOpen = $bindable(false), onClose }: { isOpen?: boolean; onClose: () => void } = $props();

	function handleOverlayClick() {
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
		onclick={handleOverlayClick}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-md mx-4 rounded-lg border border-(--color-muted)/30 bg-(--color-surface) shadow-2xl overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<div class="p-6">
				<div class="flex items-center gap-3 mb-4">
					<Lock class="w-6 h-6 text-(--color-heading)" />
					<h2 class="text-lg font-semibold text-(--color-text)">Feature Blocked</h2>
				</div>
				<p class="text-sm text-(--color-muted) mb-6">
					This feature is not available in the demo version of the editor. Follow the instructions in the README if you want to configure it for personal use.
				</p>
				<button
					type="button"
					class="w-full px-4 py-2 rounded-lg bg-(--color-heading)/10 text-(--color-heading) text-sm font-medium hover:bg-(--color-heading)/20 transition-colors cursor-pointer"
					onclick={onClose}
				>
					Got it
				</button>
			</div>
		</div>
	</div>
{/if}