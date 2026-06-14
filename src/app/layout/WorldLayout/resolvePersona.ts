import { WorldRole } from '@/shared/types';

export interface PersonaSlot {
  /** Zobrazené jméno: jméno postavy / „PJ" / „Pomocný PJ" / username. */
  name: string;
  /** Avatar URL nebo null (fallback řeší UserAvatar). */
  avatarUrl: string | null;
  /** Cíl prokliku, nebo null = neklikatelné. */
  to: string | null;
}

export interface PersonaInput {
  worldSlug: string;
  role: WorldRole | null;
  /** Aktivní postava člena (jméno + avatar) nebo null. */
  character: { characterPath: string; name: string; avatarUrl?: string } | null;
  /** Per-člen avatar vedení (režim individual). */
  pjPersonaAvatarUrl?: string;
  /** Režim vystupování vedení (`WorldSettings.pjChatPersona.mode`). */
  pjMode: 'unified' | 'individual';
  /** Sdílený avatar persony „PJ" (režim unified). */
  sharedPjAvatar?: string | null;
  /** Účet — fallback jméno/avatar. */
  account: { username?: string | null; avatarUrl?: string | null } | null;
}

/**
 * 6.8-followup / 5.1 — co ukazuje persona slot v headeru a kam vede klik.
 *
 * Pořadí (role má přednost před postavou — PJ s NPC postavou vidí „PJ"):
 *   1. vedení (role ≥ PomocnyPJ) → role label + persona avatar → klik na deník PJ,
 *   2. hráč s postavou → jméno+obrázek postavy → klik na profil postavy,
 *   3. jinak → username, neklikatelné.
 *
 * Avatar vedení: režim `individual` → vlastní `pjPersonaAvatarUrl`; `unified` →
 * sdílený persona avatar; oba s fallbackem na avatar účtu.
 */
export function resolvePersona(input: PersonaInput): PersonaSlot {
  const { worldSlug, role, character, account } = input;
  const accountAvatar = account?.avatarUrl ?? null;

  if (role === WorldRole.PJ || role === WorldRole.PomocnyPJ) {
    const name = role === WorldRole.PJ ? 'PJ' : 'Pomocný PJ';
    const avatarUrl =
      input.pjMode === 'individual'
        ? input.pjPersonaAvatarUrl ?? accountAvatar
        : input.sharedPjAvatar ?? accountAvatar;
    return { name, avatarUrl, to: `/svet/${worldSlug}/denik-pj` };
  }

  if (character) {
    return {
      name: character.name,
      avatarUrl: character.avatarUrl ?? accountAvatar,
      to: `/svet/${worldSlug}/${character.characterPath}`,
    };
  }

  return {
    name: account?.username ?? 'Účet',
    avatarUrl: accountAvatar,
    to: null,
  };
}
