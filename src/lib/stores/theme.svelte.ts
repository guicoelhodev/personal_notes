export type ThemeName = 'catpuccin' | 'tokyo-night' | 'gruvbox' | 'solarized' | 'rose-pine';
export type ThemeVariant = 'light' | 'dark';

interface ThemeConfig {
	name: ThemeName;
	variant: ThemeVariant;
}

const STORAGE_KEY = 'theme-config';

class ThemeState {
	name = $state<ThemeName>('rose-pine');
	variant = $state<ThemeVariant>('dark');

	private getInitial(): ThemeConfig {
		if (typeof window === 'undefined') {
			return { name: 'rose-pine', variant: 'dark' };
		}
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as ThemeConfig;
				if (['catpuccin', 'tokyo-night', 'gruvbox', 'solarized', 'rose-pine'].includes(parsed.name) &&
					['light', 'dark'].includes(parsed.variant)) {
					return parsed;
				}
			} catch {
				return { name: 'rose-pine', variant: 'dark' };
			}
		}
		return { name: 'rose-pine', variant: 'dark' };
	}

	constructor() {
		if (typeof window !== 'undefined') {
			const initial = this.getInitial();
			this.name = initial.name;
			this.variant = initial.variant;
		}
	}

	setTheme(name: ThemeName) {
		this.name = name;
	}

	toggleVariant() {
		this.variant = this.variant === 'dark' ? 'light' : 'dark';
	}

	sync() {
		if (typeof window !== 'undefined') {
			const config: ThemeConfig = { name: this.name, variant: this.variant };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
			document.documentElement.setAttribute('data-theme', `${this.name}-${this.variant}`);
		}
	}
}

export const themeState = new ThemeState();