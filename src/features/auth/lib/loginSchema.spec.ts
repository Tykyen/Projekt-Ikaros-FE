import { describe, it, expect } from 'vitest';
import { loginSchema } from '../lib/loginSchema';

describe('loginSchema', () => {
  it('projde s e-mailem a heslem', () => {
    expect(
      loginSchema.safeParse({ identifier: 'a@b.cz', password: 'secret' }).success,
    ).toBe(true);
  });

  it('projde s přezdívkou a heslem', () => {
    expect(
      loginSchema.safeParse({ identifier: 'alice', password: 'secret' }).success,
    ).toBe(true);
  });

  it('selže pokud chybí identifier', () => {
    const r = loginSchema.safeParse({ identifier: '', password: 'pw' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/Zadej e-mail/);
    }
  });

  it('selže pokud chybí heslo', () => {
    const r = loginSchema.safeParse({ identifier: 'alice', password: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toMatch(/Zadej heslo/);
    }
  });

  it('selže pokud identifier je delší než 255', () => {
    const r = loginSchema.safeParse({
      identifier: 'a'.repeat(256),
      password: 'pw',
    });
    expect(r.success).toBe(false);
  });
});
