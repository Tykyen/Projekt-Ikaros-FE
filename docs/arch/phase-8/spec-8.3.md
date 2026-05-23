# Spec 8.3 — `/moje-postava` + slot ve WorldContext + member-facing vychytávky adresáře

**Stav:** ✅ schváleno + implementováno 2026-05-23
**Datum:** 2026-05-23
**Závisí na:** 8.1 (CharacterDetailPage), 8.2 (CharacterDirectory + `GET .../characters/directory`), 5.1 (`WorldContext.character` slot existuje, `WorldLayout` mountuje provider).

---

## 1. Cíl

Dovést „postavu hráče" do plné funkčnosti uvnitř světa:

1. Route `/moje-postava` přestane být stub a začne se chovat jako rychlá zkratka člena k jeho postavě.
2. `WorldContext.character` slot se konečně naplní (do dnes je `null`) — header světa, chat, případně budoucí konzumenti dostanou jméno + avatar postavy přihlášeného člena.
3. Adresář postav (z 8.2) dostane člensky orientované vychytávky: **fulltext hledání**, **oblíbené** a **seskupení PC dle herních skupin**.
4. Po grafických změnách `mobil-desktop` audit.

Mimo cíl: novou stránku pro stand-alone „moje postava" netvořit (route je jen redirect / fallback). Adresář zůstává jednou stránkou, žádný redesign.

---

## 2. Sub-úkol A — `/moje-postava` redirect + fallback

### 2.1 Route a guard

