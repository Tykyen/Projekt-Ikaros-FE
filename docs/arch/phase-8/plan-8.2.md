# Plán 8.2 — Adresář postav + tvorba / mazání / convert

> **Stav:** návrh — čeká na potvrzení • **Datum:** 2026-05-22
> Spec: [spec-8.2.md](spec-8.2.md) • Design: [design-8.2.md](design-8.2.md)
> Workflow: spec ✅ → design ✅ → **plán (zde)** → potvrzení → kód

---

## 0. Zjištění z auditu (vstup do plánu)

| # | Zjištění | Dopad na plán |
|---|---|---|
| Z-1 | BE `create()` emituje `character.created` přes `emit()` (nečeká); kaskáda subdokumentů běží **async** → 201 přijde dřív, než subdokumenty existují (R-1). | Krok A: `create()` → `await emitAsync()`. Závod zmizí, FE bez hacků. |
| Z-2 | BE `delete()` **neemituje** žádný event; subdoc repozitáře nemají `deleteByCharacterId`. | Krok A staví kaskádu mazání celou. |
| Z-3 | `WorldsService` už má `@OnEvent('character.created'/'updated'/'converted')` → synchronizuje `membership.characterPath`. Chybí jen handler na `deleted`. | Krok A přidá jen `deleted` handler. Tvorba PC přiřadí hráče automaticky. |
| Z-4 | Nejasné, zda `characterPath` drží **slug** nebo **name** (handler ho zdánlivě plní `character.name`, routa je `/postava/:slug`). | Krok A: ověřit; sjednotit na **slug**, jinak `/moje-postava` (8.3) selže. |
| Z-5 | FE má hotové: `slugify` (`PageEditor/lib/slugify.ts`), `KebabMenu` (`shared/ui`), `useUploadContentImage`. Select sdílený **není** — nativní `<select>` (vzor `MemberRow`). `EmptyState` **není** — inline pattern. | Kroky D–G reusují; žádné nové sdílené UI mimo `CharacterTypeBadge`. |

🔀 **Alternativa k Z-1:** nechat `emit()` async a na FE retryovat subdoc GET na 404.
Zamítnuto — race condition by zůstala v systému, jen maskovaná; `emitAsync` ji řeší
u zdroje a 201 pak znamená „postava je kompletní".

---

## 1. Pořadí implementace

BE první (odstraní závod i osiřelá data dřív, než na to FE nav-áže), pak FE odspodu
(API → sdílené → modaly → stránka → napojení). 8 kroků = 8 commitů na `main`.

```
A  BE: kaskáda mazání + emitAsync + ověření characterPath   [cross-repo]
B  FE: API vrstva — create / delete / convert / directory / assign
C  FE: CharacterTypeBadge (extrakce ze CharacterHeader)
D  FE: CreateCharacterModal
E  FE: Adresář postav (/postavy)
F  FE: convert + delete v hlavičce detailu
G  FE: přiřazení postavy v MemberRow
H  Testy, mobil-desktop audit, roadmap + nápověda
```

---

## 2. Krok A — BE: kaskáda + emitAsync

Repo `c:\Matrix\ProjektIkaros\Projekt-ikaros\backend`.

1. **`deleteByCharacterId(characterId)`** do 5 subdoc repozitářů (diary, calendar,
   finance, inventory, notes) — `deleteOne/deleteMany({ characterId })`.
2. **`CharacterSubdocsService`** — nový handler `@OnEvent('character.deleted')
   onCharacterDeleted` → `Promise.all` 5× `deleteByCharacterId`. Vzor: existující
   `onCharacterCreated`. Try/catch + logger (vzor `world.deleted` v `ChatService`).
3. **`WorldsService`** — nový handler `@OnEvent('character.deleted')` → vyčistit
   `characterPath` u všech členů světa, kteří mazanou postavu měli. Přidat
   repo metodu `clearCharacterPath(worldId, characterPath)` pokud chybí.
4. **`characters.service.ts delete()`** — po `charRepo.delete()` emitovat
   `character.deleted` (`{ characterId, worldId, slug }`).
5. **`characters.service.ts create()`** — `emit('character.created')` →
   `await emitAsync('character.created')`. Kaskáda doběhne před návratem 201.
6. **Ověřit Z-4** — co `characterPath` skutečně obsahuje. Cíl: **slug** (routa
   `/postava/:slug`). Pokud handlery plní `name`, opravit na `slug` (handlery
   `character.created`/`updated` ve `worlds.service.ts`).
7. `prettier --write` před commitem (jinak husky selže).

**Test:** BE test handleru `character.deleted` — smazání všech 5 kolekcí +
vyčištění `characterPath`. Ověřit, že `create()` vrací 201 až s existujícími subdoc.
**Commit:** `fix(characters): krok 8.2a — kaskádní mazání + synchronní kaskáda tvorby`

---

## 3. Krok B — FE: API vrstva

`src/features/world/pages/api/`:

