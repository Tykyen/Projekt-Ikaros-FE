# Plán 22.5 — Sdílení & klonování scén

**Spec:** [spec-22.5-sdileni-klonovani-scen.md](spec-22.5-sdileni-klonovani-scen.md) · **Stav:** ✅ OBĚ DÁVKY HOTOVÉ 2026-07-15 — A (BE) commitnuto+nasazeno (e7f1cca): typecheck+lint+unit 241+e2e 7/7+smoke · B (FE): build (tsc -b)+eslint+vitest; katalog `/ikaros/sceny`, publish z knihovny map, klon modal, kurátorská fronta v Zpracovat tabu. FE čeká commit+deploy+živé ověření.
**Pořadí dávek:** A (BE) → B (FE) — nemíchat.
**Odchylky od plánu (implementační, zvoleno při impl.):** route `/ikaros/sceny` (ne `/tvorba/sceny` — konzistence s 8 knihovnami); klon filtr světů `>= PJ` (BE `POST /maps` vyžaduje PJ, ne PomocnyPJ); `cloneAllowed` FE odchytí 403 (katalog mapper ho nevrací — drobný follow-up); ReportButton bez `targetAuthorId` (katalog nevystavuje ownerId; BE self-report blokuje stejně); kurátorská fronta = Zpracovat tab (Cesta A — katalog listuje jen approved, bez fronty by kurátor pending neviděl).

**Zpřesnění z přípravy plánu (ověřeno v kódu):**
- Šablona scény (`mapTemplates`) = per-PJ privátní, cross-world, PC tokeny strippnuté při save (`filterOutPcTokens`, `map-templates.controller.ts:41`). Publikace = rozšíření téhož dokumentu, ne nová kolekce.
- Instancování do světa už existuje: `maps.service.create({templateId})` (`maps.service.ts:185-198`) seeduje novou scénu z šablony, PC nenese. Klon z katalogu jen rozšiřuje, odkud se smí instancovat.
- `activeSoundIds` → strip při publikaci (OO1). Žádné GM poznámky v šabloně (OO2).

---

## Dávka A — BE (`Projekt-ikaros/backend`)

### A1. Publikační pole na `mapTemplates`
- `schemas/map-template.schema.ts` — přidat: `published: boolean` (default false), `publishedAt?: Date`, `authorId?: string` (snapshot ownerId při publikaci), `publicAuthorName?: string`, `reviewStatus?: 'pending'|'approved'|'rejected'`, `moderationHidden?: boolean` + `moderationHiddenReason?: string`, `licenseId?: string`, `clonedFromTemplateId?: string`.
- Field-checklist: schema → `interfaces/map-template.interface.ts` → `dto/create-map-template.dto.ts` (publikační pole NEjsou v create DTO — nastavuje je jen publish endpoint, ne uživatel) → toEntity mapper v `map-templates.repository.ts`.
- Index: `{ published: 1, reviewStatus: 1, moderationHidden: 1 }` pro katalogový list.

### A2. Publish / unpublish + licence + strip zvuků
- `POST /map-templates/:id/publish` (JwtAuthGuard, owner-only): validace (má imageUrl+config); **strip `activeSoundIds=[]`** (OO1); snapshot `publicAuthorName` z profilu autora; `content_licenses.create` (mode z body: default `clone`, `attributionRequired`, `aiOrigin`, `parentContentId` = `clonedFromTemplateId` licence pokud klon-klonu) → `licenseId`; `published=true`, `reviewStatus='pending'`, `authorId=ownerId`, `publishedAt`; registrovat pending-action.
- `POST /map-templates/:id/unpublish` (owner): `published=false`; `content_licenses.changeMode(→withdrawn)`. Existující klony (scény ve světech) beze změny.
- DTO `publish-template.dto.ts` (licenceMode, attributionRequired, aiOrigin, description?).

### A3. Veřejný katalog (login-required)
- `GET /map-templates/catalog` (JwtAuthGuard): `published ∧ reviewStatus='approved' ∧ moderationHidden≠true`; volitelně filtr `?systemId`. **Whitelist mapper** `toCatalogEntry` — bez owner-privátních polí (bez raw ownerId; jen `publicAuthorName`, náhled, systém, počty).
- `GET /map-templates/catalog/:id` — detail (tentýž filtr; skrytá/neschválená → 404).

### A4. Klon z katalogu → nová scéna
- Rozšířit `maps.service.create` cestu s `templateId`: pokud je šablona `published`, dovolit instancovat i **cizí** šablonu (dnes FE dává jen vlastní; service `findById` už owner nekontroluje — přidat explicitní bránu: vlastní NEBO `published ∧ approved ∧ ¬hidden`). Brána **`cloneAllowed`** z licence (`content_licenses.getLatest(licenseId)`) → jinak 403 `TEMPLATE_CLONE_FORBIDDEN`. Zápis `clonedFromTemplateId` na novou scénu. Cílový svět: `assertCanManage` (PomocnyPJ+) — už drží route `POST /worlds/:worldId/maps`.
- PC-strip netřeba (šablona PC nemá); přesto e2e pojistka.

