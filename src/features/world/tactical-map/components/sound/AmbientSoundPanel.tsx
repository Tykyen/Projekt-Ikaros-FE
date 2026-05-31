/**
 * 10.2k → 10.2n — AmbientSoundPanel: PJ ovládání ambient playlistu scény.
 *
 * PJ skládá playlist přidáváním z „katalogu" (Zvuková databáze světa) — stejný
 * vzor jako spawn palety PC/NPC/Bestie (`CharacterCatalogModal` se search), aby
 * šel zvládnout i 200+ zvuků. „Vysílat" nastaví `scene.activeSoundIds`
 * (op `sound.playlist`) → všem na scéně začne hrát (SceneSoundPlayer). „Zastavit"
 * vyšle prázdný playlist.
 *
 * Mutaci řídí rodič (TacticalMapView) přes `onBroadcast` — stejný pattern jako
 * MapPjPanel/efekty (optimistic přes applyOperationToScene + postMapOperation).
 */
import { useMemo, useState } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSounds } from '@/features/world/sounds/hooks/useSounds';
import { useSoundActivation } from '@/features/world/sounds/player/soundActivation';
import { CharacterCatalogModal } from '../pj-panel/CharacterCatalogModal';
import type { MapScene } from '../../types';
import styles from './AmbientSoundPanel.module.css';

interface Props {
  scene: MapScene;
  /** Broadcast nového playlistu (op `sound.playlist`) — řeší rodič. */
  onBroadcast: (soundIds: string[]) => void;
}

export function AmbientSoundPanel({
  scene,
  onBroadcast,
}: Props): React.ReactElement {
  const { worldId } = useWorldContext();
  const [open, setOpen] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const { data: sounds } = useWorldSounds(open ? worldId : null);
  const { activate } = useSoundActivation();

  // Draft playlist (lokální výběr PJ); init ze scény.
  const [draft, setDraft] = useState<string[]>(scene.activeSoundIds ?? []);

  const playing = (scene.activeSoundIds ?? []).length > 0;
  const library = useMemo(() => sounds ?? [], [sounds]);

  const byId = useMemo(
    () => new Map(library.map((sound) => [sound.id, sound])),
    [library],
  );

  const add = (id: string) =>
    setDraft((d) => (d.includes(id) ? d : [...d, id]));

  const remove = (id: string) => setDraft((d) => d.filter((x) => x !== id));

  const move = (id: string, dir: -1 | 1) =>
    setDraft((d) => {
      const i = d.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handlePlay = () => {
    activate(); // PJ klik = gesto → vlastní přehrávač smí hrát
    onBroadcast(draft);
  };

  const handleStop = () => {
    onBroadcast([]);
  };

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.title}>
          🎵 Ambient {playing && <span className={styles.live}>· vysílá</span>}
        </span>
        <span className={open ? styles.chevronOpen : styles.chevron}>▾</span>
      </button>

      {open && (
        <div className={styles.body}>
          <div className={styles.toolbar}>
            <button
              type="button"
              className={styles.catalogBtn}
              onClick={() => setShowCatalog(true)}
              disabled={library.length === 0}
              title={
                library.length === 0
                  ? 'Knihovna světa je prázdná — přidej zvuky na stránce Zvuky.'
                  : 'Přidat zvuky do playlistu z databáze světa'
              }
            >
              + z katalogu
            </button>
            <span className={styles.draftCount}>{draft.length} v playlistu</span>
          </div>

          {draft.length === 0 ? (
            <p className={styles.empty}>
              {library.length === 0
                ? 'Knihovna světa je prázdná. Přidej zvuky na stránce Zvuky.'
                : 'Playlist je prázdný. Přidej zvuky přes „+ z katalogu".'}
            </p>
          ) : (
            <div className={styles.order}>
              {draft.map((id) => {
                const sound = byId.get(id);
                return (
                  <div key={id} className={styles.orderRow}>
                    <span className={styles.orderName}>
                      {sound?.name ?? '…'}
                    </span>
                    <button
                      type="button"
                      className={styles.tiny}
                      onClick={() => move(id, -1)}
                      aria-label="Nahoru"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className={styles.tiny}
                      onClick={() => move(id, 1)}
                      aria-label="Dolů"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      className={styles.tiny}
                      onClick={() => remove(id)}
                      aria-label={`Odebrat ${sound?.name ?? 'zvuk'} z playlistu`}
                      title="Odebrat z playlistu"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.play}
              onClick={handlePlay}
              disabled={draft.length === 0}
            >
              ▶ Vysílat ({draft.length})
            </button>
            <button
              type="button"
              className={styles.stop}
              onClick={handleStop}
              disabled={!playing}
            >
              ⏹ Zastavit
            </button>
          </div>
        </div>
      )}

      {showCatalog && (
        <CharacterCatalogModal
          title="Zvuková databáze světa"
          searchPlaceholder="Hledat zvuk…"
          items={library.map((s) => ({ id: s.id, name: s.name }))}
          activeIds={new Set(draft)}
          onPick={(item) => add(item.id)}
          onClose={() => setShowCatalog(false)}
        />
      )}
    </div>
  );
}
