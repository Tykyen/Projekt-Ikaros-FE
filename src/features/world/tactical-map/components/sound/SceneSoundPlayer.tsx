/**
 * 10.2k — SceneSoundPlayer: přehrává ambient playlist scény (všem na scéně).
 *
 * Mountuje se pro PJ i hráče. Sleduje `scene.activeSoundIds`, resolvuje na YT
 * ID a hraje přes sdílené jádro. Autoplay gate: hráč musí poprvé kliknout
 * „Aktivovat zvuk" (browser policy). PJ má gesto z panelu (activate()).
 */
import { useEffect, useMemo } from 'react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSounds } from '@/features/world/sounds/hooks/useSounds';
import { useYoutubePlayer } from '@/features/world/sounds/player/useYoutubePlayer';
import { extractYoutubeIds } from '@/features/world/sounds/player/youtubeId';
import {
  useSoundActivation,
  useSoundVolume,
} from '@/features/world/sounds/player/soundActivation';
import { SoundActivateButton } from '@/features/world/sounds/player/SoundActivateButton';
import type { MapScene } from '../../types';
import styles from './SceneSoundPlayer.module.css';

interface Props {
  scene: MapScene;
}

export function SceneSoundPlayer({ scene }: Props): React.ReactElement | null {
  const { worldId } = useWorldContext();
  const { data: sounds } = useWorldSounds(worldId);
  const player = useYoutubePlayer();
  const { activated } = useSoundActivation();
  const { effectiveVolume, muted, setMuted } = useSoundVolume();

  const activeIds = scene.activeSoundIds ?? [];
  const activeIdsKey = activeIds.join(',');

  // activeSoundIds → YouTube video ID (zachová pořadí playlistu).
  const videoIds = useMemo(() => {
    if (!sounds) return [];
    const byId = new Map(sounds.map((s) => [s.id, s]));
    const urls = activeIds
      .map((id) => byId.get(id)?.youtubeUrl)
      .filter((u): u is string => Boolean(u));
    return extractYoutubeIds(urls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sounds, activeIdsKey]);
  const videoIdsKey = videoIds.join(',');

  // Přehrávání řízené stavem scény + aktivací.
  useEffect(() => {
    if (videoIds.length > 0 && activated) {
      player.play(videoIds, { loop: true });
    } else if (videoIds.length === 0) {
      player.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoIdsKey, activated]);

  // Hlasitost.
  useEffect(() => {
    player.setVolume(effectiveVolume);
  }, [effectiveVolume, player]);

  if (activeIds.length === 0) return null;

  return (
    <div className={styles.bar}>
      {!activated ? (
        <SoundActivateButton label="Aktivovat zvuk" />
      ) : (
        <>
          <span className={styles.equalizer} aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.label}>Ambient</span>
          <button
            type="button"
            className={styles.mute}
            onClick={() => setMuted(!muted)}
            title={muted ? 'Zapnout zvuk' : 'Ztlumit'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </>
      )}
    </div>
  );
}
