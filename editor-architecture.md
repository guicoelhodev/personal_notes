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

## Data Flow

### List docs tree

```
Browser                          Server                          GitHub
  │                               │                               │
  │── GET /api/docs ────────────>│                               │
  │                               │── GET /git/trees/main ──────>│
  │                               │<── tree array ───────────────│
  │<── JSON [{name,path,sha}] ───│                               │
```

### Open file for editing

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

### Save file (update)

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

### Create new file

Same as save, but omit `sha` in the PUT body.

### Delete file

```
Browser                          Server                          GitHub
  │                               │                               │
  │── DELETE /api/docs/threlte/x >│                               │
  │   { sha, message }            │── DELETE /contents/docs/threl>│
  │                               │        /x.md {sha, message}  >│
  │                               │<── 200 OK ──────────────────│
  │<── { success: true } ─────────│                               │
```

## File Structure

### New files to create

```
app/
├── src/
│   ├── lib/
│   │   └── github.ts                    # GitHub API helper functions
│   ├── pages/
│   │   ├── editor/
│   │   │   └── index.astro              # Editor page (SSR)
│   │   └── api/
│   │       └── docs/
│   │           └── [...path].ts         # API route (SSR)
```

### Existing files to modify

```
app/
├── astro.config.mjs                     # Add hybrid + vercel adapter
├── package.json                         # Add @astrojs/vercel + @milkdown/crepe
├── src/
│   └── pages/
│       └── [...slug].astro              # Add export const prerender = true
```

## Implementation Order

1. **Configure Astro for hybrid mode**
   - Install `@astrojs/vercel` (`npx astro add vercel`)
   - Update `astro.config.mjs` with `output: 'hybrid'` and adapter
   - Add `export const prerender = true` to `src/pages/[...slug].astro`

2. **Create GitHub helper** (`src/lib/github.ts`)
   - `listDocsTree()` — fetch recursive tree, filter docs
   - `getFile(path)` — fetch and decode file content
   - `saveFile(path, content, sha?)` — encode and push
   - `deleteFile(path, sha)` — delete via API
   - Base64 encode/decode utilities

3. **Create API route** (`src/pages/api/docs/[...path].ts`)
   - `GET` — list tree or read file
   - `PUT` — create or update file
   - `DELETE` — delete file
   - Error handling with proper status codes

4. **Install Milkdown**
   - `npm install @milkdown/crepe`

5. **Create editor page** (`src/pages/editor/index.astro`)
   - `export const prerender = false`
   - File tree sidebar (fetch from `GET /api/docs`)
   - Milkdown editor initialization
   - Save button → `PUT /api/docs/{path}`
   - New file button
   - Delete button
   - Loading and error states

6. **Style the editor**
   - Import Milkdown theme CSS
   - Layout: sidebar + editor area
   - Responsive design with Tailwind
   - Dark mode support

7. **Test full flow**
   - List → Open → Edit → Save → Verify on GitHub
   - Create new file
   - Delete file
   - Handle conflicts (SHA mismatch)

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
