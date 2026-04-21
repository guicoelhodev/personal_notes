// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	adapter: vercel(),
	markdown: {
		shikiConfig: {
			theme: 'tokyo-night'
		}
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
