/**
 * „Naposledy viděn" v presence panelu (krok 6.1d) — relativní čas poslední
 * aktivity + barevné pásmo dle stáří, jako starý Matrix.
 */
export type LastSeenTier = 'online' | 'recent' | 'week' | 'old' | 'unknown';

export interface LastSeenInfo {
  /** Krátký popisek — „právě teď" / „8 h" / „21. 4." / prázdné. */
  label: string;
  tier: LastSeenTier;
}

/**
 * @param lastSeenAt ISO string z BE; `undefined` = skryto („neviditelný" mód).
 * @param online je uživatel právě přítomen v konverzaci (živá presence).
 */
export function formatLastSeen(
  lastSeenAt: string | undefined,
  online: boolean,
): LastSeenInfo {
  if (online) return { label: 'teď', tier: 'online' };
  if (!lastSeenAt) return { label: '—', tier: 'unknown' };

  const then = new Date(lastSeenAt).getTime();
  if (Number.isNaN(then)) return { label: '', tier: 'unknown' };

  const minutes = (Date.now() - then) / 60_000;
  const hours = minutes / 60;
  const days = hours / 24;

  let label: string;
  if (minutes < 1) label = 'teď';
  else if (minutes < 60) label = `${Math.floor(minutes)} min`;
  else if (hours < 24) label = `${Math.floor(hours)} h`;
  else if (days < 7) label = `${Math.floor(days)} d`;
  else
    label = new Date(then).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
    });

  const tier: LastSeenTier = days < 1 ? 'recent' : days < 7 ? 'week' : 'old';
  return { label, tier };
}
