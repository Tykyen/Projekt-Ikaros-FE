# Spec 9.1 — Sjednocení Page + Character (Úroveň 3)

**Status:** IMPLEMENTED (F0–F6 hotovo, F7 cleanup probíhá)
**Velikost:** XL (1–2 týdny FE + BE; nezvratná migrace dat)
**Motivace (user):** „U Nová stránka má jít vytvořit i NPC a PC, tedy sjednotit."

---

## 1 — Cíl

Jedno vstupní místo (`+ Nová stránka`) pro tvorbu **veškerého obsahu světa**: wiki stránky (Lokace/Noviny/Seznam/…) i postavy (PC/NPC). Jednotný adresář, jednotná routa, jednotný editor.

## 2 — Co se ztratí, co zůstane

| Funkce dnešní `Character` | Po sjednocení |
|---|---|
| `name`, `slug`, `imageUrl`, `publicBio`, `publicInfoBlocks` | → `Page.title`, `Page.slug`, `Page.heroImageUrl`, `Page.content`, `Page.table` |
| `privateBio`, `privateInfoBlocks` (PJ-only) | → nové `Page.privateContent`, `Page.privateInfoBlocks` (BE rozšíření) |
| `isNpc`, `isLocation`, `userId` | → `Page.type` ∈ `{PostavaHrace, NPC}` + `Page.ownerUserId` |
| `accessRequirements` | beze změny (Page už má) |
| `campaignSubjectId` | → `Page.customData.campaignSubjectId` |
| **5 subdokumentů** (Diary, Calendar, Finance, Inventory, Notes) | ZACHOVÁNO — `Character` entita zůstává jako **subdoc kontejner**, `Page` má `characterRef.characterId` |
| Optimistic concurrency (`updatedAt` token) | beze změny (přesune se na Page) |

⚠️ **Žádná funkce se nezruší.** Strukturovaný char sheet (taby Bio/Notes/Inventory/Finance/Calendar/Diary) zůstává — jen se renderuje uvnitř `PostavaLayout`.

## 3 — Datový model (po)

```ts
// Rozšířený PAGE_TYPES
export const PAGE_TYPES = {
  Lokace: 'Lokace',
  Noviny: 'Noviny',
  Seznam: 'Seznam',
  Galerie: 'Galerie',
  Rodokmen: 'Rodokmen',
  Obrazovka: 'Obrazovka',
  Ostatni: 'Ostatní',
  // ── nově ──
  PostavaHrace: 'Postava hráče',  // PC — má userId
  NPC: 'NPC',                     // bez userId
} as const;

// Rozšířená Page entity
interface Page {
  // … existing fields
  /** PJ-only obsah (mirror character.privateBio) — viditelné jen PJ + ownerUserId. */
  privateContent?: string;
  privateInfoBlocks?: InfoBlock[];
  /** Pro type=PostavaHrace: přiřazený hráč. */
  ownerUserId?: string;
  /** Pro type ∈ {PostavaHrace, NPC}: odkaz na character entity pro subdokumenty. */
  characterRef?: { characterId: string };
}
```

**Character entita zůstává** — jen ztrácí duplicitní pole (name/slug/bio/infoBlocks), která jsou nově v Page. Subdokumenty (Diary/Calendar/Finance/Inventory/Notes) beze změny.

## 4 — Routing

| Před | Po |
|---|---|
| `/svet/<w>/<page-slug>` | `/svet/<w>/<slug>` (beze změny) |
| `/svet/<w>/postava/<char-slug>` | `/svet/<w>/<slug>` — **301 redirect z `/postava/<slug>` na `/<slug>`** (1 měsíc) |
| `/svet/<w>/postavy` | `/svet/<w>/postavy` — zůstává (filtrovaný view na Pages typu PostavaHrace+NPC) |
| `/svet/<w>/moje-postava` | `/svet/<w>/moje-postava` — redirect na vlastní PostavaHrace |

**Slug namespace:** unikátní napříč všemi Pages v rámci světa. Při migraci kolize → suffix `-postava`.

## 5 — UI (Editor)

`+ Nová stránka` → wizard:

```
┌─────────────────────────────────────┐
│  Co chceš vytvořit?                 │
├─────────────────────────────────────┤
│  📄 Wiki stránka                    │
│     Lokace, Noviny, Seznam, …       │
│                                     │
│  🧑 Postava hráče (PC)              │
│     Hratelná postava s tvým profilem│
│                                     │
│  👹 NPC                             │
│     Nehratelná postava (PJ)         │
└─────────────────────────────────────┘
```

Volba → otevře PageEditor s předvybraným `type` a předvyplněnými relevantními panely (Postava/NPC dostane Bio panel + Character taby v náhledu).

## 6 — UI (Viewer)

Nový `PostavaLayout`:

```
┌────────────────────────────────────────────┐
│  [hero image]   Jméno postavy               │
│                 Hráč: @tyky (jen PC)        │
├────────────────────────────────────────────┤
│ Tabs: Bio | Notes | Inv | Fin | Cal | Diary│
├────────────────────────────────────────────┤
│  [content tabu]                             │
└────────────────────────────────────────────┘
```

