import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Zadej e-mail')
      .email('Neplatný formát e-mailu')
      .max(255, 'E-mail je příliš dlouhý'),
    username: z
      .string()
      .min(3, 'Minimálně 3 znaky')
      .max(32, 'Maximálně 32 znaků')
      .regex(/^[^@]+$/, 'Přezdívka nesmí obsahovat @'),
    password: z
      .string()
      // D-NEW-INV-SEC — sjednoceno s reset/změnou hesla (min 8) i BE RegisterDto.
      .min(8, 'Minimálně 8 znaků')
      .max(128, 'Maximálně 128 znaků'),
    passwordConfirm: z.string().min(1, 'Potvrď heslo'),
    // D-010 — GDPR souhlas
    acceptedTerms: z
      .boolean()
      .refine((v) => v === true, {
        message: 'Pro vytvoření účtu musíš souhlasit s podmínkami',
      }),
    // 20C (spec-20C §C2) — deklarativní věk. Povinná volba; z ní se v submit
    // payloadu odvodí `isMinor` (under15 = true). Minimalizace: NEsbíráme datum
    // narození. `error` pokryje i undefined (uživatel nic nevybral) → required.
    ageBracket: z.enum(['15plus', 'under15'], {
      error: 'Vyber prosím věkovou kategorii',
    }),
    // D-011 — honeypot. Skutečný uživatel pole nevidí (offscreen). Bot ho vyplní → odmítneme.
    hp: z.string().max(0, 'Bot detection').optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Hesla se neshodují',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
