# Spec 2.3 — Vytvoření světa (`/ikaros/vytvorit-svet`)

**Status:** Draft — čeká na schválení
**Rozsah:** FE (nová stránka + formulář + 4 konstanty + 1 mutation hook) + BE (3 pole doplnit do DTO, žádná schema změna)
**Větev:** `feat/krok-2.3-create-world`
**Velikost:** ~12 FE souborů (~700 ř.) + ~2 BE soubory (~20 ř.)
**Autor:** PJ + Claude
**Datum:** 2026-05-14
**Souvisí:** [spec-2.2.md](./spec-2.2.md) (`maxPlayers` field, WorldCard reuse), 2.4 detail světa, 2.5 settings světa
**Reference:** Screenshoty starého systému (PJ, 2026-05-14) — single-page formulář s 8 sekcemi

---

## 1. Cíl

Logged-in uživatel může na `/ikaros/vytvorit-svet` založit nový svět vyplněním jednoho **single-page formuláře** s 5 logickými sekcemi. Po úspěchu se stane `PJ` toho světa a je přesměrován na `/svet/:id`. Anon dostane redirect na `/login`.

---

## 2. Kontext / motivace

- Roadmap 2.3 = poslední chybějící entry-point pro tvorbu obsahu platformy. Bez něj může svět vzniknout jen seedem nebo přímým API voláním.
- Dashboard (2.1) má v empty-state Moje světy CTA „Vytvořit svět" → dnes vede na `/ikaros/vytvorit-svet` (stub 404). Sidebar Vesmíry (2.2) má sekundární odkaz „Prozkoumat / Vytvořit". Bez funkční stránky jsou tyhle linky dead-end.
- BE `POST /api/worlds` + `worlds.service.create` už existuje. `WorldSchemaClass` má **všechna pole** ze starého systému (`tones`, `playersWanted`, `dice`, `accessMode`, `system`, `maxPlayers`). Chybí jen jejich **propagace v `CreateWorldDto`** + FE typu `World`.
- Vizuální reference: starý systém (1 dlouhá stránka, 8 sekcí, ne wizard). Roadmapová formulace „wizard" je interpretována jako **průchozí flow s validací**, ne striktně step-by-step modal.

---

## 3. Audit současného stavu

### BE
- [`backend/.../schemas/world.schema.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/schemas/world.schema.ts) — **kompletní**: `name`, `slug`, `description`, `imageUrl`, `genre`, `tones: string[]`, `playersWanted?`, `playerCount`, `maxPlayers`, `dice: string[]`, `system` (default 'matrix'), `ownerId`, `isActive`, `accessMode` (default 'private'), `offeredCharacters`, `calendarConfig`, `favoritePageSlugs`.
- [`backend/.../dto/create-world.dto.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/dto/create-world.dto.ts) — **dnes přijímá jen**: `name`, `slug`, `description`, `imageUrl`, `genre`, `accessMode`, `system`, `playerCount`, `maxPlayers`. **Chybí**: `tones`, `playersWanted`, `dice`.
- [`backend/.../interfaces/world.interface.ts`](../../../../Projekt-ikaros/backend/src/modules/worlds/interfaces/world.interface.ts) — má `tones`, `playersWanted`, `dice`. OK.
- `worlds.service.create` — propaguje vše ze vstupu; po doplnění DTO bude rovnou fungovat (potvrdit kontrolou).
- Endpoint `POST /api/worlds` chráněný `JwtAuthGuard` (předpoklad — ověřit v controlleru).

### FE
- [`src/shared/types/index.ts:282`](../../src/shared/types/index.ts) — `World` má `genre`, `tones`. **Chybí** `playersWanted` a `dice`.
- [`src/features/world/api/useWorlds.ts`](../../src/features/world/api/useWorlds.ts) — `usePublicWorlds`, `useMyWorlds`, `useWorld`. **Chybí** `useCreateWorld`.
- [`src/features/ikaros/pages/`](../../src/features/ikaros/pages/) — žádná `CreateWorldPage` neexistuje (route je v App routeru jako 404 fallback nebo přímo chybí; ověřit).
- Sidebar/dashboard CTA odkazují na `/ikaros/vytvorit-svet`.

