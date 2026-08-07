import { browser } from '$app/environment';

export type AccessMode = 'unknown' | 'guest' | 'authenticated';

class AccessState {
	mode = $state<AccessMode>('unknown');
	isInitialized = $state(false);
	isAuthenticating = $state(false);
	error = $state('');
	private initialization: Promise<void> | null = null;

	initialize(): Promise<void> {
		if (!browser || this.isInitialized) return Promise.resolve();
		if (this.initialization) return this.initialization;
		this.initialization = this.loadSession();
		return this.initialization;
	}

	async authenticate(password: string): Promise<boolean> {
		this.isAuthenticating = true;
		this.error = '';
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				this.error = data?.error || 'Authentication failed';
				return false;
			}
			this.mode = 'authenticated';
			return true;
		} catch {
			this.error = 'Could not connect to the server';
			return false;
		} finally {
			this.isAuthenticating = false;
		}
	}

	async logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		this.mode = 'guest';
	}

	handleUnauthorized() {
		this.mode = 'guest';
		this.error = 'Your session expired. Authenticate again.';
	}

	private async loadSession() {
		try {
			const response = await fetch('/api/auth/session');
			const data = response.ok ? await response.json() : { authenticated: false };
			this.mode = data.authenticated ? 'authenticated' : 'guest';
		} catch {
			this.mode = 'guest';
		} finally {
			this.isInitialized = true;
		}
	}
}

export const accessState = new AccessState();
