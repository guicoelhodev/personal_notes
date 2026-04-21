# Astro API Routes — Vercel Adapter

## Overview

The project uses Astro 6 with the `@astrojs/vercel` adapter. In Astro 6, `output: 'hybrid'` was removed — the default static output now supports per-page prerendering. Pages are prerendered by default; set `export const prerender = false` on pages that need SSR.

- Pages with `export const prerender = true` (or no export) are built at build time (static)
- Pages with `export const prerender = false` are rendered on demand (SSR)
- Files in `src/pages/api/` become server-side API endpoints

## Current Configuration

### astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

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
```

Note: No `output` field — Astro 6 defaults to static with per-page prerender control.

### Dependencies

```json
{
  "@astrojs/vercel": "^x.x.x",
  "@milkdown/crepe": "^7.20.0",
  "astro": "^6.1.5",
  "tailwindcss": "^4.2.2",
  "fuse.js": "^7.3.0"
}
```

### Vite Override

Astro requires Vite 7. Added to `package.json`:

```json
"overrides": {
  "vite": "^7"
}
```

## Current Prerender Status

| Page | Prerender | Status |
|------|-----------|--------|
| `src/pages/index.astro` | `true` | Static |
| `src/pages/[...slug].astro` | `true` | Static |
| `src/pages/file.astro` | `false` | SSR (file viewer/editor) |
| `src/pages/api/docs/[...path].ts` | `false` | SSR (docs tree API) |
| `src/pages/api/save.ts` | `false` | SSR (file save API) |

## API Routes

### `GET /api/docs` — List docs tree

Returns the full recursive tree of files under `docs/`.

**File**: `src/pages/api/docs/[...path].ts`

```
GET /api/docs → listDocsTree()
```

### `PUT /api/save` — Update file

Updates an existing file on GitHub. Receives `{ path, content }`, fetches the current SHA internally, and pushes the update.

**File**: `src/pages/api/save.ts`

```ts
export const PUT: APIRoute = async ({ request }) => {
  const { path, content } = await request.json()
  // path: relative path under docs/ (e.g. "notes/file.md")
  // content: raw markdown string
  await updateFile(path, content)
  return { success: true }
}
```

Commit message format: `docs: update {path}`

### Planned routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/docs/[...path]` | Get individual file content + SHA |
| `PUT` | `/api/docs/[...path]` | Create new file |
| `DELETE` | `/api/docs/[...path]` | Delete file |

## Environment Variables

### Local development

Create `app/.env`:

```
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=guicoelhodev
GITHUB_REPO=AI_notes
```

### Vercel deployment

Configure in Vercel dashboard under **Settings > Environment Variables**.

## Important Notes

- API routes are **server-side only** — they run on the server, never in the browser
- Environment variables like `GITHUB_TOKEN` are only accessible server-side
- Return `new Response()` with appropriate status codes and headers
- Always set `Content-Type` header for JSON responses
- Astro 6 removed `output: 'hybrid'` — use `prerender = false` on individual pages instead