Bio tab = `Page.content` + `Page.table` + (pro PJ/owner) `Page.privateContent` + `Page.privateInfoBlocks`.
Ostatní taby = identické s dnešním `CharacterDetail` (čte přes `characterRef.characterId`).

## 7 — Migrace dat (BE skript)

Pro každý existující `Character` v každém světě:

1. **Vytvořit nový `Page`:**
   - `title` ← `character.name`
   - `slug` ← `character.slug` (collision → suffix `-postava`)
   - `type` ← `isNpc ? 'NPC' : 'PostavaHrace'`
   - `content` ← `publicBio`
   - `table.headers` ← `publicInfoBlocks.map(b => b.label)`, `values` ← `publicInfoBlocks.map(b => b.value)`
   - `privateContent` ← `privateBio`
   - `privateInfoBlocks` ← `privateInfoBlocks`
   - `ownerUserId` ← `userId` (PC only)
   - `characterRef.characterId` ← `character.id`
   - `heroImageUrl` ← `imageUrl`
   - `accessRequirements` ← `accessRequirements`

2. **Character entity:** smazat pole `name`, `slug`, `publicBio`, `publicInfoBlocks`, `privateBio`, `privateInfoBlocks`, `isNpc`, `isLocation`, `userId`, `imageUrl`, `accessRequirements`. Ponechat `id`, `worldId`, `diaryData`, `extraBlocks`, `customData`, `createdAt`, `updatedAt`.

3. **Routing:** přidat permanent redirect `/postava/<slug>` → `/<slug>` (1 měsíc, pak smazat).

⚠️ **Nevratné.** Doporučuji exportní snapshot DB před migrací.

## 8 — Rozhodnutí (potřebuju potvrdit)

| # | Otázka | Můj návrh |
|---|---|---|
| **R1** | Character entity zachovat jako subdoc-only, nebo úplně rozpustit do Page? | **Zachovat** — Diary/Calendar/Finance/Inventory/Notes mají vlastní endpointy a optimistic concurrency, refactor by se rozrostl. |
| **R2** | `isLocation` (Character s flagem lokace) — co s tím? | **Migrovat na `type: Lokace`** (existující PageType). Žádné nové. |
| **R3** | Routa `/postava/<slug>` po migraci — redirect 1 měsíc nebo trvale? | **1 měsíc** — pak smazat. Bookmarky uživatelů. |
| **R4** | `Page.privateContent` a `Page.privateInfoBlocks` — vidí jen PJ+owner, nebo i specifické role? | **PJ+owner.** Pokročilejší pravidla → `accessRequirements`. |
| **R5** | Wizard při `+ Nová stránka` (krok výběru typu) — nebo rovnou dropdown na klasický Page editor s rozšířeným enum? | **Wizard.** PC/NPC mají odlišný onboarding (PC potřebuje `ownerUserId`). |
| **R6** | NPC šablony / bestiář (8.4) — propojit nebo nechat oddělené? | **Propojit** — šablona NPC = předvyplněný PostavaLayout, „Použít šablonu" v editoru. |

## 9 — Scope / odhad

| FE | LoC ~ |
|---|---|
| Wizard | ~150 |
| Rozšířený PageType enum + Page interface | ~30 |
| `PostavaLayout` (viewer) — port z `CharacterDetail` | ~400 |
| `PostavaPanel` (editor) — taby Bio + privateContent | ~250 |
| Routing updates (redirect z `/postava/<slug>`) | ~40 |
| Adaptace `CharactersPage` na filtrovaný Pages view | ~200 |
| Migrace testů | ~300 |

| BE | LoC ~ |
|---|---|
| Page schema rozšíření (privateContent, privateInfoBlocks, ownerUserId, characterRef) | ~80 |
| PageType enum rozšíření + validace | ~30 |
| Migrace skript (Character → Page) | ~300 |
| Routing redirect endpoint | ~30 |
| Char subdoc endpoints — beze změny | 0 |

**Risk:** kolize slugů při migraci; performance při query Pages by type (index na `world+type`); rollback strategie.

## 10 — Mimo rozsah

- Drag-drop reorder postav v adresáři (vlastní fáze)
- Bulk operace nad postavami (mass-edit, mass-delete)
- Versioning Page content
- Public preview postav pro nečleny světa

## 11 — Spec checklist

- [x] R1–R6 odsouhlasena
- [x] BE schema migrace připravena (Page schema + DTO + service permission filter)
- [x] FE wizard zaimplementován (`NewPageWizardModal` — 3 volby Wiki / PC / NPC)
- [x] PostavaLayout viewer (Bio public/private; 5 subdoc tabů — F-future)
- [x] PostavaPanel editor (ownerUserId picker + privateContent + privateInfoBlocks)
- [x] Migration script `migrate-characters-to-pages-9.1` (idempotentní, dry-run support)
- [x] Redirect `/postava/<slug>` → `/<slug>` přes `CharacterDetailRoute` (transition wrapper)
- [x] CharactersPage create flow → wizard (display stále z Character entity — refactor až po stabilizaci)
- [ ] Roadmap update
- [ ] memory update (Page+Character architektura)

