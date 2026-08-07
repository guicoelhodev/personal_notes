const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface Attempts {
	count: number;
	resetAt: number;
}

const attempts = new Map<string, Attempts>();

export function loginAllowed(
	key: string,
	now = Date.now()
): { allowed: boolean; retryAfter: number } {
	const current = attempts.get(key);
	if (!current || current.resetAt <= now) {
		attempts.delete(key);
		return { allowed: true, retryAfter: 0 };
	}
	return {
		allowed: current.count < MAX_ATTEMPTS,
		retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
	};
}

export function recordLoginFailure(key: string, now = Date.now()): void {
	const current = attempts.get(key);
	if (!current || current.resetAt <= now) {
		attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
		return;
	}
	current.count += 1;
}

export function reserveLoginAttempt(
	key: string,
	now = Date.now()
): { allowed: boolean; retryAfter: number } {
	const result = loginAllowed(key, now);
	if (result.allowed) recordLoginFailure(key, now);
	return result;
}

export function clearLoginFailures(key: string): void {
	attempts.delete(key);
}
