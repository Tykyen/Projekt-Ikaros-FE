# Spec — Hlavní obrázek stránky/postavy: focal + zoom + fit (parita s akcemi)

**Status:** ✅ HOTOVO (2026-06-05) — schváleno PJ, plný rozsah vč. karet adresáře
**Datum:** 2026-06-05
**Velikost:** M (BE drobné rozšíření + FE editor + render místa)
**Návaznost:** 9.1 game events / 9.5 world-news-parity — sjednotit ovládání hero obrázku

---

## 1 — Cíl

User: „obrázek u postavy je čtvercovej, asi by chtělo, aby se dalo nastavit co je vidět stejně jako u akcí."

Hlavní obrázek stránky (`Page`, vč. typů Postava hráče / NPC) se dnes jen natvrdo ořízne
(`object-fit: cover`) → vypadá uřízle. Akce (`GameEvent`) už mají focal point + zoom + fit
a sdílený `getImageStyle()`. Přenést stejné ovládání na `Page` hero — editor i render.

**Rozhodnuto (PJ):**
- Plná parita = **focal + zoom + fit** (ne jen focal).
- Schopnost na úrovni **celého Page modelu** (všechny typy stránek, ne jen postava).
- Focal se promítne i do **malých karet v adresáři postav** (`CharacterCard`) → nutné
  rozšířit lehký `PageDirectoryEntry` + BE directory projekci.

---

## 2 — BE rozšíření

Module: `backend/src/modules/pages/`

### 2.1 — `Page` schema + interface
```ts
// schemas/page.schema.ts  (paralela s game-event.schema.ts)
@Prop({ default: null, type: Number }) imageFocalX: number | null;   // 0–100
@Prop({ default: null, type: Number }) imageFocalY: number | null;   // 0–100
@Prop({ default: null, type: Number }) imageZoom: number | null;     // 100–400 %
@Prop({ default: null, type: String, enum: ['cover', 'contain', null] })
imageFit: 'cover' | 'contain' | null;
```
`interfaces/page.interface.ts` — přidat stejná 4 pole (`number | null`, resp. union).

### 2.2 — DTO
`create-page.dto.ts` (kopie z `create-game-event.dto.ts`):
```ts
@IsOptional() @IsNumber() @Min(0)   @Max(100) imageFocalX?: number;
@IsOptional() @IsNumber() @Min(0)   @Max(100) imageFocalY?: number;
@IsOptional() @IsNumber() @Min(100) @Max(400) imageZoom?: number;
@IsOptional() @IsIn(['cover', 'contain'])      imageFit?: 'cover' | 'contain';
```
`update-page.dto.ts` — dědí přes `PartialType`; nullable clear přes `ValidateIf` (paralela
s `update-game-event.dto.ts`), aby šel focal/zoom/fit vynulovat při odebrání obrázku.

### 2.3 — Repository
⚠️ `pages.repository.ts` `toEntity()` je **explicit whitelist mapper** — přidat 4 řádky
extrakce, jinak schema/zápis projde, ale GET focal zahodí (viz [[project_be_field_checklist]]).

### 2.4 — Directory projekce
`GET /worlds/:worldId/pages/directory` (lehký `PageDirectoryEntry`) musí vracet i
`imageFocalX/Y/imageZoom/imageFit` (dnes vrací jen `imageUrl`). Najít projekci/mapper
directory v `pages.repository.ts` / service a doplnit 4 pole.

### 2.5 — Testy (BE)
- DTO accept focal 0/50/100, zoom 100/400, fit cover/contain; reject focal -1/101, zoom 99/401.
- Repo round-trip 4 polí (toEntity).
- Directory projekce vrací focal/zoom/fit.

---

## 3 — FE typy

`src/features/world/pages/api/pages.types.ts`:
```ts
export interface Page {
  // ...
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
}
export interface PageDirectoryEntry {
  // ...
  imageUrl?: string;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  imageZoom?: number | null;
  imageFit?: 'cover' | 'contain' | null;
}
```

---

## 4 — Editor

