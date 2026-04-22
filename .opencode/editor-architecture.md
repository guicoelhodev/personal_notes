# Editor Architecture — GitHub Markdown Editor for AI_notes

## Overview

A WYSIWYG markdown editor that reads from and writes to the GitHub repository via Astro server-side API routes. The editor uses Milkdown Crepe and runs entirely within the existing Astro site.

## Architecture Diagram

```
Browser (Client)                    Astro Server                    GitHub API
┌──────────────┐               ┌──────────────────┐           ┌──────────────┐
│              │   fetch()     │                  │  fetch()  │              │
│  Milkdown    │──────────────>│  API Routes      │──────────>│  Contents    │
│  Editor      │               │  /api/save.ts    │           │  API         │
│              │<──────────────│  /api/docs/*.ts  │<──────────│              │
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

### Key files

```
app/
├── src/
│   ├── lib/
│   │   └── github.ts                         # GitHub API helpers (getFile, listDocsTree, updateFile)
│   ├── components/
│   │   ├── Sidebar.astro                      # Sidebar with docs tree from GitHub API
│   │   ├── sidebar/
│   │   │   └── SidebarNode.astro              # Recursive tree node with folder toggle
│   │   ├── FolderActions.astro                # Create folder/file logic, plus button, popover actions
│   │   ├── PageActions.astro                  # Save button (Ctrl+S), loading state, toast notifications
│   │   ├── Popover.astro                      # Dumb reusable popover (trigger + positioning only)
│   │   ├── SearchModal.astro                  # Fuzzy search modal
│   │   └── ThemeToggle.astro                  # Dark/light theme toggle
│   ├── layout/
│   │   └── Layout.astro                       # Main layout: sidebar (static) + main content area
│   ├── pages/
│   │   ├── file.astro                         # File viewer/editor page (SSR), supports mode=create
│   │   └── api/
│   │       ├── docs/[...path].ts              # GET /api/docs — docs tree listing
│   │       └── save.ts                        # PUT /api/save — update file on GitHub
│   ├── icons/                                 # SVG icons (search, save, spinner, folder, file, three-dots, chevron-down, menu, sun, moon)
│   ├── milkdown.css                           # Milkdown theme mapped to app CSS variables
│   └── global.css                             # App design tokens (dark/light) + prose styles
```

### Layout structure

```
<body class="flex h-screen overflow-hidden">
  <aside class="w-64 shrink-0 overflow-y-auto">   <!-- Static sidebar -->
    <Sidebar />
  </aside>
  <main class="flex-1 min-w-0 min-h-0 overflow-hidden">
    <slot />                                      <!-- Page content -->
  </main>
</body>
```

The sidebar is static (not fixed/drawer). Scrolling happens inside the main content area.

## Data Flow

### List docs tree (sidebar)

```
Server (SSR)                     GitHub
  │                               │
  │── GET /git/trees/master ────>│
  │   ?recursive=1&path=docs/    │
  │<── tree array ───────────────│
  │                               │
  │   buildTree(paths)            │
  │   → render SidebarNode tree   │
```

### Open file for editing

```
Server (SSR)                     GitHub
  │                               │
  │── GET /contents/docs/{path} ─>│  (Accept: raw+json)
  │<── markdown text ────────────│
  │                               │
  │   render file.astro           │
  │   → Crepe({defaultValue})     │
  │   → window.__originalContent  │
  │   → window.__filePath         │
```

### Create file (in-place, no page reload)

```
Browser (already on /file)
  │
  │  [Plus button] or [Popover > Create File]
  │       │
  │  → inline input appears in sidebar <ul>
  │  → Enter → confirmFile()
  │       │
  │  → window.__loadEditor(path, "# Title\n", "create")
  │       │
  │  → destroys old Crepe editor
  │  → creates new Crepe editor (with placeholder)
  │  → updates __editor, __originalContent, __filePath, __mode
  │  → updates page title and URL via history.pushState
  │  → injects sidebar node with active highlight
  │
  │  Fallback: if not on /file page, does window.location.href (full reload)
```

### Create folder (in-place, no page reload)

```
Browser
  │
  │  [Popover > Create Folder]
  │       │
  │  → inline input appears in sidebar <ul>
  │  → Enter → confirmFolder()
  │       │
  │  → replaces input <li> with full folder node HTML
  │  → includes chevron toggle, plus button, popover (three-dots)
  │  → calls setupFolderActions() to bind new node events
```

### Save file (update)

```
Browser                          Server                          GitHub
  │                               │                               │
  │   Ctrl+S / click save         │                               │
  │       │                       │                               │
  │── PUT /api/save ────────────>│                               │
  │   { path, content }           │── GET /contents/docs/{path} ─>│
  │                               │<── { sha } ─────────────────│
  │                               │                               │
  │                               │── PUT /contents/docs/{path} ─>│
  │                               │   { message, content, sha }  │
  │                               │<── 200 OK ──────────────────│
  │<── { success: true } ────────│                               │
  │                               │                               │
  │   toast "Saved successfully"  │                               │
  │   update __originalContent    │                               │
