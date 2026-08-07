<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy, untrack } from 'svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { editorViewCtx } from '@milkdown/kit/core';
	import { Selection } from 'prosemirror-state';
	import { Crepe } from '@milkdown/crepe';
	import type { Ctx } from '@milkdown/kit/ctx';
	import PageActions from '$lib/components/PageActions.svelte';
	import { currentWorkspace, runWorkspaceWrite } from '$lib/client/workspace';
	import { accessState } from '$lib/stores/access.svelte';

	let editorEl: HTMLDivElement | undefined = $state();
	let loading = $state(true);
	let editorInstance: Crepe | null = null;
	let editorObserver: MutationObserver | null = null;
	let editorInputHandler: (() => void) | null = null;
	let loadGeneration = 0;

	const currentPath = $derived(page.url.searchParams.get('path') || '');
	const currentMode = $derived(page.url.searchParams.get('mode') || '');

	async function loadContent(path: string, mode: string, generation: number) {
		loading = true;

		editorState.openFile(path, mode as 'edit' | 'create' | '');

		if (path && mode !== 'create') {
			try {
				const document = await (await currentWorkspace()).read(path);
				if (generation !== loadGeneration) return;
				editorState.setContent(document.content);
				editorState.setOriginalContent(document.content);
				editorState.setVersion(document.version);
			} catch {
				if (generation !== loadGeneration) return;
				const errorMsg = '# Error\n\nFile not found: ' + path;
				editorState.setContent(errorMsg);
				editorState.setOriginalContent(errorMsg);
			}
		} else if (path && mode === 'create') {
			const fileName = path.replace(/^.*\//, '').replace(/\.md$/, '');
			const formattedName = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			const content = '# ' + formattedName + '\n\n<br />\n\n';
			editorState.setContent(content);
			editorState.setOriginalContent('');
		}

		if (generation === loadGeneration) loading = false;
	}

	async function initEditor(generation: number) {
		if (!editorEl || generation !== loadGeneration) return;
		stopEditorListeners();

		if (editorInstance) {
			try {
				await editorInstance.destroy();
			} catch {
				/* ignore */
			}
			if (generation !== loadGeneration) return;
		}

		// Milkdown owns this element and can leave DOM behind after a failed destroy.
		// eslint-disable-next-line svelte/no-dom-manipulating
		editorEl.innerHTML = '';

		const instance = new Crepe({
			root: editorEl,
			defaultValue: editorState.currentContent,
			featureConfigs: {
				[Crepe.Feature.ImageBlock]: {
					onUpload: async (file: File) => {
						try {
							const url = await runWorkspaceWrite((workspace) => workspace.upload(file));
							if (!url) throw new Error('Upload cancelled');
							return url;
						} catch (error) {
							const message = error instanceof Error ? error.message : 'Upload failed';
							editorState.triggerToast(message, 'error');
							throw error;
						}
					}
				}
			}
		});
		editorInstance = instance;
		await instance.create();
		if (generation !== loadGeneration) {
			await instance.destroy();
			return;
		}
		instance.setReadonly(accessState.mode === 'unknown');

		if (currentMode === 'create') {
			requestAnimationFrame(() => {
				instance.editor.action((ctx: Ctx) => {
					const view = ctx.get(editorViewCtx);
					view.focus();
					const endPos = view.state.doc.content.size;
					view.dispatch(view.state.tr.setSelection(Selection.near(view.state.doc.resolve(endPos))));
				});
			});
		}

		editorObserver = new MutationObserver(() => {
			try {
				const md = instance.getMarkdown();
				if (md !== undefined) {
					editorState.setContent(md);
				}
			} catch {
				/* ignore */
			}
		});

		const proseMirror = editorEl.querySelector('.ProseMirror');
		if (proseMirror) {
			editorObserver.observe(proseMirror, {
				childList: true,
				subtree: true,
				characterData: true
			});
		}

		editorInputHandler = () => {
			try {
				const md = instance.getMarkdown();
				if (md !== undefined) {
					editorState.setContent(md);
				}
			} catch {
				/* ignore */
			}
		};
		editorEl.addEventListener('input', editorInputHandler);
	}

	function stopEditorListeners() {
		editorObserver?.disconnect();
		editorObserver = null;
		if (editorEl && editorInputHandler) editorEl.removeEventListener('input', editorInputHandler);
		editorInputHandler = null;
	}

	async function handleEditorPointerDown(event: PointerEvent) {
		if (accessState.mode !== 'unknown') return;
		event.preventDefault();
		if (await accessState.ensureWriteAccess()) {
			editorInstance?.setReadonly(false);
			editorInstance?.editor.action((ctx: Ctx) => ctx.get(editorViewCtx).focus());
		}
	}

	$effect(() => {
		const readonly = accessState.mode === 'unknown';
		untrack(() => editorInstance?.setReadonly(readonly));
	});

	$effect(() => {
		const p = currentPath;
		const mode = currentMode;
		if (p) {
			const generation = ++loadGeneration;
			stopEditorListeners();
			untrack(() => {
				loadContent(p, mode, generation).then(() => initEditor(generation));
			});
			sidebarState.activeSlug = p.replace(/\.md$/, '');
		}
	});

	onDestroy(() => {
		loadGeneration += 1;
		stopEditorListeners();
		editorInstance?.destroy();
	});
</script>

<div class="flex h-full min-w-0 flex-col justify-between">
	<div class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
		{#if loading}
			<div class="flex h-full items-center justify-center">
				<p class="text-(--color-muted)">Loading...</p>
			</div>
		{:else}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				id="editor"
				class="h-full w-full min-w-0"
				bind:this={editorEl}
				onpointerdown={handleEditorPointerDown}
			></div>
		{/if}
	</div>
	<PageActions />
</div>
