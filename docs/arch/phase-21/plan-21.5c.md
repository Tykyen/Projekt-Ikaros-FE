# Impl. plán 21.5c — Kouzla (komunitní katalog)

> Spec: [spec-21.5c-kouzla.md](spec-21.5c-kouzla.md). Schváleno uživatelem 2026-07-13 („budu ti věřit, dej se do toho" + „schvalovaná kouzla a kouzla přijmutá jako balancnutá" = dvě knihovny + per-statblok schvalování jako bestiář).

## Model

- **BE modul `spells`** = kostra `plants` (community-only, žádný world/user scope) + **statblocky a dvouúrovňová diskuse z `bestiae`** (propose/approve statblock, komentáře `spell` / `statblock`).
- Statblok NEvaliduje SystemStatsValidator (kouzla nemají entity-schema) — `systemStats: Record<string, unknown>`, šablony vynucuje FE formulář (spec R6).
- Kurátorství: reuse `isBestieCurator` (`curator-roles.ts`) — stejná množina rolí jako bestiář/herbář.
- Bez klonu/vkladu do obchodu, bez WS gateway (MVP, spec §7).

## BE (Projekt-ikaros/backend) — pořadí

1. `modules/spells/` — interface + schema (`spells`, `spell_comments`), DTOs (create-community-spell, update-spell-lore, propose-statblock, create-spell-comment), repository (plants repo + `setStatblock`/`setStatblockStatus`), service (plants service + propose/approveStatblock/approveSpell z bestiae), comments service, controller (`spells/community/*`).
2. Pending fronta: `PendingActionType.CommunitySpellPendingReview` + `CommunitySpellReviewProvider` (vzor plant).
3. Moderace 20B: `ReportTargetType.Spell` + `SpellsModerationEnforcementListener` (M2/M3 hide, M4 hard delete).
4. `app.module.ts` — `SpellsModule`.
5. Ověření: typecheck + lint:check (+ cílené testy).

## FE (Projekt-ikaros-FE) — pořadí (po BE)

1. `features/ikaros/kouzla/systems/spellTemplates.ts` — **jádro: šablony polí per systém** (spec §5): pevné šablony (drd16/drdplus/dnd5e/jad/drdh/coc/gurps/shadowrun/matrix) + volná šablona (drd2/pi/fate/fae/generic = škola + páry popisek:hodnota). Typy polí: text / textarea / select / multiselect / checkbox / škola-combobox (nabídka+vlastní).
2. `types.ts` + `api/kouzlaApi.ts` + hooky (vzor herbar/bestiar).
3. Stránky: `KomunitniKouzlaPage` (2 knihovny + filtry systém/škola/tag), `KomunitniKouzloDetailPage` (karta: obrázek+oznámení, statblok taby per systém se stavem draft/approved, návrh statbloku, diskuse 2 úrovně), `SpellEditorModal` (jádro + statblok dle šablony).
4. Router (nahradit stub `/ikaros/kouzla`, + `/ikaros/kouzla/:id`), `tiles.ts` active, `shared/moderation/enums.ts` + Spell, regenerace `errorCodes.generated.ts` (`node scripts/error-contract-scan.mjs --emit`).
5. Ověření: `npm run build` + vitest + eslint + `mobil-desktop` (375/768/1440).
6. Skilly: `funkce` + `napoveda`.

## Poznámky

- BE a FE oddělené dávky (fb_no_mixed_batch); po BE nutný restart BE serveru (fb_be_restart).
- Commit dělá uživatel ručně (fb_git_manual).
- Skiny katalogu = odloženo; stabilní data-atributy od začátku.
