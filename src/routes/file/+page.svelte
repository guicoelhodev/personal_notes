<script lang="ts">
	import { page } from "$app/state";
	import { untrack } from "svelte";
	import { editorState } from "$lib/stores/editor.svelte";
	import { sidebarState } from "$lib/stores/sidebar.svelte";
	import { editorViewCtx } from "@milkdown/kit/core";
	import { Selection } from "prosemirror-state";
	import { Crepe } from "@milkdown/crepe";
	import PageActions from "$lib/components/PageActions.svelte";
	import { env } from "$env/dynamic/public";

	let editorEl: HTMLDivElement | undefined = $state();
	let loading = $state(true);
	let editorInstance: any = null;

	const currentPath = $derived(
		page.url.searchParams.get("path")
			? decodeURIComponent(page.url.searchParams.get("path")!)
			: "",
	);
	const currentMode = $derived(page.url.searchParams.get("mode") || "");

	async function loadContent() {
		loading = true;

		editorState.openFile(currentPath, currentMode as "edit" | "create" | "");

		if (currentPath && currentMode !== "create") {
			try {
				const apiBase =
					env.PUBLIC_READ_ONLY === "true" ? "/api/local-docs" : "/api/docs";
				const res = await fetch(
					`${apiBase}/${encodeURIComponent(currentPath)}`,
				);

				if (!res.ok) throw new Error("File not found");
				const content = await res.text();
				editorState.setContent(content);
				editorState.setOriginalContent(content);
			} catch {
				const errorMsg = "# Error\n\nFile not found: " + currentPath;
				editorState.setContent(errorMsg);
				editorState.setOriginalContent(errorMsg);
			}
		} else if (currentPath && currentMode === "create") {
			const fileName = currentPath.replace(/^.*\//, "").replace(/\.md$/, "");
			const formattedName = fileName
				.replace(/[-_]/g, " ")
				.replace(/\b\w/g, (c) => c.toUpperCase());
			const content = "# " + formattedName + "\n\n<br />\n\n";
			editorState.setContent(content);
			editorState.setOriginalContent("");
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

		editorEl.innerHTML = "";

		editorInstance = new Crepe({
			root: editorEl,
			defaultValue: editorState.currentContent,
			featureConfigs: {
				[Crepe.Feature.ImageBlock]: {
					onUpload: async (file: File) => {
						const formData = new FormData();
						formData.append("file", file);
						const res = await fetch("/api/upload", {
							method: "POST",
							body: formData,
						});
						const data = await res.json();
						if (data.url) {
							return data.url;
						}
						editorState.triggerToast(data.error || "Upload failed", "error");
						throw new Error(data.error || "Upload failed");
					},
				},
			},
		});
		await editorInstance.create();

		if (currentMode === "create") {
			requestAnimationFrame(() => {
				editorInstance.editor.action((ctx: any) => {
					const view = ctx.get(editorViewCtx);
					view.focus();
					const endPos = view.state.doc.content.size;
					view.dispatch(
						view.state.tr.setSelection(
							Selection.near(view.state.doc.resolve(endPos)),
						),
					);
				});
			});
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

		const proseMirror = editorEl.querySelector(".ProseMirror");
		if (proseMirror) {
			observer.observe(proseMirror, {
				childList: true,
				subtree: true,
				characterData: true,
			});
		}

		editorEl.addEventListener("input", () => {
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

	$effect(() => {
		const p = currentPath;
		if (p) {
			untrack(() => {
				loadContent().then(() => initEditor());
			});
			sidebarState.activeSlug = p.replace(/\.md$/, "");
		}
	});
</script>

<div class="flex h-full min-w-0 flex-col justify-between">
	<div class="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
		{#if loading}
			<div class="flex h-full items-center justify-center">
				<p class="text-(--color-muted)">Loading...</p>
			</div>
		{:else}
			<div id="editor" class="h-full w-full min-w-0" bind:this={editorEl}></div>
		{/if}
	</div>
	<PageActions />
</div>
