/**
 * 2.3 — 24 přednastavených tónů + „Vlastní" (po výběru se zobrazí free-text
 * input pod gridem a zadaný řetězec se přidá do `world.tones[]` místo
 * labelu „Vlastní").
 */
export const TONES = [
  'Temný',
  'Ponurý',
  'Brutální',
  'Realistický',
  'Syrový',
  'Tragický',
  'Hrdinský',
  'Epický',
  'Dobrodružný',
  'Napínavý',
  'Tajemný',
  'Hororový',
  'Psychologický',
  'Melancholický',
  'Cynický',
  'Nadějeplný',
  'Romantický',
  'Komorní',
  'Velkolepý',
  'Stylizovaný',
  'Groteskní',
  'Sarkastický',
  'Humorný',
  'Černohumorný',
] as const;

export const TONE_CUSTOM_LABEL = 'Vlastní';
export type ToneOption = (typeof TONES)[number];
