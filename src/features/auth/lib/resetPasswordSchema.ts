import { z } from 'zod';

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Heslo musí mít alespoň 8 znaků')
      .max(128, 'Heslo je příliš dlouhé'),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.newPassword === d.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'Hesla se neshodují',
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