## 12 — Co zůstalo mimo 9.1 (follow-up PR)

- ~~**Subdokumentové taby**~~ — **DONE (A1+A2):** PostavaLayout má 6 tabů (Profil/Deník/Finance/Výbava/Kalendář/Poznámky). PagesService.create() pro persona type automaticky vytvoří Character entity přes injected `CharactersService` (kaskáda subdoc emitu zachována). Bio tab je Page-driven (read-only); subdoc taby = port z `CharacterDetail` (edit mode + discard guard zachovány). Pro Bio editaci „Upravit Bio" navádí do PageEditoru.
- ~~**CharactersPage display**~~ — **DONE (B):** CharactersPage čte přes nový hook `usePersonaDirectory` z Pages directory (BE filter `?type=Postava hráče,NPC`). BE `findDirectory` rozšířen o type filter (CSV) + projekce `imageUrl` a `ownerUserId`. Lokace filter z CharactersPage zrušen (Lokace patří do `/stranky`).
- ~~**CreateCharacterModal**~~ — **DONE (C):** komponenta + spec + module.css smazány. `MembersTab` (WorldSettings) i `MyCharacterPage` CTA navigují přímo do PageEditoru s `?type=PostavaHrace&owner=<userId>`. PageEditor čte `?owner` query a předvyplní `ownerUserId` ve form state. `?create=1` deep-link odstraněn z CharacterDirectory.
- ~~**NPC šablony (8.4)**~~ — **DONE (D, minimal):** wizard nabízí 4. volbu „NPC z bestiáře" (jen PJ+) — navádí na `/admin/adresar-postav?tab=bestiary`, kde PJ klikne „Importovat" na konkrétní šablonu. Inline picker šablon ve wizardu = follow-up.
- ~~**Cleanup duplicitních polí v Character entity**~~ — **DONE:** `cleanup-character-duplicates-9.1` skript (BE) smazal `publicBio/publicInfoBlocks/privateBio/privateInfoBlocks/accessRequirements/imageUrl/isLocation` z `characters` collection. Character schema + interface + DTO redukované na subdoc kontejner (`slug`, `name`, `worldId`, `userId`, `isNpc`, `diaryData`, `extraBlocks`, `campaignSubjectId`, `customData`, timestamps). Legacy `CharacterDetailPage` + komponenty (BioTab, CharacterHeader, CharacterHeaderActions, ConvertToPcModal, CharacterTypeBadge, CharacterDetail.tsx) smazány — `PostavaLayout` je nahradil. `CharacterDetailRoute` zjednodušen na permanent redirect `/postava/<slug>` → `/<slug>`. `PopulateProfileImagesService` (BE) vyřazena. `MapsService.enrichTokens` čte avatar z Page entity přes Page lookup, ne z Character. `MyCharacterEntry` (BE+FE) ztratil `characterImageUrl` + `isLocation`.

## 13 — Diff stats (F0–F6)

| Vrstva | Soubor | Změna |
|---|---|---|
| FE | `WorldLayout.module.css` | F0: nav breakpoint 768→1100 |
| FE | `pages.types.ts` | F1: PageType + Page interface + InfoBlock |
| FE | `usePageEditorState.ts` | F4: 3 nová pole ve form state |
| FE | `useCreatePage.ts` | F4: DTO rozšíření |
| FE | `NewPageWizardModal.tsx` + `.module.css` | F2: nový wizard (~150 LoC) |
| FE | `WorldLayout.tsx` | F2: button + modal state + handler |
| FE | `PageEditorPage.tsx` | F2: čte `?type=` query |
| FE | `PageEditor.tsx` | F2+F4: `initialType` prop, PostavaPanel render, payload extension |
| FE | `PostavaLayout.tsx` + `.module.css` | F3: viewer pro PC/NPC (~330 LoC) |
| FE | `PostavaPanel.tsx` + `.module.css` | F4: editor pro PC/NPC (~280 LoC) |
| FE | `PageViewer.tsx` | F3: registrace PostavaLayout |
| FE | `CharacterDirectory.tsx` | F5: create flow → wizard |
| FE | `CharacterDetailRoute.tsx` | F6: transition redirect (~40 LoC) |
| FE | `router.tsx` | F6: použít CharacterDetailRoute pro `/postava/:slug` |
| BE | `page.interface.ts` | F4b: PAGE_TYPES + InfoBlock + Page fields |
| BE | `page.schema.ts` | F4b: 4 nové `@Prop` |
| BE | `create-page.dto.ts` | F4b: InfoBlockDto + CharacterRefDto + 4 DTO pole |
| BE | `pages.repository.ts` | F4b: toEntity rozšíření |
| BE | `pages.service.ts` | F4b: persona-only filter, sanitize privateContent, filterPrivateForViewer |
| BE | `pages.controller.ts` | F4b: userId do findAll pro permission filter |
| BE | `scripts/migrate-characters-to-pages-9.1/` | F6: migrační skript + README (~290 LoC)|
