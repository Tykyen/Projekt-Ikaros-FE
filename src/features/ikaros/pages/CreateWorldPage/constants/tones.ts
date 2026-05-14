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

/**
 * 2.3 D-NEW-tooltips — krátké popisky tónů. Zobrazují se jako native
 * `title` attribut na pill chipech.
 */
export const TONE_DESCRIPTIONS: Record<string, string> = {
  Temný: 'Stíny, beznaděj, morální šedost.',
  Ponurý: 'Tíživá atmosféra, ztráta naděje.',
  Brutální: 'Násilí má následky, smrt je blízko.',
  Realistický: 'Logika a fyzika fungují jako v našem světě.',
  Syrový: 'Drsné detaily, žádné přikrašlování.',
  Tragický: 'Hrdinové padají, vítězství stojí oběti.',
  Hrdinský: 'Postavy nad rámec smrtelníků, velké činy.',
  Epický: 'Osudy národů, dějinné události.',
  Dobrodružný: 'Cestování, objevování, akce.',
  Napínavý: 'Tikající bomba, nejistý výsledek.',
  Tajemný: 'Skryté pravdy, vyšetřování, indicie.',
  Hororový: 'Strach, monstra, psychický teror.',
  Psychologický: 'Vnitřní konflikty, motivace, trauma.',
  Melancholický: 'Smutek, nostalgie, krása pomíjivosti.',
  Cynický: 'Nikomu se nedá věřit, ideály jsou lži.',
  Nadějeplný: 'Tma končí, dobro vyhrává, smysl existuje.',
  Romantický: 'Vztahy a emoce v centru dění.',
  Komorní: 'Malá skupina, intimní příběhy, lokální dopad.',
  Velkolepý: 'Měřítko ohromuje, kulisy oslňují.',
  Stylizovaný: 'Forma nad realismem, výtvarná koncepce.',
  Groteskní: 'Přehnané, deformované, na hraně absurdity.',
  Sarkastický: 'Ironie, posměch, hořký humor.',
  Humorný: 'Komedie, vtipy, lehkost.',
  Černohumorný: 'Smích nad smrtí, makabrózní vtip.',
  Vlastní: 'Vlastní popis — vyplň text níže.',
};
