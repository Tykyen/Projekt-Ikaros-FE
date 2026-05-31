/**
 * 13.3 — SoundNowPlayingBanner: „Právě hraje" pruh nad composerem.
 *
 * Poslouchá `chat:sound:playing`/`chat:sound:stopped` pro danou konverzaci.
 * Hraje přes sdílené YT jádro; hráč musí poprvé kliknout „Aktivovat zvuk"
 * (autoplay gate). PJ může zastavit pro všechny (`sound:stop`).
 */
import { useCallback, useEffect, useState } from 'react';
import { getSocket } from '@/features/chat/api/socket';
import { useSocketEvent } from '@/features/chat/api/useSocket';
import { useYoutubePlayer } from '@/features/world/sounds/player/useYoutubePlayer';
import { extractYoutubeId } from '@/features/world/sounds/player/youtubeId';
import {
  useSoundActivation,
  useSoundVolume,
} from '@/features/world/sounds/player/soundActivation';
import { SoundActivateButton } from '@/features/world/sounds/player/SoundActivateButton';
import s from './SoundNowPlayingBanner.module.css';

interface PlayingEvent {
  channelId: string;
  youtubeUrl: string;
  name: string;
  loop: boolean;
}
interface StoppedEvent {
  channelId: string;
}

interface Props {
  channelId: string;
  currentUserId: string;
  /** PJ vidí tlačítko „Zastavit pro všechny". */
  canManage: boolean;
}

export function SoundNowPlayingBanner({
  channelId,
  currentUserId,
  canManage,
}: Props): React.ReactElement | null {
  const [now, setNow] = useState<PlayingEvent | null>(null);
  const player = useYoutubePlayer();
  const { activated } = useSoundActivation();
  const { effectiveVolume, muted, setMuted } = useSoundVolume();

  const handlePlaying = useCallback(
    (e: PlayingEvent) => {
      if (e.channelId !== channelId) return;
      setNow(e);
    },
    [channelId],
  );
  const handleStopped = useCallback(
    (e: StoppedEvent) => {
      if (e.channelId !== channelId) return;
      setNow(null);
    },
    [channelId],
  );

  useSocketEvent<PlayingEvent>('chat:sound:playing', handlePlaying);
  useSocketEvent<StoppedEvent>('chat:sound:stopped', handleStopped);

  // Přehrávání řízené stavem + aktivací.
  useEffect(() => {
    const id = now ? extractYoutubeId(now.youtubeUrl) : null;
    if (id && activated) {
      player.play([id], { loop: now?.loop ?? true });
    } else if (!now) {
      player.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now?.youtubeUrl, activated]);

  useEffect(() => {
    player.setVolume(effectiveVolume);
  }, [effectiveVolume, player]);

  // Opustím konverzaci → ztiš (nový mount banneru jiné konverzace má svůj stav).
  useEffect(() => {
    return () => player.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  if (!now) return null;

  const stopForAll = () => {
    getSocket().emit('sound:stop', { channelId, userId: currentUserId });
  };

  return (
    <div className={s.banner}>
      {!activated ? (
        <SoundActivateButton label="🔊 Aktivovat zvuk" />
      ) : (
        <span className={s.eq} aria-hidden>
          <span />
          <span />
          <span />
        </span>
      )}
      <span className={s.label}>🎵 Právě hraje:</span>
      <span className={s.name}>{now.name}</span>
      {activated && (
        <button
          type="button"
          className={s.mute}
          onClick={() => setMuted(!muted)}
          title={muted ? 'Zapnout zvuk' : 'Ztlumit'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      {canManage && (
        <button type="button" className={s.stop} onClick={stopForAll}>
          Zastavit pro všechny
        </button>
      )}
    </div>
  );
}
