import { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } from '$env/static/private';
import type { TreeEntry } from './types';

const GITHUB_API = 'https://api.github.com';
const API_VERSION = '2026-03-10';

function headers(): HeadersInit {
	return {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': API_VERSION
	};
}

export async function getFile(path: string): Promise<string> {
	const res = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${path}`,
		{
			headers: {
				...headers(),
				Accept: 'application/vnd.github.raw+json'
			}
		}
	);

	if (!res.ok) {
		throw { status: res.status, message: `File not found: ${path}` };
	}

	return await res.text();
}

export async function listDocsTree(): Promise<TreeEntry[]> {
	const res = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/master:docs?recursive=1`,
		{ headers: headers() }
	);

	if (!res.ok) {
		const error = await res.json();
		throw { status: res.status, message: error.message || 'Failed to fetch tree' };
	}

	const data = await res.json();

	const docsEntries = data.tree.map((entry: any) => ({
		path: entry.path,
		type: entry.type,
		sha: entry.sha
	}));

	return docsEntries;
}

export async function updateFile(path: string, content: string): Promise<void> {
	const res = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${path}`,
		{ headers: headers() }
	);

	if (!res.ok) {
		throw { status: res.status, message: `File not found: ${path}` };
	}

	const data = await res.json();
	const sha = data.sha;

	const base64Content = btoa(unescape(encodeURIComponent(content)));

	const updateRes = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${path}`,
		{
			method: 'PUT',
			headers: headers(),
			body: JSON.stringify({
				message: `docs: update ${path}`,
				content: base64Content,
				sha,
				branch: 'master'
			})
		}
	);

	if (!updateRes.ok) {
		const error = await updateRes.json();
		throw { status: updateRes.status, message: error.message || 'Failed to update file' };
	}
}

export async function deleteFile(path: string): Promise<void> {
	const res = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${path}`,
		{ headers: headers() }
	);

	if (!res.ok) {
		throw { status: res.status, message: `File not found: ${path}` };
	}

	const data = await res.json();
	const sha = data.sha;

	const deleteRes = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${path}`,
		{
			method: 'DELETE',
			headers: headers(),
			body: JSON.stringify({
				message: `docs: delete ${path}`,
				sha,
				branch: 'master'
			})
		}
	);

	if (!deleteRes.ok) {
		const error = await deleteRes.json();
		throw { status: deleteRes.status, message: error.message || 'Failed to delete file' };
	}
}

export async function deleteFolder(path: string): Promise<void> {
	const tree = await listDocsTree();
	const filesInFolder = tree.filter(
		(entry) => entry.type === 'blob' && entry.path.startsWith(path + '/')
	);

	for (const file of filesInFolder) {
		await deleteFile(file.path);
	}
}

export async function renameFile(oldPath: string, newPath: string): Promise<void> {
	const content = await getFile(oldPath);
	await createFile(newPath, content);
	await deleteFile(oldPath);
}

export async function renameFolder(oldPath: string, newPath: string): Promise<void> {
	const tree = await listDocsTree();
	const filesInFolder = tree.filter(
		(entry) => entry.type === 'blob' && entry.path.startsWith(oldPath + '/')
	);

	for (const file of filesInFolder) {
		const content = await getFile(file.path);
		const newFilePath = newPath + file.path.slice(oldPath.length);
		await createFile(newFilePath, content);
		await deleteFile(file.path);
	}
}

export async function createFile(path: string, content: string): Promise<void> {
	const base64Content = btoa(unescape(encodeURIComponent(content)));

	const pathFile = path.replaceAll(' ', '_');
	const res = await fetch(
		`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/docs/${pathFile}`,
		{
			method: 'PUT',
			headers: headers(),
			body: JSON.stringify({
				message: `docs: create ${path}`,
				content: base64Content,
				branch: 'master'
			})
		}
	);

	if (!res.ok) {
		const error = await res.json();
		throw { status: res.status, message: error.message || 'Failed to create file' };
	}
}