1. **`useCharacterMutations.ts`** rozšířit:
   - `useCreateCharacter` → `POST /worlds/:worldId/characters`. Vstup
     `CreateCharacterInput` (`name, slug, isNpc, isLocation, userId?, imageUrl?,
     publicBio?`). `onSuccess`: invalidace `directory` + členů.
   - `useDeleteCharacter` → `DELETE .../characters/:slug`. `onSuccess`: invalidace
     `directory` + členů, `removeQueries` detailu.
   - `useConvertCharacter` → `PATCH .../characters/:slug/convert`. Tělo `{ userId? }`.
     `onSuccess`: invalidace detailu + 5 subdoc + `directory`.
2. **`useCharacterDirectory.ts`** (nový) → `GET .../characters/directory` →
   `CharacterDirectoryEntry[]`. Klíč `charactersQueryKey.directory(worldId)`.
3. **`world/api/useUpdateMemberCharacter.ts`** (nový) → `PATCH
   /worlds/:worldId/members/:membershipId/character`, tělo `{ characterPath? }`.
   `onSuccess`: invalidace členů. Vzor `useUpdateMember.ts`.
4. **Typy** v `characters.types.ts` — `CreateCharacterInput`, `ConvertCharacterInput`.

**Test:** mapování vstupů, invalidace klíčů (mock `api`).
**Commit:** `feat(characters): krok 8.2b — API hooky create/delete/convert/directory`

---

## 4. Krok C — FE: CharacterTypeBadge

1. **`CharacterDetailPage/components/CharacterTypeBadge.tsx`** (nový) — extrahovat
   `typeBadge` z `CharacterHeader`. Props `{ isNpc, isLocation }` → label + lucide
   ikona (`User`/`Bot`/`MapPin`) + barva (modrá/fialová/cyan dle design §1.3).
   CSS modul vedle, pill styl (vzor `WorldRoleChip`).
2. **`CharacterHeader.tsx`** — nahradit inline badge novou komponentou (regrese-free).

**Test:** `CharacterTypeBadge.spec` — 3 typy → správný label/ikona.
**Commit:** `refactor(characters): krok 8.2c — sdílený CharacterTypeBadge`

---

## 5. Krok D — FE: CreateCharacterModal

`src/features/world/pages/CharactersPage/components/CreateCharacterModal.tsx` (nový).

- `Modal size="md"`. Props: `open`, `onClose`, `worldId`, `worldSlug`,
  `lockedMember?` (předvyplněný + zamčený hráč pro tvorbu z `MemberRow`).
- **Typ** — 3 dlaždice (PC/NPC/Lokace), radio chování (design §2.1).
- **Jméno** — `Input`, povinné.
- **Slug** — `Input`; auto-gen `slugify(name)` dokud uživatel needitoval ručně
  (vzor `useSlugAutoGen` z `PageEditor`). Kolize `CHARACTER_SLUG_TAKEN` →
  `Input error`.
- **Hráč** — nativní `<select>` členů (role Hráč+); jen typ PC; `lockedMember` →
  `disabled` + avatar/jméno. Data členů: existující hook seznamu členů světa.
- **Avatar** — čtvercový náhled 72×72 + `Button ghost` „Nahrát"; `useUploadContentImage`.
- **Bio** — `textarea` (krátké), volitelné.
- Submit gating: jméno ∧ slug ∧ (typ≠PC ∨ hráč). Mapování typu → `isNpc/isLocation/
  userId` dle spec §3.3. `onSuccess`: toast, zavřít, navigace na detail.

**Test:** `CreateCharacterModal.spec` — 3 typy + mapování, slug auto-gen + freeze,
kolize slugu, gating submitu, `lockedMember` zámek.
**Commit:** `feat(characters): krok 8.2d — modal tvorby postavy`

---

## 6. Krok E — FE: Adresář postav

Nahradit stub `CharactersPage.tsx` → složka `CharactersPage/`:

- **`CharactersPage.tsx`** — routing layer (worldId/slug z kontextu, guard).
- **`CharacterDirectory.tsx`** — presenter: `useCharacterDirectory`, stav filtru,
  3 sekce (PC/NPC/Lokace), `.filterBar` pill přepínač, prázdná sekce skrytá.
- **`components/CharacterCard.tsx`** — karta, čtvercový avatar, `CharacterTypeBadge`,
  u PC jméno hráče; celá karta link na detail.
