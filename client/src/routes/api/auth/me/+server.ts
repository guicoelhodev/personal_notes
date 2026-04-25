import { json } from '@sveltejs/kit';
import { getGithubUser } from '$lib/github';

export async function GET({ cookies }) {
	const token = cookies.get('github_token');
	if (!token) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		const user = await getGithubUser(token);
		return json({ user });
	} catch {
		return json({ error: 'Invalid token' }, { status: 401 });
	}
}