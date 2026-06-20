# form-schema / 09-events-misc — checkpoint RUN-2026-06-20-1621

Verze kódu: FE 2a6c8e1c · BE HEAD (kontrola git log v průběhu)  
Datum: 2026-06-20  
Metoda: M1 (přímé čtení), L2 (statická verifikace 3 vrstev)

---

## Pokrytí

| Entita | FE schema/form | BE DTO (create+update) | DB schema | Service (sanitizace) | Repository toEntity | Ověřeno |
|---|---|---|---|---|---|---|
| game-event | createGameEventSchema.ts | create/update-game-event.dto.ts | game-event.schema.ts | game-events.service.ts (n/a) | game-event.repository.ts | ✅ L2 |
| timeline-event | timelineEventSchema.ts | create/update-timeline-event.dto.ts | timeline-event.schema.ts | timeline.service.ts (sanitizeRichText ✅) | timeline.repository.ts | ✅ L2 |
| world-currency | currencies/validation.ts | update-world-currencies.dto.ts (+ dead worlds-settings dto) | world-currencies.schema.ts | world-currencies.service.ts | world-currencies.repository.ts | ✅ L2 |
| ikaros-news | createNewsSchema.ts | create-ikaros-news.dto.ts | ikaros-news.schema.ts | ikaros-news.service.ts (sanitizeRichText ✅) | ikaros-news.repository.ts | ✅ L2 |
| ikaros-event | createIkarosEventSchema.ts | create-ikaros-event.dto.ts | ikaros-event.schema.ts | ikaros-events.service.ts (n/a) | ikaros-event.repository.ts | ✅ L2 |
| sound | SoundFormModal.tsx (inline) | create-sound.dto.ts | sound.schema.ts | sounds.service.ts | sounds.repository.ts | ✅ L2 |

Celkem polí prošlo: ~48 (EV-01 až EV-48), všechny osy (RQ, LN, RG, RN, EN, TY, DF, WL, XF, SAN, NL).

---

## Dosažená L vs cílová L

- **Dosaženo: L2** (statická shoda 3 vrstev + mapper přečten přímým kódem) pro všechny entity.
- Cílová hloubka oblasti = L2+ (plán); pro hot-spoty (SAN, XF, WL) L3 ideálně.
- **L3 (existující testy):** create-game-event.dto.spec.ts (F-08, F-13 ✅) · update-world-currencies.dto.spec.ts (F-04 ✅).
- **L4 (round-trip/red-team):** PROOF-REQUEST viz níže — bez živé DB nelze ověřit.

---

## Nálezy

### 🟠 F-RUN-EV-01 — `WL` ikaros-event `imageFit` chybí v `toEntity` mapperu → GET vždy vrátí `undefined` 🆕

- **Pole / entita:** `imageFit` v `IkarosEvent`
- **FE:** `IkarosEventModal.tsx:52-53` čte `event?.imageFit`, odesílá ho v payload (`useIkarosEvents.ts:50,73`); `IkarosEventCard.tsx:128` renderuje `event.imageFit` jako arg `getImageStyle` — čeká `'cover'|'contain'|null`
- **BE DTO:** `create-ikaros-event.dto.ts:60` `@IsOptional @IsIn(['cover','contain']) imageFit?` — přijme a validuje ✅
- **BE service:** `ikaros-events.service.ts:110` `dto.imageFit` použije v update, `line:216` `imageFit: it.imageFit ?? null` v `toResponses` — čte z entity ✅
- **DB schema:** `ikaros-event.schema.ts:22` `@Prop({ type: String, enum: ['cover','contain'] }) imageFit?` — uloží ✅
- **MAPPER (missing):** `ikaros-event.repository.ts:18-35` `toEntity()` — **`imageFit` CHYBÍ** v returnu. Výsledek: `IkarosEventItem.imageFit` je vždy `undefined` → `toResponses` vrátí `null`, GET nikdy nevrátí uloženou hodnotu.
- **Dopad:** Uživatel nastaví `contain` fit → uloží se do DB → GET vrátí `null` → karta zobrazuje špatný fit. Každý reload ztrácí nastavení.
- **Dopad na existující data:** Žádný (data jsou v DB, jen se nečtou; fix bez migrace).
- **Návrh:** Doplnit do `toEntity`: `imageFit: (doc.imageFit as 'cover' | 'contain' | undefined) ?? null,` — a upravit `IkarosEventItem.imageFit?: ...` na `imageFit: 'cover' | 'contain' | null` (nebo zůstat `undefined`).
- **L2** · `ikaros-event.repository.ts:18-35`

---

### 🟡 F-RUN-EV-02 — `DF` game-event mapper `confirmable ?? false` vs DB default `true` (residual F-11) ♻️

- **Pole / entita:** `confirmable` v `GameEvent`
- **DB schema:** `game-event.schema.ts:48` `@Prop({ default: true }) confirmable: boolean;` — F-11 opravil default na `true` ✅
- **Mapper:** `game-event.repository.ts:104` `confirmable: (doc.confirmable as boolean) ?? false` — fallback **zůstal `false`** (nebyl aktualizován při F-11 fixu)
- **Dopad:** Pro legacy dokumenty bez `confirmable` pole v DB (vzniklé před F-11 opravou) mapper vrátí `false` místo `true`. V praxi: dokumenty po F-11 mají `confirmable=true` v DB → `??` se neuplatní. Dokumenty před opravou, kde pole nebylo → mapper chybně vrátí `false` (UI schová potvrzovací tlačítko).
- **Dopad na existující data:** Legacy akce před F-11 opravou mohou mít nesprávně zobrazený stav potvrzování — ale pouze pokud `confirmable` v DB opravdu chybí (záleží na tom, zda Mongoose vynutil default při prvním načtení).
- **Návrh:** Změnit na `?? true` → konzistentní s DB defaultem. Nízká priorita (rare path, ale správně by měl sedět).
- **L2** · `game-event.repository.ts:104`

