import { json, type Handle } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';

const protectedRoutes = new Set([
	'/api/save',
	'/api/rename',
	'/api/delete',
	'/api/upload',
	'/api/deleteImages'
]);

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api/') && event.request.method !== 'GET') {
		const origin = event.request.headers.get('origin');
		if (origin && origin !== event.url.origin) {
			return json({ error: 'Invalid request origin' }, { status: 403 });
		}
	}

	if (protectedRoutes.has(event.url.pathname) && event.request.method !== 'GET') {
		if (!isAuthenticated(event.cookies)) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}
	}

	return resolve(event);
};
