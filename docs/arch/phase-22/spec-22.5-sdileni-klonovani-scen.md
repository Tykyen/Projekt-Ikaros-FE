# Spec 22.5 — Sdílení & klonování scén (veřejný katalog šablon)

**Stav:** ✅ IMPLEMENTOVÁNO 2026-07-15 (BE nasazeno, FE čeká commit) · impl. plán: [plan-22.5.md](plan-22.5.md) · **Fáze:** 22 (konec Etapy II) · **Roadmap:** [22.5](../../roadmap2.md) [E4] (bývalý 17.5) · **Navazuje:** 10.2c knihovna scén (`mapTemplates`), 16.2b-2 komunitní bestiář (vzor scope+katalog+klon), 22.4 vitrína (veřejné čtení), 20D licenční podklad (`content_licenses`), 20B/20.1 moderace · **Souvis.:** 21.5 Společná tvorba (hub + nav)

**Cíl:** PJ **publikuje scénu** ze své knihovny (`mapTemplates`) jako **veřejnou šablonu** → objeví se ve **veřejném katalogu** ve Společné tvorbě → jiný PJ ji **naklonuje do svého světa** (nová scéna). Bez placení, leak-safe (žádné cizí PC / citlivá data), s atribucí autora a moderací.

---

## 0. Rozhodnutí z brainstormingu (2026-07-15)

| # | rozhodnutí | volba | proč |
|---|---|---|---|
| R1 | **Rozsah entit** | **jen SCÉNY** (šablony taktických map, `mapTemplates`). Odloženo: celé světy, šablony stránek/postav | roadmapa doslova: „máme privátní knihovnu map — chybí veřejné sdílení" → scéna je jediná entita s hotovým privátním základem a chybějící veřejnou vrstvou. **Bestie/položky se už sdílí** (Společná tvorba 16.2b-2/21.5). **Celý svět blokuje odložený import** (14.7). Stránky/postavy = doména 21.1. |
| R2 | **Nová kolekce vs. rozšíření** | **rozšířit `mapTemplates`** o publikační pole, NE nová kolekce | šablona JE už snapshot odpojený od světa (cross-world, bez `worldId`, PC tokeny strippnuté při save `filterOutPcTokens`). Publikace = přepnutí viditelnosti + licence + atribuce, ne nová serializace. |
| R3 | **Snapshot vs. živý odkaz** | **snapshot dvakrát**: šablona = snapshot scény (už dnes); klon = nová scéna ve světě (už dnes `maps.service.create({templateId})`). Žádný živý link | pozdější edit šablony NEmění naklonované scény (parita s bestií `clonedFromId`). Autor smí publikovanou šablonu upravit/stáhnout, klony zůstanou. |
| R4 | **Katalog: anon vs login** | **login-required pro MVP** (klon vyžaduje účet+svět tak jako tak); anonymní SEO-browse = samostatný follow-up | parita se VŠEMI komunitními katalogy (dnes login-only); nejmenší leak-plocha; síťový efekt uvnitř komunity funguje i bez anonu. (Anon browse lze přidat přes `OptionalJwt` + brána á la 22.4 později.) |
| R5 | **Moderace** | **reuse 20B páteře** — nový `ReportTargetType.scene_template` + `moderationHidden` pole na `mapTemplates` + enforcement listener (vzor bestiae) | sdílený obsah MUSÍ jít nahlásit/skrýt; páteř (`moderation` modul, pending-actions, `ReportButton`) existuje, chybí jen nová plocha. |
| R6 | **Kurátorský tok** | **draft → approved** přes reuse `isBestieCurator` + nový `PendingActionType.CommunitySceneTemplatePendingReview` + review provider (vzor `community-bestie-review.provider`) | žádná nová role; publikovaná šablona čeká na schválení kurátorem, než se ukáže v katalogu (anti-spam/anti-abuse). |
| R7 | **Licence & atribuce** | **poprvé napojit `content_licenses` (20D)**: při publikaci vytvořit licenční kartu (`licenseMode` default `clone`, `attributionRequired`, `aiOrigin`, `publicAuthorName` snapshot); klon gatovat na `cloneAllowed`; `parentContentId` = genealogie | 20D je v kódu doslova „podklad, který 21.5/klonování napojí". `publicAuthorName` snapshot řeší existující dluh „jen authorId, ne jméno". |

