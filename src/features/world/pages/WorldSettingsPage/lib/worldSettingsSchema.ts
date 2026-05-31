import { z } from "zod";

/**
 * 5.3a — validace formuláře Základní info. `genre`/`system` drží hodnotu
 * selectu; `customGenre`/`customSystem` se uplatní jen při volbě „Vlastní".
 * Finalizaci (select vs. custom) řeší tab před odesláním.
 */
export const basicInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Název musí mít 2–60 znaků.")
    .max(60, "Název musí mít 2–60 znaků."),
  description: z.string().max(1000, "Popis může mít max 1000 znaků."),
  genre: z.string(),
  customGenre: z.string().max(40, "Vlastní žánr max 40 znaků."),
  system: z.string().min(1, "Vyber herní systém."),
  customSystem: z.string().max(60, "Vlastní systém max 60 znaků."),
  dice: z.array(z.string()),
  maxPlayers: z.number().int().min(1).max(999).nullable(),
  playersWanted: z.string().max(500, "Text může mít max 500 znaků."),
  imageUrl: z.string(),
  // 10.2j — viditelnost hodů kostek na taktické mapě.
  diceVisibility: z.object({
    showPjRolls: z.boolean(),
    showNpcBestieRolls: z.boolean(),
    showTeammateRolls: z.boolean(),
  }),
});

export type BasicInfoForm = z.infer<typeof basicInfoSchema>;
