class EditorState {
	path = $state('');
	originalContent = $state('');
	currentContent = $state('');
	mode = $state<'edit' | 'create' | ''>('');
	isSaving = $state(false);
	isDirty = $derived(this.currentContent !== this.originalContent && this.currentContent.trim() !== '');
	toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	openFile(path: string, mode: 'edit' | 'create' | '') {
		this.path = path;
		this.mode = mode;
		this.currentContent = '';
		this.originalContent = '';
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

	async save(): Promise<boolean> {
		if (!this.path || this.isSaving) return false;
		if (!this.isDirty) {
			this.showToast('No changes to save', 'success');
			return false;
		}
		this.isSaving = true;
		try {
			const url = this.mode === 'create' ? `/api/save?mode=create` : `/api/save`;
			const res = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ path: this.path, content: this.currentContent })
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to save');
			}
			this.markSaved();
			this.showToast('Saved successfully', 'success');
			return true;
		} catch (error: any) {
			this.showToast(error.message || 'Failed to save', 'error');
			return false;
		} finally {
			this.isSaving = false;
		}
	}

	private showToast(message: string, type: 'success' | 'error') {
		this.toast = { message, type };
		setTimeout(() => {
			this.toast = null;
		}, 2500);
	}

	reset() {
		this.path = '';
		this.originalContent = '';
		this.currentContent = '';
		this.mode = '';
	}
}

export const editorState = new EditorState();
