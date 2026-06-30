import { useMemo } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { buildBestieToken } from '@/features/world/tactical-map/utils/buildSpawnToken';
import { BestieStatblock } from '@/features/world/tactical-map/components/tokens/BestieStatblock';
import { DiarySkinScope } from '@/features/world/pages/CharacterDetailPage/diary-systems/DiarySkinScope';
import { getDiaryPreset } from '@/features/world/pages/CharacterDetailPage/diary-systems/registry';
import { getBestieAbilities } from '@/features/world/bestiar/lib/bestieAbilities';
import type { Bestie } from '@/features/world/bestiar/types';
import { useChatDiaryRoll } from './useChatDiaryRoll';
import { Drd16ChatBestiePanel } from './Drd16ChatBestiePanel';
import { MatrixChatBestiePanel } from './MatrixChatBestiePanel';
import { PiChatBestiePanel } from './PiChatBestiePanel';
import { DrdPlusChatBestiePanel } from './DrdPlusChatBestiePanel';
import { Drd2ChatBestiePanel } from './Drd2ChatBestiePanel';
import { JadChatBestiePanel } from './JadChatBestiePanel';
import { DndChatBestiePanel } from './DndChatBestiePanel';
import { FateChatBestiePanel } from './FateChatBestiePanel';
import { ShadowrunChatBestiePanel } from './ShadowrunChatBestiePanel';
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
    // 16.2d-chat — „obalení": data-diary-system přímo na aside (NE wrapper —
    // display:contents by ztratil `.tabWrap > :last-child { flex:1 }` → rozbitá
    // šířka). railShell `.panel[data-diary-system='drdplus']` skinuje chrome.
    <aside className={s.panel} data-diary-system={getDiaryPreset(systemId).id}>
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
        {systemId === 'drd16' ? (
          // 16.2b-chat — drd16 katalogová bestie (read-only); panel konzumuje skin
          // tokeny z předka → vlastní DiarySkinScope.
          <DiarySkinScope worldId={worldId}>
            <Drd16ChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              notes={bestie.notes}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'matrix' ? (
          // 16.2b-chat — Matrix katalogová bestie (read-only); --mx-* z předka.
          <DiarySkinScope worldId={worldId}>
            <MatrixChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              systemId={systemId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              abilities={abilities.map((a) => ({
                name: a.label,
                description: a.value,
              }))}
              notes={bestie.notes}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'pi' ? (
          // Příběhy Impéria — pi katalogová bestie (read-only); sci-fi HUD.
          <DiarySkinScope worldId={worldId}>
            <PiChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              systemId={systemId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              abilities={abilities.map((a) => ({
                name: a.label,
                description: a.value,
              }))}
              notes={bestie.notes}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'drdplus' ? (
          // 16.2d-chat — DrD+ katalogová bestie: pergamen panel (2k6+/d6,
          // BČ→iniciativa), read-only (bez onPatch).
          <DrdPlusChatBestiePanel
            worldId={worldId}
            channelId={channelId}
            rollerName={bestie.name}
            avatarUrl={bestie.imageUrl}
            systemStats={bestie.systemStats}
            abilities={abilities.map((a) => ({
              name: a.label,
              description: a.value,
            }))}
            notes={bestie.notes}
            canEdit={false}
          />
        ) : systemId === 'drd2' ? (
          // 16.2f-chat — DrD II katalogová bestie (read-only); konzumuje skin
          // tokeny (--dd-*) z předka → vlastní DiarySkinScope (data-diary-skin).
          <DiarySkinScope worldId={worldId}>
            <Drd2ChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'jad' ? (
          <DiarySkinScope worldId={worldId}>
            <JadChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'dnd5e' ? (
          <DiarySkinScope worldId={worldId}>
            <DndChatBestiePanel
              worldId={worldId}
              channelId={channelId}
              rollerName={bestie.name}
              avatarUrl={bestie.imageUrl}
              systemStats={bestie.systemStats}
              canEdit={false}
            />
          </DiarySkinScope>
        ) : systemId === 'fae' || systemId === 'fate' ? (
          // FATE katalogová bestie (read-only) — „Karty osudu", self-contained.
          <FateChatBestiePanel
            worldId={worldId}
            channelId={channelId}
            systemId={systemId}
            rollerName={bestie.name}
            avatarUrl={bestie.imageUrl}
            systemStats={bestie.systemStats}
            canEdit={false}
          />
        ) : systemId === 'shadowrun' ? (
          // Shadowrun katalogová bestie (read-only) — jantarový statblok, self-contained.
          <ShadowrunChatBestiePanel
            worldId={worldId}
            channelId={channelId}
            rollerName={bestie.name}
            avatarUrl={bestie.imageUrl}
            systemStats={bestie.systemStats}
            notes={bestie.notes}
            canEdit={false}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
    </aside>
  );
}
