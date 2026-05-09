import { describe, expect, it } from 'vitest';
import {
  bioSchema,
  characterSchema,
  headerSchema,
  passwordSchema,
} from './profileSchemas';

describe('bioSchema', () => {
  it('akceptuje prázdný bio', () => {
    expect(bioSchema.safeParse({ bio: '' }).success).toBe(true);
  });
  it('akceptuje 1000 znaků', () => {
    expect(bioSchema.safeParse({ bio: 'x'.repeat(1000) }).success).toBe(true);
  });
  it('odmítne 1001 znaků', () => {
    expect(bioSchema.safeParse({ bio: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('characterSchema', () => {
  it('akceptuje prázdné', () => {
    expect(characterSchema.safeParse({}).success).toBe(true);
  });
  it('odmítne jméno > 64', () => {
    expect(
      characterSchema.safeParse({ characterName: 'x'.repeat(65) }).success,
    ).toBe(false);
  });
  it('odmítne bio > 1000', () => {
    expect(
      characterSchema.safeParse({ characterBio: 'y'.repeat(1001) }).success,
    ).toBe(false);
  });
});

describe('headerSchema', () => {
  it('akceptuje prázdné', () => {
    expect(headerSchema.safeParse({}).success).toBe(true);
  });
  it('odmítne město > 100', () => {
    expect(headerSchema.safeParse({ city: 'x'.repeat(101) }).success).toBe(
      false,
    );
  });
  it('odmítne displayName > 64', () => {
    expect(
      headerSchema.safeParse({ displayName: 'y'.repeat(65) }).success,
    ).toBe(false);
  });
});

describe('passwordSchema', () => {
  const valid = {
    oldPassword: 'oldpassword1',
    newPassword: 'newpassword2',
    newPasswordConfirm: 'newpassword2',
  };

  it('akceptuje validní vstup', () => {
    expect(passwordSchema.safeParse(valid).success).toBe(true);
  });

  it('odmítne nové heslo < 8 znaků', () => {
    expect(
      passwordSchema.safeParse({ ...valid, newPassword: 'short' }).success,
    ).toBe(false);
  });

  it('odmítne neshodující se confirm', () => {
    expect(
      passwordSchema.safeParse({
        ...valid,
        newPasswordConfirm: 'wrongmismatch',
      }).success,
    ).toBe(false);
  });

  it('odmítne shodné staré + nové heslo', () => {
    expect(
      passwordSchema.safeParse({
        oldPassword: 'samesame12',
        newPassword: 'samesame12',
        newPasswordConfirm: 'samesame12',
      }).success,
    ).toBe(false);
  });

  it('odmítne prázdné staré heslo', () => {
    expect(
      passwordSchema.safeParse({ ...valid, oldPassword: '' }).success,
    ).toBe(false);
  });
});
