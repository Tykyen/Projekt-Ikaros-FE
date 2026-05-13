import { describe, it, expect } from 'vitest';
import { resetPasswordSchema } from './resetPasswordSchema';

describe('resetPasswordSchema', () => {
  it('akceptuje shodná hesla ≥ 8 znaků', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'silne123',
      passwordConfirm: 'silne123',
    });
    expect(result.success).toBe(true);
  });

  it('odmítne mismatch hesel', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'silne123',
      passwordConfirm: 'jine1234',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordConfirmIssue = result.error.issues.find((i) =>
        i.path.includes('passwordConfirm'),
      );
      expect(passwordConfirmIssue?.message).toMatch(/neshod/i);
    }
  });

  it('odmítne heslo < 8 znaků', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'sla',
      passwordConfirm: 'sla',
    });
    expect(result.success).toBe(false);
  });

  it('odmítne heslo > 128 znaků', () => {
    const long = 'a'.repeat(129);
    const result = resetPasswordSchema.safeParse({
      newPassword: long,
      passwordConfirm: long,
    });
    expect(result.success).toBe(false);
  });
});
