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
      .min(6, 'Minimálně 6 znaků')
      .max(128, 'Maximálně 128 znaků'),
    passwordConfirm: z.string().min(1, 'Potvrď heslo'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Hesla se neshodují',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
