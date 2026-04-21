# Milkdown Crepe — WYSIWYG Markdown Editor

## What is it

`@milkdown/crepe` is a plugin-driven WYSIWYG markdown editor inspired by Typora, built on top of ProseMirror and Remark. It renders markdown visually as you type — no separate preview pane needed.

It works with **vanilla JS** — no framework integration (React, Svelte, etc.) required.

## Installation

```bash
npm install @milkdown/crepe
```

## Setup in Astro

Import the theme CSS and initialize the editor inside a `<script>` tag:

```astro
---
// src/pages/editor/[...editPath].astro
export const prerender = false
---

<html>
  <head>
    <meta charset="utf-8" />
    <title>Editor</title>
  </head>
  <body>
    <div id="editor"></div>

    <script>
      import { Crepe } from '@milkdown/crepe'
      import '@milkdown/crepe/theme/style.css'

      async function init() {
        const path = window.location.pathname.replace('/editor/', '')

        // Fetch markdown content from our Astro API route
        const res = await fetch(`/api/docs/${path}`)
        const data = await res.json()

        const editor = new Crepe({
          root: '#editor',
          defaultValue: data.content || '',
        })

        editor.create()

        // Expose for save button
        window.__editor = editor
      }

      init()
    </script>
  </body>
</html>
```

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
const markdown = window.__editor.getMarkdown()
// "# Hello World\n\nSome content..."
```

### Event Listeners

```js
editor.on((listener) => {
  listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
    console.log('Content changed:', markdown)
  })
})
```

## CSS

The theme is headless by default. Import the built-in theme:

```js
import '@milkdown/crepe/theme/style.css'
```

For dark mode, the theme respects CSS custom properties. Toggle via a class on the root element.