**Trade-off vědomě přijatý (R1+R4):** MVP je úzké (scény, login-only), ale postavené na 100% hotové serializaci + PC-stripu + moderaci + licenční kartě. Celé světy a anon-katalog jsou vědomě mimo — každé je samostatná velká práce (import / anon leak-safe vrstva).

---

## 1. Architektura

```
PJ v knihovně scén ── Publikovat ──▶ mapTemplates.publish
                                       │  vytvoří licenční kartu (content_licenses)
                                       │  moderationHidden=false, status=pending
                                       │  publicAuthorName = snapshot jména autora
                                       ▼
                              PendingAction: scene_template_pending_review
                                       │  kurátor (isBestieCurator) schválí
                                       ▼
                     Veřejný katalog /ikaros/tvorba/sceny  (login-required)
                                       │  list = approved ∧ ¬moderationHidden
                                       ▼
Jiný PJ ── Naklonovat do světa ──▶ maps.service.create({ templateId })
                                       │  cloneAllowed gate (licence)
                                       │  nová scéna v cílovém světě (PomocnyPJ+)
                                       │  PC tokeny se nenesou (šablona je nemá)
                                       ▼  + volitelně licence klonu (parentContentId)
```

- **Publikace = flip + karta**, ne kopie: publikovaná šablona je tentýž `mapTemplates` dokument s novými poli. Autor ji dál vidí/edituje v knihovně; katalog ukazuje jen `published ∧ approved ∧ ¬moderationHidden`.
- **Klon = existující instancování**: `maps.service.create` s `templateId` už seeduje novou scénu z šablony (config/npcTemplates/tokens/effects/fog/revealedHexes/sounds). PC tokeny v šabloně nikdy nejsou → klon je leak-safe konstrukcí. Přidává se jen: brána `cloneAllowed` + rozšíření viditelnosti (dnes klon jen z vlastních šablon; nově z veřejného katalogu).

---

## 2. Co se publikuje / co se nese (matice)

**Šablona scény obsahuje (dnes, `map-template.schema.ts`):** `config` (grid/měřítko/vision), `npcTemplates[]`, `tokens[]` (jen NPC — PC strippnuté), `effects[]`, `fogEnabled`, `revealedHexes[]`, `activeSoundIds[]`, `imageUrl`+`imageBytes`.

| složka | publikuje se | pozn. leak-safe |
|---|---|---|
| `config`, mřížka, měřítko | ✅ | neutrální |
| NPC tokeny + `systemStats` | ✅ | herní obsah, patří do šablony |
| **PC tokeny** | ❌ nikdy | `filterOutPcTokens` server-side při save (existuje); klon je nemá |
| `imageUrl` (mapa) | ✅ | sdílený blob přes URL (jako bestie klon); pozor GDPR — mapa nesmí nést reálné foto (kurátor) |
| `effects`, `fog`, `revealedHexes` | ✅ | herní stav, neutrální |
| `activeSoundIds` | ✅ *(ověřit v impl. plánu)* | ID zvuků — pokud jsou per-svět, při klonu do cizího světa mrtvé → buď nést jen globální, nebo strip |
| GM poznámky ke scéně | ❌ *(ověřit)* | pokud šablona nese PJ notes, nepublikovat |

⚠️ **Matice §2 je bezpečnostní hranice.** Před implementací ověřit, že šablona reálně nenese nic PJ-privátního nad rámec tabulky (zvuky, poznámky, jména hráčů v NPC datech).

---

## 3. Bezpečnost / leak-safe

