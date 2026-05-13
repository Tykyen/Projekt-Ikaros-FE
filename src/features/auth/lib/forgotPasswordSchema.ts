import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail je povinný')
    .email('Neplatný formát e-mailu')
    .max(255, 'E-mail je příliš dlouhý'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
