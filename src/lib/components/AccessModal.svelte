<script lang="ts">
	import Lock from '$lib/icons/Lock.svelte';
	import Spinner from '$lib/icons/Spinner.svelte';
	import { accessState } from '$lib/stores/access.svelte';

	let password = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!password || accessState.isAuthenticating) return;
		if (await accessState.authenticate(password)) password = '';
	}

	function close() {
		password = '';
		accessState.cancel();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && accessState.isModalOpen) close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if accessState.isModalOpen}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
		role="presentation"
	>
		<div
			class="w-full max-w-md overflow-hidden rounded-xl border border-(--color-muted)/30 bg-(--color-surface) shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="access-title"
		>
			<div class="p-6">
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-lg bg-(--color-heading)/10 p-2">
						<Lock class="h-5 w-5 text-(--color-heading)" />
					</div>
					<h2 id="access-title" class="text-lg font-semibold text-(--color-text)">
						{accessState.modalStep === 'choose' ? 'Escolha como acessar' : 'Autenticar'}
					</h2>
				</div>

				{#if accessState.modalStep === 'choose'}
					<p class="mb-6 text-sm leading-6 text-(--color-muted)">
						Você precisa autenticar para salvar no servidor, selecione a opção abaixo:
					</p>
					<div class="grid gap-3 sm:grid-cols-2">
						<button
							type="button"
							class="rounded-lg border border-(--color-muted)/30 px-4 py-3 text-sm font-medium text-(--color-text) transition-colors hover:bg-(--color-muted)/10"
							onclick={() => accessState.selectGuest()}
						>
							Acessar como convidado
						</button>
						<button
							type="button"
							class="rounded-lg bg-(--color-heading) px-4 py-3 text-sm font-semibold text-(--color-base) transition-opacity hover:opacity-90"
							onclick={() => accessState.showPassword()}
						>
							Autenticar
						</button>
					</div>
				{:else}
					<form onsubmit={submit}>
						<label for="access-password" class="mb-2 block text-sm font-medium text-(--color-text)">
							Senha de acesso
						</label>
						<input
							id="access-password"
							type="password"
							bind:value={password}
							autocomplete="current-password"
							class="w-full rounded-lg border border-(--color-muted)/40 bg-(--color-base) px-3 py-2 text-(--color-text) outline-none focus:border-(--color-heading)"
						/>
						{#if accessState.error}
							<p class="mt-2 text-sm text-red-500">{accessState.error}</p>
						{/if}
						<div class="mt-6 flex gap-3">
							<button
								type="button"
								class="flex-1 rounded-lg border border-(--color-muted)/30 px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-muted)/10"
								onclick={() => accessState.back()}
							>
								Voltar
							</button>
							<button
								type="submit"
								disabled={!password || accessState.isAuthenticating}
								class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-(--color-heading) px-4 py-2 text-sm font-semibold text-(--color-base) disabled:opacity-50"
							>
								{#if accessState.isAuthenticating}<Spinner class="h-4 w-4 animate-spin" />{/if}
								Entrar
							</button>
						</div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
