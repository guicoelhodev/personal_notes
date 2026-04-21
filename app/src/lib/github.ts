const GITHUB_API = 'https://api.github.com'
const API_VERSION = '2026-03-10'

function headers(): HeadersInit {
	return {
		Authorization: `Bearer ${import.meta.env.GITHUB_TOKEN}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': API_VERSION,
	}
}

const owner = import.meta.env.GITHUB_OWNER
const repo = import.meta.env.GITHUB_REPO

interface TreeEntry {
	path: string
	type: string
	sha: string
}

export async function getFile(path: string): Promise<string> {
	const res = await fetch(
		`${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
		{
			headers: {
				...headers(),
				Accept: 'application/vnd.github.raw+json',
			},
		}
	)

	if (!res.ok) {
		throw { status: res.status, message: `File not found: ${path}` }
	}

	return await res.text()
}

export async function listDocsTree(): Promise<TreeEntry[]> {
	const res = await fetch(
		`${GITHUB_API}/repos/${owner}/${repo}/git/trees/master:docs?recursive=1`,
		{ headers: headers() }
	)

	if (!res.ok) {
		const error = await res.json()
		throw { status: res.status, message: error.message || 'Failed to fetch tree' }
	}

	const data = await res.json()

	const docsEntries = data.tree.map((entry: any) => ({
		path: entry.path,
		type: entry.type,
		sha: entry.sha,
	}))

	return docsEntries
}

export async function updateFile(path: string, content: string): Promise<void> {
	const res = await fetch(
		`${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
		{ headers: headers() }
	)

	if (!res.ok) {
		throw { status: res.status, message: `File not found: ${path}` }
	}

	const data = await res.json()
	const sha = data.sha

	const base64Content = Buffer.from(content).toString('base64')

	const updateRes = await fetch(
		`${GITHUB_API}/repos/${owner}/${repo}/contents/docs/${path}`,
		{
			method: 'PUT',
			headers: headers(),
			body: JSON.stringify({
				message: `docs: update ${path}`,
				content: base64Content,
				sha,
				branch: 'master',
			}),
		}
	)

	if (!updateRes.ok) {
		const error = await updateRes.json()
		throw { status: updateRes.status, message: error.message || 'Failed to update file' }
	}
}
