<script lang="ts">
	import type { TreeNode, FileAction } from '$lib/types';
	import Popover from './Popover.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import Folder from '$lib/icons/Folder.svelte';
	import File from '$lib/icons/File.svelte';
	import Trash from '$lib/icons/Trash.svelte';
	import Edit from '$lib/icons/Edit.svelte';
	import DeleteFolderModal from './DeleteFolderModal.svelte';
	import RenameModal from './RenameModal.svelte';
	import { editorState } from '$lib/stores/editor.svelte';
	import { sidebarState } from '$lib/stores/sidebar.svelte';
	import { goto } from '$app/navigation';

	type UserAction = 'deleteModal' | 'renameModal' | null;

	let {
		node,
		folderPath,
		actions = ['add', 'createFolder', 'createFile'],
		onFolderToggle,
		alwaysVisible = false
	}: {
		node: TreeNode;
		folderPath: string;
		actions?: FileAction[];
		onFolderToggle: () => void;
		alwaysVisible?: boolean;
	} = $props();

	let isCreating = $state(false);
	let creatingType = $state<'file' | 'folder'>('file');
	let inputValue = $state('');
	let inputRef: HTMLInputElement | undefined = $state();

	let activeAction = $state<UserAction>(null);
	let actionTarget = $state<{ name: string; path: string; isFolder: boolean }>({
		name: '',
		path: '',
		isFolder: false
	});

	let popoverActions = $derived(actions.filter((a) => a !== 'add'));

	export { isCreating, inputValue };

	function startCreate(type: 'file' | 'folder') {
		isCreating = true;
		creatingType = type;
		inputValue = type === 'file' ? 'New File' : 'New Folder';
	}

	export function confirmCreate() {
		const value = inputValue.trim();
		if (!value || value === 'New File' || value === 'New Folder') {
			isCreating = false;
			return;
		}

		if (creatingType === 'file') {
			const filePath = folderPath + '/' + value + '.md';
			const formattedName = value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			editorState.path = filePath;
			editorState.mode = 'create';
			editorState.setContent('# ' + formattedName + '\n\n<br />\n\n');
			editorState.setOriginalContent('');
			goto(`/file?path=${encodeURIComponent(filePath)}&mode=create`);
		} else if (creatingType === 'folder') {
			const newFolder: TreeNode = {
				label: value,
				children: [],
				isFolder: true
			};
			node.children.push(newFolder);
			node.children.sort((a, b) => {
				if (a.isFolder && !b.isFolder) return -1;
				if (!a.isFolder && b.isFolder) return 1;
				return a.label.localeCompare(b.label);
			});
			onFolderToggle();
		}

		isCreating = false;
	}

	export function setInput(v: string) {
		inputValue = v;
	}

	export function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			confirmCreate();
		} else if (e.key === 'Escape') {
			isCreating = false;
		} else if ([',', '.'].includes(e.key)) {
			e.preventDefault();
		}
	}

	export function registerInput(el: HTMLInputElement) {
		inputRef = el;
		return {
			update() {},
			destroy() {
				inputRef = undefined;
			}
		};
	}

	$effect(() => {
		if (isCreating && inputRef) {
			inputRef.focus();
			inputRef.select();
		}
	});

	function handleDelete() {
		const isFolder = node.children.length > 0 || !!node.isFolder;
		actionTarget = { name: node.label, path: folderPath, isFolder };
		activeAction = 'deleteModal';
	}

	function handleRename() {
		const isFolder = node.children.length > 0 || !!node.isFolder;
		actionTarget = { name: node.label, path: folderPath, isFolder };
		activeAction = 'renameModal';
	}

	function cancelAction() {
		activeAction = null;
		actionTarget = { name: '', path: '', isFolder: false };
	}

	async function confirmDelete(): Promise<void> {
		const res = await fetch('/api/delete', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path: actionTarget.path, isFolder: actionTarget.isFolder })
		});

		if (!res.ok) {
			const data = await res.json();
			throw new Error(data.error || 'Failed to delete');
		}

		editorState.reset();
		goto('/');
		await sidebarState.loadTree();
		activeAction = null;
		actionTarget = { name: '', path: '', isFolder: false };
	}

	async function confirmRename(newName: string): Promise<void> {
		const res = await fetch('/api/rename', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				path: actionTarget.path,
				newName,
				isFolder: actionTarget.isFolder
			})
		});

		if (!res.ok) {
			const data = await res.json();
			const error = new Error(data.error || 'Failed to rename') as Error & { status: number };
			error.status = res.status;
			throw error;
		}

		const { newPath } = await res.json();

		const isFile = !actionTarget.isFolder;
		if (isFile && sidebarState.activeSlug === actionTarget.path) {
			sidebarState.activeSlug = newPath.replace(/\.md$/, '');
			editorState.path = newPath + '.md';
			goto(`/file?path=${encodeURIComponent(newPath)}.md`);
		} else if (isFile && editorState.path === actionTarget.path + '.md') {
			editorState.path = newPath + '.md';
			goto(`/file?path=${encodeURIComponent(newPath)}.md`);
		}

		await sidebarState.loadTree();
		activeAction = null;
		actionTarget = { name: '', path: '', isFolder: false };
	}
</script>

<li>
	<div class="flex items-center gap-1">
		{#if actions.includes('add')}
			<button
				type="button"
				aria-label="Add"
				class="folder-add-btn aspect-square cursor-pointer rounded text-(--color-muted) transition-colors hover:bg-(--color-muted)/10 {!alwaysVisible && 'opacity-0 group-hover:opacity-100'}"
				onclick={() => startCreate('file')}
			>
				<Plus class="h-3.5 w-3.5" />
			</button>
		{/if}
		{#if popoverActions.length > 0}
			<Popover {alwaysVisible}>
				{#if actions.includes('createFolder')}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]/10"
						onclick={() => startCreate('folder')}
					>
						<Folder class="h-4 w-4 shrink-0" />
						<span>Create Folder</span>
					</button>
				{/if}
				{#if actions.includes('createFile')}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]/10"
						onclick={() => startCreate('file')}
					>
						<File class="h-4 w-4 shrink-0" />
						<span>Create File</span>
					</button>
				{/if}
				{#if actions.includes('rename')}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-muted)]/10"
						onclick={handleRename}
					>
						<Edit class="h-4 w-4 shrink-0" />
						<span>Rename</span>
					</button>
				{/if}
				{#if actions.includes('delete')}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-red-500 transition-colors hover:bg-[var(--color-muted)]/10"
						onclick={handleDelete}
					>
						<Trash class="h-4 w-4 shrink-0" />
						<span>Delete</span>
					</button>
				{/if}
			</Popover>
		{/if}
	</div>
</li>

<DeleteFolderModal
	isOpen={activeAction === 'deleteModal'}
	folderName={actionTarget.name}
	onDelete={confirmDelete}
	onCancel={cancelAction}
/>

<RenameModal
	isOpen={activeAction === 'renameModal'}
	itemName={actionTarget.name}
	isFolder={actionTarget.isFolder}
	onRename={confirmRename}
	onCancel={cancelAction}
/>
