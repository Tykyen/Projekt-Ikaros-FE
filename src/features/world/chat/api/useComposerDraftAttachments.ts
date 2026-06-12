import { useEffect, useState } from 'react';

/**
 * Rozpracované (nahrané, ale neodeslané) přílohy composeru per konverzace.
 *
 * Na rozdíl od textu/RP data (`useComposerSticky`) nejdou `File` objekty
 * serializovat do localStorage → úložiště je in-memory mapa žijící MIMO
 * komponentu. Důsledek:
 *   - přežijí přepnutí konverzace (composer se remountuje, store žije dál),
 *   - NEpřežijí refresh stránky (browser zahodí `File` reference) — to by
 *     vyžadovalo upload na server už při výběru (orphan soubory v Cloudinary).
 *
 * Reset: po odeslání zprávy (`clearPicked`) — stejně jako textový draft.
 */

export interface DraftAttachment {
  id: string;
  file: File;
  kind: 'image' | 'document';
  /** Blob URL náhledu (jen obrázky). Revokuje se až při odebrání/odeslání,
   *  NE při unmountu — jinak by se náhled po přepnutí konverzace rozbil. */
  previewUrl: string | null;
}

const store = new Map<string, DraftAttachment[]>();
const keyOf = (worldId: string, channelId: string) => `${worldId}/${channelId}`;

export function useComposerDraftAttachments(worldId: string, channelId: string) {
  const key = keyOf(worldId, channelId);

  // Lazy init z in-memory store (jen jednou per mount).
  const [picked, setPicked] = useState<DraftAttachment[]>(
    () => store.get(key) ?? [],
  );

  // Re-read při změně klíče (pojistka, kdyby composer nebyl remountován).
  // Adjustment-during-render — klíč je primitivní string (R19, jako sticky).
  const [prevKey, setPrevKey] = useState(key);
  if (key !== prevKey) {
    setPrevKey(key);
    setPicked(store.get(key) ?? []);
  }

  // Persist do store při každé změně. Prázdné vyhodíme (úklid).
  useEffect(() => {
    if (picked.length === 0) store.delete(key);
    else store.set(key, picked);
  }, [picked, key]);

  return [picked, setPicked] as const;
}
