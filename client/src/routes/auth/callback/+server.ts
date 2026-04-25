import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { exchangeCodeForToken } from '$lib/github';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	if (!code) throw redirect(302, '/');

	try {
		const token = await exchangeCodeForToken(code, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
		cookies.set('github_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});
	} catch (e) {
		console.error('OAuth error:', e);
	}

	throw redirect(302, '/');
}