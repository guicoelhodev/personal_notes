<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { currentWorkspace } from '$lib/client/workspace';
	import { sidebarState } from '$lib/stores/sidebar.svelte';

	onMount(async () => {
		sidebarState.activeSlug = 'home';
		try {
			const initialDocument = await (await currentWorkspace()).consumeInitialDocument();
			if (!initialDocument) return;
			sidebarState.openFile(initialDocument.replace(/\.md$/, ''));
			await goto(resolve(`/file?path=${encodeURIComponent(initialDocument)}`), {
				replaceState: true
			});
		} catch {
			return;
		}
	});
</script>

<div class="flex items-center justify-center h-full">
	<p class="text-(--color-muted)">Select a file from the sidebar to start editing.</p>
</div>
