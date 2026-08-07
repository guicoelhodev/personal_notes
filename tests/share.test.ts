import { describe, expect, it } from 'vitest';
import { createEncryptedShareToken, verifyEncryptedShareToken } from '../src/lib/server/share-token';

describe('share links', () => {
	it('encrypts and verifies scoped share claims', () => {
		const secret = 'test-share-secret';
		const expireAt = Date.UTC(2026, 0, 2);
		const token = createEncryptedShareToken(secret, {
			path: 'projects/plan.md',
			expireAt,
			mode: 'edit',
			shareAll: true
		});

		expect(token).not.toContain('projects');
		expect(verifyEncryptedShareToken(token, secret, expireAt - 1)).toEqual({
			path: 'projects/plan.md',
			expireAt,
			mode: 'edit',
			shareAll: true
		});
		expect(verifyEncryptedShareToken(token + 'x', secret, expireAt - 1)).toBeNull();
		expect(verifyEncryptedShareToken(token, secret, expireAt)).toBeNull();
	});
});
