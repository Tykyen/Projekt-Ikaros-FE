/**
 * 17.6 — persistentní hostitel hlasového hovoru ve světě.
 *
 * Mountuje se ve `WorldLayout` MIMO `<Outlet/>`, takže hovor přežije přechod
 * mapa↔chat. Zobrazí se jen když je aktivní `worldVoiceSessionAtom` pro tento
 * svět. Jitsi iframe žije tady (odchod ze stránky ho neodmountuje); tlačítka
 * ve světovém chatu a na mapě jen togglují session atom.
 */
import { useEffect } from 'react';
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
import {
  worldVoiceSessionAtom,
  worldVoiceMinimizedAtom,
  worldVoiceDockedAtom,
} from '../store';
import s from './WorldVoiceHost.module.css';

export function WorldVoiceHost() {
  const { worldId, character } = useWorldContext();
  const user = useAtomValue(currentUserAtom);
  const [session, setSession] = useAtom(worldVoiceSessionAtom);
  const [minimized, setMinimized] = useAtom(worldVoiceMinimizedAtom);
  // 17.10 — když je mapa mountnutá a hovor sbalený, plovoucí pruh se skryje a
  // jeho místo převezme čip v liště „Zmenšené" (renderuje TacticalMapView).
  const docked = useAtomValue(worldVoiceDockedAtom);

  const active = !!worldId && session?.worldId === worldId;

  const voice = useVoice({
    roomName: jitsiRoomName(`world-${worldId}`),
    displayName: character?.name ?? user?.username,
    // Konec hovoru → zavři session i sbalený stav (příští hovor začne rozbalený).
    onLeft: () => {
      setSession(null);
      setMinimized(false);
    },
  });

  // Aktivace session → připojit (containerRef je v DOM, protože panel se renderuje).
  useEffect(() => {
    if (active && !voice.joined && !voice.connecting) voice.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={s.host}
      data-min={minimized || undefined}
      data-docked={(minimized && docked) || undefined}
      aria-hidden={(minimized && docked) || undefined}
    >
      {/* 17.10 — když je hovor sbalený, je celý pruh klikací = spolehlivé
          obnovení (malé „⤢" samo mohl překrývat Jitsi iframe → „nereaguje"). */}
      <header
        className={s.bar}
        onClick={minimized ? () => setMinimized(false) : undefined}
        role={minimized ? 'button' : undefined}
        tabIndex={minimized ? 0 : undefined}
        aria-label={minimized ? 'Rozbalit hovor' : undefined}
        onKeyDown={
          minimized
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMinimized(false);
                }
              }
            : undefined
        }
      >
        <span className={s.dot} aria-hidden />
        <span className={s.label}>Hovor světa</span>
        <button
          type="button"
          className={s.min}
          onClick={(e) => {
            e.stopPropagation();
            setMinimized((m) => !m);
          }}
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
