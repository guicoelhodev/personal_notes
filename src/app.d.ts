// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Env {
			GITHUB_TOKEN: string;
			GITHUB_OWNER: string;
			GITHUB_REPO: string;
			GITHUB_BRANCH: string;
		}
	}
}

export { };
