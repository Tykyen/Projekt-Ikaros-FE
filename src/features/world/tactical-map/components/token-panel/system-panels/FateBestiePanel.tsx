/**
 * FATE bestie panel (taktická mapa / chat rail).
 *
 * Data z `token.systemStats` (snapshot z katalogu při spawnu, fae/fate:token
 * schema = superset profilu). UI = sdílené `FateCombatBody` (Karty osudu),
 * stejné jako PC combat panel — 0 drift. Autosave celého `systemStats`
 * (BE token.update REPLACE + validateForPatch strict → posíláme plný objekt,
 * všechny klíče v token schématu).
 *
 * Stres = damageable model `health.current` (zbývající kapacita = max − boxy).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { APPROACHES } from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/FateLikeSheet';
import { useTokenUpdate } from '../../../hooks/useTokenUpdate';
import { performSheetRoll } from '../../../utils/rollFromSheet';
import type { MapToken } from '../../../types';
import type { MapRollRequest } from '../../../hooks/useMapDiceRoll';
import {
  FateCombatBody,
  type FateBox,
  type FateAbility,
  type FateAspect,
  type FateStunt,
} from './fate/FateCombatBody';

interface Props {
  token: MapToken;
  sceneId: string;
  worldId: string;
  systemId: string;
  canEdit: boolean;
  onMapRoll?: (req: MapRollRequest) => void;
}

const CONSEQUENCES = [
  { key: 'mild', label: 'Drobný', value: 2 },
  { key: 'moderate', label: 'Mírný', value: 4 },
  { key: 'severe', label: 'Vážný', value: 6 },
] as const;

const SAVE_DEBOUNCE_MS = 500;
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

function parseArr<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string' && raw) {
    try {
      const p: unknown = JSON.parse(raw);
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function FateBestiePanel({
  token,
  sceneId,
  worldId,
  systemId,
  canEdit,
  onMapRoll,
}: Props): React.ReactElement {
  const variant: 'fae' | 'core' = systemId === 'fae' ? 'fae' : 'core';
  const update = useTokenUpdate(sceneId, worldId);

  const [stats, setStats] = useState<Record<string, unknown>>(
    () => ({ ...(token.systemStats ?? {}) }),
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const save = useCallback(
    (next: Record<string, unknown>) => {
      if (!canEdit) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        update.mutate(
          { tokenId: token.id, patch: { systemStats: next } },
          {
            onError: (e) =>
              toast.error(
                `Uložení selhalo: ${e instanceof Error ? e.message : 'chyba'}`,
              ),
          },
        );
      }, SAVE_DEBOUNCE_MS);
    },
    [canEdit, token.id, update],
  );

  const mutate = useCallback(
    (patch: Record<string, unknown>) => {
      setStats((prev) => {
        const next = { ...prev, ...patch };
        save(next);
        return next;
      });
    },
    [save],
  );

  const num = useCallback(
    (key: string, fb = 0): number => {
      const v = stats[key];
      const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10);
      return Number.isFinite(n) ? n : fb;
    },
    [stats],
  );

  const refresh = num('refresh', 3);
  const fatePoints = num('fatePoints', refresh);
  const maxBoxes = num('health.max', 3);
  const current = num('health.current', maxBoxes);
  const used = clamp(maxBoxes - current, 0, maxBoxes);

  const boxes: FateBox[] = useMemo(
    () =>
      Array.from({ length: Math.max(0, maxBoxes) }, (_, i) => ({
        size: i + 1,
        on: i < used,
      })),
    [maxBoxes, used],
  );

  const abilities: FateAbility[] = useMemo(() => {
    if (variant === 'fae') {
      return APPROACHES.map((a) => ({
        label: a.label,
        bonus: num(`appr_${a.key}`, 0),
      }));
    }
    return parseArr<{ label: string; rating: unknown }>(stats.skills).map((s) => ({
      label: s.label || '—',
      bonus: parseInt(String(s.rating ?? 0), 10) || 0,
    }));
  }, [variant, stats.skills, num]);

  const aspects: FateAspect[] = useMemo(() => {
    const out: FateAspect[] = [];
    const hc = stats.highConcept;
    if (typeof hc === 'string' && hc) out.push({ text: hc, kind: 'hc' });
    parseArr<{ label: string }>(stats.aspects).forEach((a) => {
      if (a.label) out.push({ text: a.label, kind: 'other' });
    });
    return out;
  }, [stats.highConcept, stats.aspects]);

  const stunts: FateStunt[] = parseArr<{ label: string; value: string }>(
    stats.stunts,
  )
    .filter((s) => s.label)
    .map((s) => ({ name: s.label, desc: s.value ?? '' }));

  const consequences = CONSEQUENCES.map((c) => ({
    ...c,
    text: typeof stats[`cons_${c.key}`] === 'string' ? (stats[`cons_${c.key}`] as string) : '',
  }));

  const rollerName = token.instanceName ?? 'Bestie';
  const doRoll = (label: string, bonus: number): void => {
    const res = performSheetRoll({ label, modifier: bonus, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({
      category: 'skill',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
  };
  const doInitiative = (): void => {
    const res = performSheetRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate', rollerName });
    if (!res) return;
    onMapRoll?.({
      category: 'initiative',
      dicePayload: res.dicePayload,
      tokenId: token.id,
      rollerKind: 'bestie',
      rollerName,
    });
    update.mutate({ tokenId: token.id, patch: { initiative: res.total }, skipInvalidate: true });
  };

  return (
    <FateCombatBody
      variant={variant}
      canEdit={canEdit}
      fatePoints={fatePoints}
      refresh={refresh}
      onFatePoints={(d) => mutate({ fatePoints: clamp(fatePoints + d, 0, 20) })}
      boxes={boxes}
      onToggleBox={(i) => {
        const newUsed = i < used ? i : i + 1;
        mutate({ 'health.current': clamp(maxBoxes - newUsed, 0, maxBoxes) });
      }}
      consequences={consequences}
      onCons={(key, text) => mutate({ [`cons_${key}`]: text })}
      abilities={abilities}
      onRoll={doRoll}
      onInitiative={doInitiative}
      aspects={aspects}
      stunts={stunts}
    />
  );
}

export default FateBestiePanel;