- **Prázdný stav** — inline blok (ikona + text + pro PJ `Button` „Vytvořit první
  postavu"); **loading** — skeleton karty (shimmer).
- Záhlaví: `Button` „Nová postava" (jen PJ) → `CreateCharacterModal`.
- `worldStubMap` — odstranit `characters` stub položku (a `WorldStubPage` napojení).
- Layout/grid/responsive dle design §1, §5.

**Test:** `CharacterDirectory.spec` — sekce, filtr, prázdný stav, gating tlačítka;
`CharacterCard.spec` — typy, řádek hráče u PC, odkaz.
**Commit:** `feat(characters): krok 8.2e — adresář postav /postavy`

---

## 7. Krok F — FE: convert + delete v hlavičce

1. **`CharacterHeader.tsx`** — vedle „Upravit" `KebabMenu` (`shared/ui/KebabMenu`),
   jen PJ. Položky: „Převést na NPC"/„Převést na PC" (dle typu; skryté pro Lokaci),
   „Smazat postavu" (`variant: 'danger'`).
2. **`ConvertToPcModal.tsx`** (nový) — `Modal size="sm"`, radio seznam členů
   (Hráč+) s `UserAvatar`; submit → `useConvertCharacter({ userId })`.
3. **PC → NPC** — `ConfirmDialog` („Finance a výbava se skryjí.", `confirmVariant`
   primary) → `useConvertCharacter({})`.
4. **Smazat** — `ConfirmDialog` (`confirmVariant="danger"`) → `useDeleteCharacter`;
   `onSuccess`: navigace na `/svet/:worldSlug/postavy`.

**Test:** menu gating (PJ vs. ne), skrytí convertu pro Lokaci, convert tam/zpět,
delete + navigace.
**Commit:** `feat(characters): krok 8.2f — convert a mazání postavy`

---

## 8. Krok G — FE: přiřazení v MemberRow

1. **`MemberRow.tsx`** — ovládání „Postava": nativní `<select>` PC postav světa
   (`useCharacterDirectory`, filtr PC) + volba „— žádná —" + „Vytvořit postavu…".
2. Změna výběru → `useUpdateMemberCharacter` (`characterPath` = slug / prázdné).
3. „Vytvořit postavu…" → `CreateCharacterModal` s `lockedMember` daného člena.
4. Gating: PomocnyPJ(4)+ nebo sám sobě (zrcadlí BE).

**Test:** `MemberRow` — přiřazení/odpojení, gating, otevření modalu s `lockedMember`.
**Commit:** `feat(characters): krok 8.2g — přiřazení postavy hráči`

---

## 9. Krok H — testy, audit, dokumentace

1. Doplnit chybějící component testy dle spec §7; ověřit zelený běh celé sady.
2. **`verify`** smoke — vytvořit PC/NPC/Lokaci, kaskáda na detailu, convert tam/zpět,
   smazat, přiřadit/odpojit.
3. **`mobil-desktop`** audit — adresář, modaly, kebab menu na mobilu i desktopu.
4. **Roadmap** `roadmap-fe.md` — zaškrtnout 8.2; přesunout odrážku adresáře 8.3→8.2;
   zúžit 8.3; opravit ř. 1305 (Lokace = jen kalendář).
5. **`napoveda`** — aktualizovat stránku Nápověda (nová stránka Postavy + adresář).
6. Nálezy během implementace se **řeší rovnou** (rozhodnutí PJ), ne odkládají do
   `dluhy.md`; větší zásah se před opravou prokomunikuje.
**Commit:** `test(characters): krok 8.2h — testy, audit, roadmap, nápověda`

---

## 10. Soubory — souhrn

**Nové (FE):** `useCharacterDirectory.ts`, `useUpdateMemberCharacter.ts`,
`CharacterTypeBadge.tsx` (+css), `CharactersPage/{CharactersPage,CharacterDirectory}.tsx`
(+css), `CharactersPage/components/{CharacterCard,CreateCharacterModal}.tsx` (+css),
`CharacterDetailPage/components/ConvertToPcModal.tsx` (+css).
**Dotčené (FE):** `useCharacterMutations.ts`, `characters.types.ts`,
`CharacterHeader.tsx`, `MemberRow.tsx`, `worldStubMap.ts`, `router.tsx` (ověřit).
**Nové/dotčené (BE):** 5 subdoc repozitářů (`deleteByCharacterId`),
`character-subdocs.service.ts`, `worlds.service.ts` (+ membership repo),
`characters.service.ts`.

## 11. Rizika plánu

| # | Riziko | Mitigace |
|---|---|---|
| P-1 | `emitAsync` v `create()` prodlouží request o ~200 ms | Akceptovatelné — 201 pak znamená kompletní postavu; bez závodu na FE |
| P-2 | Z-4 (slug vs. name v `characterPath`) odhalí větší nesoulad | Krok A ověří první; nesoulad se **opraví v rámci 8.2** (žádné odkládání do `dluhy.md`); větší zásah se před opravou prokomunikuje |
| P-3 | Cross-repo commit (BE+FE) — krok A je v jiném repu | Krok A samostatný commit v BE repu; FE kroky až poté |
| P-4 | `CharacterTypeBadge` extrakce rozbije hlavičku 8.1 | Krok C má regresní test; vizuálně beze změny |

---

**Stav workflow:** **návrh** — čeká na potvrzení. Po potvrzení se implementuje
krok po kroku (A→H), každý jako samostatný commit na `main`.
