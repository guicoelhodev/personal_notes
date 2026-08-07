import { runWorkspaceWrite } from '$lib/client/workspace';

class EditorState {
	path = $state('');
	originalContent = $state('');
	currentContent = $state('');
	mode = $state<'edit' | 'create' | ''>('');
	version = $state('');
	isSaving = $state(false);
	isDirty = $derived(this.currentContent !== this.originalContent);
	toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	openFile(path: string, mode: 'edit' | 'create' | '') {
		this.path = path;
		this.mode = mode;
		this.currentContent = '';
		this.originalContent = '';
		this.version = '';
	}

	setContent(content: string) {
		this.currentContent = content;
	}

	setOriginalContent(content: string) {
		this.originalContent = content;
	}

	markSaved() {
		this.originalContent = this.currentContent;
		if (this.mode === 'create') {
			this.mode = 'edit';
		}
	}

	setVersion(version: string) {
		this.version = version;
	}

	async save(): Promise<boolean> {
		if (!this.path || this.isSaving) return false;
		if (!this.isDirty) {
			this.triggerToast('No changes to save', 'success');
			return false;
		}
		this.isSaving = true;

		try {
			const saved = await runWorkspaceWrite(async (workspace) => {
				return workspace.save({
					path: this.path,
					content: this.currentContent,
					version: this.version,
					create: this.mode === 'create'
				});
			});
			if (!saved) return false;
			this.version = saved.version;
			this.markSaved();
			this.triggerToast('Saved successfully', 'success');
			return true;
		} catch (error: unknown) {
			this.triggerToast(error instanceof Error ? error.message : 'Failed to save', 'error');
			return false;
		} finally {
			this.isSaving = false;
		}
	}

	triggerToast(message: string, type: 'success' | 'error') {
		this.toast = { message, type };
		setTimeout(() => {
			this.toast = null;
		}, 2000);
	}

	reset() {
		this.path = '';
		this.originalContent = '';
		this.currentContent = '';
		this.mode = '';
		this.version = '';
	}
}

export const editorState = new EditorState();
