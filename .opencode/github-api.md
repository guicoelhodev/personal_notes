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
Accept: application/vnd.github.v3+json
```

## Endpoints

### List directory contents

```
GET /repos/{owner}/{repo}/contents/{path}
```

- Returns an array of objects for directories, a single object for files
- Each object: `{ name, path, type: "file"|"dir", sha, size, download_url }`
- To get a recursive tree, use the Git Trees API instead (see below)

### Recursive tree (preferred for full directory listing)

```
GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
```

- Returns `{ tree: [{ path, type: "blob"|"tree", sha, size }] }`
- Filter by `path.startsWith("docs/")` to get only docs files
- Remove the `docs/` prefix from each path

### Get file content

```
GET /repos/{owner}/{repo}/contents/{path}
```

Response:

```json
{
  "name": "rapier-guide.md",
  "path": "docs/threlte/rapier-guide.md",
  "sha": "abc123...",
  "content": "IyBIZWxsbyBXb3JsZAo...",  // base64 encoded
  "encoding": "base64",
  "size": 1234
}
```

Decoding (handling UTF-8 correctly):

```js
function decodeBase64(base64) {
  const binaryString = atob(base64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}
```

### Create or update file

```
PUT /repos/{owner}/{repo}/contents/{path}
```

Request body:

```json
{
  "message": "Update rapier-guide.md",
  "content": "IyBIZWxsbyBXb3JsZAo...",  // base64 encoded
  "sha": "abc123..."                      // required for updates, omit for creates
}
```

Encoding (handling UTF-8 correctly):

```js
function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str)
  let binaryString = ''
  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte)
  })
  return btoa(binaryString)
}
```

Response:

```json
{
  "content": {
    "name": "rapier-guide.md",
    "path": "docs/threlte/rapier-guide.md",
    "sha": "def456..."  // new SHA after commit
  },
  "commit": {
    "sha": "commit-sha..."
  }
}
```

**Key rules:**
- Include `sha` → updates existing file
- Omit `sha` → creates new file (will fail if file already exists at path)

### Delete file

```
DELETE /repos/{owner}/{repo}/contents/{path}
```

Request body:

```json
{
  "message": "Delete rapier-guide.md",
  "sha": "abc123..."  // SHA of the file to delete
}
```

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | Success (PUT/DELETE) | — |
| `201` | Created (PUT without sha) | — |
| `404` | Not found | File or path doesn't exist |
| `409` | Conflict | SHA is outdated — file was modified since last read. Re-fetch and retry |
| `422` | Validation error | Missing required fields, or file already exists when trying to create |
| `403` | Forbidden | Token lacks permission or rate limit exceeded |

## Rate Limits

- **Authenticated**: 5,000 requests per hour
- Headers in response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## File Size Limit

- Maximum **1 MB** per file via the Contents API
- For larger files, use the Git Blobs API or Git Raw API

## Server-Side Helper (Node.js)

```ts
const GITHUB_API = 'https://api.github.com'

function githubHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AI-notes-editor',
  }
}

export async function listDocsTree(): Promise<DocEntry[]> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/main?recursive=1`,
    { headers: githubHeaders() }
  )
  const data = await res.json()
  return data.tree
    .filter((item: any) => item.path.startsWith('docs/') && item.type === 'blob')
    .map((item: any) => ({
      name: item.path.replace('docs/', ''),
      path: item.path.replace('docs/', ''),
      sha: item.sha,
      size: item.size,
    }))
}

export async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
    { headers: githubHeaders() }
  )
  const data = await res.json()
  const content = decodeBase64(data.content)
  return { content, sha: data.sha }
}

export async function saveFile(path: string, content: string, sha?: string): Promise<string> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  const body: any = {
    message: sha ? `Update ${path}` : `Create ${path}`,
    content: encodeBase64(content),
  }
  if (sha) body.sha = sha
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
    {
      method: 'PUT',
      headers: githubHeaders(),
      body: JSON.stringify(body),
    }
  )
  const data = await res.json()
  return data.content.sha // new SHA
}

export async function deleteFile(path: string, sha: string): Promise<void> {
  const owner = process.env.GITHUB_OWNER!
  const repo = process.env.GITHUB_REPO!
  await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
    {
      method: 'DELETE',
      headers: githubHeaders(),
      body: JSON.stringify({ message: `Delete ${path}`, sha }),
    }
  )
}

function decodeBase64(base64: string): string {
  const binaryString = atob(base64.replace(/\n/g, ''))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binaryString = ''
  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte)
  })
  return btoa(binaryString)
}

interface DocEntry {
  name: string
  path: string
  sha: string
  size: number
}
```
