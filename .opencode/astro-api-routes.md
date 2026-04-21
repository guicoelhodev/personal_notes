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
  "@milkdown/crepe": "^x.x.x",
  "astro": "^6.1.5",
  "tailwindcss": "^4.2.2"
}
```

## Current Prerender Status

| Page | Prerender | Status |
|------|-----------|--------|
| `src/pages/index.astro` | `true` | Static |
| `src/pages/[...slug].astro` | `true` | Static |
| `src/pages/new-file.astro` | `false` | SSR (Vercel function) |

## API Routes (Planned)

### File: `src/pages/api/docs/[...path].ts`

This is a catch-all route that handles all operations on docs files.

The dynamic parameter `path` comes from the URL. For example:
- `GET /api/docs` → `Astro.params.path` is `undefined`
- `GET /api/docs/threlte/rapier-guide.md` → `Astro.params.path` is `threlte/rapier-guide.md`

### Full Example

```ts
import type { APIRoute } from 'astro'
import { listDocsTree, getFile, saveFile, deleteFile } from '../../lib/github'

export const prerender = false

export const GET: APIRoute = async ({ params, url }) => {
  const { path } = params

  try {
    if (!path) {
      const tree = await listDocsTree()
      return new Response(JSON.stringify(tree), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const file = await getFile(path)
    return new Response(JSON.stringify(file), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const status = error?.status || 500
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const PUT: APIRoute = async ({ params, request }) => {
  const { path } = params

  if (!path) {
    return new Response(JSON.stringify({ error: 'Path is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { content, sha, message } = body
    const commitMessage = message || `Update ${path}`
    const newSha = await saveFile(path, content, sha)

    return new Response(JSON.stringify({ sha: newSha }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const status = error?.status || 500
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const { path } = params

  if (!path) {
    return new Response(JSON.stringify({ error: 'Path is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { sha, message } = body
    await deleteFile(path, sha)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    const status = error?.status || 500
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

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

## APIRoute Type

```ts
import type { APIRoute } from 'astro'
```

The `APIRoute` type provides:

- `Astro.params` — URL parameters from dynamic route segments
- `Astro.request` — The incoming `Request` object
- `Astro.url` — The parsed URL
- `Astro.cookies` — Cookie access
- `Astro.redirect(path, status)` — Helper for redirects

## Important Notes

- API routes are **server-side only** — they run on the server, never in the browser
- Environment variables like `GITHUB_TOKEN` are only accessible server-side
- Return `new Response()` with appropriate status codes and headers
- Always set `Content-Type` header for JSON responses
- The `[...path]` catch-all route captures the rest of the URL after `/api/docs/`
- Astro 6 removed `output: 'hybrid'` — use `prerender = false` on individual pages instead
