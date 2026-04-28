<script lang="ts">
	import { themeState } from '$lib/stores/theme.svelte';
	import type { ThemeName } from '$lib/stores/theme.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeSelector from './ThemeSelector.svelte';

	const themes: { id: ThemeName; label: string; color: string }[] = [
		{ id: 'rose-pine', label: 'Rose Pine', color: '#c4a7e7' },
		{ id: 'catpuccin', label: 'Catpuccin', color: '#c6a0f6' },
		{ id: 'gruvbox', label: 'Gruvbox', color: '#fb4934' },
		{ id: 'solarized', label: 'Solarized', color: '#268bd2' },
		{ id: 'tokyo-night', label: 'Tokyo Night', color: '#7aa2f7' }
	];

	function handleThemeChange(themeId: string) {
		themeState.setTheme(themeId as ThemeName);
		themeState.sync();
	}
</script>

<div>
	<h3 class="mb-4 text-base font-semibold text-(--color-text)">Look and Feel</h3>

	<div class="flex items-center justify-between border-b border-(--color-muted)/20 py-3">
		<div>
			<span class="text-sm font-medium text-(--color-text)">Theme</span>
			<p class="text-xs text-(--color-muted)">Choose your preferred color palette</p>
		</div>
		<ThemeSelector options={themes} value={themeState.name} onchange={handleThemeChange} />
	</div>

	<div class="flex items-center justify-between py-3">
		<div>
			<span class="text-sm font-medium text-(--color-text)">Variant</span>
			<p class="text-xs text-(--color-muted)">Switch between light and dark</p>
		</div>
		<ThemeToggle />
	</div>
</div>

