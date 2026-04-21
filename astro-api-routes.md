# Astro API Routes — Hybrid Mode + Vercel

## Overview

The project currently runs as a **static site** (Astro's default `output: 'static'`). To add API routes for the GitHub editor, we need to switch to **hybrid mode** and add the Vercel adapter.

In hybrid mode:
- Pages with `export const prerender = true` are built at build time (static)
- Pages without `prerender` or with `export const prerender = false` are rendered on demand (SSR)
- Files in `src/pages/api/` become server-side API endpoints

## Configuration

### Install Vercel adapter

```bash
npx astro add vercel
```

This adds `@astrojs/vercel` to dependencies and updates `astro.config.mjs`.

### Update astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'hybrid',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

## API Routes

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

## Existing Pages

The current pages use `getStaticPaths()` which requires static prerendering. Add this export to keep them static:

```astro
---
// src/pages/[...slug].astro
export const prerender = true

export async function getStaticPaths() {
  // ... existing code
}
---
```

The `index.astro` page is already static by default in hybrid mode.

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