- Route `/svet/:worldSlug/moje-postava` už v [src/app/router.tsx:232](src/app/router.tsx#L232) existuje s `memberOnly()` guardem — beze změny.
- Komponenta [src/features/world/pages/MyCharacterPage.tsx](src/features/world/pages/MyCharacterPage.tsx) (dnes stub) se přepíše.

### 2.2 Chování

Komponenta čte z `useWorldContext()`:

- **`character != null` (`characterPath` je vyplněno a directory ho našel):**
  `<Navigate to={\`/svet/${worldSlug}/postava/${characterPath}\`} replace />`.
  Použít `replace` aby uživatel po Backu v prohlížeči nepřistál zpátky v `/moje-postava` smyčce.

- **`character == null` (žádná postava nepřiřazena, nebo se nepodařilo dohledat):**
  Fallback karta uprostřed obsahu s těmito stavy:
  - **Loading** (`ctxValue.loading === true`): skeleton (jeden řádek).
  - **Member bez postavy** (běžný stav nového hráče): hláška „V tomto světě zatím nemáš postavu." + 1 CTA „Zobrazit adresář postav" → `/svet/:worldSlug/postavy`. Pokud aktuální `userRole >= WorldRole.PJ`, navíc sekundární CTA „Vytvořit postavu" → `/svet/:worldSlug/postavy?create=1` (adresář si otevře vlastní `CreateCharacterModal`).
  - **`characterPath` byl nastaven, ale directory entry chybí** (PJ smazal postavu mezi sessions): hláška „Postava `<slug>` už neexistuje. Požádej PJ o přidělení nové." + CTA „Zobrazit adresář".

### 2.3 Edge cases

- Globální admin **bez membershipu** ve světě (Admin vidí svět ze System view) → `memberOnly()` guard ho do `/moje-postava` nepustí; není třeba speciální větev.
- `WorldStubPage` se z importu odstraní (jediný stávající konzument).

---

## 3. Sub-úkol B — Naplnění `WorldContext.character`

### 3.1 Zdroj dat

`WorldLayout` už drží `membership` z `useWorldStatus(realWorldId)`. K naplnění slotu potřebujeme `name` + `avatarUrl` postavy.

**Rozhodnutí:** Reuse `useCharacterDirectory(worldId)` — endpoint `GET /worlds/:worldId/characters/directory` z 8.2. TanStack Query cache ho sdílí s `CharactersPage`, žádný extra request při navigaci mezi `/postavy` a zbytkem světa.

**Alternativa zvážená:** Vlastní endpoint `GET .../characters/by-slug/:slug` jen pro slot. Zamítnuto — přidává BE povrch zbytečně, directory je dostatečně lehký a stejně se v rámci světa fetchuje (PJ otevírá adresář, hráč ho otevírá při hledání postav…).

### 3.2 Logika

V `WorldLayout` (`ctxValue` useMemo):

```ts
const { data: directory } = useCharacterDirectory(realWorldId);
const characterPath = membership?.characterPath ?? null;
const characterSlot: WorldCharacterSlot | null = useMemo(() => {
  if (!characterPath || !directory) return null;
  const entry = directory.find((e) => e.slug === characterPath);
  if (!entry) return null;
  return {
    characterPath: entry.slug,
    name: entry.name,
    avatarUrl: entry.avatarUrl ?? undefined,
  };
}, [characterPath, directory]);
```

A v `ctxValue` `character: characterSlot`.

### 3.3 Konzumenti slotu

- `WorldLayout` header — `personaName` / `personaAvatar` (řádky 201–209) už slot konzumují, fallbackují na účet. Žádná další změna.
- `MyCharacterPage` — viz sub-úkol A.
- Budoucí konzumenti (chat persona indicator, mention picker default) — beze změny v 8.3.

### 3.4 Performance / risk

- `useCharacterDirectory` je `enabled: !!worldId`. Pokud člen ještě nemá postavu, fetch stále proběhne — to je přijatelné, je to lehký endpoint a stejně se brzy vyžádá.
- **Cache invalidation:** Po `PATCH .../members/:id/character` (přiřazení postavy hráči) PJ scenario — directory cache se invaliduje v `useUpdateMemberCharacter` hooku už dnes (ověřit). Membership cache (`useMyWorlds`) se invaliduje rovněž; slot se přepočítá v `useMemo`. Pokud invalidaci v existujících hookech nenajdeme, doplníme.

---

## 4. Sub-úkol C — Adresář postav: search + oblíbené + seskupení dle skupin

Adresář žije v [src/features/world/pages/CharactersPage/CharacterDirectory.tsx](src/features/world/pages/CharactersPage/CharacterDirectory.tsx). Rozšíříme ho o tři nezávislé feature, vše klient-side.

### 4.1 Toolbar layout (nad sekcemi)

Nad stávajícím `FilterBar` přidáme řádek toolbaru:

```
[ 🔍 Hledat postavu… ] [ ▦ Skupiny ]
[ Vše | Hráčské | NPC | Lokace ]      ← stávající FilterBar
```

- **Search input** (vlevo, flex 1): `<Input placeholder="Hledat postavu…" />`, `lucide-react` `Search` ikona. Žádný debounce (in-memory filter je levný).
- **Skupiny toggle** (vpravo): pill button `[ ▦ Skupiny ]`, aktivní state filled. Po kliknutí překlopí grouping (jen vizuální, jiná data neovlivní).
- Pod tím stávající `FilterBar` s pily typu (Vše / Hráčské / NPC / Lokace) — beze změny.
- Na mobilu (≤ 768 px): toolbar zalomí na 2 řádky, search 100 % width, ▦ Skupiny chip pod ním zarovnaný vlevo. Pill řada zůstává horizontálně scrollovatelná.

### 4.2 Search

Filtrovací pravidlo (case-insensitive, `cs` locale, normalizace diakritiky přes `String.prototype.normalize('NFD').replace(/\p{Diacritic}/gu, '')`):

```ts
const q = normalize(searchQuery.trim());
if (!q) return true;
return (
  normalize(entry.name).includes(q) ||
  normalize(memberNames[entry.userId] ?? '').includes(q) ||
  normalize(entry.slug).includes(q)
);
```

- Search se aplikuje **před** type-filtrem (`pcs/npcs/locations`) a oblíbenými.
- Empty state při 0 výsledcích: „Žádná postava neodpovídá hledání." + tlačítko „Vymazat filtr".
- URL state: `?q=<search>&filter=<all|pc|npc|location>&group=<0|1>` (`replace: true`, back/forward funguje). Konzistentní s `WorldsPage` URL state pattern.

### 4.3 Oblíbené

Per (`userId`, `worldId`) localStorage:

- Klíč: `ikaros.world.<worldId>.favCharacters.<userId>` (`userId` → soukromí — když si přihlásí jiný user na stejném prohlížeči, vidí své oblíbené).
- Hodnota: `string[]` slugů postav, max 200 (sanity cap).
- Hook: `useFavoriteCharacters(worldId)` → `{ favorites: Set<string>, toggle(slug): void }`. Reaktivní (vlastní `useState` + `useEffect` na storage event pro cross-tab sync).

UI:

- Na `CharacterCard` přibude ikona hvězdičky (lucide `Star` / `StarOff`, abs. pozice top-right). Kliknutí toggluje, `stopPropagation` aby neaktivovalo proklik karty.
- Nad sekcí „Postavy hráčů" / „NPC" / „Lokace" přibude nová sekce **„Oblíbené"** (ikonka `Star`, jen pokud `favorites.size > 0`). Obsahuje karty napříč typy ze všech filtrovaných entries (search + type-filter respektovány).
- Postava může v jednom okamžiku být v sekci „Oblíbené" i ve své typové sekci současně (záměrně — duplikace jako shortcut).

### 4.4 Seskupení PC dle herních skupin

Zdroj „skupiny": `membership.group` z `WorldMembership` — string label, definovaný v `WorldSettings.customGroups`. Mapping `userId → group` doplníme do `memberNames` useMemo (rozšíříme na `memberMeta: Record<string, { name: string; group?: string }>`).

Když je toggle „Skupiny" aktivní (`groupBy === true`):

- **Sekce „Postavy hráčů"** se rozštěpí na pod-sekce — jedna per skupina, plus „Bez skupiny" pro PC, kteří mají hráče bez `group`, nebo NPC-asignaci.
- Pořadí pod-sekcí: dle `WorldSettings.customGroups` pole (zachovává PJ ordering), „Bez skupiny" jako poslední.
- NPC a Lokace **se neseskupují** (chybí member, není podle čeho). Sekce zůstanou.
- Skupiny bez postavy v aktuálním filtru se neukáží (`hideEmpty`).
- Barva skupiny (`WorldSettings.groupColors[group]`) se použije jako accent pásek vlevo u nadpisu pod-sekce. Fallback `var(--frame-border)`.

Když je toggle vypnutý (default), chování beze změny.

### 4.5 Card refresh

`CharacterCard` (existující komponenta) dostane:

- Hvězdičkový toggle (top-right overlay, transparentní pozadí).
- Volitelný `<groupLabel>` chip u PC karet (vedle `playerName` řádku), zobrazený jen když `groupBy` zapnuto. Mikro-pill s `groupColors[group]` border.

### 4.6 Mimo rozsah 8.3

- Server-side search / paginace (BE endpoint dnes vrací all entries; až bude > 200 postav, řešit samostatně).
- Sdílení oblíbených napříč zařízeními (vyžaduje BE persistence; bod do `dluhy.md`).
- Drag-and-drop reorder skupin uvnitř adresáře (PJ to dělá v `WorldSettings/MembersTab`).

---

## 5. Mobile / Desktop

Po implementaci spustit `mobil-desktop` skill se zaměřením na:

- `MyCharacterPage` fallback karta — centered, max-width 480 px, padding 16 px na mobilu.
- Toolbar v adresáři (search + ▦ Skupiny) — viz §4.1.
- Hvězdička na kartě — touch target 32 × 32 px min, ale ne přes-blokující proklik karty (`stopPropagation` + dostatečný odstup od textu).
- Grouped subsection nadpisy — wrap na mobilu, accent pásek nevizuálně neslepit s ostatními sekcemi.

---

## 6. Testy

**FE unit / komponentové:**

- `MyCharacterPage` — 3 cases: redirect s characterPath, fallback bez characterPath, fallback s neexistujícím slugem (directory loaded, entry not found).
- `useCharacterDirectory` + `WorldContext.character` propagace — 2 cases: characterPath bez directory → null; characterPath s match → naplněný slot.
- `useFavoriteCharacters` — 4 cases: empty start, toggle add, toggle remove, cross-tab sync (mock `storage` event).
- `CharacterDirectory` rozšíření — search filtruje, „Oblíbené" sekce se zobrazí jen s aspoň 1 oblíbeným, groupBy rozdělí PC sekci, „Bez skupiny" jako poslední.
- `normalize` helper (search) — 3 cases: diakritika, lower/upper, prázdný string.

**BE:** Žádné změny BE → žádné nové BE testy.

---

## 7. Otevřené body / rozhodnutí pro schválení

Defaulty vybrané v Auto Mode (změny budou rychlé — jen prosím přečíst):

- **D1: Slot fetch přes `useCharacterDirectory`** (žádný nový BE endpoint). Pokud zamítnuto → přidáme `GET .../characters/by-slug/:slug` v BE.
- **D2: Oblíbené v localStorage** (per `userId` × `worldId`), žádný BE. Pokud chcete sdílení napříč zařízeními → přidat BE (`User.favoriteCharacters: Record<worldId, slug[]>`) a hook přepsat — odhadnutě +0.5 dne.
- **D3: Search jen klient-side, bez debounce, hledá v `name | slug | playerName`** s diakritikou-neutral. Pokud chcete přidat i bio / hledání v BE — větší rozsah.
- **D4: Groupování seskupí jen PC sekci, NPC + Lokace ne** (NPC group taggování není v 8.2 definováno). Pokud chcete i NPC seskupovat (např. tag „organizace"), potřeba doplnit `Character.npcGroup` na BE — out of scope.
- **D5: `MyCharacterPage` fallback s 1 CTA „Zobrazit adresář"**, pro PJ navíc „Vytvořit postavu" s `?create=1` query trigger. Pokud chcete větší rozcestník (vč. „Požádat PJ" message thread), out of scope.
- **D6: Žádný redesign adresáře — jen toolbar nad existujícím gridem.** Pokud chcete jiný layout (např. sticky sidebar s filtry), separate spec.

---

## 8. Tracked dluhy (out-of-scope, ale stojí za zápis po implementaci)

- **D-XXX:** Sdílené oblíbené napříč zařízeními (BE persistence) — souvisí s budoucí synchronizací user preferences.
- **D-XXX:** Saved filter combos (uložit „Postavy mé skupiny + oblíbené" jako preset) — power-user feature, ne MVP.
- **D-XXX:** Cross-world „moje postavy" přehled na úvodníku Ikaros — agregátor přes všechny membershipy. Out of scope (krok 8.x je world-scoped).
