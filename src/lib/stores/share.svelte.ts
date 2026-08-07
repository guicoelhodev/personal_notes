export interface SharedAccess {
	path: string;
	expireAt: number;
	mode: 'view' | 'edit';
	shareAll: boolean;
}

class ShareState {
	token = $state<string | null>(null);
	access = $state<SharedAccess | null>(null);
	isLoading = $state(false);

	get isActive(): boolean {
		return this.token !== null;
	}

	get shareAll(): boolean {
		return this.access?.shareAll === true;
	}

	canEdit(path: string): boolean {
		return this.access?.mode === 'edit' && this.access.path === path;
	}

	sync(token: string | null) {
		if (token === this.token) return;
		this.token = token;
		this.access = null;
		if (!token) return;
		void this.validate(token);
	}

	fileUrl(path: string): string {
		const params = new URLSearchParams({ path });
		if (this.token) params.set('token', this.token);
		return `/file?${params}`;
	}

	requestHeaders(): HeadersInit {
		return this.token ? { 'X-Share-Token': this.token } : {};
	}

	private async validate(token: string) {
		this.isLoading = true;
		try {
			const response = await fetch('/api/share', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
			if (!response.ok || this.token !== token) return;
			this.access = await response.json();
		} finally {
			if (this.token === token) this.isLoading = false;
		}
	}
}

export const shareState = new ShareState();
