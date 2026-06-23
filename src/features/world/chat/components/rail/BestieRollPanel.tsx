import { useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { buildBestieToken } from '@/features/world/tactical-map/utils/buildSpawnToken';
import { BestieStatblock } from '@/features/world/tactical-map/components/tokens/BestieStatblock';
import { getBestieAbilities } from '@/features/world/bestiar/lib/bestieAbilities';
import type { Bestie } from '@/features/world/bestiar/types';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import s from './railShell.module.css';
import b from './BestieRollPanel.module.css';

interface Props {
  worldId: string;
  channelId: string | null;
  systemId: string;
  bestie: Bestie;
  /** PJ — zpět na panel Přítomní. */
  onBack?: () => void;
  /** Mobil — zavřít rail. */
  onClose?: () => void;
}

const noop = () => {};

/**
 * 16.1c — statblok bestie z katalogu v railu chatu. Vizuál „pro hru" (jako
 * taktická mapa): identity hlavička s portrétem + jménem, pod ní statblok.
 * Read-only (staty + lore; editace bestie patří do Bestiáře), schopnosti
 * **klikací → hod do chatu** jako ta bestie (atribuce `bestie`). Token
 * vyrábíme z katalogové bestie přes `buildBestieToken` — žádná HP perzistence.
 */
export function BestieRollPanel({
  worldId,
  channelId,
  systemId,
  bestie,
  onBack,
  onClose,
}: Props) {
  const token = useMemo(() => buildBestieToken(bestie, 0, 0), [bestie]);
  const abilities = useMemo(() => getBestieAbilities(bestie), [bestie]);

  const makeOnRoll = useChatDiaryRoll(worldId, channelId);
  const onRoll = makeOnRoll({
    kind: 'bestie',
    rollerName: bestie.name,
    avatarUrl: bestie.imageUrl,
  });

  return (
    <aside className={s.panel}>
      <div className={s.controls}>
        {onBack && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onBack}
            aria-label="Zpět na Přítomní"
            title="Zpět na Přítomní"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className={s.spacer} />
        {onClose && (
          <button
            type="button"
            className={s.iconBtn}
            onClick={onClose}
            aria-label="Zavřít"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className={s.identity}>
        <div className={s.avatar}>
          {bestie.imageUrl ? (
            <img src={bestie.imageUrl} alt={bestie.name} />
          ) : (
            <div className={s.avatarFallback}>
              {bestie.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <h2 className={s.name}>{bestie.name}</h2>
      </div>

      <div className={s.scroll}>
        <BestieStatblock
          token={token}
          worldId={worldId}
          systemId={systemId}
          canEdit={false}
          stats={bestie.systemStats}
          onStatsChange={noop}
          abilities={abilities}
          onAbilitiesChange={noop}
          notes=""
          onNotesChange={noop}
          disabled={false}
          onRollAbility={(a) =>
            onRoll({
              label: a.label,
              modifier: parseInt(a.value, 10) || 0,
              kind: 'fate',
            })
          }
        />

        {bestie.notes?.trim() && (
          <section className={b.lore}>
            <h4 className={b.loreHead}>📜 Popis</h4>
            <p className={b.loreBody}>{bestie.notes}</p>
          </section>
        )}
      </div>
    </aside>
  );
}
