# cache / 07-bestie — checkpoint RUN-2026-06-20-1621

## Pokrytí

Projeto:
- `src/features/world/bestiar/hooks/useBestiar.ts` — query key factory, `useSocketEvent` handler
- `src/features/world/bestiar/hooks/useBestieMutations.ts` — všechny mutace + invalidační predikát
- `src/features/world/bestiar/hooks/useBestieMutations.spec.tsx` — test C-33 (predikát)
- `src/features/world/bestiar/api/bestiarApi.ts` — REST povrch
- `src/features/world/bestiar/BestiarPage.tsx` — konzument
- `src/features/world/bestiar/types.ts` — BestiarResponse
- `src/features/world/tactical-map/components/pj-panel/BestiePalette.tsx:51` — konzument (spawn paleta)
- `src/features/world/tactical-map/TacticalMapView.tsx:253,704,720,732` — prefetch + lookupBestie + resolveTokenImage + resolveTokenImageCrop
- `src/features/world/tactical-map/components/tokens/BestieStatblock.tsx:70-82` — getQueryData + templateNotes
- `src/features/world/tactical-map/utils/buildSpawnToken.ts:87-127` — snapshot semantika
- `src/features/world/campaign/components/ScenarioLinksPanel.tsx:68` — picker bestií
- `src/features/chat/api/useSocket.ts:51-89` — useSocketEvent / useSocketReconnect mechanika
- `src/app/main.tsx:18-24` — global QueryClient config (staleTime 30s, retry 1, bez refetchOnReconnect override)
- `backend/src/modules/bestiae/bestiae.service.ts` — emitChanged per-scope
- `backend/src/modules/bestiae/bestiae.gateway.ts` — `bestiar:changed` routing (system/world/user)
- `backend/src/modules/bestiae/bestiae.service.spec.ts` — BE testové pokrytí

## Dosažená L vs cílová L

| Osa | Cílová L | Dosažená L | Poznámka |
|-----|----------|------------|----------|
| KM  | L2 | L2 | factory sdílena query i invalidace; predikát ověřen |
| SC  | L2 | L3 | C-33 opraveno predikátem; test prochází (1/1) |
| FO  | L2 | L2 | všech 6 konzumentů pokryto; getQueryData závislost ověřena |
| CB  | L2 | L2 | `useMutation({onSuccess})` — přežije unmount |
| OPT | L1 | L1 | N/A — žádná optimistická mutace |
| DEL | L2 | L2 | soft-delete + restore potvrzeny |
| CR  | L2 | L2 | create/clone predikátově invaliduje celý systém |
| WS  | L2 | L2 | BE gateway ověřena; listener aktivní; reconnect mezera viz C-RUN-01 |
| LC  | L2 | L2 | getQueryData závisí na aktivním mount — D-07-2 ověřena |

Celková dosažená úroveň: **L3** (C-33 SC na L3 díky testu; ostatní L2; runtime M4 neprovedeno = PROOF-REQUEST).

## Nálezy

### Ověřeno — žádné nové kritické nálezy

**C-33 ✅ OPRAVENO (L3)** — predikátová invalidace `q.queryKey[2] === systemId` v `useBestieMutations.ts:29-33`
trefí všechny světy téhož systému. Test `useBestieMutations.spec.tsx` ověřuje cross-world i netrefení jiného
systému — prochází.

**C-34 ✅ OPRAVENO (L2)** — `useBestiar.ts:20-25` volá `useSocketEvent('bestiar:changed', predicate-invalidate)`.
BE `bestiae.gateway.ts:42-58` emituje `bestiar:changed{systemId}` s 3-scope routingem (system=broadcast,
world=`world:{id}` room, user=`user:{id}` room). Leak-safe (payload jen `systemId`).

**C-35 ⚖️ PONECHÁNO** — `buildSpawnToken.ts:100` ukládá `templateId` (ne `imageUrl`). `resolveTokenImage`
(TacticalMapView.tsx:720) a `templateNotes` (BestieStatblock.tsx:82) dělají live lookup. Po soft-delete bestie
token ztratí obrázek + template-notes. Staty/abilities/HP snapshot přežijí (správně). By-design (D-07-1).

### Nový nález

**C-RUN-01 · `WS`/`LC` · `useBestiar` nemá `useSocketReconnect` refetch po reconnectu — díra v krátkém dropu**
- **Kde:** `src/features/world/bestiar/hooks/useBestiar.ts:20-25` + `src/features/chat/api/useSocket.ts:68-88`
- **Co:** `useSocketEvent` re-registruje listener na socket po `status` změně (reconnect), ale **NEspouští refetch dotazu**. TanStack Query `refetchOnReconnect: true` (default) zaberou jen pokud je query stale (>30s staleTime). Pokud je socket drop kratší než 30s (data čerstvá), zmeškaný `bestiar:changed` event se ztratí → UI drží mezidobí stale bestiar bez refetche.
- **Dopad:** Stejný systémový vzor jako C-05/C-07/C-46 (WS-only obnova bez reconnect fallbacku). Bestiar je ale čten s 30s staleTime → praktický dopad nízký (krátký drop = data čerstvá = nepropadne přes 30s hranici jen výjimečně). Zvýšené riziko pro spawn palettu na mapě (dlouhé sezení, mounted BestiePalette trvale).
- **Trigger:** Drop < 30s → reconnect → cizí PJ přidal/smazal bestii during drop → bestiar stale ale TQ refetchOnReconnect nezaberou (data ještě čerstvá) → next invalidate event přijde až po dalším eventu, ne po reconnectu.
- **Viditelnost:** Tiše stará data v paletě; workaround F5 nebo čekání na staleTime.
- **Návrh:** Přidat `useSocketReconnect(() => void qc.invalidateQueries({ predicate: ... }))` do `useBestiar` (vzor z `useWorldChat.ts:217`).
- **Závažnost:** 🟡 — 30s staleTime výrazně tlumí, praktický dopad okrajový; vzorový dluh pro vzájemnou konzistenci WS vrstvy (∝ C-05/C-07/C-46).
- **L2** · ♻️ (stejná třída jako C-46)

## PROOF-REQUEST

1. **M4 runtime** (WS push end-to-end): spustit dvě karty téhož světa; v kartě A vytvořit bestii; ověřit, že karta B (BestiarPage nebo BestiePalette) se obnoví **bez F5** do ~1s. Vyžaduje živý BE + spuštěný FE.
2. **M4 reconnect** (C-RUN-01): odpojit síť na <30s; v mezičase vytvořit bestii jiným klientem (nebo manuální emit); ověřit, že po reconnectu karta A zobrazí novou bestii bez F5. Toto nedělám — infra.
3. **BE spec emitChanged** — `bestiae.service.spec.ts` testuje create/scope, ale **NEassertuje `emitChanged` volání** (`mockEventEmitter.emit` je mock, ale `.toHaveBeenCalledWith('bestiae.changed', ...)` assertion chybí). Viz `bestiae.service.spec.ts:66-82`. Nízká priorita (code čtením ověřeno), ale do L3/L4 by tato assertion patřila.
