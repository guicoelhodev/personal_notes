import { redirect } from '@sveltejs/kit';

export async function POST({ cookies }) {
	cookies.delete('github_token', { path: '/' });
	throw redirect(302, '/');
}