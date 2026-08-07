import { dev } from '$app/environment';
import { json, type RequestHandler } from '@sveltejs/kit';
import {
	createSessionToken,
	SESSION_COOKIE,
	SESSION_MAX_AGE,
	verifyPassword
} from '$lib/server/auth';
import { clearLoginFailures, reserveLoginAttempt } from '$lib/server/login-rate-limit';

async function readLimitedBody(request: Request, limit: number): Promise<string | null> {
	const declaredLength = Number(request.headers.get('content-length') || 0);
	if (declaredLength > limit) return null;
	if (!request.body) return '';

	const reader = request.body.getReader();
	const decoder = new TextDecoder();
	let size = 0;
	let result = '';
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > limit) {
			await reader.cancel();
			return null;
		}
		result += decoder.decode(value, { stream: true });
	}
	return result + decoder.decode();
}

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const clientAddress = getClientAddress();
	const limit = reserveLoginAttempt(clientAddress);
	if (!limit.allowed) {
		return json(
			{ error: 'Muitas tentativas. Tente novamente mais tarde.' },
			{ status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
		);
	}

	const rawBody = await readLimitedBody(request, 1024);
	if (rawBody === null) return json({ error: 'Request too large' }, { status: 413 });
	let body: { password?: unknown } | null = null;
	try {
		body = JSON.parse(rawBody);
	} catch {
		// Invalid input receives the same response as an invalid password.
	}
	if (!body || typeof body.password !== 'string' || !verifyPassword(body.password)) {
		return json({ error: 'Senha de acesso inválida' }, { status: 401 });
	}

	let token: string;
	try {
		token = createSessionToken();
	} catch {
		return json({ error: 'Session authentication is not configured' }, { status: 503 });
	}
	clearLoginFailures(clientAddress);
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: !dev,
		sameSite: 'strict',
		maxAge: SESSION_MAX_AGE
	});
	return json({ authenticated: true });
};
