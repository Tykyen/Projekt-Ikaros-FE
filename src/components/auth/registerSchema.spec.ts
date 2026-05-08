import { describe, it, expect } from 'vitest';
import { registerSchema } from './registerSchema';

const valid = {
  email: 'user@test.io',
  username: 'newuser',
  password: 'pass1234',
  passwordConfirm: 'pass1234',
};

describe('registerSchema', () => {
  it('akceptuje validní vstup', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('odmítne prázdný e-mail', () => {
    const result = registerSchema.safeParse({ ...valid, email: '' });
    expect(result.success).toBe(false);
  });

  it('odmítne nevalidní formát e-mailu', () => {
    const result = registerSchema.safeParse({ ...valid, email: 'notanemail' });
    expect(result.success).toBe(false);
  });

  it('odmítne username < 3 znaky', () => {
    const result = registerSchema.safeParse({ ...valid, username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('odmítne username > 32 znaky', () => {
    const result = registerSchema.safeParse({
      ...valid,
      username: 'a'.repeat(33),
    });
    expect(result.success).toBe(false);
  });

  it('odmítne username obsahující @', () => {
    const result = registerSchema.safeParse({
      ...valid,
      username: 'evil@user',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/@/);
    }
  });

  it('odmítne heslo < 6 znaků', () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: 'short',
      passwordConfirm: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('odmítne heslo > 128 znaků', () => {
    const long = 'a'.repeat(129);
    const result = registerSchema.safeParse({
      ...valid,
      password: long,
      passwordConfirm: long,
    });
    expect(result.success).toBe(false);
  });

  it('odmítne neshodující se hesla (chyba pod passwordConfirm)', () => {
    const result = registerSchema.safeParse({
      ...valid,
      passwordConfirm: 'jine123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['passwordConfirm']);
      expect(result.error.issues[0].message).toMatch(/neshod/i);
    }
  });
});
