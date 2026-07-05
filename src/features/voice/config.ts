/**
 * 17.6 — konfigurace hlasového hovoru (Voice krčma).
 *
 * V1 běží na veřejném Jitsi `meet.jit.si` (zdarma, bez účtu). Room name nese
 * salt, aby se náhodně nekřížil s cizí místností na sdíleném serveru — NENÍ to
 * bezpečnostní opatření (kdokoli se jménem se připojí). Skutečná izolace =
 * self-host Jitsi + JWT autentizace, vedená jako dluh (viz spec-17.6 §5).
 */
export const JITSI_DOMAIN = 'meet.jit.si';

/** Deterministický Jitsi room pro danou místnost — všichni v téže krčmě spolu. */
export function jitsiRoomName(room: string): string {
  return `ikaros-${room}-a7f3k9c2`;
}