### 4.1 — `HeroUploadCard` — volitelné focal/zoom/fit
Rozšířit o **volitelné** props (zpětně kompatibilní — bez nich se chová jak dnes):
```ts
interface Props {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
  // NEW — když chybí, focal UI se nerenderuje (AKJ tab override beze změny):
  focal?: { x: number; y: number };
  onFocalChange?: (f: { x: number; y: number }) => void;
  zoom?: number | null;
  onZoomChange?: (z: number | null) => void;
  fit?: ImageFit | null;
  onFitChange?: (f: ImageFit) => void;
}
```
Když je `onFocalChange` předán **a** je `value` (obrázek):
- na preview `<img>` aplikovat `getImageStyle(focal.x, focal.y, zoom, fit)`
- překrýt focal overlay `<button>` (klik → přepočet x/y %, clamp 0–100) + marker
  (reuse pattern z [`GameEventModal.tsx:253-303`](src/features/world/components/GameEventModal/GameEventModal.tsx#L253-L303))
- pod kartou `<ImageFitToggle>` + `<ImageZoomSlider>`
- hint „Klikni na obrázek tam, kde má být střed výřezu."

### 4.2 — `IdentityPanel` — drát stav
Parent `PageEditor` drží `imageFocalX/Y/imageZoom/imageFit` ve form stavu (jako game-event
modal). `IdentityPanel` rozšířit `onChange` patch typ o ta pole a předat je do
`HeroUploadCard`. Při odebrání obrázku (`imageUrl=''`) focal/zoom/fit vynulovat (null).

⚠️ `AkjTabsPanel` používá `HeroUploadCard` bez focal props → **beze změny** (AKJ tab
override zůstává jen URL; focal mimo rozsah).

---

## 5 — Render místa (přes `getImageStyle`)

Nahradit syrové `<img>` (object-fit z CSS) za `style={getImageStyle(p.imageFocalX, p.imageFocalY, p.imageZoom, p.imageFit)}`:

| Místo | Soubor | Pozn. |
|---|---|---|
| Avatar postavy (**primární — ten čtverec**) | `PostavaLayout.tsx` (PostavaHero ~300) | hlavní cíl |
| Velký hero (bigImage) | `OstatniLayout.tsx` (~33) | |
| Malý hero v sidebaru | `PageSidebar.tsx` (~49) | |
| Full hero novinky | `NovinyLayout.tsx` (~41) | |
| Karta v adresáři | `CharactersPage/components/CharacterCard.tsx` (~62) | z `PageDirectoryEntry` |

CSS u těchto `<img>`: ponechat rozměr/aspekt kontejneru; `object-fit`/`object-position`
nově řídí inline style z `getImageStyle` (odstranit konfliktní `object-fit` z CSS, ať
nepřebíjí inline `contain`).

---

## 6 — Permission (žádná změna)
Focal/zoom/fit edituje ten, kdo smí editovat stránku (PJ+ / owner / Admin) — beze změny.
Čtení (render) jako dnes.

---

## 7 — Acceptance criteria
1. BE `Page` schema má `imageFocalX/Y/imageZoom/imageFit` optional/nullable.
2. DTO validuje focal 0–100, zoom 100–400, fit cover/contain; update umí null-clear.
3. `toEntity` i directory projekce vrací 4 pole (GET je nezahazuje).
4. Editor: klik na preview nastaví střed výřezu; zoom slider 100–400 %; fit toggle cover/contain.
5. Odebrání obrázku vynuluje focal/zoom/fit.
6. Detail postavy (`PostavaLayout`) respektuje focal/zoom/fit — obrázek už není uříznutý.
7. Velký hero / sidebar / noviny respektují focal/zoom/fit.
8. Karta v adresáři postav respektuje focal (z directory entry).
9. AKJ tab override (`HeroUploadCard` bez focal props) se chová jak dřív.
10. Legacy stránky bez focal (null) → default focal 50/50, zoom 100, fit cover (getImageStyle).
11. FE testy: HeroUploadCard focal (klik mění x/y, render bez focal props beze změny);
    CharacterCard s focal stylem. BE testy dle §2.5.
12. `mobil-desktop` audit dotčených render míst + editoru.
13. `napoveda` — pokud stránka zmiňuje hlavní obrázek, doplnit focal/zoom/fit.

---

## 8 — Mimo rozsah
- Focal pro AKJ tab `contentOverride.imageUrl`.
- Focal pro galerii (`galleryImages`) a tabulkové obrázky.
- Migrace existujících dat (default null → getImageStyle fallback to řeší).
- Per-render-místo odlišný focal (focal je jeden, sdílený přes všechna místa).

---

## 9 — Reference
- Vzor parity: [`spec-9.5-world-news-parity.md`](../phase-9/spec-9.5-world-news-parity.md)
- Util: [`getImageStyle`](src/shared/lib/imageStyle.ts)
- Sdílené UI: [`ImageZoomSlider`](src/shared/ui/ImageZoomSlider/ImageZoomSlider.tsx), [`ImageFitToggle`](src/shared/ui/ImageFitToggle/ImageFitToggle.tsx)
- Vzor editoru: [`GameEventModal.tsx`](src/features/world/components/GameEventModal/GameEventModal.tsx)
- Vzor karty: [`GameEventCard.tsx`](src/features/world/components/GameEventCard/GameEventCard.tsx)
- BE vzor: `backend/src/modules/game-events/` (schema/dto/repository)
