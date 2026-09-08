# Repository Guide

## Toolchain

- Use npm with `package-lock.json`; Node must satisfy Vite's requirement documented here: 20.19+ or 22.12+.
- `npm run check` runs `svelte-kit sync` before `svelte-check`; do not edit generated `.svelte-kit` files.
- `npm run lint` checks Prettier before ESLint. Run one test file with `npm test -- tests/paths.test.ts`, or one case with `npm test -- -t "rejects traversal"`.
- Vitest only discovers `tests/**/*.test.ts` and runs in Node. Browser-storage tests install `fake-indexeddb` explicitly.

## Architecture

- The app is SvelteKit 2/Svelte 5 with runes forced for project code by `svelte.config.js`; state modules live in `src/lib/stores/*.svelte.ts`.
- `/file` is client-only (`src/routes/file/+page.ts`) because Milkdown and the guest workspace require browser APIs.
- `src/lib/client/workspace.ts` selects the HTTP workspace for authenticated/share sessions and IndexedDB for guests. An unauthorized normal write falls back to the guest workspace; an active share session does not.
- Server flow is `src/routes/api` -> `src/lib/server/application` -> `src/lib/server/ports` -> `src/lib/server/adapters/s3`. Keep AWS SDK details inside the S3 adapter and wire implementations in `src/lib/server/container.ts`.
- S3 stores Markdown under `docs/` and assets under `images/`. Document ETags are optimistic-concurrency versions; updates require a version, and renames use temporary metadata locks with recovery logic.

## Security And Data

- `src/hooks.server.ts` enforces same-origin checks for every non-GET API request, but authentication is split: it centrally protects rename/delete/share creation while save/upload/image cleanup also authorize authenticated or scoped share access inside their handlers. Preserve both layers when changing mutations.
- Server configuration comes from `$env/dynamic/private`. `.env.example` is authoritative for variables, including `SHARE_LINK_SECRET`, which is required to create share links.
- Guest IndexedDB data and authenticated S3 data are intentionally separate; login must not migrate, publish, or delete guest content.
- `npm run migrate:s3 -- --dry-run` needs no credentials. The real migration reads `src/lib/docs` and `.github/images`, refuses differing existing objects unless `--overwrite` is passed, then verifies uploaded keys; retain those source files until production migration is confirmed.
