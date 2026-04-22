<script lang="ts">
	import Popover from './Popover.svelte';
	import Plus from '$lib/icons/Plus.svelte';
	import Folder from '$lib/icons/Folder.svelte';
	import File from '$lib/icons/File.svelte';

	let { folderPath, onCreate }: { folderPath: string; onCreate: (type: 'file' | 'folder') => void } = $props();
</script>

<li>
	<div class="flex items-center gap-1">
		<button
			type="button"
			aria-label="Add"
			class="folder-add-btn aspect-square rounded hover:bg-(--color-muted)/10 transition-colors cursor-pointer text-(--color-muted) opacity-0 group-hover:opacity-100"
			onclick={() => onCreate('file')}
		>
			<Plus class="w-3.5 h-3.5" />
		</button>
		<Popover>
			<button
				type="button"
				class="flex items-center gap-2 w-full text-left text-sm px-3 py-1.5 hover:bg-(--color-muted)/10 transition-colors cursor-pointer text-(--color-text)"
				onclick={() => onCreate('folder')}
			>
				<Folder class="w-4 h-4 shrink-0" />
				<span>Create Folder</span>
			</button>
			<button
				type="button"
				class="flex items-center gap-2 w-full text-left text-sm px-3 py-1.5 hover:bg-(--color-muted)/10 transition-colors cursor-pointer text-(--color-text)"
				onclick={() => onCreate('file')}
			>
				<File class="w-4 h-4 shrink-0" />
				<span>Create File</span>
			</button>
		</Popover>
	</div>
</li>
