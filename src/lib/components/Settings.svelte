<script lang="ts">
	import Gear from '$lib/icons/Gear.svelte';
	import SettingsModal from './SettingsModal/index.svelte';
	import { env } from '$env/dynamic/public';

	let isOpen = $state(false);

	const isReadOnly = $derived(env.PUBLIC_READ_ONLY === 'true');
	const modeLabel = $derived(isReadOnly ? 'Local Mode' : 'GitHub Mode');
	const modeStatus = $derived(isReadOnly ? 'Read only' : 'Full access');

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

