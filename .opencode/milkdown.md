# Milkdown Crepe — WYSIWYG Markdown Editor

## What is it

`@milkdown/crepe` is a plugin-driven WYSIWYG markdown editor inspired by Typora, built on top of ProseMirror and Remark. It renders markdown visually as you type — no separate preview pane needed.

It works with **vanilla JS** — no framework integration (React, Svelte, etc.) required.

## Installation

```bash
npm install @milkdown/crepe
```

## Current Implementation

The editor is at `src/pages/new-file.astro`, rendered inside the app's Layout (with sidebar and theme toggle).

### CSS Setup

Two CSS files are involved:

1. **`src/milkdown.css`** — Imports the Milkdown common theme and maps all `--crepe-*` variables to the app's design tokens (`--color-base`, `--color-text`, `--color-heading`, etc.). Also contains typography styles (headings, paragraphs, lists, blockquotes, code, tables) aligned with Tailwind Typography.
2. **`src/global.css`** — App's design tokens and prose styles.

The Milkdown theme uses only `common/style.css` (structural/layout). Colors and fonts are fully controlled by the app's CSS variables, so dark/light mode works automatically via the `.light` class on `<html>`.

```astro
---
// src/pages/new-file.astro
import Layout from "../layout/Layout.astro";
import "../milkdown.css";

export const prerender = false;
---

<Layout title="New File — AI Notes">
  <div id="editor" class="h-full"></div>

  <script>
    import { Crepe } from "@milkdown/crepe";

    const editor = new Crepe({
      root: "#editor",
      defaultValue: "# Title page\n\nUse / and start writing",
    });

    editor.create();
  </script>
</Layout>
```

### Font Configuration

Fonts are set to Tailwind CSS defaults in `src/milkdown.css`:

```css
--crepe-font-title: system-ui, -apple-system, sans-serif;
--crepe-font-default: system-ui, -apple-system, sans-serif;
--crepe-font-code: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### Heading Colors

All headings (`h1`-`h6`) inside `.milkdown .ProseMirror` use `var(--color-heading)` (blue).

### Typography Styles

The `src/milkdown.css` file contains typography rules for `.milkdown .ProseMirror` that mirror Tailwind Typography's `.prose`:

- Headings with descending sizes, `border-bottom` on `h2`
- Paragraphs, lists, blockquotes, links, code (inline and block), tables, hr, images
- All colors derived from app CSS variables

## API Reference

### Constructor

```ts
const editor = new Crepe({
  root: '#editor',           // DOM element or CSS selector
  defaultValue: '# Hello',   // Initial markdown content (string)
  features: {                // Toggle features on/off
    [Crepe.Feature.Toolbar]: true,
    [Crepe.Feature.Slash]: true,
  },
  featureConfigs: {          // Configure individual features
    // ...
  },
})
```

### Methods

| Method | Description |
|--------|-------------|
| `editor.create()` | Mount the editor into the DOM |
| `editor.destroy()` | Remove the editor from the DOM |
| `editor.getMarkdown()` | Returns the current markdown content as a string |
| `editor.setReadonly(bool)` | Toggle readonly mode |
| `editor.on(fn)` | Register event listeners via `ListenerManager` |
| `editor.editor` | Access the underlying Milkdown `Editor` instance |

### Features (built-in)

Controlled via the `features` option using `Crepe.Feature` enum:

- `Crepe.Feature.Toolbar` — Floating toolbar for formatting
- `Crepe.Feature.Slash` — Slash command menu (`/`)
- `Crepe.Feature.Placeholder` — Placeholder text
- `Crepe.Feature.ImageBlock` — Block-style image editing
- `Crepe.Feature.BlockEdit` — Drag-and-drop block reordering
- `Crepe.Feature.Cursor` — Cursor position info
- `Crepe.Feature.Listener` — Event listener support
- `Crepe.Feature.History` — Undo/redo
- `Crepe.Feature.Clipboard` — Copy/paste
- `Crepe.Feature.Indent` — Indentation (4 spaces)
- `Crepe.Feature.Trailing` — Trailing paragraph
- `Crepe.Feature.Upload` — Image upload
- `Crepe.Feature.Commonmark` — Standard markdown (headings, bold, italic, links, images, code, lists, blockquotes, horizontal rules)
- `Crepe.Feature.GFM` — GitHub Flavored Markdown (tables, task lists, strikethrough, autolinks)

All features are enabled by default.

### Getting Markdown for Save

```js
const markdown = editor.getMarkdown()
// "# Title page\n\nUse / and start writing"
```

### Event Listeners

```js
editor.on((listener) => {
  listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
    console.log('Content changed:', markdown)
  })
})
```
