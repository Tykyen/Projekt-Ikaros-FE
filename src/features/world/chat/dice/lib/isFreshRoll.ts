/**
 * Krok 6.3d — Rozhodne, jestli se má hod přehrát s rolling animací.
 *
 * Cutoff = 5 sekund. Důvody:
 * - optimistic insert odesílatele (0 ms),
 * - WS broadcast příjemcům online (typicky < 1 s),
 * - připojení po refreshi nebo scroll historie → settled bez animace.
 *
 * Bez tohoto by chat při otevření přehrával rolling pro všechny historicky
 * hozené kostky najednou — vizuální chaos.
 */

export const FRESH_ROLL_WINDOW_MS = 5_000;

export function isFreshRoll(
  createdAt: string | Date | undefined | null,
  nowMs: number = Date.now(),
  windowMs: number = FRESH_ROLL_WINDOW_MS,
): boolean {
  if (!createdAt) return false;
  const created =
    createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created < windowMs;
}