1. **PC tokeny** — už strippnuté při save (`filterOutPcTokens`, defense-in-depth FE+BE). Klon je z definice nemá. **Regresní test:** publikovat scénu s PC tokenem → šablona ho nemá → klon ho nemá.
2. **Atribuce bez leaku identity** — `publicAuthorName` = snapshot *zobrazovaného* jména autora (ne e-mail, ne username, pokud je citlivé); ukládá se při publikaci (řeší dluh „jen authorId").
3. **Moderace má přednost** — `moderationHidden` šablonu vyřadí z katalogu i klonu (i pro autora, dle 20B); skrytou vidí jen reviewer.
4. **Klon gatuje licence** — `cloneAllowed === false` → 403 (autor může publikovat „jen k prohlížení").
5. **Klon do světa = PomocnyPJ+** cílového světa (existující `assertCanManageWorld` vzor) — anonym/hráč nenaklonuje.
6. **Login-required katalog** (R4) — žádná anon plocha v MVP → žádný nový leak-safe endpoint.
7. **Média** — `imageUrl` je sdílený blob (jako bestie). Kurátor při schválení odpovídá za to, že mapa neobsahuje reálné foto/PII (parita s ostatními katalogy). SSRF/moderace médií reuse `media-url.guard`/`export-moderation.util` kde relevantní.

---

## 4. BE změny (`Projekt-ikaros/backend`)

1. **`mapTemplates` schema + interface + DTO + toEntity** — přidat: `published: boolean` (default false), `publishedAt`, `authorId` (= ownerId snapshot), `publicAuthorName`, `moderationHidden`/`moderationHiddenReason`, `licenseId?`, `reviewStatus: 'pending'|'approved'|'rejected'`, `clonedFromTemplateId?` (genealogie). Field-checklist všech 4 míst.
2. **Publish endpoint** — `POST /map-templates/:id/publish` (owner+, JwtAuthGuard): validace (šablona má obsah), vytvoření licenční karty (`content_licenses.create`), `published=true`, `reviewStatus='pending'`, snapshot `publicAuthorName`; zaregistrovat pending-action. `POST /:id/unpublish` (owner) → stáhnout z katalogu (klony zůstávají).
3. **Veřejný katalog** — `GET /map-templates/catalog` (JwtAuthGuard, login): `published ∧ reviewStatus='approved' ∧ ¬moderationHidden`; filtry (systém, tagy?); `GET /map-templates/catalog/:id` detail. **Nesmí** vracet owner-privátní pole (whitelist mapper).
4. **Klon z katalogu** — rozšířit stávající instancování: `POST /worlds/:worldId/maps` s `templateId` katalogové šablony → brána `cloneAllowed` (licence) + `assertCanManageWorld` + zápis `clonedFromTemplateId` na novou scénu + volitelně licence klonu (`parentContentId`). Instancování už PC nenese.
5. **Moderace** — `ReportTargetType.scene_template` (BE enum + FE zrcadlo), enforcement listener (`moderationSetHidden`/`Remove`/`Restore` na mapTemplates, vzor bestiae), `ReportButton targetType="scene_template"` na detailu katalogu.
6. **Kurátorský tok** — `PendingActionType.CommunitySceneTemplatePendingReview` + review provider (vzor `community-bestie-review.provider`) + registrace v `onModuleInit`; approve/reject endpoint (`isBestieCurator`).
7. **Licence** — `content_licenses` poprvé konzumováno: create při publish, čtení `cloneAllowed` při klonu, `changeMode` při unpublish→withdrawn.
8. **e2e** — viz §6.

## 5. FE změny (`Projekt-ikaros-FE`)

1. **Publikovat z knihovny scén** — v UI knihovny šablon (taktická mapa) tlačítko „Publikovat do katalogu" (owner) + stav (draft/čeká/schváleno) + „Stáhnout". Modal licence: `licenseMode`, „vyžadovat uvedení autora", AI původ (`aiOrigin`), krátký popis.
2. **Katalog scén** — nová dlaždice v hubu Společné tvorby `/ikaros/tvorba` → route `/ikaros/tvorba/sceny` (list + detail), vzor `KomunitniBestiarPage`. Karta = náhled mapy + jméno + autor + „Naklonovat".
3. **Naklonovat do světa** — modal „Vyber svět" (světy, kde jsem PomocnyPJ+) → `POST /worlds/:worldId/maps {templateId}` → redirect na TM novou scénu. Reuse výběru světa (jako vklad do obchodu 21.5).
4. **Moderace** — `ReportButton` na detailu katalogu; renderer fronty pro kurátora (vzor bestiář pending).
5. **Typy** — FE zrcadlo publikačních polí + `content_licenses` DTO (jen co katalog čte).

---

## 6. Ověření

- **e2e BE:** publikace vytvoří licenční kartu + pending; katalog ukáže jen approved; skrytá (moderationHidden) šablona v katalogu ani klonu není; klon z katalogu do světa (PomocnyPJ+) vytvoří scénu **bez PC tokenů**; `cloneAllowed=false` → klon 403; nečlen/hráč cílového světa klon 403; unpublish nechá existující klony beze změny; **regrese: publikovaná scéna s PC tokenem → klon PC nemá** (invariant).
- **FE ručně (uživatel na živém webu):** PJ publikuje scénu → čeká na schválení → kurátor schválí → jiný PJ ji vidí v katalogu a naklonuje → na TM sedí NPC/fog/mapa, žádné cizí PC.
- **Moderace:** nahlásit šablonu → objeví se ve frontě kurátora → skrytí ji vyřadí z katalogu.
- **Persistence:** publikovat → stáhnout → publikovat znovu (A→B→A) drží stav; klony přežijí unpublish.

---

## 7. Otevřené otázky / rizika

1. ✅ **VYŘEŠENO — Zvuky** (`activeSoundIds`): odkazují na `sounds` kolekci, kde má sound `worldId` (svět-scoped, null=globální). Při klonu do cizího světa by world-scoped ID byla mrtvá + leak existence. → **při publikaci `activeSoundIds` strippnout na `[]`** (sdílená scéna bez soundtracku; klonér si nastaví vlastní). `sound.schema.ts:102`.
2. ✅ **VYŘEŠENO — GM poznámky**: `map-template.schema.ts:16-49` nenese žádné PJ-privátní pole (jen config/npcTemplates/tokens/effects/fog/revealedHexes/activeSoundIds/imageUrl). Není co strippovat.
3. **Kolize `imageUrl`** — sdílený blob mezi šablonou a klonem (jako bestie). Při smazání autorovy šablony nesmí zmizet obrázek klonům (orphan-cleanup pozor). Zvážit kopii blobu při klonu vs. sdílení URL.
4. **Kurátorská kapacita** — každá nová katalogová plocha zvyšuje moderační zátěž (dnes `isBestieCurator` = pár lidí). Zdokumentovat.
5. **Anon SEO-browse** (R4 odloženo) — kdy a jak (OptionalJwt + brána); samostatný podbod.
6. **Šablony scénářů (storyboard)** — `scenarioTemplate` má stejný privátní model; přirozený druhý kandidát na sdílení stejným vzorem (mimo MVP 22.5).

---

## 8. Dotčené soubory (předběžně)

**BE:** `modules/maps/schemas/map-template.schema.ts` + interface + `dto/create-map-template.dto.ts` + `map-templates.controller.ts` + `maps.service.ts` (publish/catalog/clone brána) + `map-templates.repository.ts`; `modules/moderation/enums/moderation.enums.ts` (`scene_template`) + nový `maps/scene-template-moderation.listener.ts`; `modules/pending-actions/pending-action-type.enum.ts` + nový review provider; `modules/content-licenses/*` (poprvé volané); `test/` e2e.

**FE:** knihovna scén (publish UI — TM library komponenta) + `PublishTemplateModal`; hub `/ikaros/tvorba` dlaždice + nová route `/ikaros/tvorba/sceny` (`SceneCatalogPage` + detail, vzor `KomunitniBestiarPage`); `CloneToWorldModal` (výběr světa); `shared/moderation` `ReportButton` napojení; FE typy.

**Beze změny:** serializace scény, `filterOutPcTokens`, instancování `maps.service.create` (jádro), moderační modul (jen nová plocha), 22.4 vitrína.
