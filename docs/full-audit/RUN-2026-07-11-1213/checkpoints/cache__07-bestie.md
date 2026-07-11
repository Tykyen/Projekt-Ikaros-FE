# Checkpoint — cache / 07-bestie

- **Styl:** cache-invalidation (TanStack Query v5), registr `docs/cache-audit.md`, prefix `C-`.
- **Oblast:** `docs/cache-plan/07-bestie.md` — `src/features/world/bestiar/**` + cross-feature tactical-map (paleta/statblok/token image/prefetch) + campaign (ScenarioLinksPanel).
- **Osy:** `CR` `SC` `FO` `DEL` `WS` `KM` · perspektivy P1 (konzumentská inventura) + P2 (prefix-match) + P4 (WS↔REST parita).
- **Dosažená L:** **L2** (key-match staticky ověřen napříč všemi konzumenty + BE cross-check, že bestiae service systemId NEnormalizuje → drift potvrzen; predikátová invalidace vytrasována). Cílová pro oblast = L2+. → **splněno.**

## Stav známých nálezů (registr) — NEHLÁSÍM jako nové

- **C-33** ♻️ **OPRAVENO v kódu** — `useBestieMutations` už invaliduje predikátem `queryKey[0]==='bestiar' && queryKey[2]===systemId` (cross-world), ne přesným klíčem. Area doc ho ještě popisuje jako otevřený (doc predatuje fix).
- **C-34** ♻️ **OPRAVENO v kódu** — WS `bestiar:changed{systemId}` listener v `useBestiar.ts:20` (predikát `[2]===p.systemId`) + reconnect fallback `useSocketReconnect` (:29). BE `BestiaeGateway` scope-routed (world/user room / broadcast).
- **C-35** ♻️ **známý, stále platí** ⚖️ — soft-delete nechá token bez live obrázku/template-notes (snapshot staty přežijí). By-design hybrid (D-07-1). Kód beze změny v `resolveTokenImage`/`BestieStatblock`. Nehlásím nově.
- **D-07-1/2/3** ♻️ latentní/by-design, beze změny.

## 🆕 Nový nález

### 🆕 C-RUN-07-1 · `SC`/`KM` · ScenarioLinksPanel čte bestiář pod NECANONICKÝM `systemId` klíčem → pro alias světy (drd-plus/coc/drdh/dnd/…) prázdný picker + predikátová invalidace ho MINE
- **Kde:**
  - `campaign/components/StoryboardView.tsx:66` — `const worldSystem = world?.system ?? '';` (**raw**, bez normalizace) → `:291` `worldSystem={worldSystem}`.
  - `campaign/components/ScenarioLinksPanel.tsx:68` — `useBestiar(worldId, worldSystem || null)` → cache klíč `['bestiar', worldId, world.system]`.
  - Kontrast: VŠICHNI ostatní konzumenti berou canonical přes `useResolvedSystemId()` = `resolveSystemId(world.system)`:
    `BestiarPage.tsx:29`, `TacticalMapView.tsx:212` (`worldSystemId`, feeduje paletu :2302 + lookupBestie :980 + prefetch :362), `BestieEditorModal`/`CloneBestieModal` (prop z BestiarPage).
  - `systemId.ts:20` `SYSTEM_ALIASES`: `drd-plus→drdplus`, `call-of-cthulhu→coc`, `draci-hlidka→drdh`, `dnd→dnd5e`, `pribehy(_/-)imperia→pi`, `vlastni→generic`.
- **Rozpor:** area doc `07-bestie.md:36+:39` tvrdí, že ScenarioLinksPanel sdílí „týž `(worldId, systemId)` klíč" jako ostatních 5 — **neplatí pro alias světy**. `worldSystem` = raw, ostatní = canonical → dvě různé cache položky.
- **BE (cross-check):** `bestiae.service.ts` systemId NEnormalizuje (create ukládá `dto.systemId` as-is; list filtruje daným systemId — grep resolveSystemId/alias/normalize = 0). Bestie vzniklé editorem se ukládají pod **canonical** (`useResolvedSystemId`). `bestiae.gateway.ts:49` posílá `bestiar:changed{systemId=canonical}`.
- **Dopad (dvojí):**
  1. **DATA (cross-ref bug-plan):** pro svět s `world.system='drd-plus'` picker fetchne `GET /bestiae?systemId=drd-plus` → BE nemá žádné bestie s `systemId==='drd-plus'` (všechny jsou `drdplus`) → **sekce „🐉 Bestiář" ve scénáři prázdná** i když bestiář existuje.
  2. **CACHE (tato osa):** mutační predikát (`useBestieMutations`, `queryKey[2]===systemId(canonical)`) i WS predikát (`useBestiar`, `[2]===p.systemId=canonical`) **neprefixují** raw položku `[2]='drd-plus'` → i kdyby data byla, po create/update/delete/clone bestie zůstane picker stale (obnova jen 30s staleTime / refetchOnMount).
