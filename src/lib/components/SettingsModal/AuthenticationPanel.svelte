<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Spinner from '$lib/icons/Spinner.svelte';
	import { accessState } from '$lib/stores/access.svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';

	let { onAuthenticated }: { onAuthenticated: () => void } = $props();

	let password = $state('');
	let validationError = $state('');

	async function login(event: SubmitEvent) {
		event.preventDefault();
		validationError = '';
		if (!password.trim()) {
			validationError = 'Enter the access password';
			return;
		}
		if (await accessState.authenticate(password)) {
			editorState.reset();
			onAuthenticated();
			await goto(resolve('/'));
			await sidebarState.loadTree();
		}
	}

	async function logout() {
		validationError = '';
		await editorState.discardPendingImages();
		await accessState.logout();
		window.location.assign(resolve('/'));
	}
</script>

<div class="flex h-full flex-col">
	<h3 class="mb-1 text-base font-semibold text-(--color-text)">Authentication</h3>
	<p class="mb-5 text-sm text-(--color-muted)">
		{accessState.mode === 'authenticated'
			? 'Your session is connected to R2 storage.'
			: 'Without an active session, your documents remain in this browser.'}
	</p>

	<div class="mb-5 flex items-center gap-3 rounded-lg border border-(--color-muted)/20 p-3">
		<span
			class="h-2.5 w-2.5 rounded-full {accessState.mode === 'authenticated'
				? 'bg-green-500'
				: 'bg-(--color-muted)'}"
		></span>
		<div>
			<p class="text-sm font-medium text-(--color-text)">
				{accessState.mode === 'authenticated' ? 'R2 connected' : 'Local storage'}
			</p>
			<p class="text-xs text-(--color-muted)">
				{accessState.mode === 'authenticated' ? 'Access to server documents' : 'Using IndexedDB'}
			</p>
		</div>
	</div>

	{#if accessState.mode === 'authenticated'}
		<button
			type="button"
			class="mt-auto w-full cursor-pointer rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
			onclick={logout}
		>
			Log out
		</button>
	{:else}
		<form onsubmit={login}>
			<label for="settings-password" class="mb-2 block text-sm font-medium text-(--color-text)">
				Access password
			</label>
			<input
				id="settings-password"
				type="password"
				bind:value={password}
				autocomplete="current-password"
				placeholder="Enter your password"
				class="w-full rounded-lg border border-(--color-muted)/40 bg-(--color-base) px-3 py-2.5 text-(--color-text) outline-none transition-colors placeholder:text-(--color-muted) focus:border-(--color-heading)"
				oninput={() => {
					validationError = '';
					accessState.error = '';
				}}
			/>
			{#if validationError || accessState.error}
				<p class="mt-2 text-sm text-red-500">{validationError || accessState.error}</p>
			{/if}
			<button
				type="submit"
				disabled={accessState.isAuthenticating}
				class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-(--color-heading) px-4 py-2.5 text-sm font-semibold text-(--color-base) transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if accessState.isAuthenticating}<Spinner class="h-4 w-4 animate-spin" />{/if}
				Log in
			</button>
		</form>
	{/if}

	{#if validationError && accessState.mode === 'authenticated'}
		<p class="mt-2 text-sm text-red-500">{validationError}</p>
	{/if}
</div>
