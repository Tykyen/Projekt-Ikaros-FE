/**
 * 13.3 — SoundBroadcastButton: PJ „pustí zvuk všem" v konverzaci.
 *
 * 🎵 tlačítko (jen PJ) → popover: výběr ze zvukové databáze světa nebo vložení
 * YT odkazu → emit `sound:play` (BE gate >= PomocnyPJ → broadcast
 * `chat:sound:playing`). Ephemeral, nejde do historie.
 */
import { useState } from 'react';
import { Music } from 'lucide-react';
import { getSocket } from '@/features/chat/api/socket';
import { useWorldSounds } from '@/features/world/sounds/hooks/useSounds';
import { extractYoutubeId } from '@/features/world/sounds/player/youtubeId';
import { MEDIA_TYPE_LABELS } from '@/features/world/sounds/lib/soundEnums';
import s from './SoundBroadcastButton.module.css';

interface Props {
  worldId: string;
  channelId: string;
  currentUserId: string;
}

export function SoundBroadcastButton({
  worldId,
  channelId,
  currentUserId,
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const { data: sounds } = useWorldSounds(open ? worldId : null);

  const play = (youtubeUrl: string, name: string, loop: boolean) => {
    if (!extractYoutubeId(youtubeUrl)) return;
    getSocket().emit('sound:play', {
      channelId,
      userId: currentUserId,
      youtubeUrl,
      name,
      loop,
    });
    setOpen(false);
    setUrl('');
  };

  const stop = () => {
    getSocket().emit('sound:stop', { channelId, userId: currentUserId });
    setOpen(false);
  };

  const library = sounds ?? [];

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.btn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Pustit zvuk všem"
        title="Pustit zvuk všem (PJ)"
      >
        <Music size={18} />
      </button>

      {open && (
        <>
          <div className={s.backdrop} onClick={() => setOpen(false)} />
          <div className={s.popover}>
            <div className={s.urlRow}>
              <input
                className={s.urlInput}
                placeholder="Vlož YouTube odkaz…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && extractYoutubeId(url)) {
                    play(url, 'Zvuk z odkazu', true);
                  }
                }}
              />
              <button
                type="button"
                className={s.playUrl}
                disabled={!extractYoutubeId(url)}
                onClick={() => play(url, 'Zvuk z odkazu', true)}
              >
                ▶
              </button>
            </div>

            <div className={s.list}>
              {library.length === 0 ? (
                <p className={s.empty}>
                  Knihovna světa je prázdná. Přidej zvuky na stránce Zvuky.
                </p>
              ) : (
                library.map((snd) => (
                  <button
                    key={snd.id}
                    type="button"
                    className={s.item}
                    onClick={() => play(snd.youtubeUrl, snd.name, snd.loop)}
                  >
                    <span className={s.itemName}>{snd.name}</span>
                    <span className={s.itemType}>
                      {MEDIA_TYPE_LABELS[snd.mediaType]}
                    </span>
                  </button>
                ))
              )}
            </div>

            <button type="button" className={s.stop} onClick={stop}>
              ⏹ Zastavit pro všechny
            </button>
          </div>
        </>
      )}
    </div>
  );
}
