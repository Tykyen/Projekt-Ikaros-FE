# 04 · Technická architektura Vypravěče

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.2 (nápověda/Vypravěč), 25.4, 26.1–26.5 (cesty, persona, návody), 28.2 (vyhodnocení bety)
Sousední podklady: [03-interakcni-model.md](03-interakcni-model.md) (kotva, stavy, kolizní plochy) · [05-retence-a-cesty.md](05-retence-a-cesty.md) (obsah cest, milníky, metriky) · [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) (výrobní linka, šablony, CI validace) · [07-migrace-napovedy.md](07-migrace-napovedy.md) (fázování viz [00-vize-a-rozhodnuti.md](00-vize-a-rozhodnuti.md) §4)

---

## 1. Princip a struktura

Řetěz pravdy: **kód → `docs/funkce/` → registr → doručovací plochy** (Vypravěč, HelpPage, „?", empty-states). Tři vrstvy:

1. **Statický TS registr** — verzovaný gitem, typově kontrolovaný; jediný zdroj help textů (žádná šestá kopie).
2. **Kontextový engine** — čistě FE derivace, žádný fetch navíc.
3. **Minimální BE persistence** — modul `user-onboarding` (NestJS + Mongo, 1 kolekce) + localStorage cache.

Vše deterministické; LLM jen jako výměnný adaptér za švem `VypravecBrain` (§9).

```
src/shared/vypravec/
  registry/   types.ts · index.ts · routeHeaders.ts · errorTopics.ts · anchors.ts
              topics/*.ts (per oblast) · journeys/*.ts · changelog.ts
  engine/     useVypravecContext.ts · events.ts · moments.ts · doneConditions.ts
  brain/      types.ts · deterministic.ts
  ui/         VypravecFab.tsx · VypravecPanel.tsx (lazy) · JourneyBar.tsx · TopicView.tsx · VypravecHost.tsx
  state/      onboardingStore.ts (localStorage + BE sync) · telemetry.ts
scripts/build-vypravec-index.ts
backend/src/modules/user-onboarding/   (schema, controller, service, telemetry, cleanup listener)
```

Prerekvizita (den 1): **typovaný route registr** extrahovaný z `router.tsx` + parity test router↔registr — `RoutePattern` v typech níže se opírá o něj (překlep route spadne v `tsc -b`).

---

## 2. Registr — datové modely

```ts
// Publikum: odvozeno z WorldRole enumu (Zadatel=0…PJ=5) + platformní stavy.
// Žadatel NENÍ audience (členský stav ctx.worldState.membershipPending);
// Korektor zahrnut (v enumu existuje); 'admin' = elevovaný platform Admin.
type VypravecAudience = 'anon' | 'prihlaseny' /* mimo svět */ | 'ctenar' | 'hrac'
                      | 'korektor' | 'pomocnyPJ' | 'pj' | 'admin';

interface HelpTopic {
  id: string;                       // 'svet.chat.kostky' — stabilní, deep-linkovatelný
  title: string;
  tags: string[];                   // synonyma žargonu ('AKJ','mlha','clearance') pro fulltext
  routes: RoutePattern[];           // typováno proti route registru
  audience?: VypravecAudience[];    // undefined = všichni
  minAudienceNote?: string;         // „Tohle dělá tvůj PJ"
  status: 'funkcni' | 'castecne' | 'stub';
  // ^ Poctivost u 🚧 funkcí strojově: plní se ručně při voice passu dle docs/funkce/;
  //   'castecne'/'stub' → Vypravěč v topiku říká, co reálně funguje.
  //   CI soft-report porovnává status proti značkám 🚧/✅ v docs/funkce/ (grep přes source.kapitola).
  body: { kind:'md'; md: string }                                   // AI-generovaný obsah
      | { kind:'blocks'; steps?: StepItem[]; terms?: TermItem[]; callouts?: CalloutItem[] }
      | { kind:'component'; load: () => Promise<{default: ComponentType<{audience:VypravecAudience}>}>;
          searchText: string };     // úniková cesta pro 4 existující interaktivní helpy; lazy
  links?: { label: string; to: RoutePattern | TopicId }[];
  deepLink?: string;                // '/ikaros/napoveda?sekce=svet&topik=…'
  media?: HelpMediaKey[];           // reuse media.ts
  source: { kapitola: string; sekce?: string };   // kotva do docs/funkce/; kapitola = jen 'NN' (např. '13'), NE 'NN-nazev'
  verifiedAt: string;               // 'YYYY-MM-DD' — poslední ověření proti funkce
  since?: string;                   // fáze vzniku/změny → štítek „nové"
}

interface RouteHeader { route: RoutePattern; name: string; blurb: string;
                        audienceNotes?: Partial<Record<VypravecAudience,string>> }

const ERROR_TOPICS: Record<ErrorCode, TopicId>;   // ~15 položek; friendly hláška = 1. linie,
                                                  // topik = „proč a co dál" (2. linie)

interface ErrorTopic extends HelpTopic {          // cíl ERROR_TOPICS; šablona 06 §4.5
  errorCode: ErrorCode;
  shortMessage: string;             // 1. linie (1 věta, friendly hláška); body = 2. linie (proč + co dál)
}

interface Tip {                                   // proaktivní bublina; šablona 06 §4.4
  id: string; trigger: TipTrigger;  // jen whitelistované momenty (06 §4.4)
  dismissKey: string;               // → dismissed (§5.1); zavřené se nikdy neopakuje
  text: string;                     // ≤ 200 znaků, max 2 věty
  cta?: { label: string; to?: RoutePattern };
  source: HelpTopic['source']; verifiedAt: string;
}

interface Oslava {                                // milník; šablona 06 §4.6
  id: string; milestone: string;    // klíč do milestones (§5.1)
  event: string;                    // spouští VÝHRADNĚ event, nikdy probe/backfill (§5.4)
  text: string;
}

interface Anchor { id: string; route: RoutePattern; visibleFor?: VypravecAudience[];
                   mobileNote?: string; fallbackText: string }   // data-vypravec kontrakt, CI guard existence
```

Registr rozdělený per oblast; **metadata eager (malý chunk), body lazy**. Markdown pro AI-produkovaný obsah, `component` pro ChatHelp/TacticalMapHelp/OrchestraceHelp/EfektyKresleniHelp. `@/shared/ui/help` zůstává UI-kit, `src/shared/vypravec/` je feature modul.

### 2.1 Cesty (journeys)

```ts
interface JourneyStep {
  id: string;                 // 'pj.create-world'
  title: string;              // „Založ svět"
  narratorLine: string;       // Ishidova replika (flavor)
  cta: { label: string; to: string };   // deep-link; parametry světa doplní engine z contextWorldId
  anchor?: AnchorId;
  done: DoneCondition;        // §4
  topicId?: string;           // „chci vědět víc"
  skipAllowed: true; estMin: number;
}
interface Journey {
  id: 'pj-start' | 'hrac-start' | 'wb-start';   // reálná ID cest dle 05 §3/§4/§5
  persona: string; estimateMin: number;
  worldBinding: 'creates' | 'joins' | 'none';
  // 'creates' (26.1): contextWorldId zafixuje splnění kroku 1 (event world.created nese worldId);
  //   má-li uživatel už vlastní svět, zafixuje ho výběr při startu cesty.
  // 'joins' (26.2): contextWorldId zafixuje join.requested / výběr světa.
  phases: { title: string; steps: JourneyStep[] }[];
}
```

**Vazba cesty na svět (KRITICKÉ pravidlo):** každá rozběhnutá cesta s `worldBinding ≠ 'none'` má v progresu **`contextWorldId`**. Všechny probe, milníky i deep-linky kroků 2+ se scopují **výhradně na něj** — probe „počet stránek nad seed" i milník „první hráč ve tvém světě" se počítají v kontextovém světě, CTA deep-linky z něj berou worldSlug. PJ se dvěma světy = deterministické chování (cesta patří jednomu světu). **Lišta kroku se zobrazuje jen ve světě cesty a mimo svět;** v cizím světě (uživatel tam má jinou roli, např. Hrac) se sbalí do badge „cesta pokračuje ve světě X" s navigate CTA. Povinný persistence test: PJ cesty ve světě A + role Hrac ve světě B → lišta ve světě B nenabízí „První NPC".

**Souběh cest:** max **1 aktivní cesta**, ostatní pauznuté; přepnutí kdykoli z menu Cesty. Persona je jen výhybka první cesty, ne trvalý zámek.

---

## 3. Kontextový engine

`useVypravecContext()` — čistá derivace bez fetchů: `location` + `WorldContext` (worldId, world, isPJ, userRole, character, loading) + auth store + onboarding store →

```ts
interface VypravecCtx {
  scope: 'ikaros' | 'world' | 'chat' | 'admin';
  route: string; params: Record<string,string>;
  audience: VypravecAudience;
  world?: { slug: string; name: string; system: string; accessMode: string };
  worldState?: { hasCharacter: boolean; membershipPending: boolean };
  homeTopics: HelpTopic[];             // match route + audience, filtr done-logu
  activeJourney?: { journey: Journey; contextWorldId?: string;
                    currentStep: JourneyStep; progress: number;
                    inForeignWorld: boolean };   // true → lišta sbalená do badge
}
```

Odpověď „kde jsem" = šablona nad `RouteHeader` + rolí; nulový BE dotaz. Proaktivitu emituje engine jako `VypravecMoment` (jen 4 povolené typy dle anti-Clippy ústavy, viz [03-interakcni-model.md](03-interakcni-model.md)); renderuje jediný `VypravecHost`.

---

## 4. Checklist engine

```ts
type DoneCondition =
  | { kind:'fe-event'; event: string;
      match?: { worldId?: 'contextWorldId'; channelKind?: ChannelKind; pageType?: string } }
  | { kind:'probe';   key: ProbeKey }       // probe klíče se vyhodnocují nad contextWorldId cesty
  | { kind:'visit';   route: RoutePattern; scoped?: boolean };   // scoped → jen ve světě cesty (05 §3)
```

- **FE event bus** (`vypravecEvents.emit`, ~8–10 jednořádkových emitů v existujících mutation-success handlerech: world.created, page.created, message.sent, dice.rolled, join.requested, invite.created, member.approved, rsvp.confirmed, persona.chosen…). **Eventy nesou payload `{worldId?, channelKind?}`** — emit je stále jednořádkový, data má success handler k dispozici. `match` v DoneCondition pak filtruje: krok 5 cesty 26.1 („Napiš do svého světa") = `message.sent` + `worldId: 'contextWorldId'` → zpráva v Putyce ho nesplní ani nezkreslí aha-metriku PJ; totéž `dice.rolled`. Eager stub bufferuje eventy do dohrání enginu.
- **Krok 4 (accessMode):** ŽÁDNÝ nový event — **probe z `WorldContext.world.accessMode`** (data už FE má); `invite.created` a nábor zůstávají eventy. Pravidlo obecně: co je čitelné ze stavu, řeš probem, ne eventem.
- **Probe rekonsiliace:** při otevření panelu / vstupu na routu cesty se `probe` kroky přepočítají z dat, která FE má nebo levně dotáhne (reuse react-query cache: `['worlds','my']` z `useMyWorlds()`; `WorldContext.character`; počty stránek/členů — vždy scopováno na `contextWorldId`). Probe běží **jen při aktivní cestě** — žádná plošná zátěž BE.
- **Pravidlo:** kde existuje probe, je zdrojem pravdy; event jen okamžitě spouští oslavu (event se může ztratit, stav ne). Kroky = idempotentní derivace stavu → auto-odškrtnou se zpětně; checklist nikdy nelže.
- **Multi-device:** MVP bez nového WS — splněný krok se POSTne, ostatní zařízení dotáhnou při dalším loadu (krátká nekonzistence přiznaná). V2: WS signál `onboarding:updated {userId}` dle vzoru `universe:updated` (signál bez dat → refetch).

---

## 5. Persistence

### 5.1 BE modul `user-onboarding`

NestJS + Mongo, ~1 den práce, nulové provozní náklady:

```ts
UserOnboardingState {
  userId,
  persona: 'pj'|'hrac'|'worldbuilder'|null,
  journeys: { [journeyId]: {
    startedAt, contextWorldId?,                  // §2.1 — fixace světa cesty
    steps: { [stepId]: doneAt }, pausedAt?, dismissedAt?,
    waiting?                                     // WaitingState — jen cesta hráče, viz 05 §4
  } },
  seenRoutes: string[], dismissed: string[],     // bubliny/tipy — nikdy neopakovat
  milestones: { [id]: at },
  mode: 'active'|'onCall',
  lastSeenChangelog?: string,
  backfilled?: boolean,                          // §5.4
  updatedAt
}
```

Endpointy: `GET /users/me/onboarding` · `PATCH /users/me/onboarding` · JwtAuthGuard, žádné role. Zápisy debounced 2 s batch.

### 5.2 Merge sémantika PATCH (závazná — lekce race 23.5)

Plošné last-write-wins je pro pole **ztrátové** (mobil + desktop si přepíšou `dismissed` → zavřená bublina se vrátí = porušení ústavy „zavřené se nikdy neopakuje"). BE merguje per typ:

| Data | Merge na BE |
|---|---|
| `seenRoutes`, `dismissed` | **set-union** (jen rostou) |
| `milestones` | merge per id, při konfliktu `min(at)` |
| `journeys[].steps` | merge per stepId, `min(doneAt)` |
| `journeys[].contextWorldId` | first-write-wins (fixace se nemění; změna jen explicitním restartem cesty) |
| skaláry (`persona`, `mode`, `lastSeenChangelog`, `pausedAt`, `dismissedAt`) | last-write-wins |

**Povinný test: A→B→A přes dvě „zařízení"** (dva klienti střídavě PATCHují; dismissed z obou přežije, žádný krok se „neodškrtne zpět").

### 5.3 localStorage + odolnost zápisů

`vypravec:{userId}`: cache pro okamžitý render + jediný zdroj pro anonyma (seenRoutes, dismissed); po registraci jednorázový **delta merge** do BE (persistence test A→B→A dle fb_persist_variants; ztráta při smazání storage akceptovaná — rozhodnutí 12).

**Flush strategie:** localStorage se zapisuje **vždy první** (synchronně, zdroj obnovy); PATCH debounced 2 s; na `visibilitychange`/`pagehide` **flush přes `navigator.sendBeacon`** (zavření tabu/mobilního prohlížeče do 2 s po splnění kroku nesmí ztratit zápis); nepotvrzené delty (pending fronta v localStorage) se **re-POSTnou při dalším loadu**. Merge sémantika §5.2 dělá re-POST idempotentní.

### 5.4 Backfill existujících účtů

Moment „post-registrace" u existujících účtů (22 migrovaných Matrix účtů, vlastník, admini) nikdy nenastane — bez ošetření by dostali záplavu bublin „Poprvé tady?" a retroaktivní oslavy starých světů. **Při prvním GET bez UserOnboardingState:** účet s `createdAt` starším než datum nasazení Vypravěče →

1. seed `seenRoutes` = aktuální routy z registru (žádné „poprvé tady" na místech, která znají roky),
2. milníky odvoditelné probem označit done **BEZ oslavy** (oslavu spouští výhradně event, nikdy backfill/probe),
3. **žádné auto-otevření persona dialogu** — místo něj jednorázová badge/bublina „Chceš, abych tě provedl?" (dismiss → nikdy víc),
4. `backfilled: true` (diagnostika + vyloučení z funnel metrik nových registrací).

### 5.5 Self-delete cleanup

Dle vzoru project_self_deletion_architecture (event-driven cleanup): modul `user-onboarding` **poslouchá user-deleted event** → smaže `UserOnboardingState` + smaže/anonymizuje záznamy telemetrie s daným `userId`. Bez toho by telemetrie držela osobní identifikátor po smazání účtu (GDPR).

### 5.6 Telemetrie (jedna, sjednocená)

`POST /vypravec/telemetry` (batch, fire-and-forget, flush přes sendBeacon jako §5.3) → Mongo kolekce s **TTL 90 dní**.

- **FE eventy:** funnel (persona_chosen, step_done, aha; stupeň „registrace" = BE, vytvořený účet — viz 05 §9.1) + obsah (topic_open, search_miss, no_topic, feedback ±, dismissed).
- **`return_d2`/`return_d7` NEJSOU FE eventy** — FE neví, že jde o návrat, a při nepřihlášení event nikdy neodejde. **Návratovost počítá vyhodnocovací skript** (`npm run vypravec:funnel`) z `updatedAt`/`lastSeen` v UserOnboardingState a z timestampů telemetrie.
- **GDPR přesně:** telemetrie nese `userId` (funnel per-user, „dohnat odpadlého osobně" — je to osobní údaj, ne „GDPR-lite bez ID"); žádná entity ID světů/stránek; query truncate 200 znaků; TTL 90 dní; výmaz při smazání účtu (§5.5). Vše explicitně popsat v /soukromi.

Vyhodnocení: `npm run vypravec:gaps` (obsahové díry) + funnel skript; admin UI v /admin až v2.

---

## 6. Vyhledávání

**MiniSearch client-side** (~7 kB gz) nad registrem — **NE MeiliSearch** (projektový model je per-svět s povinným worldId + známý tichý fail; nápověda je globální a statická). Build skript `build-vypravec-index.ts` vyrenderuje `searchText` (z md/blocks; u `component` povinný ručně, vynucený typem) a serializovaný index jako **lazy JSON chunk** (fetch až při otevření vyhledávání). `processTerm` = diakritický fold (bez něj čeština nenajde nic); `tags` = synonymický můstek žargonu. Audience filtr až při renderu (hráč najde i PJ topik s `minAudienceNote`). Priorita: první kandidát na řez při skluzu (stretch S2) — hlavička + kontextové karty + menu ho suplují.

---

## 7. Theming

- **Mimo svět:** plná brand grafika (WebP + PNG fallback, `loading="lazy"`, `fetchpriority="low"`).
- **Uvnitř světa:** jednobarevná silueta přes CSS `mask-image` + `currentColor`, obarvená tokenem motivu; bubliny/panel výhradně tokeny (`var(--surface)`, `var(--accent)`, `rgb(var(--overlay)/α)`). Jedna silueta = rozpoznatelnost napříč 12 motivy bez per-motiv assetů.
- Vypravěč **nikdy nesahá na `:root`** (theme_root_ownership), jen čte tokeny; žije **mimo** 8 skinovaných ploch deníku (FAB v layoutu, ne v DiaryTab). Žádné hardcoded barvy (lint:colors).

---

## 8. Lazy loading / výkon

Rozpočet **eager < 10 kB gz** (jinak Vypravěč rozbije LCP ≤ 2,5 s bránu plny-auditu): eager jen FAB + inline silueta SVG + route-match nad metadata chunkem + event-bus stub (buffer). `import()` při prvním otevření: panel, journey engine, plný registr. Při hledání: MiniSearch + index. Per topik: body. Onboarding GET po `requestIdleCallback`, render z localStorage cache. Proaktivita na úvodníku až po LCP.

---

## 9. Brain šev

```ts
interface VypravecBrain { answer(q: string, ctx: VypravecCtx): Promise<VypravecAnswer> }
```

**MVP `DeterministicBrain`:** MiniSearch → top topik → šablonová odpověď + deep-link; bez shody poctivý fallback (replika 8) — nikdy nehádá. **V3 `LlmBrain` za feature flagem:** BE proxy `POST /vypravec/ask` — RAG nad top-5 topiky (searchText), levný model (Haiku), striktní instrukce citovat jen topiky, rate-limit per user, cache per (hash otázky, route), rozpočtový strop, klíč jen na BE. Šev je v MVP zadarmo; LLM = výměna implementace, ne přestavba.

---

## 10. Povinné testy architektury (souhrn)

| Test | Kryje |
|---|---|
| Merge A→B→A přes 2 zařízení (dismissed, steps) | §5.2 — set-union vs. LWW |
| Anonym → registrace delta merge A→B→A | §5.3, fb_persist_variants |
| PJ cesty ve světě A + role Hrac ve světě B | §2.1 — contextWorldId scoping lišty/probe/deep-linků |
| `message.sent` v Putyce NEsplní krok „Napiš do svého světa" | §4 — event match worldId |
| Backfill: starý účet → žádné bubliny/oslavy, žádný auto-open persony | §5.4 |
| Self-delete → UserOnboardingState + telemetrie pryč | §5.5 |
| Re-POST pending delty po zabitém tabu | §5.3 — sendBeacon/idempotence |
| Router↔route registr parita · mrtvé odkazy · unikátní ID · kotvy `data-vypravec` | registr, viz [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) §7 |
| Soft-report `status` topiku vs. 🚧/✅ v docs/funkce/ | §2 — pole `status` |
