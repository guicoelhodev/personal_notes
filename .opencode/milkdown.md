# Milkdown Crepe — WYSIWYG Markdown Editor

## What is it

`@milkdown/crepe` is a plugin-driven WYSIWYG markdown editor inspired by Typora, built on top of ProseMirror and Remark. It renders markdown visually as you type — no separate preview pane needed.

It works with **vanilla JS** — no framework integration (React, Svelte, etc.) required.

## Current Implementation

The editor is at `src/pages/file.astro`, rendered inside the app's Layout with sidebar. The editor loads content from GitHub (via SSR) and saves back via `PUT /api/save`.

### Editor initialization

```js
const editor = new Crepe({
  root: "#editor",
  defaultValue: content,  // loaded from GitHub API via SSR
});
editor.create();

// Expose globally for save functionality
window.__editor = editor;
window.__originalContent = content;
window.__filePath = path;
```

The editor starts in **edit mode** (not readonly). No toggle between edit/view — it's always editable.

### CSS Setup

1. **`src/milkdown.css`** — Imports the Milkdown common theme and maps all `--crepe-*` variables to the app's design tokens (`--color-base`, `--color-text`, `--color-heading`, etc.). Also contains typography styles (headings, paragraphs, lists, blockquotes, code, tables) aligned with Tailwind Typography.
2. **`src/global.css`** — App's design tokens (dark/light) and prose styles.

The Milkdown theme uses only `common/style.css` (structural/layout). Colors and fonts are fully controlled by the app's CSS variables, so dark/light mode works automatically via the `.light` class on `<html>`.

### Font Configuration

```css
--crepe-font-title: system-ui, -apple-system, sans-serif;
--crepe-font-default: system-ui, -apple-system, sans-serif;
--crepe-font-code: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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

### Getting Markdown for Save

```js
const markdown = editor.getMarkdown()
```

### Event Listeners

```js
editor.on((listener) => {
  listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
    console.log('Content changed:', markdown)
  })
})
```
