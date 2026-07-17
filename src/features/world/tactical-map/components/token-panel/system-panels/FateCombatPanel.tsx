/**
 * FATE PC combat panel (taktická mapa / chat rail).
 *
 * Data z deníku postavy (`customData`, prefix `fae_*` / `fate_*`) přes
 * debounced write. UI = sdílené `FateCombatBody` (Karty osudu). Dvě varianty:
 *   - `FaeCombatPanel`  (variant fae, prefix fae_) → Přístupy
 *   - `FateCombatPanel` (variant core, prefix fate_) → Dovednosti
 *
 * Boj: 🎲 = 4dF + bonus (`onRoll`), stres/následky/body osudu editace
 * (debounce 500 ms). Deník = záznam (bez kostek); combat panel = boj (kostky).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCharacterDiary } from '@/features/world/pages/api/useCharacterSubdocs';
import { useUpdateCharacterDiary } from '@/features/world/pages/api/useCharacterMutations';
import { APPROACHES } from '@/features/world/pages/CharacterDetailPage/diary-systems/_shared/FateLikeSheet';
import type { MapToken } from '../../../types';
import type { CombatPanelProps } from '../combatPanels';
import {
  FateCombatBody,
  type FateBox,
  type FateAbility,
  type FateAspect,
  type FateStunt,
} from './fate/FateCombatBody';

const CONSEQUENCES = [
  { key: 'mild', label: 'Drobný', value: 2 },
  { key: 'moderate', label: 'Mírný', value: 4 },
  { key: 'severe', label: 'Vážný', value: 6 },
] as const;

const DEFAULT_BOXES: FateBox[] = [
  { size: 1, on: false },
  { size: 2, on: false },
  { size: 3, on: false },
];

const clampFp = (n: number): number => Math.max(0, Math.min(20, n));

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

interface ImplProps {
  variant: 'fae' | 'core';
  prefix: string;
  token: MapToken;
  worldId: string;
  canEdit: boolean;
  onRoll?: CombatPanelProps['onRoll'];
}

function FatePanelImpl({
  variant,
  prefix,
  token,
  worldId,
  canEdit,
  onRoll,
}: ImplProps): React.ReactElement {
  const { data: diary, isLoading } = useCharacterDiary(
    worldId,
    token.characterSlug,
  );
  const updateMut = useUpdateCharacterDiary(worldId, token.characterSlug);

  const [localPatch, setLocalPatch] = useState<Record<string, string>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cd = useMemo(() => {
    const base = (diary?.customData ?? {}) as Record<string, unknown>;
    return { ...base, ...localPatch };
  }, [diary, localPatch]);

  const g = useCallback(
    (key: string, fb = ''): string => {
      const v = cd[`${prefix}${key}`];
      return v === undefined || v === null ? fb : String(v);
    },
    [cd, prefix],
  );
  const num = useCallback(
    (key: string, fb = 0): number => {
      const n = parseInt(g(key, ''), 10);
      return Number.isFinite(n) ? n : fb;
    },
    [g],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const flush = useCallback(
    (patch: Record<string, string>) => {
      if (Object.keys(patch).length === 0) return;
      updateMut.mutate(
        { customDataPatch: patch },
        {
          onSuccess: () =>
            setLocalPatch((prev) => {
              const next = { ...prev };
              Object.keys(patch).forEach((k) => delete next[k]);
              return next;
            }),
          onError: () => toast.error('Nepodařilo se uložit změny'),
        },
      );
    },
    [updateMut],
  );

  const writeKey = useCallback(
    (key: string, value: string) => {
      if (!canEdit) return;
      const full = `${prefix}${key}`;
      setLocalPatch((prev) => ({ ...prev, [full]: value }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLocalPatch((current) => {
          flush(current);
          return current;
        });
      }, 500);
    },
    [canEdit, prefix, flush],
  );

  const refresh = num('refresh', 3);
  const fatePoints = num('fatePoints', refresh);

  const abilities: FateAbility[] = useMemo(() => {
    if (variant === 'fae') {
      return APPROACHES.map((a) => ({
        label: a.label,
        bonus: num(`appr_${a.key}`, 0),
      }));
    }
    return parseArr<{ name: string; val: string }>(cd[`${prefix}skills`]).map(
      (s) => ({ label: s.name || '—', bonus: parseInt(s.val, 10) || 0 }),
    );
  }, [variant, cd, prefix, num]);

  const stressArr = parseArr<FateBox>(cd[`${prefix}stress`]);
  const boxes = stressArr.length ? stressArr : DEFAULT_BOXES;

  const consequences = CONSEQUENCES.map((c) => ({
    ...c,
    text: g(`cons_${c.key}`),
  }));

  const aspects: FateAspect[] = useMemo(() => {
    const out: FateAspect[] = [];
    if (g('highConcept')) out.push({ text: g('highConcept'), kind: 'hc' });
    if (g('trouble')) out.push({ text: g('trouble'), kind: 'trouble' });
    parseArr<{ name: string }>(cd[`${prefix}aspects`]).forEach((a) => {
      if (a.name) out.push({ text: a.name, kind: 'other' });
    });
    return out;
  }, [g, cd, prefix]);

  const stunts: FateStunt[] = parseArr<{ name: string; desc: string }>(
    cd[`${prefix}stunts`],
  ).filter((s) => s.name);

  if (isLoading) return <FateCombatBodyLoading />;
  // Bez tohohle guardu (jako jediný z 12 combat panelů) padal panel na chybové
  // cestě do `diary?.customData ?? {}` → stres/následky/FP se vykreslily jako
  // prázdné a klik uložil ABSOLUTNÍ hodnotu spočtenou z té nuly → přepsal
  // reálný deník. Ostatní panely mají `if (!diary)` hned za loadingem — tohle
  // je dorovnání na jejich vzor (chytá i chybu i „deník neexistuje").
  if (!diary) return <FateCombatBodyUnavailable />;

  return (
    <FateCombatBody
      variant={variant}
      canEdit={canEdit}
      fatePoints={fatePoints}
      refresh={refresh}
      onFatePoints={(d) => writeKey('fatePoints', String(clampFp(fatePoints + d)))}
      boxes={boxes}
      onToggleBox={(i) =>
        writeKey(
          'stress',
          JSON.stringify(
            boxes.map((b, j) => (j === i ? { ...b, on: !b.on } : b)),
          ),
        )
      }
      consequences={consequences}
      onCons={(key, text) => writeKey(`cons_${key}`, text)}
      abilities={abilities}
      onRoll={
        onRoll
          ? (label, bonus) => onRoll({ label, modifier: bonus, kind: 'fate' })
          : undefined
      }
      onInitiative={
        onRoll
          ? () => onRoll({ label: 'Iniciativa', modifier: 0, kind: 'fate' })
          : undefined
      }
      aspects={aspects}
      stunts={stunts}
    />
  );
}

function FateCombatBodyLoading(): React.ReactElement {
  return <div style={{ padding: 16, color: '#9b8a6c' }}>Načítám statblok…</div>;
}

function FateCombatBodyUnavailable(): React.ReactElement {
  return (
    <div style={{ padding: 16, color: '#9b8a6c' }} role="alert">
      Deník postavy není dostupný.
    </div>
  );
}

/** Fate Accelerated PC combat panel (prefix `fae_`). */
export function FaeCombatPanel(props: CombatPanelProps): React.ReactElement {
  return <FatePanelImpl {...props} variant="fae" prefix="fae_" />;
}

/** Fate Core PC combat panel (prefix `fate_`). */
export function FateCombatPanel(props: CombatPanelProps): React.ReactElement {
  return <FatePanelImpl {...props} variant="core" prefix="fate_" />;
}