---

## 4. Návrh řešení

### 4.1 BE — doplnění DTO

`CreateWorldDto`:
```diff
+ @IsOptional() @IsArray() @IsString({ each: true }) tones?: string[];
+ @IsOptional() @IsString() @MaxLength(500) playersWanted?: string;
+ @IsOptional() @IsArray() @IsString({ each: true }) dice?: string[];
```

`UpdateWorldDto` (pokud existuje a postrádá je) — analogicky (out of scope pokud existuje, pokud ne, pak in-scope).

`worlds.service.create` — ověřit forward (nic neměnit, jen test).

**Validace whitelist**: pole `genre`, `tones[*]`, `dice[*]`, `system` BE **nevaliduje proti enum/whitelistu** — drží volný string (FE konstanty řídí UX). Důvod: snadné rozšiřování konstant bez BE migrace; FE chrání před překlepem ovládacími prvky.

### 4.2 FE — typ `World`

```diff
export interface World {
  ...
  genre?: string;
  tones?: string[];
+ playersWanted?: string;
+ dice?: string[];
  system: string;
  ...
}
```

### 4.3 FE — mutation hook `useCreateWorld`

`src/features/world/api/useCreateWorld.ts`:
```ts
export interface CreateWorldInput {
  name: string;
  slug: string;
  description?: string;
  genre?: string;
  tones?: string[];
  playersWanted?: string;
  maxPlayers?: number | null;
  accessMode: 'public' | 'open' | 'private';
  system: string;
  dice?: string[];
}

export function useCreateWorld() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorldInput) => api.post<World>('/worlds', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds', 'public'] });
      qc.invalidateQueries({ queryKey: ['worlds', 'my'] });
    },
  });
}
```

### 4.4 FE — stránka `CreateWorldPage`

**Struktura:**
```
src/features/ikaros/pages/CreateWorldPage/
├── CreateWorldPage.tsx               ← orchestrator (state + submit)
├── CreateWorldPage.module.css
├── index.ts
├── components/
│   ├── SectionCard.tsx               ← wrapper s nadpisem + popisem
│   ├── BasicInfoSection.tsx          ← Název, Slug, Identita (popis)
│   ├── GenreSection.tsx              ← Žánr (single-select) + Tóny (multi-select grid)
│   ├── PlayersSection.tsx            ← Hráči (textarea) + Počet hráčů (number)
│   ├── AccessModeSection.tsx         ← Radio chips public/open/private
│   ├── SystemSection.tsx             ← Herní systém (dropdown) + Kostky (multi-select grid)
│   ├── CheckboxGrid.tsx              ← znovupoužitelný multi-select (3col → 1col)
│   └── *.module.css
├── constants/
│   ├── genres.ts                     ← 10 žánrů + "Vlastní"
│   ├── tones.ts                      ← 25 tónů + "Vlastní"
│   ├── dice.ts                       ← 13 kostek
│   └── systems.ts                    ← 1 systém (Matrix), připraveno na rozšíření
├── hooks/
│   └── useWorldSlug.ts               ← auto-derive slug z názvu (cs translit)
└── __tests__/
    ├── CreateWorldPage.spec.tsx
    └── useWorldSlug.spec.ts
```

**Formulář — 5 sekcí v pořadí:**

1. **Základní informace**
   - **Název světa *** (`<input type="text">`, 2–60 znaků, required)
   - **Slug** (`<input type="text">`, 2–40 znaků, regex `^[a-z0-9-]+$`)
     - Auto-derive z názvu (cs translit: š→s, č→c, ř→r, ž→z, ý→y, á→a, í→i, é→e, ú→u, ů→u, ě→e, ť→t, ď→d, ň→n; mezery → `-`; lowercase; strip non-`a-z0-9-`; max 40).
     - Pokud uživatel slug ručně upraví, auto-derive se zastaví (dirty flag).
     - Helper text pod inputem: „Adresa světa: `/svet/<slug>`".
   - **Identita světa** (`<textarea>`, 0–1000 znaků) — popis světa pro hráče. Placeholder: „Tento svět je o…".

