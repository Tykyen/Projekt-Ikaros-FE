/**
 * 17.6 — persistentní hostitel hlasového hovoru ve světě.
 *
 * Mountuje se ve `WorldLayout` MIMO `<Outlet/>`, takže hovor přežije přechod
 * mapa↔chat. Zobrazí se jen když je aktivní `worldVoiceSessionAtom` pro tento
 * svět. Jitsi iframe žije tady (odchod ze stránky ho neodmountuje); tlačítka
 * ve světovém chatu a na mapě jen togglují session atom.
 */
import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Minus,
  Maximize2,
} from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useVoice } from '../useVoice';
import { jitsiRoomName } from '../config';
import { worldVoiceSessionAtom } from '../store';
import s from './WorldVoiceHost.module.css';

export function WorldVoiceHost() {
  const { worldId, character } = useWorldContext();
  const user = useAtomValue(currentUserAtom);
  const [session, setSession] = useAtom(worldVoiceSessionAtom);
  const [minimized, setMinimized] = useState(false);

  const active = !!worldId && session?.worldId === worldId;

  const voice = useVoice({
    roomName: jitsiRoomName(`world-${worldId}`),
    displayName: character?.name ?? user?.username,
    onLeft: () => setSession(null),
  });

  // Aktivace session → připojit (containerRef je v DOM, protože panel se renderuje).
  useEffect(() => {
    if (active && !voice.joined && !voice.connecting) voice.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div className={s.host} data-min={minimized || undefined}>
      <header className={s.bar}>
        <span className={s.dot} aria-hidden />
        <span className={s.label}>Hovor světa</span>
        <button
          type="button"
          className={s.min}
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? 'Rozbalit hovor' : 'Sbalit hovor'}
        >
          {minimized ? <Maximize2 size={14} /> : <Minus size={14} />}
        </button>
      </header>

      <div className={s.body} data-min={minimized || undefined}>
        <div
          className={s.jitsi}
          ref={voice.containerRef}
          aria-hidden={!voice.joined && !voice.connecting}
        />
        {voice.connecting && (
          <div className={s.connecting} aria-live="polite">
            Připojuji — povol prosím mikrofon…
          </div>
        )}
      </div>

      <div className={s.controls} role="toolbar" aria-label="Ovládání hovoru">
        <button
          type="button"
          className={s.ctl}
          data-off={voice.local.muted || undefined}
          onClick={voice.toggleMic}
          aria-label={voice.local.muted ? 'Zapnout mikrofon' : 'Ztlumit mikrofon'}
        >
          {voice.local.muted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <button
          type="button"
          className={s.ctl}
          data-on={voice.local.cam || undefined}
          onClick={voice.toggleCam}
          aria-label={voice.local.cam ? 'Vypnout kameru' : 'Zapnout kameru'}
        >
          {voice.local.cam ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          type="button"
          className={s.ctl}
          data-on={voice.local.screen || undefined}
          onClick={voice.toggleScreen}
          aria-label="Sdílet obrazovku"
        >
          <MonitorUp size={18} />
        </button>
        <button
          type="button"
          className={`${s.ctl} ${s.leave}`}
          onClick={voice.leave}
          aria-label="Odejít z hovoru"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
}
