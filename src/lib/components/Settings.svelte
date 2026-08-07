<script lang="ts">
	import Gear from '$lib/icons/Gear.svelte';
	import SettingsModal from './SettingsModal/index.svelte';
	import { accessState } from '$lib/stores/access.svelte';
	import { editorState } from '$lib/stores/editor.svelte';

	let isOpen = $state(false);

	const modeLabel = $derived(
		accessState.mode === 'authenticated'
			? 'R2 autenticado'
			: accessState.mode === 'guest'
				? 'Convidado local'
				: 'Leitura pública'
	);
	const modeStatus = $derived(
		accessState.mode === 'authenticated'
			? 'Acesso completo'
			: accessState.mode === 'guest'
				? 'Salvando neste navegador'
				: 'Sem alterações habilitadas'
	);

	function openModal() {
		isOpen = true;
	}

	function closeModal() {
		isOpen = false;
	}

	async function logout() {
		if (editorState.isDirty) {
			editorState.triggerToast('Save or discard your changes before leaving', 'error');
			return;
		}
		await accessState.logout();
		window.location.reload();
	}

	function authenticate() {
		if (editorState.isDirty) {
			editorState.triggerToast('Save or discard your changes before authenticating', 'error');
			return;
		}
		accessState.openAuthentication();
	}
</script>

<div class="mt-auto flex items-center justify-between border-t border-(--color-border) pt-4">
	<div class="flex flex-col items-start">
		<span class="text-sm font-medium text-(--color-text)">{modeLabel}</span>
		<span class="text-xs text-(--color-muted)">{modeStatus}</span>
	</div>

	{#if accessState.mode === 'guest'}
		<button
			type="button"
			class="text-xs font-medium text-(--color-heading) hover:underline"
			onclick={authenticate}
		>
			Autenticar
		</button>
	{:else if accessState.mode === 'authenticated'}
		<button
			type="button"
			class="text-xs font-medium text-(--color-muted) hover:text-(--color-text)"
			onclick={logout}
		>
			Sair
		</button>
	{/if}

	<button
		type="button"
		class="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-(--color-surface)"
		onclick={openModal}
	>
		<Gear class="h-5 w-5 text-(--color-muted)" />
	</button>
</div>

<SettingsModal bind:isOpen onClose={closeModal} />