2. **Žánr a styl**
   - **Žánr *** (`<select>`, required) — `Fantasy`, `Sci-Fi`, `Cyberpunk`, `Post-apokalypsa`, `Horror`, `Mystery`, `Historický`, `Moderní / Současný`, `Western`, `Vlastní`. Při výběru „Vlastní" se zobrazí inline `<input>` pro free-text.
   - **Tón a styl vyprávění** (multi-select checkbox grid, 0–25 + „Vlastní" s free-textem) — 25 atmosfér ze starého systému (Temný, Ponurý, Brutální, Realistický, Syrový, Tragický, Hrdinský, Epický, Dobrodružný, Napínavý, Tajemný, Hororový, Psychologický, Melancholický, Cynický, Nadějeplný, Romantický, Komorní, Velkolepý, Stylizovaný, Groteskní, Sarkastický, Humorný, Černohumorný) + Vlastní (free-text se objeví pod gridem).
   - Popis sekce: „Vyberte atmosféru, jakou bude svět navozovat. Můžete zaškrtnout více možností."

3. **Hráči**
   - **Koho hledáte** (`<textarea>`, 0–500 znaků) — text pro potenciální zájemce. Placeholder: „Hledám aktivní a kreativní hráče…".
   - **Počet hráčů (kapacita)** (`<input type="number">`, optional, 1–999, placeholder „max. počet"). Helper: „Pro sort 'volná místa' v Přehledu vesmírů."

4. **Přístupový režim ***
   - Radio chips (3 možnosti, default `private`):
     - **Veřejný** (`public`) — kdokoliv vidí, kdokoliv se přidá přímo (žádné schválení PJ).
     - **Otevřený** (`open`) — kdokoliv vidí, ale vstup vyžaduje souhlas PJ (žádost přes Zpracovat tab → 2.4).
     - **Soukromý** (`private`) — vidí jen členové + zadatelé žádostí. Default.
   - Popis pod chipy se mění podle volby (vysvětlí flow).
   - `closed` v UI **není** — to je interní stav (svět zavřený PJ; nastaví se přes settings později).

5. **Herní systém**
   - **Herní systém *** (`<select>`, required, default `matrix`) — **13 položek** (mapování na BE preset slug, kde existuje):
     - `matrix` — Matrix (Klasická TTRPG Pravidla) *(BE preset neexistuje → empty schema)*
     - `dnd5e` — Dungeons & Dragons 5e ✓
     - `jad` — Jeskyně a Draci ✓
     - `drd16` — Dračí Doupě 1.6 *(BE má jen `drd16-*` per-povolání presety → empty)*
     - `drd-plus` — Dračí Doupě Plus *(BE preset neexistuje → empty)*
     - `drd2` — Dračí Doupě II *(BE preset neexistuje → empty)*
     - `draci-hlidka` — Dračí Hlídka *(BE preset neexistuje → empty)*
     - `pi` — Příběhy Impéria ✓
     - `shadowrun` — Shadowrun ✓
     - `gurps` — GURPS ✓
     - `fate` — Fate Core / Accelerated ✓
     - `call-of-cthulhu` — Call of Cthulhu ✓
     - `vlastni` — Vlastní Systém *(po volbě se zobrazí free-text input pro vlastní název)*
   - BE drží `system` jako volný string. `worlds.service.create` volá `systemPresetsService.findOne(system)` — pokud preset chybí, `diarySchema: []`. To je validní; uživatel doplní schema přes `WorldSettings` později.
   - Helper: „Vybraný systém ovlivní, v jakém uspořádání se budou hráčům a příšerám kreslit deníky v Taktické mapě."
   - **Kostky** (multi-select pill chips, 0–13) — `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100 / procenta`, `2d6`, `3d6`, `Pool d6`, `Pool d10`, `Mixed polyhedral`, `Fate kostky`. Helper: „Zaškrtněte, jaké kostky nebo mechaniky se budou ve světě uplatňovat."

**Footer akce (sticky bottom-bar):**
- `Zrušit` (link/button) → `navigate(-1)` (zpět na předchozí stránku, default `/`).
- `Vytvořit svět` (primary, disabled dokud nejsou všechna `*` vyplněná; loading state během mutation).

**Po `useCreateWorld.mutateAsync` success:**
1. `toast.success("Svět «{name}» byl vytvořen.")` (sonner — pattern z 2.1b).
2. `navigate('/svet/' + newWorld.id)` (worldId, ne slug — konzistentní s 2.1 WorldCard linky).
3. Sidebar/dashboard moje světy se invaliduje (querycache).

**Validace na FE:**
- Name 2–60: error message „Název musí mít 2–60 znaků."
- Slug 2–40, regex: „Slug může obsahovat jen malá písmena, číslice a pomlčky."
- Slug uniqueness: spoléháme na BE response (409 CONFLICT → toast „Slug už existuje, zvol jiný").
- Genre required: „Vyber žánr."
- AccessMode required (radio, default private — vždy validní).
- System required (select, default matrix — vždy validní).

### 4.5 Route + auth gate

- Přidat route v `App.tsx` (nebo router config) — `/ikaros/vytvorit-svet` → `<CreateWorldPage />`.
- Auth-gated: anon uvidí redirect na `/` (s toastem „Pro vytvoření světa se přihlas") **nebo** ProtectedRoute wrapper (zkontrolovat existující pattern v projektu).
- Layout: `IkarosLayout` (header + sidebar + content), žádná specifická layout změna.

### 4.6 Vizuální vrstva — směr „Workshop"

Po design auditu zvolen směr **B (Workshop)**: hustá ale čistá kompozice, two-column desktop, sekce jako karty s pořadovým číslem v rohu, **pill chips** místo klasických checkboxů, sticky footer bez progress dots.

- **Žádné hardcoded barvy.** Reuse skin tokenů: `var(--surface-1)`, `var(--surface-2)`, `var(--frame-border)`, `var(--accent)`, `var(--accent-hover)`, `var(--text-primary)`, `var(--text-muted)`, `var(--input-bg)`, `var(--shadow-md)`, `var(--shadow-lg)`.
- `SectionCard` = obal sekce, `border: 1px solid var(--frame-border)`, `border-radius: 12px`, `padding: 24px`, `background: var(--surface-2)`, `position: relative`. Pořadové číslo `①–⑤` v pravém horním rohu: `font-size: 32px; opacity: 0.25; color: var(--text-muted); position: absolute`.
- Layout sekcí — desktop: `grid-template-columns: 1fr 1fr; gap: 24px`, poslední sekce (Herní systém) full-width (`grid-column: 1 / -1`). Tablet: 1col stack. Mobile: 1col stack, padding sníženo na 20px.
- `PillChips` (komponenta multi-select):
  - Unselected: `border: 1px solid var(--frame-border); background: transparent; padding: 10px 16px; border-radius: 999px; font-size: 14px; color: var(--text-primary); transition: all 0.15s ease`.
  - Hover: `border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent)`.
  - Selected: `border-color: var(--accent); background: var(--accent); color: var(--surface-1); font-weight: 600`.
  - Layout: `display: flex; flex-wrap: wrap; gap: 8px`. Touch target ≥ 44 px na mobilu.
- Access mode chips: stejný styl jako PillChips, ale single-select (radio behavior). Aktivní chip + popis pod ním (`<p>` s `color: var(--text-muted); font-size: 13px; margin-top: 12px`).
- Sticky footer bar = `position: sticky; bottom: 0; background: var(--surface-1); border-top: 1px solid var(--frame-border); padding: 14px 20px; display: flex; justify-content: space-between; gap: 12px; backdrop-filter: blur(8px)`. Submit button disabled při chybě, tooltip „Vyplň: Název, Žánr".
- Stagger reveal load: `.section { opacity: 0; animation: fadeUp 0.4s ease forwards; }` s `animation-delay: 0/80/160/240/320 ms` per sekce. Respekt `prefers-reduced-motion: reduce`.
- Žádné ornamenty / dekorace v komponentě — řeší je skin layer (memory: `feedback_theme_isolation`, `feedback_skin_originality`).
- **Progress dots ve footeru:** vynechány (po diskuzi s autorem — submit-button disabled state + tooltip „Vyplň: X, Y" je dostatečný).

### 4.7 Mobile vs desktop

- Mobile (≤ 768 px):
  - Sekce stack v 1 sloupci.
  - `CheckboxGrid` 1col.
  - Hráči (textarea) + Počet hráčů (number) → 1 sloupec stack místo 2col.
  - Sticky footer bar full-width.
- Tablet (769–1024 px):
  - `CheckboxGrid` 2col.
  - Hráči + Počet 2col.
- Desktop (> 1024 px):
  - `CheckboxGrid` 3col.
  - Hráči + Počet 2col (textarea 2/3, number 1/3).

---

## 5. Out of scope

- **Wizard mode** (multi-step modal/page) — single-page formulář je explicitní volba podle starého systému.
- **Hero obrázek světa** (`imageUrl`) — připravený upload flow zatím neexistuje pro worlds. Přijde s 2.5 (world settings) nebo 2.4 (detail + edit).
- **Editace existujícího světa** — bude 2.5 `WorldSettingsPage`. Stejný formulář s prefillem.
- **Žánr / tón / kostka custom string validation** (max length per chip) — BE drží volný string, FE limituje textfield free-textu na 40 znaků.
- **Quota počtu světů per user** — žádné omezení, ale tracked dluh **D-NEW-quota** pokud spam přijde.
- **Help tooltipy „?" u tónů/kostek** (ze screenshotu) — out of scope, dluh **D-NEW-tooltips**. Nedávají bez slovníku popisků smysl a zdržují MVP.
- **`UpdateWorldDto` doplnění** (tones/playersWanted/dice) — pokud chybí, řešíme s 2.5; pokud DTO existuje a má je, OK.
- **Slug live availability check** (`GET /api/worlds/slug-available?slug=...`) — out of scope. BE vrátí 409 při kolizi → toast.

---

## 6. Acceptance kritéria

### BE
1. `CreateWorldDto` přijímá `tones`, `playersWanted`, `dice` jako optional.
2. `worlds.service.create` po doplnění DTO propaguje pole do DB (test: vytvořit svět s `tones: ['Temný']`, `dice: ['d20']`, `playersWanted: 'foo'` → DB záznam má všechna pole).
3. Existující testy `worlds.service.spec.ts` zůstávají zelené.
4. 1 nový BE test (create s tones/dice/playersWanted).

### FE
5. `/ikaros/vytvorit-svet` renderuje formulář (anon redirect na `/`, logged-in vidí stránku).
6. Validace: chybí název → submit blocked, chybí žánr → submit blocked. Disabled CTA dokud nejsou všechna `*` vyplněná.
7. Slug auto-derive při typování názvu (cs translit), zastaví se po ručním editu slugu.
8. Submit volá `POST /api/worlds` se všemi vyplněnými poli, success → navigate `/svet/:id` + toast.
9. BE chyba 409 (slug kolize) → toast „Slug už existuje, zvol jiný."
10. Žánr „Vlastní" → zobrazí free-text input, hodnota putuje do `genre` jako string.
11. Tón „Vlastní" → free-text input pod gridem, hodnota se přidá do `tones[]`.
12. Tones / dice multi-select toggle funguje (klik checkbox = add/remove ze stavu).
13. Access mode radio chips: default `private`, popis pod chipy se mění podle volby.
14. Mobile (≤ 768 px): 1col grid, sticky footer full-width.
15. Žádný hardcoded barevný literál (`lint:colors` ✓).
16. Sidebar/dashboard CTA „Vytvořit svět" funkční (link už existuje).

### Build / lint / test
17. `lint`, `lint:colors`, `tsc`, `build`, `test:run` ✓.
18. FE +~10 nových testů (CreateWorldPage 3, useWorldSlug 4, CheckboxGrid 2, BasicInfoSection 1).
19. BE +1 test (create s tones/dice).

---

## 7. Test plán

### BE
- Unit `worlds.service.create` s `tones: ['Temný','Hrdinský']`, `dice: ['d20','d6']`, `playersWanted: 'aktivní hráče'` → DB má všechna pole.

### FE
- `useWorldSlug` unit (4): translit „Šedý hrad" → „sedy-hrad"; mezery → `-`; specialty stripped; dirty flag respektuje.
- `CheckboxGrid` (2): toggle on/off, controlled value.
- `CreateWorldPage` integrace (3):
  - Vyplnění minima (název + žánr + access) → mutation volaná s defaulty.
  - Slug auto-derive při typu názvu, manuální slug edit zastaví derivaci.
  - Success → navigate volaný s `/svet/{id}`.
- `BasicInfoSection` (1): error message při krátkém názvu.
- Smoke: dashboard empty state „Vytvořit svět" → CreateWorldPage → submit → `/svet/:id`.

---

## 8. Riziko & rollback

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| BE DTO whitelist drop polí | Střední | Střední | Přidat `tones`/`playersWanted`/`dice` před FE; integration test po implementaci. |
| Slug kolize bez live check | Střední | Nízká | 409 toast, uživatel přejmenuje. Live check = dluh **D-NEW-slug-check**. |
| Existující data v DB bez `tones`/`dice` | Nízká | Žádný | Optional pole, default `[]`. |
| Uživatel zaškrtá Tón „Vlastní" bez vyplnění textu | Nízká | Nízká | Klient: pokud free-text prázdný, „Vlastní" se nepřidá do `tones[]`. |
| Anon přístup na `/ikaros/vytvorit-svet` | Nízká | Nízká | ProtectedRoute / explicit redirect na `/` s toastem. |

**Rollback:** Revert commitů. BE DTO doplnění je aditivní, neporuší existující API klienty.

---

## 9. Otázky k autorovi

Žádné — autor delegoval rozhodnutí. Klíčové volby z PJ screenshotů + projektových konvencí:

- **Single-page formulář**, ne wizard. (Důvod: starý systém, méně klikání, validace inline.)
- **8 sekcí ze screenshotu** sloučeno do **5** logických bloků (Základní / Žánr+Tóny / Hráči+Kapacita / Access / Systém+Kostky).
- **AccessMode** přidán nad screenshot — roadmap to požaduje, screenshot to neměl.
- **Slug** přidán nad screenshot — povinné pro URL, auto-derive z názvu.
- **System dropdown** = momentálně 1 položka, ale strukturovaná konstanta = budoucí rozšíření zdarma.
- **Tooltipy `?`** vynechány — chybí slovník popisků; tracked dluh.
- **Hero image** vynechán — chybí upload flow pro worlds; pokrytí 2.5.
- **Help tooltipy „?" u tónů/kostek** (ze screenshotu) — out of scope, dluh.

---

## 10. Mimo rozsah (samostatné fáze / kroky)

- 2.4 Detail světa + join flow
- 2.5 World settings (edit existujícího světa, hero image upload)
- 9.2 Cross-world kalendář
- D-NEW-quota (limit počtu světů per user)
- D-NEW-tooltips (slovník popisků tónů a kostek)
- D-NEW-slug-check (live availability check endpoint)
