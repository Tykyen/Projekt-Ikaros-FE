/**
 * 17.6 — tlačítko „Připojit se k hovoru" / „Odejít" ve světě.
 *
 * Jen togglುje `worldVoiceSessionAtom`; samotný hovor (Jitsi iframe) hostuje
 * `WorldVoiceHost` ve `WorldLayout`. Používá se ve světovém chatu i na mapě —
 * obě místa sdílejí jednu session, takže hovor přežije přechod mezi nimi.
 */
import { useAtom } from 'jotai';
import { Phone, PhoneOff } from 'lucide-react';
import { worldVoiceSessionAtom } from '../store';
import s from './WorldVoiceButton.module.css';

export function WorldVoiceButton({
  worldId,
  className,
  size = 18,
}: {
  worldId: string;
  className?: string;
  size?: number;
}) {
  const [session, setSession] = useAtom(worldVoiceSessionAtom);
  const inCall = session?.worldId === worldId;
  return (
    <button
      type="button"
      className={className ?? s.btn}
      data-active={inCall || undefined}
      onClick={() => setSession(inCall ? null : { worldId })}
      title={inCall ? 'Odejít z hovoru' : 'Připojit se k hovoru'}
      aria-label={inCall ? 'Odejít z hovoru' : 'Připojit se k hovoru'}
      aria-pressed={inCall}
    >
      {inCall ? <PhoneOff size={size} /> : <Phone size={size} />}
    </button>
  );
}
