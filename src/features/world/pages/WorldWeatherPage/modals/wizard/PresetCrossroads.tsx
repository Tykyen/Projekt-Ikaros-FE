/**
 * 9.4-I — Stage 1 wizardu: rozcestí.
 *
 * 3 velké portrétové karty — Reálný svět (aktivní), Fantasy (locked 9.4-II),
 * Sci-fi (locked 9.4-III). Klik na aktivní → setRealm + setStage('categories').
 * Locked karty mají `aria-disabled` a tooltip o budoucí iteraci.
 */
import { Lock } from 'lucide-react';
import s from './PresetCrossroads.module.css';
import type { Realm } from './types';

interface RealmCard {
  realm: Realm;
  glyph: string;
  name: string;
  tagline: string;
  count: string;
  categories: string;
  /** Pokud true, klick noop + locked styling. */
  locked: boolean;
  /** Lock label (např. „9.4-II"). */
  lockedLabel?: string;
}

const BUILTIN_REALM_CARDS: RealmCard[] = [
  {
    realm: 'real',
    glyph: '🌍',
    name: 'Reálný svět',
    tagline:
      'Reálné země a města Země, klimatické zóny, mořská prostředí, reálné extrémy.',
    count: '~840 presetů',
    categories: 'Země & města · Klimatické zóny · Mořská prostředí · Extrémy',
    locked: false,
  },
  {
    realm: 'fantasy',
    glyph: '🐉',
    name: 'Fantasy & mytologie',
    tagline:
      'Literární světy, mytologická místa, magická prostředí, horor.',
    count: '53 presetů',
    categories:
      'Středozem · Westeros · Faerůn · Olymp · Asgard · Witcher · Tamriel',
    locked: false,
  },
  {
    realm: 'scifi',
    glyph: '🚀',
    name: 'Sci-fi & vesmír',
    tagline: 'Planety, vesmírné stanice, lodi, EVA, cyberpunk.',
    count: '45 presetů',
    categories: 'Mars · Měsíc · Titan · ISS · Lodní interiéry · Cyberpunk',
    locked: false,
  },
];

interface Props {
  onPickRealm: (realm: Realm) => void;
  /**
   * 9.4-dluh — počet custom svět-scoped presetů (z `useCustomPresets`).
   * Pokud >0 → karta „Mé presety" plně aktivní. Pokud 0 → karta se zobrazí
   * ale je vizuálně tlumená + tooltip „Ulož generátor jako preset…".
   */
  customPresetsCount: number;
  /**
   * 9.4 — celkový počet dostupných setů (globálních + custom). Slouží jen pro
   * countBadge na kartě „Sety".
   */
  setsCount?: number;
}

export function PresetCrossroads({
  onPickRealm,
  customPresetsCount,
  setsCount = 0,
}: Props) {
  const customCard: RealmCard = {
    realm: 'custom',
    glyph: '⭐',
    name: 'Mé presety',
    tagline:
      'Vlastní presety uložené pro tento svět. Z „Uložit jako preset" v modalu.',
    count:
      customPresetsCount > 0
        ? `${customPresetsCount} presetů`
        : 'Zatím žádné',
    categories:
      customPresetsCount > 0
        ? 'Svět-scoped · Tvé vlastní konfigurace'
        : 'Klikni „Uložit jako preset" v modalu generátoru',
    // Nikdy locked — vždy klikatelné (empty state v stage 3 vysvětlí jak vytvořit).
    locked: false,
  };
  const setsCard: RealmCard = {
    realm: 'set',
    glyph: '📦',
    name: 'Sety',
    tagline:
      'Předpřipravené balíčky generátorů — 1 klik vytvoří víc regionů najednou.',
    count:
      setsCount > 0 ? `${setsCount}+ globálních` : '14+ globálních',
    categories:
      'Evropa · Asie · Mars · Vesmírná stanice · Solar System',
    locked: false,
  };
  const cards: RealmCard[] = [customCard, setsCard, ...BUILTIN_REALM_CARDS];

  return (
    <div className={s.grid}>
      {cards.map((card) => (
        <button
          key={card.realm}
          type="button"
          className={s.card}
          data-realm={card.realm}
          data-locked={card.locked || undefined}
          data-empty={
            card.realm === 'custom' && customPresetsCount === 0
              ? 'true'
              : undefined
          }
          aria-disabled={card.locked}
          onClick={() => {
            if (!card.locked) onPickRealm(card.realm);
          }}
          title={
            card.locked
              ? `Dostupné v iteraci ${card.lockedLabel}`
              : card.realm === 'custom' && customPresetsCount === 0
                ? 'Zatím nemáš žádný vlastní preset. Otevři modal generátoru a klikni „Uložit jako preset".'
                : `Pokračovat na kategorie ${card.name}`
          }
        >
          {card.locked && (
            <span className={s.lockBadge} aria-hidden>
              <Lock size={14} />
            </span>
          )}
          <span className={s.glyph} aria-hidden>
            {card.glyph}
          </span>
          <span className={s.name}>{card.name}</span>
          <span className={s.tagline}>{card.tagline}</span>
          <span className={s.countBadge}>
            {card.count}
            {card.lockedLabel ? ` · ${card.lockedLabel}` : ''}
          </span>
          <span className={s.categories}>{card.categories}</span>
        </button>
      ))}
    </div>
  );
}
