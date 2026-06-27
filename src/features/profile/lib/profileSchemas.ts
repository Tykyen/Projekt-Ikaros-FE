import { z } from 'zod';

// 1.3a — zod schémata pro jednotlivé sekce profilu

export const bioSchema = z.object({
  bio: z.string().max(1000, 'Maximálně 1000 znaků').optional(),
});

export const characterSchema = z.object({
  characterName: z.string().max(64, 'Maximálně 64 znaků').optional(),
  characterBio: z.string().max(1000, 'Maximálně 1000 znaků').optional(),
});

export const headerSchema = z.object({
  // D-NEW-INV-PROFILE — trim: „jen mezery" se normalizují na prázdné (→ fallback
  // na username), aby neprošlo vizuálně prázdné, ale „neprázdné" jméno.
  displayName: z.string().trim().max(32, 'Maximálně 32 znaků').optional(),
  city: z.string().trim().max(100, 'Maximálně 100 znaků').optional(),
});

export const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Zadej současné heslo'),
    newPassword: z
      .string()
      .min(8, 'Minimálně 8 znaků')
      .max(128, 'Maximálně 128 znaků'),
    newPasswordConfirm: z.string().min(1, 'Potvrď nové heslo'),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    path: ['newPasswordConfirm'],
    message: 'Hesla se neshodují',
  })
  .refine((d) => d.oldPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'Nové heslo se musí lišit od současného',
  });

// 1.3b — žádost o změnu username.
// Pozn.: FE je ZÁMĚRNĚ přísnější než BE. BE `RequestUsernameChangeDto` validuje
// jen `/^[^@]+$/` (povolí mezery i velká písmena), FE zde vynucuje slug formát
// `/^[a-z0-9-]+$/` (jen malá písmena, číslice, pomlčky) — lepší pro username.
export const usernameRequestSchema = z.object({
  requestedUsername: z
    .string()
    .min(3, 'Minimálně 3 znaky')
    .max(32, 'Maximálně 32 znaků')
    .regex(
      /^[a-z0-9-]+$/,
      'Jen malá písmena, číslice a pomlčky',
    ),
});

// 14.1 — 2FA
export const totpCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Zadej 6 číslic'),
});
export const totpDisableSchema = z.object({
  password: z.string().min(1, 'Zadej heslo'),
});

export type BioForm = z.infer<typeof bioSchema>;
export type CharacterForm = z.infer<typeof characterSchema>;
export type HeaderForm = z.infer<typeof headerSchema>;
export type PasswordForm = z.infer<typeof passwordSchema>;
export type UsernameRequestForm = z.infer<typeof usernameRequestSchema>;
export type TotpCodeForm = z.infer<typeof totpCodeSchema>;
export type TotpDisableForm = z.infer<typeof totpDisableSchema>;