### A5. Moderace — nová plocha
- `moderation/enums/moderation.enums.ts` — `ReportTargetType.scene_template = 'scene_template'`.
- Nový `maps/scene-template-moderation.listener.ts` — `@OnEvent('moderation.enforce'|'moderation.revert')` → `moderationSetHidden`/`Remove`/`Restore` na `mapTemplates` (vzor `bestiae/moderation-enforcement.listener.ts`; idempotentní, bez role brány).
- Skrytá šablona: z katalogu i klonu ven (A3/A4 filtr `moderationHidden≠true` + klon brána).

### A6. Kurátorský tok (draft → approved)
- `pending-actions/pending-action-type.enum.ts` — `CommunitySceneTemplatePendingReview = 'community_scene_template_pending_review'`.
- Nový `maps/scene-template-review.provider.ts` (vzor `bestiae/community-bestie-review.provider.ts`): fronta = `published ∧ reviewStatus='pending'`, gate `isBestieCurator`, registrace v modulu `onModuleInit`.
- `POST /map-templates/:id/approve` + `/reject` (isBestieCurator) → `reviewStatus`; approve zpřístupní v katalogu.

### A7. e2e leak-pojistky (`test/scene-template-share.e2e-spec.ts`)
1. publish → licenční karta vznikne + pending-action; katalog šablonu NEukáže (pending).
2. approve → katalog ukáže; klon do světa (PomocnyPJ+) vytvoří scénu **bez PC tokenů** (invariant: publikuj scénu s PC tokenem → klon PC nemá).
3. `activeSoundIds` po publikaci `[]`.
4. `cloneAllowed=false` → klon 403; hráč/nečlen cílového světa → 403.
5. moderationHidden → z katalogu i klonu ven; skrytou vidí jen reviewer.
6. unpublish → existující klon beze změny; katalog ho nemá.
7. cizí owner nesmí publish/unpublish/approve cizí šablonu (403); approve jen kurátor.

**Hotovo A =** typecheck + lint:check (hook) + jest ručně (`--maxWorkers=2`); restart BE; uživatel commitne.

---

## Dávka B — FE (`Projekt-ikaros-FE`)

### B1. Typy
- `mapTemplates` FE typ + publikační pole; katalogový DTO (jen co katalog čte); minimální `content_licenses` typ (mode/cloneAllowed/attribution/aiOrigin).

### B2. Publikace z knihovny scén
- V UI knihovny šablon (taktická mapa — komponenta správy `mapTemplates`) přidat u vlastní šablony: „Publikovat do katalogu" + stav (badge draft/čeká/schváleno/skryto) + „Stáhnout z katalogu".
- `PublishTemplateModal` — licence (`licenseMode` výběr, „vyžadovat uvedení autora", AI původ `aiOrigin`, krátký popis). Vzor licenčních polí z 20D.

### B3. Katalog scén (Společná tvorba)
- Hub `/ikaros/tvorba` — přidat dlaždici „Scény" (mřížka; vzor ostatních knihoven).
- Route `/ikaros/tvorba/sceny` (list) + `/ikaros/tvorba/sceny/:id` (detail) — vzor `KomunitniBestiarPage`/`KomunitniBestieDetailPage`. Karta: náhled mapy + název + autor + „Naklonovat".

### B4. Klon do světa
- `CloneToWorldModal` — výběr světa, kde je uživatel PomocnyPJ+ (reuse výběr světa jako 21.5 vklad do obchodu) → `POST /worlds/:worldId/maps {templateId}` → toast + odkaz na TM novou scénu.

### B5. Moderace FE
- `shared/moderation/ReportButton` s `targetType="scene_template"` na detailu katalogu (+ enum zrcadlo).
- Kurátorská fronta: renderer scene-template pending (vzor bestiář `ContentReportRenderer`/pending registry).

### B6. Dokumentace + ověření (před commitem)
- skilly `funkce` (kap. 14 mapy — nová sekce „Sdílení scén"; + kap. 04 komunitní obsah) + `napoveda` (WorldSection/FAQ — jak publikovat/klonovat scénu) + `mobil-desktop` (katalog karty, publish modal, clone modal) + zaškrtnout 22.5 v roadmapě.
- `npm run build` (tsc -b) + eslint --fix; vitest dotčené oblasti; živé ověření = uživatel.

---

## Rizika
1. **`imageUrl` sdílený blob** (OO3) — smazání autorovy šablony nesmí osiřet obrázek klonům (klon = scéna s vlastní `imageUrl` kopií URL; orphan-cleanup mapTemplates pozor, ať nemaže blob referencovaný scénami). Ověřit orphan flow při delete šablony.
2. **Klon cizí šablony** — dnešní `maps.service.create({templateId})` owner nekontroluje → po A4 MUSÍ mít explicitní bránu (vlastní ∨ published-approved), jinak by přes známé ID šlo instancovat i nepublikovanou cizí šablonu. Kryto e2e.
3. **Kurátorská kapacita** — nová fronta zvyšuje zátěž; zdokumentovat v `funkce`.
4. **Migrace** — publikační pole jsou optional/default → žádný backfill (staré šablony `published=false`).
