import { json, type RequestHandler } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';

export const GET: RequestHandler = ({ cookies }) => {
	return json({ authenticated: isAuthenticated(cookies) });
};
