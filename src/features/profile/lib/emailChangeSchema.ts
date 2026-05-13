import { z } from 'zod';

export const emailChangeSchema = z.object({
  newEmail: z
    .string()
    .min(1, 'E-mail je povinný')
    .email('Neplatný formát e-mailu')
    .max(255, 'E-mail je příliš dlouhý'),
  currentPassword: z
    .string()
    .min(1, 'Heslo je povinné')
    .max(128, 'Heslo je příliš dlouhé'),
});

export type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;
