import { useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { buildBestieToken } from '@/features/world/tactical-map/utils/buildSpawnToken';
import { BestieStatblock } from '@/features/world/tactical-map/components/tokens/BestieStatblock';
import { getBestieAbilities } from '@/features/world/bestiar/lib/bestieAbilities';
import type { Bestie } from '@/features/world/bestiar/types';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import s from './BestieRollPanel.module.css';

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
 * 16.1c — statblok bestie z katalogu v railu chatu. Read-only (staty + lore;
 * editace bestie patří do Bestiáře), schopnosti **klikací → hod do chatu** jako
 * ta bestie (atribuce `bestie`). Token vyrábíme z katalogové bestie přes
 * `buildBestieToken` (BestieStatblock chce `MapToken`) — žádná HP perzistence,
 * je to jen one-shot hod „za bestii".
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
      <div className={s.head}>
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
        <span className={s.title}>{bestie.name}</span>
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
          <section className={s.lore}>
            <h4 className={s.loreHead}>📜 Popis</h4>
            <p className={s.loreBody}>{bestie.notes}</p>
          </section>
        )}
      </div>
    </aside>
  );
}
