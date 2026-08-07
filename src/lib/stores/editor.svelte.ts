import { deleteWorkspaceImages, runWorkspaceWrite } from '$lib/client/workspace';
import { extractManagedImageUrls, removedManagedImageUrls } from '$lib/utils/images';

class EditorState {
	path = $state('');
	originalContent = $state('');
	currentContent = $state('');
	mode = $state<'edit' | 'create' | ''>('');
	version = $state('');
	isSaving = $state(false);
	isDirty = $derived(this.currentContent !== this.originalContent);
	toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	private pendingUploads = new Set<string>();
	private pendingImageDeletions = new Set<string>();
	private savingUploads = new Set<string>();
	private activeImageUploads = new Set<Promise<string | null>>();

	openFile(path: string, mode: 'edit' | 'create' | '') {
		void this.discardPendingImages();
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

	markSaved(content = this.currentContent) {
		this.originalContent = content;
		if (this.mode === 'create') {
			this.mode = 'edit';
		}
	}

	setVersion(version: string) {
		this.version = version;
	}

	trackImageUpload(upload: Promise<string | null>): Promise<string | null> {
		const tracked = upload
			.then((url) => {
				if (url) this.pendingUploads.add(url);
				return url;
			})
			.finally(() => this.activeImageUploads.delete(tracked));
		this.activeImageUploads.add(tracked);
		return tracked;
	}

	async discardUploadedImage(url: string): Promise<void> {
		this.pendingUploads.add(url);
		await this.cleanupImages([url]);
	}

	async save(): Promise<boolean> {
		if (!this.path || this.isSaving) return false;
		if (!this.isDirty) {
			const imagesCleaned = await this.cleanupImages([
				...[...this.pendingUploads].filter(
					(url) => !extractManagedImageUrls(this.currentContent).includes(url)
				),
				...this.pendingImageDeletions
			]);
			this.triggerToast(
				imagesCleaned ? 'No changes to save' : 'Image cleanup failed',
				imagesCleaned ? 'success' : 'error'
			);
			return false;
		}
		this.isSaving = true;
		const savedPath = this.path;
		const savedContent = this.currentContent;
		const savedOriginalContent = this.originalContent;
		const savedVersion = this.version;
		const savedMode = this.mode;
		const uploadSnapshot = [...this.pendingUploads];
		for (const url of uploadSnapshot) this.savingUploads.add(url);

		try {
			const activeImages = new Set(extractManagedImageUrls(savedContent));
			const imagesToDelete = [
				...removedManagedImageUrls(savedOriginalContent, savedContent),
				...uploadSnapshot.filter((url) => !activeImages.has(url)),
				...this.pendingImageDeletions
			];
			const saved = await runWorkspaceWrite(async (workspace) => {
				return workspace.save({
					path: savedPath,
					content: savedContent,
					version: savedVersion,
					create: savedMode === 'create'
				});
			});
			if (!saved) return false;
			if (this.path === savedPath) {
				this.version = saved.version;
				this.markSaved(savedContent);
			}
			for (const url of uploadSnapshot) this.pendingUploads.delete(url);
			const imagesCleaned = await this.cleanupImages(imagesToDelete);
			this.triggerToast(
				imagesCleaned ? 'Saved successfully' : 'Saved, but image cleanup failed',
				imagesCleaned ? 'success' : 'error'
			);
			return true;
		} catch (error: unknown) {
			if (this.path !== savedPath) await this.cleanupImages(uploadSnapshot);
			this.triggerToast(error instanceof Error ? error.message : 'Failed to save', 'error');
			return false;
		} finally {
			for (const url of uploadSnapshot) this.savingUploads.delete(url);
			this.isSaving = false;
		}
	}

	async discardPendingImages(): Promise<void> {
		await Promise.allSettled(this.activeImageUploads);
		const uploads = [...this.pendingUploads].filter((url) => !this.savingUploads.has(url));
		const urls = [...uploads, ...this.pendingImageDeletions];
		for (const url of uploads) this.pendingUploads.delete(url);
		this.pendingImageDeletions.clear();
		await this.cleanupImages(urls);
	}

	private async cleanupImages(urls: string[]): Promise<boolean> {
		const uniqueUrls = [...new Set(urls)];
		if (uniqueUrls.length === 0) return true;
		try {
			await deleteWorkspaceImages(uniqueUrls);
			for (const url of uniqueUrls) {
				this.pendingUploads.delete(url);
				this.pendingImageDeletions.delete(url);
			}
			return true;
		} catch {
			for (const url of uniqueUrls) this.pendingImageDeletions.add(url);
			return false;
		}
	}

	triggerToast(message: string, type: 'success' | 'error') {
		this.toast = { message, type };
		setTimeout(() => {
			this.toast = null;
		}, 2000);
	}

	reset() {
		void this.discardPendingImages();
		this.path = '';
		this.originalContent = '';
		this.currentContent = '';
		this.mode = '';
		this.version = '';
	}
}

export const editorState = new EditorState();
