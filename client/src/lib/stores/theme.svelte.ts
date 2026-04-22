class ThemeState {
	theme = $state<'dark' | 'light'>(this.getInitial());

	private getInitial(): 'dark' | 'light' {
		if (typeof window === 'undefined') return 'dark';
		return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
	}

	toggle() {
		this.theme = this.theme === 'dark' ? 'light' : 'dark';
	}

	constructor() {
		if (typeof window !== 'undefined') {
			this.theme = this.getInitial();
		}
	}

	sync() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('theme', this.theme);
			document.documentElement.classList.toggle('light', this.theme === 'light');
		}
	}
}

export const themeState = new ThemeState();
