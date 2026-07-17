import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  UserCircle,
  BookOpen,
  Coins,
  Backpack,
  CalendarDays,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import {
  CHARACTER_TAB_IDS,
  type CharacterTabId,
  type CharacterTabVisibility,
} from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateWorldSettings } from '@/features/world/api/useUpdateWorldSettings';
import { defaultCharacterTabVisibility } from '@/features/world/lib/characterTabVisibility';
import { SettingsPanel } from '../components/SettingsPanel';
import s from './CharacterTabsVisibilityTab.module.css';

const TAB_LABELS: Record<CharacterTabId, string> = {
  denik: 'Deník',
  finance: 'Finance',
  vybava: 'Výbava',
  kalendar: 'Kalendář',
  poznamky: 'Poznámky',
};

const TAB_ICONS: Record<CharacterTabId, React.ReactElement> = {
  denik: <BookOpen size={14} aria-hidden />,
  finance: <Coins size={14} aria-hidden />,
  vybava: <Backpack size={14} aria-hidden />,
  kalendar: <CalendarDays size={14} aria-hidden />,
  poznamky: <StickyNote size={14} aria-hidden />,
};

type TypKey = keyof CharacterTabVisibility;

const TYPES: { key: TypKey; label: string }[] = [
  { key: 'PostavaHrace', label: 'Postava hráče' },
  { key: 'NPC', label: 'NPC' },
];

function normalize(
  src: CharacterTabVisibility | undefined,
): CharacterTabVisibility {
  if (!src) return defaultCharacterTabVisibility();
  return {
    PostavaHrace: src.PostavaHrace ?? [...CHARACTER_TAB_IDS],
    NPC: src.NPC ?? [...CHARACTER_TAB_IDS],
  };
}

function sameVis(a: CharacterTabVisibility, b: CharacterTabVisibility): boolean {
  const eq = (x: CharacterTabId[], y: CharacterTabId[]) =>
    x.length === y.length && x.every((id) => y.includes(id));
  return eq(a.PostavaHrace, b.PostavaHrace) && eq(a.NPC, b.NPC);
}

/**
 * Side-task character-tab-visibility — PJ matrix per Page.type × subdoc tab.
 * Profil je vždy povinný (mimo matrix). Hráč/Korektor s viditelností nehne —
 * filtruje pohled rolí, které by jinak měly přístup ke všem subdoc tabům
 * (PJ, PomocnyPJ, vlastník PC).
 */
export default function CharacterTabsVisibilityTab() {
  const { world } = useWorldContext();
  const settingsQ = useWorldSettings(world?.id ?? '');
  const mutation = useUpdateWorldSettings(world?.id ?? '');

  const initial = useMemo(
    () => normalize(settingsQ.data?.characterTabVisibility),
    [settingsQ.data?.characterTabVisibility],
  );
  const [local, setLocal] = useState<CharacterTabVisibility>(initial);
  // Render-phase reset (React doc pattern „Storing information from previous renders") —
  // když settings query refetchne novou data po uložení, sync local s ní.
  const [prevInitial, setPrevInitial] = useState<CharacterTabVisibility>(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setLocal(initial);
  }

  if (!world) return null;

  const dirty = !sameVis(local, initial);
  const saving = mutation.isPending;

  function toggle(typ: TypKey, id: CharacterTabId) {
    setLocal((prev) => {
      const list = prev[typ];
      const next = list.includes(id)
        ? list.filter((x) => x !== id)
        : [...list, id];
      return { ...prev, [typ]: next };
    });
  }

  function reset() {
    setLocal(defaultCharacterTabVisibility());
  }

  async function save() {
    try {
      await mutation.mutateAsync({ characterTabVisibility: local });
      toast.success('Nastavení uloženo');
    } catch {
      toast.error('Uložení selhalo');
    }
  }

  return (
    <SettingsPanel
      title="Postavy & NPC"
      description={
        'Vyber, které sekce se zobrazí na detailu Postavy a NPC. Skrytí je vratné — data se nemažou, jen zmizí z UI. Tab „Profil“ je vždy povinný.'
      }
      query={settingsQ}
    >
      <>
          {/* Desktop matrix */}
          <div className={s.matrix} role="grid" aria-label="Matice viditelnosti">
            <div className={`${s.row} ${s.head}`} role="row">
              <div className={s.cornerCell} role="columnheader" />
              <div className={s.headCell} role="columnheader">
                <UserCircle size={14} aria-hidden /> Profil
                <span className={s.alwaysBadge}>vždy</span>
              </div>
              {CHARACTER_TAB_IDS.map((id) => (
                <div key={id} className={s.headCell} role="columnheader">
                  {TAB_ICONS[id]} {TAB_LABELS[id]}
                </div>
              ))}
            </div>

            {TYPES.map(({ key, label }) => (
              <div key={key} className={s.row} role="row">
                <div className={s.typeCell} role="rowheader">
                  {label}
                </div>
                <div className={s.cell}>
                  <input
                    type="checkbox"
                    checked
                    disabled
                    aria-label={`Profil — ${label} (vždy zapnuto)`}
                  />
                </div>
                {CHARACTER_TAB_IDS.map((id) => {
                  const on = local[key].includes(id);
                  return (
                    <div key={id} className={s.cell}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key, id)}
                        aria-label={`${TAB_LABELS[id]} — ${label}`}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Mobile stacked sections */}
          <div className={s.mobileSections}>
            {TYPES.map(({ key, label }) => (
              <div key={key} className={s.mobileSection}>
                <h3 className={s.mobileTitle}>{label}</h3>
                <label className={`${s.mobileRow} ${s.mobileRowDisabled}`}>
                  <input type="checkbox" checked disabled />
                  <UserCircle size={14} aria-hidden />
                  <span>Profil</span>
                  <span className={s.alwaysBadge}>vždy</span>
                </label>
                {CHARACTER_TAB_IDS.map((id) => {
                  const on = local[key].includes(id);
                  return (
                    <label key={id} className={s.mobileRow}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key, id)}
                      />
                      {TAB_ICONS[id]}
                      <span>{TAB_LABELS[id]}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>

          <footer className={s.footer}>
            <Button variant="secondary" onClick={reset} disabled={saving}>
              Resetovat na výchozí
            </Button>
            <Button onClick={save} disabled={!dirty || saving}>
              {saving ? 'Ukládám…' : 'Uložit změny'}
            </Button>
          </footer>
      </>
    </SettingsPanel>
  );
}
