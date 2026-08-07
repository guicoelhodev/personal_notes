import { describe, expect, it } from 'vitest';
import {
	createSignedSession,
	passwordMatches,
	SESSION_MAX_AGE,
	verifySignedSession
} from '../src/lib/server/session';

describe('signed session', () => {
	it('compares the configured password', () => {
		expect(passwordMatches('correct', 'correct')).toBe(true);
		expect(passwordMatches('incorrect', 'correct')).toBe(false);
		expect(passwordMatches('', '')).toBe(false);
	});

	it('accepts a valid token and rejects tampering', () => {
		const now = Date.UTC(2026, 0, 1);
		const token = createSignedSession('strong-password', now);
		expect(verifySignedSession(token, 'strong-password', now)).toBe(true);
		expect(verifySignedSession(token + 'x', 'strong-password', now)).toBe(false);
		expect(verifySignedSession(token, 'different-password', now)).toBe(false);
	});

	it('rejects expired tokens', () => {
		const now = Date.UTC(2026, 0, 1);
		const token = createSignedSession('strong-password', now);
		expect(verifySignedSession(token, 'strong-password', now + SESSION_MAX_AGE * 1000)).toBe(false);
	});
});
