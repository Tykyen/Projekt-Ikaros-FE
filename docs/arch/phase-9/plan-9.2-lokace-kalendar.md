# Plán 9.2 — Lokace má vlastní kalendář

**Spec:** [`spec-9.2-lokace-kalendar.md`](spec-9.2-lokace-kalendar.md)
**Stav:** Návrh — čeká na schválení
**Odhad:** ~6 h (BE 2 h, FE 3 h, backfill + test 1 h)

---

## Sekvence

```
BE-1 → BE-2 → BE-3 → BE-4 → FE-1 → FE-2 → FE-3 → MIG → AC
       └─ paralelní s BE-3 ─┘
```

`MIG` (backfill) běží **po deploy BE**; `FE-*` po `MIG` (jinak FE Lokace bez `characterRef` neukáže tab).

---

## BE

### BE-1: Character schema `kind` enum

**Soubor:** `backend/src/modules/characters/schemas/character.schema.ts`, `character.interface.ts`, `dto/create-character.dto.ts`, `update-character.dto.ts`

- Schema: `@Prop({ enum: ['persona', 'location'], default: 'persona' }) kind: 'persona' | 'location';`
- Interface + DTO: `kind?: 'persona' | 'location'` (`@IsOptional() @IsIn(['persona', 'location'])`)
- `toEntity` mapper: čte `kind`, default `'persona'` při missing (kompatibilita s pre-9.2 dokumenty)

**Test:** unit test pro mapper s/bez `kind` field.

### BE-2: Page → Character auto-create rozšířen

**Soubor:** `backend/src/modules/pages/pages.service.ts:235` (`createWithCharacter`)

- Stávající větve: `Page.type ∈ {PostavaHrace, NPC}` → Character `isNpc=...`, plné subdocs
- **Nová větev**: `Page.type === 'Lokace'` → Character `kind: 'location'`, `isNpc: false`, **pouze `characterCalendar` subdoc** (skip diary/finance/inventory/notes)
- `page.characterRef = newCharacter.id` (stejně jako u PostavaHrace/NPC)

**Test:** integration test — POST Page typu Lokace → verify `characterRef` exists + jen calendar subdoc v charactersubdocs collection.

### BE-3: CharacterSubdocs auth pro Lokaci

**Soubor:** `backend/src/modules/character-subdocs/character-subdocs.controller.ts` (calendar endpoints)

`assertSubdocAccess` se pro Lokaci chová jinak:
- Character `kind: 'location'` nemá `userId` (owner) → ownership check vrátí false
- **Edit** musí povolit `WorldRole >= PomocnyPJ` (vč. PJ + Admin/Superadmin)
- **View** = membership world + AKJ check na Page (Lokace má AKJ requirements na Page entity)

Helper: `assertSubdocAccess` accept volitelný param `entityType: 'persona' | 'location'`, pro `'location'` přeskoč owner check + řeš pres Page AKJ.

**Test:** controller spec — anonymous → 404 PUT, member non-PJ → 403 PUT, PomocnyPJ → 200 PUT.

### BE-4: CalendarsModule.aggregate filter

**Soubor:** `backend/src/modules/calendars/calendars.service.ts` (`aggregate()`)

- Stávající filter: pravděpodobně `Character.{isNpc, userId}` based
- **Změna:** include vše bez ohledu na `kind` — Lokace eventy se mají objevit v aggregátu
- Per-character payload v response (`calendars[].character`) doplnit `kind` field (FE pak může rozlišit zobrazení)

**Test:** service spec — vytvoř 1 persona + 1 location s eventy → `aggregate()` vrátí oba; FE consumer obdrží `kind` v každém záznamu.

---

## FE

### FE-1: Types update

**Soubor:** `src/features/world/pages/api/characters.types.ts` (nebo kdekoli žije `Character` type)

- Doplnit `kind?: 'persona' | 'location'` (optional pro backward kompatibility)
- `useCharacter` / `useCharacterCalendar` hooks — žádné změny, jen procházejí `kind` skrz

### FE-2: LokaceLayout rewrite

**Soubor:** `src/features/world/pages/PageViewer/layouts/LokaceLayout.tsx` (rewrite, ~80 řádků)

**Vzor:** [`PostavaLayout.tsx`](../../src/features/world/pages/PageViewer/layouts/PostavaLayout.tsx) (zkrácený — bez Deník/Finance/Výbava/Poznámky)

Struktura:
```tsx
const tabs = [
  { id: 'profil', label: 'Profil', icon: <MapPin size={16} /> },
  ...(character ? [{ id: 'kalendar', label: 'Kalendář', icon: <CalendarDays size={16} /> }] : []),
];

return (
  <div>
    <PageHeader page={page} canEdit={canEdit && activeTab === 'profil'} />
    <AkjBanner />
    <Tabs items={tabs} activeId={activeTab} onChange={requestTabChange}>
      {activeTab === 'profil' && <OstatniLayout page={page} />}
      {activeTab === 'kalendar' && character && (
        <CalendarTab slug={page.slug} mode={editMode ? 'edit' : 'view'} ... />
      )}
    </Tabs>
  </div>
);
```