---

### ✅ Ověřené opravy z minulého sweepu (HEAD HEAD potvrzeny)

- **F-02 ✅ OPRAVENO** — timeline `text` sanitizace: `timeline.service.ts:165` (`create`) + `:206` (`update`) volá `sanitizeRichText(dto.text)`; `enrich():95` read-time záloha. `TimelineEventCard.tsx:184` stále `dangerouslySetInnerHTML` bez DOMPurify — ale server-side ochrana (write+read) je dostačující per design (oba průchody).
- **F-04 ✅ OPRAVENO** — `WorldCurrencyItemDto` (`update-world-currencies.dto.ts:17`) nyní: `@Matches(/^[A-Z0-9]{1,8}$/) @MaxLength(8) code` + `@MinLength(1) @MaxLength(40) name` + `@MaxLength(8) symbol` + `@Min(0.0001) @Max(1000000) rate`. Existuje SPEC test `update-world-currencies.dto.spec.ts` (L3 ✅). Dual DTO v `update-world-settings.dto.ts:26-31` je dead code — `worlds.service.ts` currencies field nepoužívá.
- **F-08 ✅ OPRAVENO** — `create-game-event.dto.ts:75-81` `@ValidateIf(o => o.groupOnly===true || o.targetGroup!=null)` + regresní spec F-08/AR-13 (L3 ✅).
- **F-10 ✅ OPRAVENO** — `ikaros-news.service.ts:119` `content: sanitizeRichText(dto.content)` (create) + `:168` (update). XSS latentní → odstraněn.
- **F-11 ✅ OPRAVENO** — `game-event.schema.ts:48` `@Prop({ default: true }) confirmable` — DB default sjednocen s FE. Mapper residual drift → F-RUN-EV-02 výše.
- **F-12 🟣 dluh** — sound `youtubeUrl` BE bez YT validace — vědomý dluh, HEAD potvrzen (`create-sound.dto.ts:26` `@IsString()` bez regex). Platí.
- **F-13 ✅ OPRAVENO** — `createGameEventSchema.ts:30` `targetGroup: z.string().max(64)` (FE má `max(64)` konzistentní s BE `@MaxLength(64)`) + spec test potvrzuje.

---

### Shody ověřeny (bez nálezů, L2)

- **timeline** — `title/year/month/day/hour` FE↔DTO sedí; `link` FE `url()` vs BE `@Matches(/^https?:\/\//)` — rozdíl v přísnosti (zod url() přísnější), ale oba blokují ne-http; `pageSlug` regex identický `/^[a-z0-9-]+$/`; `celestialOverrides` 8 fází: FE `LUNAR_PHASES as const` (timelineEventSchema.ts:3-12) = BE `celestial-override.dto.ts:4-13` (`@IsIn(LUNAR_PHASES)`) = 8 stejných hodnot ✅ (dvě kopie, latentní drift při rozšíření — ale EV-21 označen jako ⬜, ne hotový nález).
- **ikaros-news** — `title/content/type/imageUrl` FE↔DTO sedí; `type` 3 kopie (FE enum, BE `@IsIn`, DB `enum`) — shoda ✅ (EV-29 ověřen).
- **ikaros-event** — `title/date/description/confirmable` FE↔DTO sedí; `confirmable` FE `z.boolean()` bez default ale modal nastaví `defaultValues.confirmable: true` → FE vždy pošle; BE `@IsOptional` → DB `default: true` → konzistentní pro nové zápisy (EV-34 `DF`/`RQ` prakticky OK).
- **sound enums** — `SoundFormModal` importuje FE label mapy z `soundEnums.ts`; BE `CreateSoundDto` importuje enumy z `sound.schema.ts` = single source of truth; `Record<SoundMediaType, string>` přes TS garantuje, že FE labely musí pokrývat všechny BE enum hodnoty → zero drift risk (EV-38..44 ✅).
- **currency** — FE `currencyItemBaseSchema` + BE `WorldCurrencyItemDto` plně shodné včetně `@Max(1000000)` (FE `max(1_000_000)`). Unique code jen FE superRefine + DB nemá unique index na `items[]` — toto je vědomý stav (F-04 registr).
- **game-event imageUrl** — FE: state mimo zod (modal); BE create DTO: `@Matches(/^(https?:\/\/|\/)/)` — FE nevaliduje URL pattern na imageUrl (jen upload button zajistí validní URL). Dopad: minimální (imageUrl přichází z uploaderu).

---

## PROOF-REQUEST

Bez živé DB/BE nelze ověřit L4:

1. **PR-EV-01 (M4 round-trip)** — `imageFit` ikaros-event: POST `/ikaros-events` s `imageFit:'contain'` → GET `/ikaros-events` → ověřit, zda response obsahuje `imageFit:'contain'`. Očekávaný výsledek PŘED opravou: `imageFit: null`. Toto ověří F-RUN-EV-01.
2. **PR-EV-02 (M4 round-trip)** — legacy `confirmable` game-event: zkontrolovat akce v produkční DB vytvořené před F-11 opravou — mají `confirmable: true` nebo pole chybí? Ověřit mapper behavior.
3. **PR-EV-03 (M5 red-team)** — sound `youtubeUrl`: POST `/worlds/:id/sounds` s `youtubeUrl: 'https://example.com/notyt'` → ověřit BE akceptuje (F-12 dluh potvrdí).
4. **PR-EV-04 (M3 testy)** — spustit BE `npx jest --maxWorkers=2 --testPathPattern="game-events|world-currencies|timeline"` pro ověření L3 na opravených oblastech.
