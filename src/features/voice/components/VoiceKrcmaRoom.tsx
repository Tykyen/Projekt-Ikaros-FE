/**
 * 17.6 — Voice krčma: voice-first hlasová místnost (Jitsi).
 *
 * Layout: velká hlasová plocha vlevo (Jitsi video + roster + ovladače), text
 * pokec vpravo (reuse `ChatRoom` pro místnost `voice-krcma`). Identita
 * „Řezbářská krčma" (dřevo, okování, vyřezávaný vlys) je ve tvaru/ornamentu
 * v CSS; barvy jdou z `--theme-*` → krčma se přebarví s platformovým skinem.
 */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Lock,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { useAtomValue } from 'jotai';
import { currentUserAtom } from '@/shared/store/authStore';
import { ChatRoom } from '@/features/chat/components/ChatRoom';
import type { VoiceParticipant } from '@/features/chat/lib/types';
import { useVoice } from '../useVoice';
import { useVoicePresence } from '../api/useVoicePresence';
import { jitsiRoomName } from '../config';
import s from './VoiceKrcma.module.css';

const ROOM = 'voice-krcma' as const;

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

/** Dlaždice / čip účastníka — portrét v dřevěném rámu s rohovým okováním. */
function Participant({
  p,
  compact,
}: {
  p: VoiceParticipant;
  compact?: boolean;
}) {
  return (
    <div className={compact ? s.chip : s.tile}>
      <span className={s.corner} aria-hidden />
      <span className={s.corner} data-pos="tr" aria-hidden />
      <span className={s.corner} data-pos="bl" aria-hidden />
      <span className={s.corner} data-pos="br" aria-hidden />
      <span className={s.avatar}>
        {p.avatarUrl ? (
          <img src={p.avatarUrl} alt="" />
        ) : (
          <span className={s.mono}>{initials(p.username)}</span>
        )}
      </span>
      <span className={s.pname}>
        {p.username}
        {p.muted && <MicOff size={compact ? 11 : 13} className={s.mutedIcon} />}
      </span>
    </div>
  );
}

export function VoiceKrcmaRoom() {
  const user = useAtomValue(currentUserAtom);
  const [params] = useSearchParams();
  // Pop-out okno (window.open): jen hlasová plocha, bez postranního pokecu.
  const isPopout = params.get('popout') === '1';
  const {
    containerRef,
    joined,
    connecting,
    error,
    local,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreen,
  } = useVoice({
    roomName: jitsiRoomName(ROOM),
    displayName: user?.username,
  });
  const { roster, sendState } = useVoicePresence(ROOM, joined);

  // Změnu vlastního mikrofonu/kamery hlásíme do rosteru ostatních.
  useEffect(() => {
    if (joined) sendState(local.muted, local.cam);
  }, [joined, local.muted, local.cam, sendState]);

  const openPopout = () => {
    window.open(
      '/chat/voice?popout=1',
      'ikaros-voice-krcma',
      'popup=yes,width=980,height=700',
    );
  };

  const count = roster.length;

  return (
    <div className={s.wrap} data-popout={isPopout || undefined}>
      <section className={s.voice} data-joined={joined || undefined}>
        <span className={s.frieze} aria-hidden />
        <header className={s.head}>
          <h1 className={s.title}>
            <span aria-hidden>🎙️</span> Voice krčma
          </h1>
          <span className={s.reg}>
            <Lock size={12} /> jen registrovaní
          </span>
          <span className={s.live} data-live={count > 0 || undefined}>
            {count > 0 ? `živě · ${count} na mikrofonu` : 'krčma je tichá'}
          </span>
          {!isPopout && (
            <button
              type="button"
              className={s.popout}
              onClick={openPopout}
              title="Otevřít v samostatném okně"
              aria-label="Otevřít krčmu v samostatném okně"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </header>

        <div className={s.stage}>
          {joined && count > 0 && (
            <div className={s.rosterBar}>
              {roster.map((p) => (
                <Participant key={p.userId} p={p} compact />
              ))}
            </div>
          )}

          {/* Jitsi kontejner je v DOM vždy — join() do něj mountuje iframe.
              Viditelný i během připojování, ať je vidět prompt na mikrofon. */}
          <div
            className={s.jitsi}
            ref={containerRef}
            aria-hidden={!joined && !connecting}
          />

          {connecting && (
            <div className={s.connecting} aria-live="polite">
              Připojuji ke krčmě — povol prosím mikrofon v prohlížeči…
            </div>
          )}

          {!joined && !connecting && (
            <div className={s.lobby}>
              {count > 0 ? (
                <ul className={s.tiles}>
                  {roster.map((p) => (
                    <li key={p.userId}>
                      <Participant p={p} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={s.empty}>
                  Krčma je zatím tichá. Buď první, kdo usedne k mikrofonu.
                </p>
              )}
              <button
                type="button"
                className={s.enter}
                onClick={join}
                disabled={connecting}
              >
                <Mic size={18} />
                {connecting ? 'Připojuji…' : 'Usednout k mikrofonu'}
              </button>
              {error && <p className={s.err}>{error}</p>}
            </div>
          )}

          {joined && (
            <div className={s.controls} role="toolbar" aria-label="Ovládání hovoru">
              <button
                type="button"
                className={s.ctl}
                data-off={local.muted || undefined}
                onClick={toggleMic}
                aria-label={local.muted ? 'Zapnout mikrofon' : 'Ztlumit mikrofon'}
              >
                {local.muted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                type="button"
                className={s.ctl}
                data-on={local.cam || undefined}
                onClick={toggleCam}
                aria-label={local.cam ? 'Vypnout kameru' : 'Zapnout kameru'}
              >
                {local.cam ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button
                type="button"
                className={s.ctl}
                data-on={local.screen || undefined}
                onClick={toggleScreen}
                aria-label="Sdílet obrazovku"
              >
                <MonitorUp size={20} />
              </button>
              <button
                type="button"
                className={`${s.ctl} ${s.leave}`}
                onClick={leave}
                aria-label="Odejít z hovoru"
              >
                <PhoneOff size={20} />
                <span>Odejít</span>
              </button>
            </div>
          )}
        </div>
        <span className={s.frieze} aria-hidden />
      </section>

      {!isPopout && (
        <aside className={s.pokec}>
          <ChatRoom
            room={ROOM}
            roomName="Pokec krčmy"
            icon={<MessageCircle size={18} />}
          />
        </aside>
      )}
    </div>
  );
}
