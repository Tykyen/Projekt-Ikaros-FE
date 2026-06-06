# Spec — Znak skupiny (emblém) + propsání do ikony chat kanálu

**Fáze:** 12.3 navazující · **Datum:** 2026-06-06 · **Stav:** schváleno (PJ „tak to naprogramuj")

## Cíl
Skupina členů světa (`customGroups`) může mít **znak** (obrázek). Stejný znak je **ikonou jejího chat kanálu** (linkovaného `ChatGroup`). PJ nahraje znak jednou, zobrazí se na stránce skupiny i v chatu. Lze odebrat.

## Kontext (stávající stav)
- Skupina členů = `WorldSettings.customGroups` (názvy) + `groupColors` (název→barva). **Obrázek nemá.**
- Chat kanál = `ChatGroup`; má `imageUrl` (renderuje jako ikonu), `color`, `iconKey` a **`linkedWorldGroup`** (název skupiny členů).
- BE automaticky zakládá pro každou `customGroups` skupinu linkovaný `ChatGroup` (`createWorldGroupChannel`, `linkedWorldGroup === název`) + privátní konverzaci; členy drží v sync (`syncLinkedChannelMembers`).

## Datový model (single source of truth)
`WorldSettings.groupImages: Record<groupName, url>` — znak per skupina, paralelně k `groupColors`. **Jediný zdroj pravdy.**
- BE: `world-settings.schema.ts` (`@Prop type Object default {}`), `world-settings.interface.ts`, `update-world-settings.dto.ts` (`@IsOptional @IsObject`), `world-settings.repository.ts` toEntity mapper. (field-drift checklist.)
- FE: `WorldSettings.groupImages?: Record<string,string>` v `shared/types`.

## Propsání znaku → ikona kanálu (read-time enrich)
V `chat.service.getGroupsWithChannels`: načti `settings.groupImages` (worldsService už injektovaný). Pro každou skupinu s `linkedWorldGroup` přepiš `imageUrl = groupImages[linkedWorldGroup] ?? group.imageUrl`.
- **Proč enrich a ne sync:** žádné eventy, žádná duplikace, žádný stale. Znak **vždy vyhraje** pro linkovaný kanál (override případně ručně nastavené chat ikony — přesně záměr).
- Chat UI **beze změny** — `ChannelGroup` už `imageUrl` kreslí.
- Omezení: změna znaku se v otevřeném chatu projeví až při refetchi groups (přijatelné, znak se mění zřídka).

## UI
- **GroupColorEditor** (Nastavení → Členové): per řádek skupiny vedle barvy **náhled znaku + nahrát/odebrat** (`useUploadImage`). Save posílá `customGroups` + `groupColors` + `groupImages` (mapy rebuildnuté z řádků → smazaná skupina ztratí i znak).
- **GroupMembersPage** (hlavička): místo generické ikony `Users` vykreslit **znak** (kruhový, prsten v barvě skupiny). Bez znaku → fallback `Users`. **Var. B:** PJ vidí v hlavičce rychlé tlačítko nahrát/změnit znak (PATCH jen `groupImages` mapy merge).

### Design (frontend-design audit)
Znak = **kruhový erb** s prstencem v barvě skupiny (`groupColors[name]`), velikost ~40px v hlavičce, ~32px případně jinde. Fallback (bez znaku): `Users` ikona v ztlumeném kruhu. PJ hover → overlay „změnit". Žádný generický čtverec — kruh + accent ring drží identitu skupiny (barva + znak spolu).

## Role / přístup
- Upload/změna znaku = PJ (`updateSettings` → `canAdminWorld`). Členové znak jen vidí.
- `Nezařazení` (`__none__`) není `customGroups` → nemá kanál ani znak.

## Edge cases
- Skupina bez znaku: stránka i kanál fallbackují (Users / původní chat ikona).
- Smazaná skupina: groupImages rebuild ji vypustí.
- Smazaný obrázek (url 404): prohlížeč ukáže rozbitý/fallback — neřešíme zvlášť.

## Workflow
Brainstorm (chat) → tato spec → impl → kód. Po implementaci: `mobil-desktop` (hlavička skupiny + editor), `napoveda` (skupiny mají znak = ikona kanálu).
