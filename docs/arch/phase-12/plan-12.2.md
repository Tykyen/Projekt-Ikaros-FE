# Plán 12.2 — Headline / menu builder

Spec: `spec-12.2.md` ✅ schváleno 2026-06-03.

Pořadí respektuje: BE první (restart), BE+FE nikdy v jedné paralelní dávce.

## Fáze A — BE pole `lastInfo` (+ restart)
1. `world-settings.schema.ts` → `lastInfo` subdoc `{ text, updatedAt, visible }`, default null.
2. `world-settings.interface.ts` → `LastInfo` + `WorldSettings.lastInfo`.
3. `update-world-settings.dto.ts` → `LastInfoDto` (`text @MaxLength(280)`, `visible @IsBoolean`), zařadit do `UpdateWorldSettingsDto`.
4. `worlds.service.ts` → při změně textu doplnit `updatedAt` v `sanitizeUpdateSettingsDto`.
5. **Restart BE** (nest --watch / manuální).

## Fáze B — FE typy
6. `src/shared/types` → `HeadlineNode`, `MenuTemplateItem`, `MenuTemplate`, `LastInfo`; rozšířit `WorldSettings`.
7. `useUpdateWorldSettings.ts` → `UpdateWorldSettingsInput` += `customHeadline`, `menuTemplates`, `lastInfo`.

## Fáze C — Stránka admin/headline
8. `router.tsx` → route `admin/headline` (PJ guard) + lazy import.
9. `WorldHeadlineAdminPage/` — kontejner (dirty-tracking, jediné Uložit), CSS module.
10. Sekce komponenty:
    - `NavVisibilitySection` (reuse logika z NavVisibilityTab).
    - `CustomHeadlineBuilder` (tree: add group/link, rename, delete, ↑/↓, nest).
    - `MenuTemplatesSection` (CRUD + Vložit do navigace).
    - `LastInfoSection` (textarea + visible toggle).
    - `HeadlinePreview` (živý náhled lišty).
11. Page link autocomplete — reuse page directory hook.

## Fáze D — Render ve WorldLayout
12. `worldNavConfig.ts` (nebo nový lib) → `headlineToNavGroups(customHeadline)`.
13. `WorldLayout.tsx` → připojit za `filterNavByHidden` (desktop nav + drawer).
14. `LastInfoBar` komponenta + zapojení pod `<header>`; localStorage dismiss.

## Fáze E — Konsolidace
15. `NavVisibilityTab` → nahradit odkazem na `/svet/:slug/admin/headline` (zachovat tab, obsah = redirect/CTA).

## Fáze F — Testy
16. BE unit: lastInfo set/clear, role gate.
17. FE: `headlineToNavGroups`, tree ops, LastInfoBar dismiss, dirty save.

## Fáze G — Audity
18. `mobil-desktop`, `napoveda`, zaškrtnout roadmapu, vitest + lint + build.
