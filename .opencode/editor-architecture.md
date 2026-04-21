# Editor Architecture — GitHub Markdown Editor for AI_notes

## Overview

A WYSIWYG markdown editor that reads from and writes to the GitHub repository via Astro server-side API routes. The editor uses Milkdown Crepe and runs entirely within the existing Astro site.

## Architecture Diagram

```
Browser (Client)                    Astro Server                    GitHub API
┌──────────────┐               ┌──────────────────┐           ┌──────────────┐
│              │   fetch()     │                  │  fetch()  │              │
│  Milkdown    │──────────────>│  API Route       │──────────>│  Contents    │
│  Editor      │               │  [...path].ts    │           │  API         │
│              │<──────────────│                  │<──────────│              │
│              │   JSON        │  github.ts       │  JSON     │              │
└──────────────┘               └──────────────────┘           └──────────────┘
                                      │
                                      │ GITHUB_TOKEN
                                      │ (env variable)
                                      │
                               ┌──────────────────┐
                               │  GitHub Repo     │
                               │  AI_notes/docs/  │
                               └──────────────────┘
```

## Current File Structure

### Created files

```
app/
├── src/
│   ├── milkdown.css                         # Milkdown theme + typography styles
│   ├── pages/
│   │   └── new-file.astro                   # Editor page (SSR, prerender = false)
```

### Modified files

```
app/
├── astro.config.mjs                         # Added @astrojs/vercel adapter (no output: 'hybrid', removed in Astro 6)
├── package.json                             # Added @astrojs/vercel + @milkdown/crepe
├── src/
│   ├── components/
│   │   └── Sidebar.astro                    # Added "Criar +" button at bottom
│   └── pages/
│       ├── index.astro                      # Added export const prerender = true
│       └── [...slug].astro                  # Added export const prerender = true
```

### Planned files (not yet created)

```
app/
├── src/
│   ├── lib/
│   │   └── github.ts                        # GitHub API helper functions
│   └── pages/
│       └── api/
│           └── docs/
│               └── [...path].ts             # API route (SSR)
```

## Data Flow

### List docs tree (planned)

```
Browser                          Server                          GitHub
  │                               │                               │
  │── GET /api/docs ────────────>│                               │
  │                               │── GET /git/trees/main ──────>│
  │                               │<── tree array ───────────────│
  │<── JSON [{name,path,sha}] ───│                               │
```

### Open file for editing (planned)

```
Browser                          Server                          GitHub
  │                               │                               │
  │── GET /api/docs/threlte/x.md >│                               │
  │                               │── GET /contents/docs/threlte/ │
  │                               │         x.md ────────────────>│
  │                               │<── {content, sha} ───────────│
  │                               │                               │
  │                               │   decode base64 → text       │
  │<── {content, sha} ────────────│                               │
  │                               │                               │
  │   Milkdown.create({           │                               │
  │     defaultValue: content     │                               │
  │   })                          │                               │
```

### Save file (update) (planned)

```
Browser                          Server                          GitHub
  │                               │                               │
  │   editor.getMarkdown()        │                               │
  │       │                       │                               │
  │── PUT /api/docs/threlte/x.md >│                               │
  │   { content, sha, message }   │   encode base64               │
  │                               │── PUT /contents/docs/threlte/ │
  │                               │   x.md {message,content,sha}  >│
  │                               │<── { content.sha } ──────────│
  │<── { sha: "new-sha" } ────────│                               │
```

### Create new file (planned)

Same as save, but omit `sha` in the PUT body.

### Delete file (planned)

```
Browser                          Server                          GitHub
  │                               │                               │
  │── DELETE /api/docs/threlte/x >│                               │
  │   { sha, message }            │── DELETE /contents/docs/threl>│
  │                               │        /x.md {sha, message}  >│
  │                               │<── 200 OK ──────────────────│
  │<── { success: true } ─────────│                               │
```

## Implementation Progress

- [x] Install `@astrojs/vercel` and `@milkdown/crepe`
- [x] Configure `astro.config.mjs` with Vercel adapter
- [x] Add `prerender = true` to existing static pages (`index.astro`, `[...slug].astro`)
- [x] Create editor page at `src/pages/new-file.astro` with Milkdown Crepe
- [x] Add "Criar +" button in sidebar linking to `/new-file`
- [x] Theme integration — Milkdown uses app CSS variables for colors and fonts
- [x] Typography styles — headings, paragraphs, lists, blockquotes, code, tables
- [x] Tailwind v4 canonical class syntax (`(--color-*)` instead of `[var(--color-*)]`)
- [ ] Create GitHub API helper (`src/lib/github.ts`)
- [ ] Create API route (`src/pages/api/docs/[...path].ts`)
- [ ] Connect save button to API route
- [ ] Connect load from API route for editing existing files
- [ ] File tree sidebar in editor page
- [ ] Delete file functionality
- [ ] New file creation via API
- [ ] Handle SHA conflicts (409)
- [ ] Loading and error states

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Personal Access Token with `repo` scope | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | Repository owner | `guicoelhodev` |
| `GITHUB_REPO` | Repository name | `AI_notes` |

## Important Considerations

- **Static pages remain static** — The existing doc viewer pages (`index.astro`, `[...slug].astro`) are prerendered. Changes made via the editor are committed to GitHub and reflected on the next build/deploy.
- **PAT security** — The token is only used server-side (in the API route). It never reaches the browser.
- **Rate limits** — GitHub allows 5,000 authenticated requests per hour. The editor should handle rate limit errors gracefully.
- **File size** — GitHub Contents API has a 1 MB limit per file.
- **SHA conflicts** — If a file is modified externally between read and write, GitHub returns 409. The editor should re-fetch the file and prompt the user.
- **Vercel function size** — The `@milkdown/crepe` package is client-side only (loaded in the browser). The API route only uses `fetch` to call GitHub, so server bundle size is minimal.
- **Astro 6** — `output: 'hybrid'` was removed. Use `prerender = false` on individual pages for SSR.
