# Spec 27.1b — Vazba ④ scénář→událost→kronika (dokončení zlaté cesty ④)

**Status:** Draft — čeká na schválení (vyčleněno z 27.1 rozhodnutím autora 2026-07-24)
**Rozsah:** produkční featura — datové propojení 3 modulů (campaign / game-events / timeline) + FE UI + povýšení golden-path-4 e2e na reálný řetěz
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE` (FE, e2e povýšení)
**Velikost:** BE ~12 souborů · FE ~9 souborů · +1 e2e assert
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** **27.1** (certifikace ④ jako „4 uzly"; tato karta ji povýší na řetěz) · 27.3 (scope registr)

---

## 1. Cíl

Založit datovou vazbu, aby zlatá cesta ④ (`wiki → scénář → událost → kronika`) byla **reálný referenční řetěz**, ne jen 4 nezávislé moduly ve stejném světě. Po dokončení jde projít odspoda nahoru: kronikový zápis → herní session → scénář → wiki stránka.

---

## 2. Kontext / motivace

27.1 certifikuje ④ jen jako „4 moduly fungují v jednom světě", protože v kódu **neexistuje** žádná vazba mezi scénářem, událostí a kronikou (ověřeno grepem: žádné `scenarioId`/`gameEventId`/`timelineEventId`). Bez vazby je „řetěz" ④ fikce. Autor odmítl variantu „dluh" i variantu „nechat jako 4 nezávislé uzly natrvalo" → vazba se zakládá jako samostatná, doručitelná karta.

Produktová hodnota: PJ připraví scénář nad wiki podklady → naplánuje herní session (game-event) hrající ten scénář → po hře zapíše do kroniky, co se stalo, s odkazem na session. Vzniká dohledatelná narativní linie.

---

## 3. Audit současného stavu

Obecný link systém **neexistuje**. `LinkPickerPopover` (`src/shared/ui/LinkPicker/`) produkuje holý `string` href a je vázaný jen na wiki slugy — není to generický entity-linker. Konvence kódu:
- **string slug** pro odkaz na wiki: `linkedPageSlug` (scenario), `pageSlug` (timeline).
- **string-id pole** pro same-domain relace: `subjectIds`, `storylineIds` (`@Prop({type:[String]})`, resolve na FE, **žádný mongoose populate**).

Stav tří entit:
- `CampaignScenario` — má `linkedPageSlug` (→ wiki, existuje). **Žádný** odkaz na event.
- `GameEvent` (`game_events`) — `date` = ISO reálného světa (RSVP na termín). **Žádné** odkazovací pole.
- `TimelineEvent` (`timeline_events`) — `{year,month,day}` = in-game fantasy kalendář; má `pageSlug`, `link`. **Žádný** odkaz na event.

---

## 4. Návrh řešení

Idiomatické řešení dle konvence: **dvě úzká `string | null` id pole, směr „potomek → rodič"** (ne generická abstrakce, ne obousměrná vazba, ne mongoose FK/populate).

| Pole | Entita | Sémantika | Zdroj hodnot (dropdown) |
|---|---|---|---|
| `scenarioId: string \| null` | `GameEvent` | „tato session hraje tento scénář" | `GET /campaign/scenarios?worldId=` |
| `sourceGameEventId: string \| null` | `TimelineEvent` | „tento kronikový zápis vzešel z této session" | `GET /game-events` (svět) |

Řetěz „nahoru": `timeline.sourceGameEventId → gameEvent.scenarioId → scenario.linkedPageSlug → page`.

⚠️ **Sémantická past:** `GameEvent.date` = reálný svět (RSVP), `TimelineEvent.{year,month,day}` = in-game kalendář. Vazba je **narativní** („session → zápis"), NE převod data. UI to nesmí spojit jako „stejný čas".

### 4.1 BE (12 souborů, konvence be-field-checklist — od toEntity)
- GameEvent: `schemas/game-event.schema.ts` · `interfaces/game-event.interface.ts` · `dto/create-game-event.dto.ts` · `dto/update-game-event.dto.ts` · `game-events.service.ts` (create+update) · `repositories/game-event.repository.ts` (toEntity)
- TimelineEvent: `schemas/timeline-event.schema.ts` · `interfaces/timeline-event.interface.ts` · `dto/create-timeline-event.dto.ts` · `dto/update-timeline-event.dto.ts` · `timeline.service.ts` (create+update) · `repositories/timeline.repository.ts` (toEntity)
- Pole `@Prop({ type: String, default: null })`, DTO `@IsOptional() @IsString()`. Lehká validace „existuje ve stejném světě" (rozhodnutí impl plánu; MVP = jen string, jako `pageSlug` dnes).

### 4.2 FE (9 souborů)
- GameEvent: `shared/types/index.ts` (typ) · `features/world/api/useGameEvents.ts` (DTO) · `features/world/components/GameEventModal/GameEventModal.tsx` + `lib/createGameEventSchema.ts` (select „Hraný scénář") · `components/GameEventCard/GameEventCard.tsx` (zobrazení odkazu)
- TimelineEvent: `pages/TimelinePage/api/types.ts` · `components/TimelineEventModal.tsx` + `lib/timelineEventSchema.ts` (select „Vzešlo z události") · `components/TimelineEventCard.tsx` (zobrazení)
- Dropdown = search-select ve stylu existujícího `PagePicker`/`ScenarioLinksPanel`; nevyrábět nový vzor.

### 4.3 Povýšení e2e a doc
- `golden-path-4-…e2e-spec.ts`: přidat assert „potomek nese ID rodiče" (timeline.sourceGameEventId === event.id; event.scenarioId === scenario.id), odstranit `TODO(27.1b)`.
- `docs/golden-paths.md`: ④ status z „4 uzly v jednom světě" → „referenční řetěz certifikován".

📚 Vazba „nahoru" (potomek nese ID rodiče) se přidává jen na 2 entity a nevyžaduje obousměrnou synchronizaci — smazání rodiče nechá u potomka „mrtvé" ID, FE resolve degraduje na „—" (jako `pageSlug` na smazanou stránku). Kaskádu neřešíme (konzistentní s dnešním chováním slugů).

---

## 5. Out of scope
- Generický `EntityRef {type,id}` link systém — řešeno úzkými poli.
- Obousměrná vazba / kaskádní mazání.
- Převod reálného data ↔ in-game kalendáře.
- Leg scénář→wiki (`linkedPageSlug` už existuje).

---

## 6. Acceptance kritéria
1. ✅ BE: `GameEvent.scenarioId` + `TimelineEvent.sourceGameEventId` projdou schema→DTO→service→toEntity (create i update; POST/PATCH perzistuje, GET vrací).
2. ✅ FE: GameEventModal select „Hraný scénář", TimelineEventModal select „Vzešlo z události"; karty zobrazují odkaz; smazaný rodič → „—".
3. ✅ golden-path-4 e2e ověřuje reálný řetěz referencí (ID rodičů).
4. ✅ `mobil-desktop` na 2 nové selecty.
5. ✅ `funkce` (nová BE schopnost + vazba) + `napoveda` (dvě nová pole ve formulářích události/kroniky).
6. ✅ `type-sync` / `be-field-checklist` bez driftu (FE typ = BE DTO).

---

## 7. Test plán
- BE: unit/e2e create+update+get pro obě pole; golden-path-4 povýšen a zelený.
- FE: `type-sync`, vitest pokud dává smysl; `mobil-desktop` na selecty (statická CSS review + screenshot od uživatele).
- Manuální (uživatel na živém): nastav scénář na události, událost na kronice, ověř zobrazení a degradaci po smazání rodiče.

---

## 8. Riziko & rollback
| Riziko | Mitigace |
|---|---|
| `worldId` umístění (game-event query/body vs. timeline body) | tabulka v 27.1 §3.4 |
| Field-drift BE↔FE (přidané pole se dropne) | be-field-checklist od toEntity; type-sync; BE restart po změně |
| Mrtvé ID po smazání rodiče | FE resolve degraduje na „—", žádná chyba (jako pageSlug dnes) |
| Selecty nefungují na mobilu | `mobil-desktop`, reuse existujícího search-select vzoru |

**Rollback:** pole jsou nullable a aditivní; revert = odstranit pole+UI, existující data bez pole fungují dál.

---

## 9. Otázky k autorovi
1. **Validace ve stejném světě:** MVP = jen string (jako `pageSlug`), nebo hned tvrdá validace, že přiřazený scénář/událost patří do téhož světa? *(Návrh: MVP string, validaci jako lehký follow-up — konzistentní s dnešním `pageSlug`.)*

Zbytek delegováno / rozhodnuto v §4.

---

**Po schválení napíšu implementační plán** (BE zátah → FE zátah → e2e povýšení + uzávěr; nemíchat BE+FE v dávce).
