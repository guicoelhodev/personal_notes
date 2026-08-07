import { describe, expect, it } from 'vitest';
import {
	clearLoginFailures,
	loginAllowed,
	reserveLoginAttempt
} from '../src/lib/server/login-rate-limit';

describe('login rate limit', () => {
	it('blocks an address after five failures', () => {
		const key = 'test-address';
		clearLoginFailures(key);
		for (let attempt = 0; attempt < 5; attempt += 1) {
			expect(reserveLoginAttempt(key, 1000).allowed).toBe(true);
		}
		expect(loginAllowed(key, 1000).allowed).toBe(false);
		expect(loginAllowed(key, 15 * 60 * 1000 + 1001).allowed).toBe(true);
	});
});
