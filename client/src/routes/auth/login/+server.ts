import { redirect } from '@sveltejs/kit';
import { GITHUB_CLIENT_ID } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

export async function GET({ url }) {
	const redirectUri = `${PUBLIC_APP_URL}/auth/callback`;
	throw redirect(
		302,
		`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`
	);
}