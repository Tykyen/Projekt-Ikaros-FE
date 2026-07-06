# Spec 17.7 — Rodokmeny (vizuální strom rodiny)

**Stav:** návrh ke schválení · **Priorita:** C2 (volitelné) · **Náklad:** střední (FE+BE)

## Cíl
Nový typ wiki stránky **`Rodokmen`** = interaktivní **strom rodiny**: osoby s fotkou/jménem/datem, vztahy manželé + rodiče→děti, pan/zoom, klik na osobu → přeskok na její stránku. Vzhled se řídí **motivem světa** (12 motivů), stejně jako deník/chat/mapa.

## Rozhodnutí (odchylka od roadmapy)
Roadmap 17.7 navrhoval „speciální pohled nad `CampaignRelationship` (Pavučina)". **Zvoleno místo toho: samostatná featura s vlastními daty** (varianta A).
- **Proč:** rodokmen běžně obsahuje **předky/příbuzné, kteří nemají vlastní stránku** (jen jméno+foto+datum). Vázat každý uzel na existující entitu Pavučiny by to znemožnilo.
- **Osoba = volná data** (jméno, druhý řádek, narození, úmrtí, foto) **+ volitelný odkaz na stránku** postavy (`pageSlug`). Když je vyplněný → klik naviguje; když ne → jen zobrazení.
- Pavučina (`CampaignRelationship`) zůstává nedotčená; rodokmen ji needituje ani z ní nečte.

## Datový model
Nové volitelné pole na `Page` (zrcadlo FE↔BE, viz `theme_ids_dual` pattern):

```ts
interface FamilyPerson {
  id: string;            // stabilní klientské id (nanoid)
  name: string;          // křestní / hlavní jméno
  sub?: string;          // druhý řádek (příjmení / přezdívka / „roz. …")
  born?: string;         // volný text: „1502" i „3. 4. 1502"
  died?: string;         // volný text; prázdné = žije
  imageUrl?: string;     // foto (nahrané); fallback = iniciály na barvě
  color?: string;        // fallback barva medailonu bez fota
  pageSlug?: string;     // odkaz na stránku postavy (klik → navigace)
  x: number; y: number;  // pozice uzlu na plátně (uložená)
}
interface FamilyUnion {
  id: string;
  aId: string;           // první partner
  bId?: string;          // druhý partner; prázdné = samoživitel / nemanželské
  childIds: string[];    // potomci tohoto svazku
}
interface FamilyTree { people: FamilyPerson[]; unions: FamilyUnion[]; }
// Page.familyTree?: FamilyTree   (undefined pro ostatní typy)
```

**Vztahy pokryté modelem:** manželství (union a+b), rodiče→děti (union.children), více dětí, **rozvod/druhý sňatek** (táž osoba ve více unions), **nemanželské/samoživitel** (union s `bId` prázdné). Neřeší v1: adopce jako zvláštní typ hrany, více-partnerské skupiny nad rámec dvojice.

## Kolize s legacy typem „Rodokmen" (⚠️ důležité)
Starý typ „Rodokmen" (velký zoom obrázek) byl v 7.x přejmenován na „Zoom" a `normalizePageType('Rodokmen') → 'Zoom'` mapuje legacy DB dokumenty při čtení. Nový typ „Rodokmen" (strom rodiny) má **stejný název** → v DB by obojí bylo `type:'Rodokmen'`, nerozlišitelné podle stringu.

**Řešení bez DB migrace — rozliš podle pole `familyTree`:**
- `normalizePageType(type, hasFamilyTree)`: `type==='Rodokmen' && !hasFamilyTree → 'Zoom'` (legacy velký obrázek), jinak ponech.
- Všechny 3 BE mappery (toEntity, directory, backlinks) projektují existenci `familyTree` a volají `normalizePageType(doc.type, !!doc.familyTree)`.
- **Nový Rodokmen se vytvoří vždy s `familyTree` objektem** (i prázdným `{people:[],unions:[]}`), aby rozlišení fungovalo od začátku.
- FE `resolvePageTypeFromUrl` — **odebrat** legacy redirect `Rodokmen→Zoom` (Rodokmen je zas platný typ).

## BE změny
- `page.interface.ts` — `FamilyPerson/Union/Tree` typy + `familyTree?` na `Page`; přidat `Rodokmen: 'Rodokmen'` do `PAGE_TYPES`.
- `page.schema.ts` — nested schema `familyTree` (Mongoose).
- `create-page.dto.ts` — validace (nested `@ValidateNested` + `@Type`); `type` už projde přes `@IsIn(PAGE_TYPES)`.
- `pages.repository.ts` `toEntity` — whitelist `familyTree` (jinak se tiše zahodí).
- Restart BE nutný (viz `fb_be_restart`).

## FE změny
- `pages.types.ts` — typy + `Page.familyTree` + `Rodokmen` do `PAGE_TYPES`/enumu.
- `pageTypeMeta.tsx` — ikona pro `Rodokmen` (`Network` — uvolnila se po přejmenování na Zoom).
- `PageViewer.tsx` — `LAYOUTS.Rodokmen = FamilyTreeLayout`.
- **`FamilyTreeLayout`** (view) — render stromu na `--theme-*` tokenech (motiv světa): medailony, ortogonální spojnice (kreslené měřením DOM), pan/zoom (vzor `ZoomableImage`), klik na osobu s `pageSlug` → `navigate`. Prázdný strom → `EmptyState` (+ PJ shortcut do editoru).
- **`FamilyTreeEditor`** (v `PageEditor`, jen typ Rodokmen) — přepínač Náhled/Úpravy; klik na osobu → panel (jméno, druhý řádek, narození, úmrtí, foto přes `HeroUploadCard` vzor, odkaz na stránku přes `LinkPickerPopover` — viz `link_picker`); tlačítka `+ Partner / + Dítě / + Rodič`, smazat; drag uzlů (uložené x,y); „+ Přidat první osobu" pro prázdný strom.
- Vzhled = **motiv světa** přes token kontrakt (kostra společná, skin per motiv) — dle HTML návrhu `c:\tmp\rodokmen-navrh.html`.

## Rozmístění uzlů
**Ruční drag** (uložené `x,y`) + tlačítko **„Srovnat" = plnohodnotný auto-layout** (schváleno i za cenu náročného kódu). Auto-layout: generační řady (y dle hloubky), manželé vedle sebe jako blok, potomci vycentrovaní pod svazkem, subtree-šířkové balení bez překryvů (Reingold-Tilford rozšířený o manželské bloky), minimalizace křížení. Vlastní kód, bez knihovny (bundle). Nový uzel z „+ Dítě/Partner/Rodič" se umístí relativně k rodiči; „Srovnat" srovná celý strom.

## Přístup / role
Editace jen `PomocnyPJ+` (jako ostatní stránky, `canEdit`). Čtení dle `accessRequirements` stránky (AKJ/role). `pageSlug` odkazy respektují běžný přístup cílové stránky (klik na skrytou → cíl si vyřeší gate).

## Dokumentace po implementaci
`funkce` (nový typ stránky Rodokmen), `napoveda` (jak hráč čte / PJ tvoří), roadmap 17.7 → hotovo, glossary `typ-stranky`.

## Nezahrnuto v1
Auto-layout jako default, GEDCOM import/export, adopční/nevlastní hrany se zvláštním stylem, sdílení uzlu mezi více rodokmeny, časová osa životů.