- **Trigger:** svět běžící na aliasovaném systému (DrD+, CoC, Dráčí hlídka, legacy DnD/Příběhy impéria/„vlastní") → PJ otevře scénář (Storyboard 11.2), sekce provázání s bestiářem. Pro canonical-id světy (drd2/dnd5e/matrix/…) problém nenastane (raw==canonical).
- **Viditelnost:** tiše prázdný/stale bestie picker ve scénáři — PJ nemůže provázat bestie, i když je v Bestiáři má.
- **Workaround:** žádný v UI (F5 nepomůže — klíč je systematicky špatný pro alias světy).
- **Návrh (neopravovat tiše):** v ScenarioLinksPanel/StoryboardView normalizovat přes `resolveSystemId(world.system)` (nebo rovnou `useResolvedSystemId()`), ať klíč `[2]` = canonical jako u všech ostatních konzumentů. Triviální 1-řádkový fix, sjednotí cache položku i predikátovou invalidaci.
- **L:** L2 (statická key-match shoda + BE potvrzení nenormalizace; ne L3 — `useBestieMutations.spec` alias-drift nepokrývá).

## Pokrytí (L2 inventura konzumentů — všech 7 v záběru)

| Konzument | Klíč `[2]` zdroj | Verdikt |
|---|---|---|
| `BestiarPage` list/taby | `useResolvedSystemId` (canonical) | ✅ |
| `BestiePalette` (paleta) | prop z TacticalMapView `worldSystemId` (canonical) | ✅ |
| `TacticalMapView` prefetch `sceneHasBestie` | `worldSystemId` (canonical) | ✅ |
| `lookupBestie`/`resolveTokenImage(Crop)` (getQueryData) | `worldSystemId` (canonical) | ✅ (D-07-2 pasivní) |
| `BestieStatblock` templateNotes (getQueryData) | prop `systemId` (canonical) | ✅ |
| `buildBestieToken` | žádný bestiar klíč (snapshot do mapScene) | ✅ (D-07-1) |
| **`ScenarioLinksPanel`** | **raw `world.system`** | 🆕 **C-RUN-07-1** |

- **CB:** editor/clone modaly volají `mutate(v,{onSuccess})` jen pro UI (onSaved/onError); invalidace žije v `useMutation({onSuccess:invalidate})` hooku → přežije unmount modalu. ✅ čisté.
- **M-CEN:** všech 5 mutací (create/update/softDelete/restore/clone) má cache efekt (predikátová invalidace). ✅.
- **Detail query:** `getBestie(id)` v api existuje, ale nikde se nevolá jako `useQuery` (žádný `['bestie', id]` detail) → žádný DEL/404 orphan. ✅.

## PROOF-REQUESTy

- **PR-07-1 (bug-plan / +db):** ověřit runtime, že pro svět s `world.system='drd-plus'` (nebo coc/drdh) je sekce Bestiář ve ScenarioLinksPanel prázdná, zatímco `/svet/:id/bestiar` bestie ukazuje (potvrdí dopad #1). Nejlevnější: seed bestie pod canonical + otevřít scénář v alias světě.
- **PR-07-2 (+e2e/M5):** vitest — mock `bestiar:changed{systemId:'drdplus'}` + ScenarioLinksPanel s `worldSystem='drd-plus'` → assert, že se query NEinvaliduje (červený před fixem, zelený po normalizaci klíče).

## Mimo záběr (pozn.)

- `src/features/ikaros/bestiar/**` (komunitní knihovna bestií 21.x, klíče `['bestie-comments',id]` aj.) = jiná feature, mimo oblast 07 (ta je `world/bestiar`). Neauditováno zde.
