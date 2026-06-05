# 07 — Bestie

> **Sweep 2026-06-05.** Cache-invalidation inventura (TanStack Query v5). Read-only.
> Osy: `CR` `SC` `FO` `DEL` `WS` · perspektivy P1 (konzumentská inventura) + P4 (WS↔REST parita).
> Soubory: `src/features/world/bestiar/**`, cross-feature `tactical-map` (paleta / statblok / token image) + `campaign` (ScenarioLinksPanel).
> Nálezy → [`../cache-audit.md`](../cache-audit.md) (`C-33…C-35`).
> **Stav: ✅ hotovo — 3 nálezy (C-33 🟠 SC, C-34 🟠 WS, C-35 🟡 DEL/CB), snapshot token = ⚖️ by-design (D-07-1).**

---

## 0. Architektonický klíč — JEDEN klíč, 3 scope uvnitř

Bestiář **nemá** per-scope klíče. Factory [bestiarQueryKey](../../src/features/world/bestiar/hooks/useBestiar.ts#L8):

```ts
['bestiar', worldId ?? 'none', systemId ?? 'none']
```

Jeden `useQuery` → `BestiarResponse { system[], user[], world[] }` ([types.ts:24](../../src/features/world/bestiar/types.ts#L24)) — server segreguje scope, FE drží **všechny 3 scope v jednom cache záznamu**. Tab/paleta jen čtou pole `.system`/`.user`/`.world` z téhož objektu.

➡️ **Důsledek pro osu `SC`:** „invaliduje create/clone správný scope?" je **mimo** — invalidace klíče vyhodí **celý** záznam (všechny 3 scope naráz). Scope-mismatch *uvnitř světa* nemůže nastat. **Reálné scope riziko je naopak v `worldId` segmentu klíče** — viz C-33 (system/user scope jsou cross-world, ale klíč je per-world).

Factory je sdílená (query i invalidace i cross-feature `getQueryData` volají tutéž funkci) → **drift `KM` nemožný**. Všech 6 konzumentů ji importuje, nikde inline pole. `KM` osa: ✅ čistá by-construction.

---

## 1. Konzumentská inventura (P1)

| Zdroj / entita | `queryKey` | role | staleTime / enabled | soubor:řádek |
|---|---|---|---|---|
| Bestiář (3-scope) — **list** | `['bestiar', worldId, systemId]` | seznam (3 taby Můj/Svět/Systém) + tabCounts | 30s; `worldId && systemId` | [useBestiar.ts:17](../../src/features/world/bestiar/hooks/useBestiar.ts#L17) · [BestiarPage.tsx:27](../../src/features/world/bestiar/BestiarPage.tsx#L27) |
| Bestiář — **spawn paleta** | *(tentýž klíč)* | mapa PJ panel — „+ z katalogu" 3 taby + aktivní list | 30s | [BestiePalette.tsx:51](../../src/features/world/tactical-map/components/pj-panel/BestiePalette.tsx#L51) |
| Bestiář — **token image / spawn lookup** | *(tentýž, přes `getQueryData`)* | `resolveTokenImage` + `lookupBestie` (spawn snapshot) | čte cache, neforčuje fetch | [TacticalMapView.tsx:681](../../src/features/world/tactical-map/TacticalMapView.tsx#L681) |
| Bestiář — **prefetch pro tokeny** | *(tentýž, `useBestiar` se `sceneHasBestie`)* | drží cache plnou, aby bestie token měl obrázek i bez PJ panelu | 30s; `sceneHasBestie` | [TacticalMapView.tsx:253](../../src/features/world/tactical-map/TacticalMapView.tsx#L253) |
| Bestiář — **statblok templateNotes** | *(tentýž, přes `getQueryData`)* | `bestie.notes` read-only v token panelu (PJ) | čte cache (cache-miss → notes skryté) | [BestieStatblock.tsx:71](../../src/features/world/tactical-map/components/tokens/BestieStatblock.tsx#L71) |
| Bestiář — **scénář linking** | `['bestiar', worldId, worldSystem]` | picker bestií pro `bestieIds[]` (11.2 ScenarioLinksPanel) | 30s | [ScenarioLinksPanel.tsx:68](../../src/features/world/campaign/components/ScenarioLinksPanel.tsx#L68) |
| **Bestie token instance** (NE bestiar query) | `mapSceneQueryKey(worldId)` | token na mapě = `MapToken` se snapshotem (HP/staty/abilities/notes) | viz oblast 08 | [buildSpawnToken.ts:86](../../src/features/world/tactical-map/utils/buildSpawnToken.ts#L86) |

> **Důležité:** všech 6 prvních konzumentů sdílí týž `(worldId, systemId)` klíč → jediná `invalidate(bestiarQueryKey)` je obnoví **všechny** (pokud běží/jsou mounted). `BestieStatblock`/`lookupBestie` čtou přes `getQueryData` (pasivně) — invalidace je nereinicializuje sama, ale aktivní `useBestiar` mount (paleta nebo prefetch) refetchne a oni čtou čerstvý objekt při příštím renderu.

---

## 2. Mutace × konzument matice

Všechny mutace [useBestieMutations.ts](../../src/features/world/bestiar/hooks/useBestieMutations.ts) sdílí jediný callback `invalidate = invalidateQueries({ queryKey: bestiarQueryKey(worldId, systemId) })` v **`useMutation({onSuccess})`** (přežije unmount — ✅ `CB`).

| Mutace (soubor:řádek) | list/taby | paleta | token image | statblok notes | scénář picker | cross-world (jiný worldId) | placement |
|---|---|---|---|---|---|---|---|
| `create` [:29](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L29) | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** (jen aktuální world klíč) | `useMutation` ✅ |
| `update` [:33](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L33) | ✅ | ✅ | ✅ⁱ | ✅ⁱ | ✅ | **❌** | `useMutation` ✅ |
| `softDelete` [:38](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L38) | ✅ | ✅ | ✅ⁱ | ✅ⁱ | ✅ | **❌** | `useMutation` ✅ |
| `restore` [:42](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L42) | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** | `useMutation` ✅ |
| `clone` [:46](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L46) | ✅ | ✅ | ✅ | ✅ | ✅ | **❌** | `useMutation` ✅ |

ⁱ = **token instance se NEobnoví** (snapshot, by-design — D-07-1). „✅" znamená jen že **template-notes/obrázek** čtený živě z katalogu (`BestieStatblock` templateNotes, `resolveTokenImage`) se po editaci šablony srovná — NE staty/abilities snapshotu tokenu.

➡️ **`CR` ✅:** nová/klonovaná bestie → invalidace shodí celý 3-scope záznam → refetch vrátí ji ve správné scope sekci serveru. FE nikde scope ručně nefiltruje při zápisu, čte segregaci z BE. Clone `system→world`: invalidace je per-`worldId` klíč (ne per-scope) → cílový world scope **je** v témž záznamu → ✅ uvnitř světa.

➡️ **`DEL` částečně:** soft-delete = `invalidate` (správně, NE `removeQueries` — bestie nemá samostatný `['bestie', id]` detail query, jen segment listu; refetch vrátí list bez ní). Žádný „mrtvý detail" k odejití. Viz C-35 k token instancím po delete.

**WS handlery:** **žádné.** Grep `bestie:`/`bestiar:` ve `*Socket*` → 0 výskytů; `useWorldSocket` neposlouchá žádný bestie event. → C-34.

---

## 3. Verdikt: token snapshot — ⚖️ by-design (D-07-1)

**Zadání-hypotéza (FO):** „po editaci bestie v katalogu se obnoví token instance na mapě?" → **NE, záměrně.**

[buildBestieToken](../../src/features/world/tactical-map/utils/buildSpawnToken.ts#L86) při spawnu vytvoří **plný snapshot** do `MapToken` (`systemStats`, `abilities`, `notes`, HP) — uloženo v `mapSceneQueryKey`, NE v bestiar query. `BestiePanelView`/`BestieStatblock` editují `token.*` (instance), nikoli katalog. Paměť `project_bestie_token_instance` + `project_takticka_mapa_*`: „bestie token = nezávislá instance se snapshotem; edit instance neprosakuje zpět do šablony a edit šablony neprosakuje do existujících instancí."

➡️ Edit katalogové bestie **správně NEinvaliduje** scénu — staty/abilities již spawnutých tokenů zůstávají (lore stabilita encounteru). **Výjimka:** `resolveTokenImage`+`templateNotes` čtou **živě** z katalogu přes `templateId` → ty se po editaci šablony srovnají (obrázek tokenu, read-only template-notes). To je vědomý hybrid: instanční data = snapshot, prezentační/lore = live. **Není nález.**

---

## 4. Nálezy

### 🟠 C-33 · `SC` · system/user-scope bestie jsou cross-world, ale cache klíč je per-`worldId` → stale v jiných světech
- **Klíč:** [bestiarQueryKey](../../src/features/world/bestiar/hooks/useBestiar.ts#L8) `['bestiar', worldId, systemId]` — **vždy** nese `worldId`, i pro scope, který na světě nezávisí.
- **Server:** [listBestie](../../src/features/world/bestiar/api/bestiarApi.ts#L13) posílá `worldId` jako filtr **jen pro world-scope**; `system` (globální pro celý systém) a `user` („napříč mými světy" — [BestieEditorModal.tsx:179](../../src/features/world/bestiar/components/BestieEditorModal.tsx#L179)) vrací **nezávisle na worldId**.
- **Rozpor:** mutace invaliduje jen `['bestiar', <aktuální worldId>, systemId]`. Tytéž system/user bestie ale žijí i v cache záznamech jiných světů téhož systému (`['bestiar', <jiný worldId>, systemId]`) — ty zůstanou stale.
- **Trigger:** (a) Admin upraví/smaže/vytvoří **system** bestii ve světě A → svět B (jiná karta / nedávno navštívený, gcTime 5 min) drží starou system sekci. (b) Uživatel vytvoří **user** bestii ve světě A → ve světě B v sekci „Můj" chybí. Týká se i clone do user/system.
- **Viditelnost:** tiše starý seznam ve druhém světě (chybějící/smazaná/neaktuální položka v tabu Systém nebo Můj); spawn paleta druhého světa nenabídne novou globální bestii.
- **Workaround:** F5 / 30s staleTime ve druhém světě (refetchOnMount při návratu na bestiar, ale paleta na mapě může mít cache už mounted déle).
- **Závažnost:** 🟠 — krátký staleTime 30s tlumí; reálný dopad hlavně na souběžně otevřené světy / rychlé přepínání. **Nejde o broken invalidaci aktuálního světa** (ten ✅), jde o cross-world scope-leak klíče.
- **Návrh (k diskusi, neopravovat tiše):** rozdělit klíč podle scope povahy — system/user scope na klíč **bez** worldId (`['bestiar','system',systemId]` / `['bestiar','user',systemId]`), world scope per-world; nebo invalidovat predikátem `['bestiar']` + filtr na `systemId` (shodí všechny světy téhož systému). Predikát je nejlevnější fix (over-invalidace bezpečná). VERIFY tvar BE odpovědi (vrací system/user opravdu world-agnosticky? — bug-plan SP-71/SP-72).

### 🟠 C-34 · `WS`/`FO` · bestiář nemá žádný real-time push (cizí PJ/Admin změna neviditelná)
- **Místo:** namespace `['bestiar', …]` nesdílí prefix žádného world eventu; `useWorldSocket` ani jiný `*Socket` hook neposlouchá `bestie:*` (grep 0 výskytů). Žádný BE→FE broadcast.
- **Rozpor:** vlastní mutace invalidují korektně, ale **změna od jiného uživatele** se nepropíše. World-scope bestiář je sdílený (PJ + PomocnyPJ + Admin); system-scope sdílí všichni Admini napříč platformou.
- **Trigger:** PJ-A přidá/upraví/smaže world bestii → PJ-B (otevřený bestiar nebo spawn paleta na mapě) ji neuvidí do staleTime 30s / refetchOnMount. Admin přidá system bestii → ostatní Admini stale.
- **Viditelnost:** tiše chybí (nový item v paletě / katalogu druhého PJ); u smazané bestie může druhý PJ spawnovat z palety něco, co už neexistuje (spawn z cache snapshotu projde, ale je „duch").
- **Workaround:** 30s / F5.
- **Závažnost:** 🟠 — krátký staleTime výrazně tlumí; jde o real-time gap (parita s C-04 world-news), ne o rozbitou invalidaci. Cross-ref [`../ws-audit.md`](../ws-audit.md).
- **Návrh:** BE broadcast `bestie:changed {worldId|systemId, scope}` → FE handler `invalidate(['bestiar'])` (predikát dle systemId). Provázat s fixem C-33 (stejný invalidační vzor).

### 🟡 C-35 · `DEL`/`CB` · soft-delete bestie nechá „osiřelé" tokeny na mapě bez živého obrázku/template-notes
- **Mutace:** `softDelete` [useBestieMutations.ts:38](../../src/features/world/bestiar/hooks/useBestieMutations.ts#L38) → `invalidate(bestiarQueryKey)` → bestie zmizí z katalogu (✅).
- **Rozpor:** existující **token instance** na scénách drží `templateId` smazané bestie. Snapshot staty/abilities/notes přežijí (by-design, D-07-1 — token je nezávislý) — ale `resolveTokenImage` [TacticalMapView.tsx:694](../../src/features/world/tactical-map/TacticalMapView.tsx#L694) a `templateNotes` [BestieStatblock.tsx:82](../../src/features/world/tactical-map/components/tokens/BestieStatblock.tsx#L82) dělají **live lookup** přes `templateId` v bestiar cache. Po delete + refetch katalogu lookup vrátí `null` → token ztratí obrázek (spadne na monogram) a template-notes zmizí.
- **Trigger:** PJ smaže bestii, která má živé tokeny na otevřené scéně.
- **Viditelnost:** token „přebliká" z obrázku na monogram (resolve je fresh každý render — TacticalMapView komentář L692); instanční staty/HP/abilities/poznámky **zůstávají** (správně). Po `restore` se obrázek vrátí.
- **Workaround:** žádný nutný — token je funkční dál (snapshot), jen kosmetika obrázku. Restore vrátí i obrázek.
- **Závažnost:** 🟡 — kosmetické, instance data nezničena; je to spíš důsledek hybridu „obrázek live, zbytek snapshot" (D-07-1). **Pozn.:** kdyby byl obrázek taky snapshotnutý do tokenu (jako staty), delete šablony by token vůbec neovlivnil → konzistentnější. VERIFY: chce produkt, aby smazání bestie „odbarvilo" živé tokeny? Pokud ne → snapshotnout `imageUrl` do `MapToken` při spawnu (buildBestieToken).

---

## 5. Latentní / VERIFY (neeskalováno na C-xx)

- **D-07-1 `FO` ⚖️ by-design** — token instance = snapshot, edit/delete šablony nemění instanční staty/abilities/notes. Záměr (paměť `project_bestie_token_instance`). Kořen C-35 (jen obrázek/template-notes jsou live výjimka). Není nález; dokumentováno pro budoucí „proč se token neaktualizoval po editaci bestie".
- **D-07-2 `LC` 🟡 (pasivní konzument)** — `BestieStatblock`/`lookupBestie`/`resolveTokenImage` čtou přes `getQueryData` (ne `useQuery`) → **nejsou reaktivní** na invalidaci sami od sebe. Spoléhají na to, že paralelně běží aktivní `useBestiar` mount (paleta nebo prefetch [TacticalMapView.tsx:253](../../src/features/world/tactical-map/TacticalMapView.tsx#L253) `sceneHasBestie`) → ten refetchne, oni přečtou čerstvo při příštím renderu. Když by ani jeden aktivní mount neběžel (např. hráč bez PJ panelu, scéna bez bestie ale otevřený starý token panel — okrajové), `getQueryData` vrátí stale/undefined. Prefetch `sceneHasBestie` to z velké části kryje. VERIFY (M4) jen pokud se objeví „token bez obrázku po editaci".
- **D-07-3 `OPT` ✅ N/A** — žádná bestie mutace nepoužívá `setQueryData`/optimistic; vše plain invalidate po success. Žádná optimistická lež možná.

**Census (M-CEN): čistý** — všech 5 mutací (`create/update/softDelete/restore/clone`) má cache efekt (`invalidate`). Žádná mutace bez efektu.
