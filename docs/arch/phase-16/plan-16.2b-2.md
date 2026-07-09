# Implementační plán 16.2b-2 — Komunitní (globální) bestiář

> Spec: [spec-16.2b-2-bestiar-komunitni.md](spec-16.2b-2-bestiar-komunitni.md) (🟢 SCHVÁLENO).
> Pořadí: **BE-first** (rozhodnutí #3). BE a FE se **nemíchají v jedné dávce** (`fb_no_mixed_batch`). Každá dávka je kompletní (`fb_no_debt`).
> Repo BE: `C:\Matrix\ProjektIkaros\Projekt-ikaros\backend` · Repo FE: `Projekt-ikaros-FE`.

---

## Přehled dávek

```
BE-1  Datový model (community scope + statblocks mapa + BestieComment)
BE-2  Service/controller: CRUD lore, statblok návrh→schválení, list 2 knihovny, klon, pending/moderace
BE-3  Diskuse endpointy (BestieComment)
   ── restart BE (fb_be_restart) ──
FE-1  Route /ikaros/bestiar (nahradit stub) + typy + API hooky
FE-2  Knihovna: 2 oddělené seznamy + filtry Typ/Systém
FE-3  Detail „kniha": lore + obrázek + pravidlové záložky + statblok render
FE-4  Dvouúrovňová diskuse (reuse UI pattern stávajících diskusí)
FE-5  Editor lore (přímo) + návrh statů (přes diskusi) + vklad do bestiáře (klon modal)
FE-6  MVP ověření na default vzhledu — funkčně kompletní
   ── MVP HOTOVO ──
SK-0  Kostra data-atributů + komunitniBestiarSkins.css + etalon (pergamen + sci-fi/kyberpunk)
SK-*  Série zbylých 19 motivů (motiv po motivu; každý frontend-design → schválení → impl → mobil-desktop)
```

---

## BE-1 — Datový model
**Repo BE.** Modul `bestiae` (rozšíření) + nová entita komentářů.

- `schemas/bestie.schema.ts` — enum `scope` přidat `'community'`; přidat `statblocks` mapu (`Record<systemId, { systemStats, status:'draft'|'approved', authorId, createdAt }>`), `latin?`, `kind`, `tags[]`, `status:'draft'|'approved'`, `authorId`, `approvedAt?`, `approvedBy?`. Index `{scope, status}`.
- `interfaces/bestie.interface.ts` — zrcadlit.
- Nová `schemas/bestie-comment.schema.ts` + interface: `{ bestieId, targetType:'beast'|'statblock', systemId?, authorId, content, moderationHidden?, moderationHiddenReason?, createdAt }`. Index `{bestieId, targetType, systemId}`.
- DTO create/update (lore) + DTO návrh statbloku.
- **DoD:** `npm run typecheck` + `lint:check` (BE hook). Bez chování zatím.

## BE-2 — Service / controller (bestie)
**Repo BE.**
- `list` rozšířit o `community` scope, dělené `status` (approved / draft) — 2 knihovny; filtr `kind` + `systemId`.
- `create` (community) → `status:'draft'`, `authorId` z JWT; **+ současně klon do autorova user/world** (§5 spec).
- `updateLore` — jen lore pole; **staty přes tuto cestu NEJDOU** (§2a).
- `proposeStatblock` / `approveStatblock` / `approveBeast` — schvalovací tok. **Kurátor = správci diskusí + správci článků + Admin/Superadmin** (permission = může moderovat `DiscussionPendingReview` NEBO `ArticlePendingReview`, nebo `isGlobalAdmin`). Ověřit v BE, jak se určuje moderátor těch typů, a reuse téhož předpokladu.
- `cloneToWorld` / `cloneToUser` — vezme `statblocks[sys]` → single-system `Bestie` (`clonedFromId`, snapshot). Reuse dnešní klon logiky.
- Moderace: `moderationHidden` + reuse `moderation-enforcement.listener.ts`.
- Pending: přidat typ `CommunityBestiePendingReview` do `pending-actions` (BE zdroj + FE `PendingActionType`/`pendingBadge.ts`); viditelný pro moderátory diskusí/článků.
- **DoD:** jest (ručně, `--runInBand`), typecheck, lint.

## BE-3 — Diskuse endpointy
**Repo BE.** Controller/service pro `BestieComment`: list (dle `bestieId` + `targetType`/`systemId`), create, moderace-hide. WS event pro live přírůstek (volitelně, vzor `bestiar:changed`).
- **DoD:** jest, typecheck, lint. **Poté restart BE** (`fb_be_restart`).

## FE-1 — Route + typy + API
**Repo FE.**
- `src/app/router.tsx` — `/ikaros/bestiar` nahradit `ComingSoonPage` → `KomunitniBestiarPage` (veřejná; akce gated auth).
- `src/features/ikaros/bestiar/types.ts` — GlobalBestie, Statblock, BestieComment (sync s BE, `type-sync`).
- API hooky (`useKomunitniBestiar`, `useBestieComments`, mutace) — vzor `useBestiar`/`useBestieMutations`.
- **DoD:** build (`tsc -b`), route naběhne.

## FE-2 — Knihovna
**Repo FE.** `BestiarLibraryList` — 2 oddělené knihovny (přepínací hřbety) + seznam (rejstřík) + filtry Typ/Systém. Odznak „✓ v mém světě" u vlastního návrhu. Předloha: HTML kostra.
- **DoD:** build, `mobil-desktop` (375/768/1440).

## FE-3 — Detail „kniha"
**Repo FE.** `BestieBook` + `RulesetTabs` + `StatblockView` (reuse render z `BestieDetail`). Lore (obrázek+dropcap) → záložky systémů (jen s obsahem + „Přidat systém") → statblok. Prázdná/návrhová záložka = výzva + varování.
- **DoD:** build, render napříč systémy (vzor `BestieDetail.systems.spec`).

## FE-4 — Dvouúrovňová diskuse
**Repo FE.** `TwoLevelDiscussion` — u knihy (targetType `beast`) + u aktivní záložky (`statblock`+systemId). UI/UX **jako stávající diskuse** (reuse komponent/stylu, ne nový vzhled).
- **DoD:** build, `socket-contract` pokud WS.

## FE-5 — Editor + návrh statů + vklad
**Repo FE.**
- Lore editor (přímá editace) — jméno/latinsky/popis/obrázek/typ/tagy.
- **Návrh statů** = přes diskusní/schvalovací tok (§2a), NE přímý zápis do statblocku; reuse `EntitySchemaForm` pro sestavení návrhu.
- `InsertToBestiaryModal` (klon vybrané pravidlové verze do world/user) — reuse `CloneBestieModal`.
- **DoD:** build, `auth-policy` (gating akcí), `mobil-desktop`.

## FE-6 — MVP ověření
Funkčně kompletní na **default vzhledu** (bez skinů). Projít celý tok: prohlížení → diskuse → návrh bytosti (→ hned v mém světě) → schválení → vklad do světa. `verify` skill.
- **DoD:** `funkce` + `napoveda` (změna funkčnosti); commit bod.

## SK-0 — Kostra skinů + etalon
**Repo FE.** Data-atributy do kostry (`data-bestie-book`, `-portrait`, `-ruleset-tabs`, `-statblock`, `-discussion`, `-lib-list`, `-lib-row`). `komunitniBestiarSkins.css` (scoped `[data-theme] [data-bestie-*]`, barvy z `--theme-*`). **Etalon:** `pergamen` (Kniha) + `sci-fi`/`kyberpunk` (Obrazovka) → `frontend-design` návrh → schválení → impl → `mobil-desktop`.

## SK-* — Série 19 motivů
Po schválení etalonu; motiv po motivu (kompletní, ne polovičatě). Neutrální (`bila`, `modre-nebe`, `zlaty-standard`) = minimalistický jazyk. Každý: návrh → schválení → impl → `mobil-desktop`.

---

## Průběžné povinnosti
- BE precommit hook = typecheck + lint (ne testy); jest/prettier ručně (`fb_be_precommit`).
- FE **nikdy** prettierem (`fb_fe_no_prettier`); `eslint --fix`. FE bez precommit hooku → ověřovat ručně (`fe_test_precommit`).
- Field-drift: schema/DTO/service/toEntity (`be_field_check`).
- Git commituje uživatel ručně (`fb_git_manual`); commit přímo na main (`fb_work_on_main`).
