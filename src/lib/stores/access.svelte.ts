import { browser } from '$app/environment';

export type AccessMode = 'unknown' | 'guest' | 'authenticated';
type ModalStep = 'choose' | 'password';

const GUEST_PREFERENCE = 'personal-notes-guest-mode';

class AccessState {
	mode = $state<AccessMode>('unknown');
	isInitialized = $state(false);
	isModalOpen = $state(false);
	modalStep = $state<ModalStep>('choose');
	isAuthenticating = $state(false);
	error = $state('');
	private initialization: Promise<void> | null = null;
	private pending: Array<(mode: AccessMode | null) => void> = [];

	initialize(): Promise<void> {
		if (!browser || this.isInitialized) return Promise.resolve();
		if (this.initialization) return this.initialization;
		this.initialization = this.loadSession();
		return this.initialization;
	}

	async ensureWriteAccess(): Promise<AccessMode | null> {
		await this.initialize();
		if (this.mode !== 'unknown') return this.mode;
		this.error = '';
		this.modalStep = 'choose';
		this.isModalOpen = true;
		return new Promise((resolve) => this.pending.push(resolve));
	}

	selectGuest() {
		localStorage.setItem(GUEST_PREFERENCE, 'true');
		this.mode = 'guest';
		this.finish('guest');
	}

	showPassword() {
		this.error = '';
		this.modalStep = 'password';
	}

	openAuthentication() {
		this.error = '';
		this.modalStep = 'password';
		this.isModalOpen = true;
	}

	back() {
		this.error = '';
		this.modalStep = 'choose';
	}

	async authenticate(password: string): Promise<boolean> {
		const wasGuest = this.mode === 'guest';
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
				this.error = data?.error || 'Não foi possível autenticar';
				return false;
			}
			localStorage.removeItem(GUEST_PREFERENCE);
			this.mode = 'authenticated';
			this.finish('authenticated');
			if (wasGuest) window.location.reload();
			return true;
		} catch {
			this.error = 'Não foi possível conectar ao servidor';
			return false;
		} finally {
			this.isAuthenticating = false;
		}
	}

	async logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		this.mode = 'unknown';
		localStorage.removeItem(GUEST_PREFERENCE);
	}

	cancel() {
		this.finish(null);
	}

	handleUnauthorized() {
		this.mode = 'unknown';
		this.error = 'Sua sessão expirou. Autentique novamente.';
		this.modalStep = 'password';
		this.isModalOpen = true;
	}

	private async loadSession() {
		try {
			const response = await fetch('/api/auth/session');
			const data = response.ok ? await response.json() : { authenticated: false };
			if (data.authenticated) this.mode = 'authenticated';
			else if (localStorage.getItem(GUEST_PREFERENCE) === 'true') this.mode = 'guest';
		} catch {
			if (localStorage.getItem(GUEST_PREFERENCE) === 'true') this.mode = 'guest';
		} finally {
			this.isInitialized = true;
		}
	}

	private finish(mode: AccessMode | null) {
		this.isModalOpen = false;
		const pending = this.pending.splice(0);
		for (const resolve of pending) resolve(mode);
	}
}

export const accessState = new AccessState();
