/**
 * 16.2d (D-SYSTEMID-HOOK) — canonical systemId aktuálního světa.
 *
 * Sjednocuje rodinu „system-id drift" (CH-011/CH-030/CH-031/CH-113): komponenty
 * NEvolají `resolveSystemId(world?.system)` ručně (a nezapomenou normalizovat),
 * ale tenhle hook. „Dlouhá" id z nabídky (`drd-plus`/`call-of-cthulhu`/
 * `draci-hlidka`) tak vždy projdou na canonical (`drdplus`/`coc`/`drdh`).
 *
 * Vrací `''` když svět/systém chybí — volající fallbackuje (`|| 'drd2'`, `|| null`).
 */
import { useWorldContext } from '@/features/world/context/WorldContext';
import { resolveSystemId } from './systemId';

export function useResolvedSystemId(): string {
  const { world } = useWorldContext();
  return resolveSystemId(world?.system);
}
