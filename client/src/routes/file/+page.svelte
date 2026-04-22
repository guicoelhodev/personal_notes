<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import PageActions from '$lib/components/PageActions.svelte';

	let editorEl: HTMLDivElement | undefined = $state();
	let loading = $state(true);
	let editorInstance: any = null;

	const currentPath = $derived(page.url.searchParams.get('path') ? decodeURIComponent(page.url.searchParams.get('path')!) : '');
	const currentMode = $derived(page.url.searchParams.get('mode') || '');

	async function loadContent() {
		loading = true;

		editorState.openFile(currentPath, currentMode as 'edit' | 'create' | '');

		if (currentPath && currentMode !== 'create') {
			try {
				const res = await fetch(`/api/docs/${encodeURIComponent(currentPath)}`);
				if (!res.ok) throw new Error('File not found');
				const content = await res.text();
				editorState.setContent(content);
				editorState.setOriginalContent(content);
			} catch {
				const errorMsg = '# Error\n\nFile not found: ' + currentPath;
				editorState.setContent(errorMsg);
				editorState.setOriginalContent(errorMsg);
			}
		} else if (currentPath && currentMode === 'create') {
			const fileName = currentPath.replace(/^.*\//, '').replace(/\.md$/, '');
			const formattedName = fileName
				.replace(/[-_]/g, ' ')
				.replace(/\b\w/g, (c) => c.toUpperCase());
			const content = '# ' + formattedName + '\n\n<br />\n\n';
			editorState.setContent(content);
			editorState.setOriginalContent('');
		}

		loading = false;
	}

	async function initEditor() {
		if (!editorEl) return;

		if (editorInstance) {
			try {
				await editorInstance.destroy();
			} catch {
				/* ignore */
			}
		}

		editorEl.innerHTML = '';

		const { Crepe } = await import('@milkdown/crepe');

		editorInstance = new Crepe({
			root: editorEl,
			defaultValue: editorState.currentContent
		});
		editorInstance.create();

		if (currentMode === 'create') {
			const editable = editorEl.querySelector('.ProseMirror') as HTMLElement | null;
			editable?.focus();
		}

		const observer = new MutationObserver(() => {
			try {
				const md = editorInstance?.getMarkdown?.();
				if (md !== undefined) {
					editorState.setContent(md);
				}
			} catch {
				/* ignore */
			}
		});

		const proseMirror = editorEl.querySelector('.ProseMirror');
		if (proseMirror) {
			observer.observe(proseMirror, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}

		editorEl.addEventListener('input', () => {
			try {
				const md = editorInstance?.getMarkdown?.();
				if (md !== undefined) {
					editorState.setContent(md);
				}
			} catch {
				/* ignore */
			}
		});
	}

	onMount(async () => {
		await loadContent();
		await initEditor();

		if (currentPath) {
			sidebarState.activeSlug = currentPath.replace(/\.md$/, '');
		}
	});

	$effect(() => {
		const p = currentPath;
		if (p) {
			loadContent().then(() => initEditor());
		}
	});
</script>

<div class="h-full flex flex-col justify-between">
	<div class="flex-1 min-h-0 overflow-y-auto">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<p class="text-(--color-muted)">Loading...</p>
			</div>
		{:else}
			<div id="editor" class="h-full" bind:this={editorEl}></div>
		{/if}
	</div>
	<PageActions />
</div>
