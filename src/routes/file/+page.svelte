<script lang="ts">
	import { page } from '$app/state';
	import { onDestroy, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { editorViewCtx } from '@milkdown/kit/core';
	import { Selection } from 'prosemirror-state';
	import { Crepe } from '@milkdown/crepe';
	import PageActions from '$lib/components/PageActions.svelte';
	import { optimizeImage } from '$lib/client/images';
	import { currentWorkspace, readWorkspaceImage, runWorkspaceWrite } from '$lib/client/workspace';
	import { localImageId } from '$lib/utils/images';
	import { accessState } from '$lib/stores/access.svelte';
	import { shareState } from '$lib/stores/share.svelte';

	let editorEl: HTMLDivElement | undefined = $state();
	let loading = $state(true);
	let editorInstance: Crepe | null = null;
	let editorObserver: MutationObserver | null = null;
	let editorInputHandler: (() => void) | null = null;
	let imageUrlCache = new SvelteMap<string, { promise: Promise<string>; objectUrl?: string }>();
	let loadGeneration = 0;

	const currentPath = $derived(page.url.searchParams.get('path') || '');
	const currentMode = $derived(page.url.searchParams.get('mode') || '');
	const isReadOnly = $derived(
		shareState.isActive &&
		accessState.mode !== 'authenticated' &&
		(!shareState.canEdit(currentPath) || currentMode === 'create')
	);

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
			revokeImageUrls();
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
					proxyDomURL: resolveImageUrl,
					onImageLoadError: (event: Event) => {
						const image = event.target;
						if (!(image instanceof HTMLImageElement)) return;
						console.error('Editor image failed to load', {
							documentPath: currentPath,
							source: image.getAttribute('src'),
							currentSource: image.currentSrc,
							online: navigator.onLine
						});
					},
					onUpload: async (file: File) => {
						try {
							const optimized = await optimizeImage(file);
							const url = await editorState.trackImageUpload(
								runWorkspaceWrite((workspace) => workspace.uploadImage(optimized))
							);
							if (!url) throw new Error('Upload cancelled');
							if (generation !== loadGeneration) {
								await editorState.discardUploadedImage(url);
								throw new Error('Upload cancelled');
							}
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
		instance.setReadonly(isReadOnly);
		if (generation !== loadGeneration) {
			await instance.destroy();
			revokeImageUrls();
			return;
		}
		if (currentMode === 'create') {
			requestAnimationFrame(() => {
				instance.editor.action((ctx) => {
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

	function resolveImageUrl(source: string): Promise<string> | string {
		const normalizedSource = source.trim();
		if (/^file:/i.test(normalizedSource)) {
			console.error('Local file image cannot be loaded by a web application', {
				documentPath: currentPath,
				source: normalizedSource
			});
			return '';
		}
		if (normalizedSource.startsWith('/api/images/')) {
			return new URL(normalizedSource, window.location.origin).href;
		}
		if (!localImageId(normalizedSource)) return normalizedSource;
		const cached = imageUrlCache.get(normalizedSource);
		if (cached) return cached.promise;

		let entry: { promise: Promise<string>; objectUrl?: string };
		const promise = readWorkspaceImage(normalizedSource)
			.then((image) => {
				if (!image) throw new Error('Local image not found');
				const objectUrl = URL.createObjectURL(image);
				if (imageUrlCache.get(normalizedSource) !== entry) {
					URL.revokeObjectURL(objectUrl);
					return normalizedSource;
				}
				entry.objectUrl = objectUrl;
				return objectUrl;
			})
			.catch((error) => {
				if (imageUrlCache.get(normalizedSource) === entry)
					imageUrlCache.delete(normalizedSource);
				throw error;
			});
		entry = { promise };
		imageUrlCache.set(normalizedSource, entry);
		return promise;
	}

	function revokeImageUrls() {
		for (const entry of imageUrlCache.values()) {
			if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
		}
		imageUrlCache.clear();
	}

	function stopEditorListeners() {
		editorObserver?.disconnect();
		editorObserver = null;
		if (editorEl && editorInputHandler) editorEl.removeEventListener('input', editorInputHandler);
		editorInputHandler = null;
	}

	$effect(() => {
		const p = currentPath;
		const mode = currentMode;
		if (p) {
			const generation = ++loadGeneration;
			untrack(() => {
				stopEditorListeners();
				loadContent(p, mode, generation).then(() => initEditor(generation));
			});
			sidebarState.activeSlug = p.replace(/\.md$/, '');
		}
	});

	$effect(() => {
		editorInstance?.setReadonly(isReadOnly);
	});

	onDestroy(() => {
		loadGeneration += 1;
		stopEditorListeners();
		void editorState.discardPendingImages();
		const instance = editorInstance;
		editorInstance = null;
		void instance?.destroy().finally(revokeImageUrls);
	});
</script>

<div class="flex h-full min-w-0 flex-col justify-between">
	<div class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
		{#if loading}
			<div class="flex h-full items-center justify-center">
				<p class="text-(--color-muted)">Loading...</p>
			</div>
		{:else}
			<div
				id="editor"
				class="h-full w-full min-w-0"
				bind:this={editorEl}
			></div>
		{/if}
	</div>
	{#if !isReadOnly}
		<PageActions />
	{/if}
</div>