- Dirty-guard navigation block (port z PostavaLayout `confirmGuard` + `useBlocker`)
- Edit toggle button viditelný jen v Kalendář tab + pro `PomocnyPJ+`
- Pokud `page.characterRef` chybí (legacy Lokace pre-MIG) → fallback na čistý OstatniLayout (žádné taby)

### FE-3: CalendarTab reuse

**Soubor:** `src/features/world/pages/CharacterDetailPage/components/CalendarTab.tsx`

- **Žádná úprava komponenty samotné.** Re-use as-is — fetchne `useCharacterCalendar(slug)` přes BE endpoint `GET /api/worlds/:worldId/characters/:slug/calendar`.
- Pokud cesta importu z CharacterDetailPage je sémanticky podivná (Lokace importuje z CharacterDetailPage), refactor: přesunout `CalendarTab` do `src/features/world/calendar/components/CalendarTab.tsx` a aktualizovat import v PostavaLayout. **Volitelně** v rámci 9.2 — nebo dluh.

**Doporučení:** přesun = +30 min, ale lepší dlouhodobá hygiena. Začleněno v plánu.

---

## MIG: Backfill skript

**Soubor:** `backend/scripts/backfill-lokace-character-9.2.ts`

```ts
// Pseudokód
const pages = await pagesRepo.find({ type: 'Lokace', characterRef: null });
console.log(`Found ${pages.length} legacy Lokace pages`);
for (const page of pages) {
  if (!args.apply) { console.log(`[dry] would create Character for ${page.slug}`); continue; }
  const character = await charactersRepo.create({
    worldId: page.worldId, slug: page.slug, name: page.title,
    kind: 'location', isNpc: false,
  });
  await charSubdocsRepo.create({ characterId: character.id, kind: 'calendar', events: [], color: '#3B82F6', displaySettings: {} });
  await pagesRepo.update(page.id, { characterRef: character.id });
  console.log(`[apply] linked ${page.slug} → character ${character.id}`);
}
```

**Spuštění:**
- Dry-run: `pnpm tsx backend/scripts/backfill-lokace-character-9.2.ts` (default)
- Apply: `pnpm tsx backend/scripts/backfill-lokace-character-9.2.ts --apply`

**Idempotence:** filter `characterRef: null` — re-spuštění už migrované Lokace přeskočí.

---

## AC (Acceptance Check)

Po dokončení manuálně ověřit (spec AC 1-7):

1. ✅ Nová Lokace → BE auto-create Character + calendar subdoc + `characterRef` set
2. ✅ Backfill --apply na existující Lokace → linked
3. ✅ PageViewer Lokace → 2 taby (Profil + Kalendář)
4. ✅ Kalendář tab view + edit (PomocnyPJ+)
5. ✅ PJ `GET /calendars` aggregate → Lokace eventy v `events[]`
6. ✅ Permission: anonymous 404 PUT, member non-PJ 403 PUT, PomocnyPJ 200 PUT
7. ✅ Mobile responsivita ≤768px

Po manuálním AC:
- Skill `mobil-desktop` na LokaceLayout
- Skill `napoveda` (Page Lokace teď má víc funkčnosti)
- Aktualizovat `roadmap-fe.md` (zaškrtnout 9.2)
- Uzavřít odpovídající dluh (pokud existuje v `docs/dluhy.md`)

---

## Risks

| Riziko | Pravděpodobnost | Mitigace |
|---|---|---|
| `assertSubdocAccess` rozšíření rozbije PostavaHrace/NPC auth | Střední | Přidat regression test pro PostavaHrace PUT calendar; spustit existující character-subdocs test suite. |
| Aggregate change vrátí 2x eventy (Page i Character path) | Nízká | Aggregate čte jen z `charactersubdocs` collection — Page calendar neexistuje. Verify v testu. |
| Backfill vytvoří duplicitní Character (re-run) | Nízká | Filter `characterRef: null` zajistí idempotenci. |
| FE LokaceLayout pre-MIG fallback bez tabs ⇒ uživatel nevidí kalendář dokud admin nespustí backfill | Střední | Komunikovat v release notes; po MIG všechno automaticky funguje. |

---

## Závěr — co potvrzuješ

Po `OK` na tento plán implementuji v této sekvenci:
1. BE-1 → BE-2 → BE-3 → BE-4 (commit „feat(9.2): BE — Character kind + Lokace calendar pipeline")
2. FE-1 → FE-2 → FE-3 (commit „feat(9.2): FE — LokaceLayout s Kalendář tabem")
3. MIG skript (commit „chore(9.2): backfill skript pro legacy Lokace")
4. Manuální AC + skill `mobil-desktop` + `napoveda` + roadmap aktualizace
