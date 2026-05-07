import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Zadej e-mail nebo přezdívku')
    .max(255, 'Zadání je příliš dlouhé'),
  password: z.string().min(1, 'Zadej heslo'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
