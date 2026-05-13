import { describe, it, expect } from 'vitest';
import { forgotPasswordSchema } from './forgotPasswordSchema';

describe('forgotPasswordSchema', () => {
  it('akceptuje validní e-mail', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'jan@example.com' });
    expect(result.success).toBe(true);
  });

  it('odmítne prázdný e-mail', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('odmítne neplatný formát', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'bez-zavinace' });
    expect(result.success).toBe(false);
  });

  it('odmítne e-mail > 255 znaků', () => {
    const long = 'a'.repeat(251) + '@b.cc'; // 256 znaků
    const result = forgotPasswordSchema.safeParse({ email: long });
    expect(result.success).toBe(false);
  });
});
