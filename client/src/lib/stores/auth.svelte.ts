import type { GithubUser } from '$lib/github';

class AuthState {
	user = $state<GithubUser | null>(null);
	status = $state<'idle' | 'loading' | 'authorized' | 'unauthorized'>('idle');

	get isAuthorized() {
		return this.status === 'authorized' && this.user !== null;
	}

	get username() {
		return this.user?.login ?? null;
	}

	get avatarUrl() {
		return this.user?.avatar_url ?? null;
	}

	login() {
		window.location.href = '/auth/login';
	}

	async logout() {
		await fetch('/auth/logout', { method: 'POST' });
		this.user = null;
		this.status = 'unauthorized';
	}

	async fetchCurrentUser() {
		this.status = 'loading';

		const res = await fetch('/api/auth/me');
		if (!res.ok) {
			this.status = 'unauthorized';
			return;
		}

		const data = await res.json();
		this.user = data.user;
		this.status = 'authorized';
		console.log('Logged in as:', this.user?.login);
	}
}

export const authState = new AuthState();