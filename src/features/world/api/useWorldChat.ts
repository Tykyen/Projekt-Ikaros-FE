/**
 * Chat světa — hooky. Plný chat světa je fáze 6; tento soubor zatím
 * obsahuje jen švový bod pro dashboard dlaždici „Chat".
 */

/**
 * Počet nepřečtených zpráv chatu světa.
 *
 * **Placeholder (fáze 5):** chat světa ještě neexistuje (`WorldChatPage`
 * je stub), proto vrací vždy `0`.
 *
 * **Fáze 6:** vyměnit tělo za reálný unread tracking — `useQuery` nad BE
 * endpointem + invalidace na socket eventu nové zprávy. Signatura
 * `(worldId) => number` zůstává, dashboard dlaždice se nemění.
 */
export function useWorldChatUnread(worldId: string): number {
  void worldId;
  return 0;
}
