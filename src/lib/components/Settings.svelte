<script lang="ts">
	import Gear from '$lib/icons/Gear.svelte';
	import SettingsModal from './SettingsModal/index.svelte';
	import { accessState } from '$lib/stores/access.svelte';
	import { shareState } from '$lib/stores/share.svelte';

	let isOpen = $state(false);

	const modeLabel = $derived(
		shareState.isActive || accessState.mode === 'authenticated'
			? 'Authenticated'
			: accessState.mode === 'unknown'
				? 'Checking session'
				: 'Local storage'
	);
	const modeStatus = $derived(
		shareState.isActive
			? 'Guest Access'
			: accessState.mode === 'authenticated'
			? 'Full access'
			: accessState.mode === 'unknown'
				? 'Please wait'
				: 'Saving in this browser'
	);

	function openModal() {
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
	}
</script>

<div class="mt-auto flex items-center justify-between border-t border-(--color-border) pt-4">
	<div class="flex flex-col items-start">
		<span class="text-sm font-medium text-(--color-text)">{modeLabel}</span>
		<span class="text-xs text-(--color-muted)">{modeStatus}</span>
	</div>

	<button
		type="button"
		class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-(--color-surface)"
		onclick={openModal}
	>
		<Gear class="h-5 w-5 text-(--color-muted)" />
	</button>
</div>

<SettingsModal bind:isOpen onClose={closeModal} />
