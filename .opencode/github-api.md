# GitHub Contents API — Reference for the Editor

## Base URL

```
https://api.github.com/repos/{owner}/{repo}/contents/{path}
```

Environment variables used:

- `GITHUB_TOKEN` — Personal Access Token with `repo` scope
- `GITHUB_OWNER` — Repository owner (e.g., `guicoelhodev`)
- `GITHUB_REPO` — Repository name (e.g., `AI_notes`)

## Authentication

All requests must include:

```
Authorization: Bearer {GITHUB_TOKEN}
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2026-03-10
```

## Implemented Functions

### `getFile(path)` — Get raw file content

```
GET /repos/{owner}/{repo}/contents/docs/{path}
Accept: application/vnd.github.raw+json
```

Returns raw markdown text (not base64).

```ts
export async function getFile(path: string): Promise<string>
```

### `listDocsTree()` — List all docs recursively

```
GET /repos/{owner}/{repo}/git/trees/master:docs?recursive=1
```

Returns array of `{ path, type, sha }` entries.

```ts
interface TreeEntry {
  path: string
  type: string
  sha: string
}

export async function listDocsTree(): Promise<TreeEntry[]>
```

### `updateFile(path, content)` — Update existing file

1. `GET /contents/docs/{path}` → get current `sha`
2. Encode content to base64
3. `PUT /contents/docs/{path}` with `{ message, content, sha, branch }`

Commit message: `docs: update {path}`

```ts
export async function updateFile(path: string, content: string): Promise<void>
```

## Endpoints Reference

### List directory contents

```
GET /repos/{owner}/{repo}/contents/{path}
```

- Returns an array of objects for directories, a single object for files
- Each object: `{ name, path, type: "file"|"dir", sha, size, download_url }`

### Recursive tree (preferred for full directory listing)

```
GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

- Returns `{ tree: [{ path, type: "blob"|"tree", sha, size }] }`
- The current implementation scopes to `master:docs` to get only docs files

### Get file content

```
GET /repos/{owner}/{repo}/contents/{path}
Accept: application/vnd.github.raw+json  → raw text
Accept: application/vnd.github+json      → { content (base64), sha, ... }
```

### Create or update file

```
PUT /repos/{owner}/{repo}/contents/{path}
```

Request body:

```json
{
  "message": "Update file.md",
  "content": "base64-encoded-content",
  "sha": "abc123...",       // required for updates
  "branch": "master"
}
```

Key rules:
- Include `sha` → updates existing file
- Omit `sha` → creates new file (fails if file exists)

### Delete file

```
DELETE /repos/{owner}/{repo}/contents/{path}
```

Request body:

```json
{
  "message": "Delete file.md",
  "sha": "abc123..."
}
```

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | Success (PUT/DELETE) | — |
| `201` | Created (PUT without sha) | — |
| `404` | Not found | File or path doesn't exist |
| `409` | Conflict | SHA outdated — file modified since last read. Re-fetch and retry |
| `422` | Validation error | Missing required fields, or file already exists when creating |
| `403` | Forbidden | Token lacks permission or rate limit exceeded |

## Rate Limits

- **Authenticated**: 5,000 requests per hour
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## File Size Limit

- Maximum **1 MB** per file via the Contents API
