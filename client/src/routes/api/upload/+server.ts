import { json } from '@sveltejs/kit';
import { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } from '$env/static/private';
import type { RequestHandler } from './$types';

const GITHUB_API = 'https://api.github.com';
const API_VERSION = '2026-03-10';

function headers(): HeadersInit {
	return {
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': API_VERSION
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File;

	const MAX_SIZE = 5 * 1024 * 1024; // 5MB

	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'File too large (max 5MB)' }, { status: 400 });
	}

	const timestamp = Date.now().toString(16);
	const randomPart = Math.random().toString(16).substring(2, 10);
	const hash = `${timestamp}_${randomPart}`;

	const extension = file.name.split('.').pop() || 'png';
	const filename = `img_${hash}.${extension}`;
	const path = `.github/images/${filename}`;

	const arrayBuffer = await file.arrayBuffer();
	const binaryString = Array.from(new Uint8Array(arrayBuffer))
		.map((byte) => String.fromCharCode(byte))
		.join('');
	const base64Content = btoa(binaryString);

	const res = await fetch(`${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
		method: 'PUT',
		headers: headers(),
		body: JSON.stringify({
			message: `images: upload ${filename}`,
			content: base64Content,
			branch: 'master'
		})
	});

	if (!res.ok) {
		return json({ error: 'Upload failed' }, { status: res.status });
	}

	const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/master/${path}`;

	return json({ url });
};
