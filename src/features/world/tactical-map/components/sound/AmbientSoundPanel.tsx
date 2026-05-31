/**
 * 10.2k — AmbientSoundPanel: PJ ovládání ambient playlistu scény.
 *
 * PJ vybere zvuky z knihovny světa → „Vysílat" nastaví `scene.activeSoundIds`
 * (op `sound.playlist`) → všem na scéně začne hrát (SceneSoundPlayer). „Zastavit"
 * vyšle prázdný playlist. Vzhled sjednocen s DiceLogPanel (solid, sbalitelný).
 *
 * Mutaci řídí rodič (TacticalMapView) přes `onBroadcast` — stejný pattern jako
 * MapPjPanel/efekty (optimistic přes applyOperationToScene + postMapOperation).
 */
import { useMemo, useState } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSounds } from '@/features/world/sounds/hooks/useSounds';
import { useSoundActivation } from '@/features/world/sounds/player/soundActivation';
import { MEDIA_TYPE_LABELS } from '@/features/world/sounds/lib/soundEnums';
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
  const { data: sounds } = useWorldSounds(open ? worldId : null);
  const { activate } = useSoundActivation();

  // Draft playlist (lokální výběr PJ); init ze scény.
  const [draft, setDraft] = useState<string[]>(scene.activeSoundIds ?? []);

  const playing = (scene.activeSoundIds ?? []).length > 0;
  const library = sounds ?? [];

  const byId = useMemo(
    () => new Map(library.map((sound) => [sound.id, sound])),
    [library],
  );

  const toggle = (id: string) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

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
          {library.length === 0 ? (
            <p className={styles.empty}>
              Knihovna světa je prázdná. Přidej zvuky na stránce Zvuky.
            </p>
          ) : (
            <>
              <div className={styles.picker}>
                {library.map((sound) => {
                  const idx = draft.indexOf(sound.id);
                  const selected = idx >= 0;
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      className={`${styles.item} ${selected ? styles.itemOn : ''}`}
                      onClick={() => toggle(sound.id)}
                      title={MEDIA_TYPE_LABELS[sound.mediaType]}
                    >
                      <span className={styles.itemOrder}>
                        {selected ? idx + 1 : '+'}
                      </span>
                      <span className={styles.itemName}>{sound.name}</span>
                    </button>
                  );
                })}
              </div>

              {draft.length > 0 && (
                <div className={styles.order}>
                  {draft.map((id) => {
                    const sound = byId.get(id);
                    if (!sound) return null;
                    return (
                      <div key={id} className={styles.orderRow}>
                        <span className={styles.orderName}>{sound.name}</span>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
