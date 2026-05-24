/**
 * D-040 — sdílený resolver pro tombstone autora.
 *
 * Vstup: pole isDeleted + původní displayName + avatarUrl z BE entity.
 * Výstup: tvar pro render (`{displayName, avatarUrl, deleted}`) — pokud autor
 * smazaný, vrátí "Smazaný účet" + bez avataru.
 *
 * Použití (chat / článek / diskuze / galerie renderer):
 * ```tsx
 * const { displayName, avatarUrl, deleted } = resolveTombstone({
 *   isDeleted: msg.senderIsDeleted,
 *   displayName: msg.senderName,
 *   avatarUrl: msg.senderAvatarUrl,
 * });
 * <UserAvatar src={avatarUrl} deleted={deleted} alt={displayName} />
 * ```
 *
 * Není to React hook — čistá funkce (zbytečný re-render hookem pro pouhý map).
 */
export interface TombstoneResolveInput {
  isDeleted?: boolean;
  displayName: string;
  avatarUrl?: string | null;
}

export interface TombstoneResolveOutput {
  displayName: string;
  avatarUrl: string | null | undefined;
  deleted: boolean;
}

export function resolveTombstone(
  input: TombstoneResolveInput,
): TombstoneResolveOutput {
  if (input.isDeleted === true) {
    return {
      displayName: 'Smazaný účet',
      avatarUrl: undefined,
      deleted: true,
    };
  }
  return {
    displayName: input.displayName,
    avatarUrl: input.avatarUrl ?? undefined,
    deleted: false,
  };
}