```

### No changes to save

```
Browser
  │
  │   editor.getMarkdown().trim() === __originalContent.trim()
  │       │
  │   toast "No changes to save"
```

## Implementation Progress

- [x] Install `@astrojs/vercel` and `@milkdown/crepe`
- [x] Configure `astro.config.mjs` with Vercel adapter
- [x] Add `prerender = true` to existing static pages
- [x] Create GitHub API helper (`src/lib/github.ts`) — `getFile`, `listDocsTree`, `updateFile`
- [x] Create API route `GET /api/docs` for docs tree listing
- [x] Create API route `PUT /api/save` for file updates
- [x] File viewer page (`file.astro`) — loads content from GitHub, renders Milkdown editor
- [x] File tree sidebar with collapsible folders and active state highlighting
- [x] Save button with Ctrl+S shortcut, loading spinner, disabled state
- [x] Toast notifications (no changes, saved, error)
- [x] Change detection — compares editor content with original from API
- [x] Popover component on folder nodes (three-dots menu, fixed positioning to avoid overflow clipping)
- [x] Layout fixes — static sidebar, proper flex container, scroll inside editor
- [x] Create file via popover action (in-place, no page reload, with sidebar injection)
- [x] Create folder via popover action (in-place DOM rendering with event re-binding)
- [ ] Delete file functionality
- [ ] Handle SHA conflicts (409)
- [ ] Loading states for initial file load

## Client-side Global State

The editor exposes globals on `window`:

| Variable | Type | Description |
|----------|------|-------------|
| `window.__editor` | `Crepe` | Milkdown Crepe editor instance |
| `window.__originalContent` | `string` | Original content from API (for change detection) |
| `window.__filePath` | `string` | Current file path relative to `docs/` (e.g. `"notes/file.md"`) |
| `window.__mode` | `string` | Current mode: `""` (edit) or `"create"` |
| `window.__loadEditor` | `function` | Destroys current editor, creates new one in-place, updates globals, URL, sidebar |

## Components

### PageActions

Bottom bar with file path display and save button.

- Save button: styled like search button (icon + kbd shortcut)
- Loading state: spinner icon replaces save icon, button disabled
- Toast: fixed bottom-right, auto-dismiss after 2s

### Popover

Dumb/reusable popover component — UI only, no business logic.

- Trigger: three-dots icon (visible on parent hover via `group-hover:opacity-100`)
- Menu: positioned via JS using `getBoundingClientRect()` of trigger
- Auto-closes on outside click
- Actions are passed via `<slot />` (managed by FolderActions)

### FolderActions

Owns all create folder/file logic. Used inside SidebarNode for folder rows.

- **Plus button** (`.folder-add-btn`): directly triggers `handleCreateFile(ul)`
- **Popover actions**: listens for clicks on `.popover-action[data-action]`
- `handleCreateFile(ul)`: creates inline input, validates (blocks `,` and `.`), on Enter calls `window.__loadEditor()` (in-place) or falls back to `window.location.href`
- `handleCreateFolder(ul)`: creates inline input, on Enter renders full folder node HTML with chevron, plus button, and popover, then calls `setupFolderActions()` to rebind events
- Uses `dataset.folderActionsSetup` flag to prevent duplicate listeners
- New folders created dynamically include their own FolderActions (plus + popover) via inline HTML

### SidebarNode

Recursive tree node for folder/file navigation.

- Folders: collapsible with chevron arrow (left of title) + popover (right of title)
- Files: link to `/file?path={slug}.md`
- Active state highlighting based on `currentSlug`
- Auto-opens folders containing the active file

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | Personal Access Token with `repo` scope | `ghp_xxxxxxxxxxxx` |
| `GITHUB_OWNER` | Repository owner | `guicoelhodev` |
| `GITHUB_REPO` | Repository name | `AI_notes` |

## Important Considerations

- **PAT security** — The token is only used server-side (in API routes). It never reaches the browser.
- **Static sidebar** — Sidebar is a flex item, not fixed. Scroll happens inside main content.
- **Save API** — Uses `PUT` method. Server fetches SHA internally before pushing update.
- **Commit message format** — `docs: update {path}` (e.g., `docs: update notes/file.md`)
- **Rate limits** — GitHub allows 5,000 authenticated requests per hour.
- **File size** — GitHub Contents API has a 1 MB limit per file.
- **SHA conflicts** — If a file is modified externally, GitHub returns 409. Not yet handled.
