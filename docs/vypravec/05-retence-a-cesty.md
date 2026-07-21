# 05 — Retence a cesty

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 26.1–26.4 (cesty + volba persony), 26.5 (návody, v2), 28.2 (vyhodnocení bety)
Sousední podklady: [02-persona-a-grafika.md](02-persona-a-grafika.md) (style-guide replik) · [03-interakcni-model.md](03-interakcni-model.md) (bubliny, lišta kroku, kolizní plochy) · [04-architektura.md](04-architektura.md) (persistence, eventy, probe, telemetrie, backfill)

Retenční princip: vztah s postavou, ne mechanika. Žádné body/streaky/badges — progres = done-log prezentovaný Ishidou. Cíl: první úspěch persony do minut, sociální akce ≤ 24 h, důvod k návratu.

---

## 1. Volba persony (26.4)

Jediné auto-otevření panelu vůbec: 1× po registraci, přeskočitelné 1 klikem, **není modal/fullscreen** (Vypravěč nesmí začínat vztah overlayem, který sám zakazuje). Replika: *„Zdravím tě, příteli. Jsem Ishida — tohle místo jsem stvořil a znám každý jeho kout. Než vykročíš: chceš vést hru, hrát, nebo tvořit svět?"*

| Volba | Akce |
|---|---|
| Chci vést hru | start cesty `pj-start` (26.1) |
| Chci hrát | MVP stretch S1: lehký checklist `hrac-start` (26.2); jinak kurátorovaný rozcestník |
| Chci stavět svět | rozcestník topiků; plná cesta 26.3 v2 |
| Jen se rozhlédnu | Vypravěč ustoupí; volba kdykoli později z menu Cesty |

**Persona = výhybka první cesty, NE trvalý zámek** (oprava kritiky): kdykoli lze z menu Cesty spustit jinou cestu i změnit personu. **Max 1 aktivní cesta**, ostatní pauznuté; přepnutí kdykoli z menu. `persona_chosen` se persistuje (telemetrie + `UserOnboardingState.persona`).

**Existující účty** (migrovaných 22 Matrix účtů, admini): moment post-registrace nenastane → místo auto-open jednorázová badge/bublina *„Chceš, abych tě provedl?"*; milníky odvozené probem se backfillnou jako done **bez oslavy** (oslavu spouští jen event) — detail [04-architektura.md](04-architektura.md).

---

## 2. Model cesty a scope na svět

```ts
interface Journey { id: string; persona: 'pj'|'hrac'|'worldbuilder';
                    estimateMin: number; phases: { title: string; steps: JourneyStep[] }[] }
// Zkrácený tvar; plná definice vč. `worldBinding: 'creates'|'joins'|'none'` je v 04 §2.1.

interface JourneyStep {
  id: string;                  // 'pj.zaloz-svet'
  title: string;
  narratorLine: string;        // Ishidova replika dle style-guide (02): ≤200 znaků, max 2 věty, tykání
  cta: { label: string; to: string };  // ':worldSlug' doplní engine z contextWorldId
  anchor?: AnchorId;
  done: DoneCondition;
  topicId?: string;            // „chci vědět víc"
  skipAllowed: true; estMin: number;
}

type DoneCondition =
  | { kind:'fe-event'; event: string; match?: EventMatch }  // event = trigger oslavy, ne zdroj pravdy
  | { kind:'probe';    key: ProbeKey }                      // zdroj pravdy; čte contextWorldId implicitně
  | { kind:'visit';    route: RoutePattern; scoped?: boolean };

// Oprava kritiky (done díry): eventy nesou payload, kroky matchují
interface EventMatch { worldId?: 'contextWorldId'; channelKind?: 'world'|'putyka'|'camp'; pageType?: string }

interface JourneyProgress {           // v UserOnboardingState (04)
  contextWorldId?: string;            // zafixuje se splněním kroku 1; u existujícího světa výběrem
  startedAt: string; steps: Record<string, string /*doneAt*/>;
  pausedAt?: string; dismissedAt?: string;
  waiting?: WaitingState;             // jen cesta hráče, §4
}
```

**Scope (oprava kritiky — cesta bez vazby na svět je nedefinovaná u PJ se 2 světy / uživatele ve 3 rolích):**
- `contextWorldId` se zafixuje splněním kroku 1 (payload `world.created`), případně výběrem existujícího světa.
- Kroky 2–5 cesty 26.1: všechny probe, visit i deep-linky **scopované na contextWorldId**; `message.sent` v Putyce krok 5 nesplní (match `channelKind:'world'` + worldId).
- Lišta kroku se v **jiném světě** sbalí do badge *„cesta pokračuje ve světě X"* s navigate CTA — krok „První NPC" se nikdy nezobrazí ve světě, kde je uživatel jen Hráč.
- Persistence test povinný: PJ cesty ve světě A + role Hráč ve světě B (A→B→A).

**Pravidla enginu** (detail [04-architektura.md](04-architektura.md)): probe = zdroj pravdy, event = jen okamžitý trigger oslavy; kroky idempotentní derivace stavu → auto-odškrtnutí zpětně (checklist nikdy nelže); `accessMode` se detekuje probem z `WorldContext.world.accessMode`, ne eventem. Zápisy: localStorage první, PATCH debounced + flush přes `sendBeacon`/`visibilitychange`, nepotvrzené delty re-POST při dalším loadu.

**Pauza/obnova:** obnova kdykoli z menu Cesty; při dalším loginu s aktivní cestou max 1 bublina/session *„Pokračujeme u kroku 4?"* [Jo] [Později] [Zrušit cestu] — žádný guilt-trip. Obnova začíná probe resyncem. Fázování: max 5 viditelných kroků naráz (empirie: 3 kroky = 72 % dokončení, 7 = 16 %).

---

## 3. Cesta 26.1 — PJ Start (MVP, plná)

Cíl ~15 min · mezi-aha ≤ 5 min · cílová dokončenost ~70 %. Krok = úkol v reálném UI, nikdy tooltip sekvence.

```ts
const PJ_START: Journey = { id:'pj-start', persona:'pj', estimateMin:15, phases:[

{ title:'Postav svět', steps:[
  { id:'pj.zaloz-svet', title:'Založ svět',
    narratorLine:'Stačí název, žánr a systém — zbytek za tebe rozumně přednastavím. Jen pozor: technologie, magie a náboženství se volí jen teď.',
    cta:{ label:'Založit svět', to:'/ikaros/vytvorit-svet' },
    // event zafixuje contextWorldId z payload.worldId; probe kryje ušlý event
    // (hasOwnWorld → má-li už světy, výběr světa = zafixování contextWorldId)
    done:{ kind:'fe-event', event:'world.created' },   // + probe 'hasOwnWorld'
    topicId:'svet.zalozeni',   // TÚ/magie/náboženství jen při tvorbě; svět vzniká Soukromý
    skipAllowed:true, estMin:5 },

  { id:'pj.rozhledni-se', title:'Rozhlédni se',
    narratorLine:'Svět není prázdný. Předchystal jsem ti pravidla, měny i kalendář — projdi si, co už stojí.',
    cta:{ label:'Ukaž mi můj svět', to:'/svet/:worldSlug' },
    done:{ kind:'visit', route:'/svet/:worldSlug', scoped:true },   // jen dashboard contextWorldId
    topicId:'svet.neni-prazdny',   // 6 seedovaných stránek + měny + kalendář = mezi-aha ≤5 min
    skipAllowed:true, estMin:2 },
]},

{ title:'Oživ ho', steps:[
  { id:'pj.prvni-npc', title:'První NPC',
    narratorLine:'Svět ožije postavami. Založ první NPC — nebo si ho vypůjč z bestiáře systému, ať nezačínáš od nuly.',
    cta:{ label:'Založit NPC', to:'/svet/:worldSlug/nova-stranka?typ=npc' },
    done:{ kind:'fe-event', event:'page.created',
           match:{ worldId:'contextWorldId', pageType:'npc' } },   // + probe 'pagesAboveSeed' (scoped)
    topicId:'postava.3-tier', skipAllowed:true, estMin:4 },

  { id:'pj.otevri-branu', title:'Otevři bránu a pozvi lidi',
    narratorLine:'Tvůj svět je zatím soukromý — nikdo cizí se dovnitř nedostane. Otevři přístup, pošli pozvánku, nebo vyvěs nábor.',
    cta:{ label:'Nastavení přístupu', to:'/svet/:worldSlug/nastaveni#pristup' },
    // Oprava kritiky: accessMode NENÍ event — probe z WorldContext.world.accessMode
    done:{ kind:'probe', key:'gateOpened' },
    // gateOpened(ctx) = accessMode !== 'private' ∨ invite.created{worldId} ∨ nábor pro contextWorldId
    topicId:'svet.vstup', skipAllowed:true, estMin:3 },

  { id:'pj.napis-do-sveta', title:'Napiš do svého světa',
    // Oprava kritiky: replika se doručí PŘED vstupem do composeru (kolizní plocha, viz 03)
    narratorLine:'Otevřu ti Globální konverzaci tvého světa. Napiš cokoli — třeba pozdrav pro budoucí hráče.',
    cta:{ label:'Otevřít chat světa', to:'/svet/:worldSlug/chat' },
    done:{ kind:'fe-event', event:'message.sent',
           match:{ worldId:'contextWorldId', channelKind:'world' } },  // Putyka NEsplní
    topicId:'svet.chat.kanal-vs-konverzace', skipAllowed:true, estMin:1 },
]}]};
```

Krok 5 a kolizní plocha (oprava kritiky): v composeru se kotva skryje a lišta cesty **sbalí do minimalizovaného proužku s textem kroku** (nikdy úplné zmizení; mobil s klávesnicí: tenký proužek nad ní) — instrukce je doručená předem u CTA, `message.sent` už jen potvrdí. Oslava dokončení cesty se doručí až mimo kolizní plochu. Detail [03-interakcni-model.md](03-interakcni-model.md).

Krok 1 vede přes **minimální povinná pole** (název + žánr + systém, zbytek defaulty) a **předem varuje před pastmi** (TÚ/magie/náboženství jen při tvorbě; svět vzniká Soukromý — proto krok 4). „Rychlá volba" ve wizardu = v2, jen pokud telemetrie ukáže přetékání kroku 1 (otevřené rozhodnutí 8 syntézy).

---

## 4. Cesta 26.2 — Hráč (MVP stretch S1 jako celý blok; jinak rozcestník)

Cíl ~7 min. **Cesta má jen 2 odškrtávací kroky + čekací stav** (oprava kritiky: krok závislý výhradně na akci PJ porušuje „krok = úkol v reálném UI" a progress 2/3 navždy demotivuje).

```ts
const HRAC_START: Journey = { id:'hrac-start', persona:'hrac', estimateMin:7, phases:[
{ title:'Najdi si stůl', steps:[

  { id:'hrac.najdi-stul', title:'Najdi stůl',
    narratorLine:'Světy mají čtyři režimy přístupu — někam vejdeš rovnou, jinde se klepe. Vyber si, kde chceš hrát.',
    cta:{ label:'Procházet světy', to:'/ikaros/vesmiry' },      // sekundární link: /ikaros/nabory
    done:{ kind:'visit', route:'/ikaros/vesmiry' },             // ∨ visit /ikaros/nabory
    topicId:'svet.vstup',   // 4 accessMode + „Chci hrát" vs. „Jen číst" (detail: svet.vstup.hrat-vs-cist)
    skipAllowed:true, estMin:3 },

  { id:'hrac.ozvi-se', title:'Ozvi se',
    narratorLine:'Požádej o vstup do světa, který tě zaujal — nebo se zatím ohlas v Putyce. První slovo je nejtěžší.',
    cta:{ label:'Chci hrát', to:'/svet/:worldSlug' },                // fallback CTA: 'Otevřít Putyku' → /chat
    done:{ kind:'fe-event', event:'join.requested' },           // payload.worldId → contextWorldId
    // ∨ message.sent{channelKind:'putyka'|'camp'} ∨ odpověď na nábor
    topicId:'svet.zadatel', skipAllowed:true, estMin:3 },
]}]};
```

**Fallback prázdné bety:** není-li vhodný svět, krok 2 míří rovnou do Putyky/Campu — sociální akce nesmí čekat na schválení PJ. Cíl „uvítací svět" (25.4, publicShowcase) = rozhodnutí vlastníka 4; Vypravěč nikdy neslibuje, co katalog nedá. Avatar/Postava v Campu = volitelný dodatek po cestě, ne krok (hodnota před kosmetikou).

**Čekací stav (NENÍ JourneyStep):** po splnění kroku 2 žádostí o vstup se cesta označí **„hotovo z tvé strany"** + oslava: *„Z tvé strany hotovo. Teď je řada na PJ — dám ti vědět, až se brána otevře."*

```ts
interface WaitingState {
  worldId: string;               // z join.requested → contextWorldId
  since: string;
  resolveProbe: 'hasCharacter';  // WorldContext.character, scoped na worldId
  timeoutDays: 7;
  timeoutTipShown?: string;      // max 1×, dismissable
}
```

- **Informační karta** v panelu (menu Cesty): stav žádosti (`membershipPending`), replika few-shot 3: *„Tvoje žádost leží u PJ. Než ji schválí, dovnitř nesmí nikdo — ani já ti bránu neotevřu. Stav vidíš na dashboardu světa. Čekání není chyba."* Žádný progress „2/3 navždy".
- **Probe `hasCharacter`** (při loadu / vstupu do světa) → dodatečná bublina: *„Postava je na světě. Najdeš ji pod Moje postava — pojď se na ni podívat."* CTA `/svet/:worldSlug/moje-postava`. Zároveň vysvětlení, že postavu zakládá PJ (few-shot 2).
- **Timeout 7 dní bez schválení** → tip (1×, zavíratelný): *„PJ se zatím neozval — to se stává. Zkus jiný svět, nebo pověs lístek na nábory."* CTA `/ikaros/nabory`. Čekací stav běží dál (žádost nerušíme za uživatele).

---

## 5. Cesta 26.3 — Worldbuilder (v2; MVP jen rozcestník)

MVP: rozcestník topiků (svět jako ateliér · wiki + [[wikilink]] · Pavučina · výkladní skříň). Plná cesta v2 (~15 min), engine totožný — přidání je obsahová práce:

```ts
const WORLDBUILDER: Journey = { id:'wb-start', persona:'worldbuilder', estimateMin:15, phases:[
{ title:'Postav si ateliér', steps:[
  { id:'wb.zaloz-atelier', title:'Založ svět',
    narratorLine:'Tvůj ateliér. Doporučuji ho zatím nechat soukromý — ukázat ho světu můžeš, až bude na co koukat.',
    cta:{ label:'Založit svět', to:'/ikaros/vytvorit-svet' },
    done:{ kind:'fe-event', event:'world.created' },   // → contextWorldId; + probe hasOwnWorld
    topicId:'svet.zalozeni', skipAllowed:true, estMin:5 },
  { id:'wb.prvni-stranka', title:'První vlastní stránka',
    narratorLine:'Založ lokaci a zkus v textu [[wikilink]] — stránky se ti začnou samy propojovat.',
    cta:{ label:'Nová stránka', to:'/svet/:worldSlug/nova-stranka?typ=lokace' },
    done:{ kind:'fe-event', event:'page.created', match:{ worldId:'contextWorldId' } }, // + probe pagesAboveSeed
    topicId:'svet.wiki.wikilinky', skipAllowed:true, estMin:4 },
]},
{ title:'Ukaž ho', steps:[
  { id:'wb.pavucina', title:'První vztah v Pavučině',
    narratorLine:'Pavučina drží vztahy tvého světa pohromadě. Přidej první subjekt a propoj ho s tím, co už máš.',
    cta:{ label:'Otevřít Pavučinu', to:'/svet/:worldSlug/pavucina' },
    done:{ kind:'probe', key:'hasPavucinaSubject' },   // scoped contextWorldId
    topicId:'svet.pavucina', skipAllowed:true, estMin:4 },
  { id:'wb.ukaz-to', title:'Ukaž to světu',
    narratorLine:'Výkladní skříň pustí čtenáře k vybraným stránkám, aniž bys otevíral celý svět. Vystav, na co jsi hrdý.',
    cta:{ label:'Nastavení přístupu', to:'/svet/:worldSlug/nastaveni#pristup' },
    done:{ kind:'probe', key:'publicShowcaseOn' },     // ∨ event share (ShareButton)
    topicId:'svet.vykladni-skrin', skipAllowed:true, estMin:2 },
]}]};
```

**Rozhodnutí o počtu cest (platí):** MVP = 1 plná cesta (26.1 — testeři vlny 1 zakládají světy) + rozcestníky; 26.2 jen jako **celý** stretch blok S1 (fb_no_debt: řežou se celé cesty, ne půlky tří).

---

## 6. Milníky a oslavy

Oslava = 1 replika + zápis do done-logu. Žádná konfeta, badge ani modal; bublina auto-zmizí po 8 s; na kolizní ploše se doručí až po odchodu z ní. Max 1 emoji. Šablona OSLAVA viz [06-obsah-a-udrzba.md](06-obsah-a-udrzba.md) §4.6.

| Milník | Detekce | Kdy |
|---|---|---|
| Dokončený krok cesty | done podmínka kroku | MVP |
| První svět | `world.created` (probe backfill bez oslavy) | MVP |
| První hráč ve tvém světě | event `member.approved` {worldId} (trigger oslavy) + probe: člen role Hráč+ ≠ PJ ve vlastním světě (zdroj pravdy, tiché done) — pro PJ nejsilnější retenční moment | MVP |
| „Hotovo z tvé strany" (hráč) | splnění kroku `hrac.ozvi-se` | MVP (se stretch S1) |
| První postava · první hod kostkou · první publikovaný obsah | event + probe | v2 |

**Oslavu spouští výhradně event** — probe jen tiše doplní done (jinak by backfill existujících účtů retroaktivně slavil roky starý svět; oprava kritiky). Proto milník „První hráč" potřebuje vlastní event `member.approved` (emit v mutation-success handleru schválení žádosti v UI PJ, payload `{worldId}`) — bez něj by byl detekovatelný jen probem, a tedy neoslavitelný; probe zůstává zdroj pravdy. Heuristika „první session" (30 zpráv/h, combat.start) **se nezavádí vůbec** — selhává u play-by-post a na kohortě 10–30 lidí je šum. Neslavíme drobnosti (login, avatar) — inflace oslav zabíjí hodnotu.

---

## 7. Graduace a ticho

MVP dva režimy: **aktivní / jen na zavolání** (přepínač v profilu) + implicitní pravidlo: **3 po sobě zavřené proaktivní bubliny bez interakce → auto-tichý režim** + jednorázové ohlášení *„Nebudu rušit. Kdybys mě potřeboval, víš, kde mě najdeš."* Snadné znovu-zapnutí z panelu (riziko: uživatel zavíral ve spěchu, ale pomoc chce).

**Vztah k aktivní cestě (oprava kritiky):** auto-tichý režim tlumí **jen proaktivní bubliny a badge**; aktivní cesta (lišta kroku, mini-progress) běží dál — je explicitně vyžádaná. Do čítače 3 zavření se počítají **jen tipy momentů typu 2 a 3** (první vstup do sekce, zákys) — ne oslavy, ne repliky vyžádané klikem.

V2: tři fáze vztahu (Průvodce → Společník → Kronikář), readiness-based odemykání pokročilých témat (LoS až po první scéně, UVTT/Stavitel po 2+ scénách, Storyboard po 5+ stránkách, PJ persona po prvním týdnu chatu), narativní Kronika jako UI. V MVP je kronika jen interní done-log.

---

## 8. Push politika

**Beta: žádná nová push kategorie, žádné připomínky.** Jediná povolená změna (stretch S4): texty UŽ existujících notifikací (schválení žádosti, nový člen) dostanou Ishidův hlas — čistě textová úprava, nulové riziko. Zdůvodnění: špatně načasovaný personifikovaný push poškodí důvěru v postavu víc než v platformu; u první kohorty je důvěra vše.

V2 (rozhodnutí vlastníka 5): kategorie `vypravec` (profil → Notifikace) + max 1 kontextová připomínka nedokončené cesty **jen s reálnou hodnotou** (*„PJ schválil tvou žádost — tvá postava čeká"*), nikdy guilt-trip.

---

## 9. Metriky a trychtýř

### 9.1 Trychtýř per persona

registrace → volba persony (cíl > 80 %) → krok 1 → **aha akce** → sociální akce ≤ 24 h → návrat D2 → návrat D7

| Stupeň | Definice | Zdroj |
|---|---|---|
| registrace | vytvořený účet | BE |
| persona_chosen | volba v dialogu 26.4 (vč. „Jen se rozhlédnu") | FE telemetrie |
| step_done | done kroku (id, journeyId, contextWorldId se neposílá — jen bool „scoped") | FE telemetrie |
| aha | per persona, viz 9.2 | FE telemetrie (event `aha`) |
| sociální ≤ 24 h | `message.sent` ∨ `join.requested` ∨ `invite.created` ∨ nábor, do 24 h od registrace | skript nad telemetrií (timestampy) |
| návrat D2 / D7 | **NE FE event** (oprava kritiky — FE neví, že jde o návrat, a při nepřihlášení event neodejde): vyhodnocovací skript počítá z `UserOnboardingState.updatedAt` / timestampů telemetrie | BE skript |

### 9.2 Aha akce per persona (rozhodnutí vlastníka 11)

| Persona | Aha akce |
|---|---|
| PJ | svět + první NPC (`world.created` + `page.created{pageType:'npc'}` v témže světě) |
| Hráč | první zpráva (`message.sent`, jakýkoli channelKind) ∨ žádost o vstup (`join.requested`) |
| Worldbuilder | svět + první vlastní stránka nad seed |

### 9.3 Instrumentace

Jedna telemetrická kolekce (detail [04-architektura.md](04-architektura.md)): `POST /vypravec/telemetry` batch fire-and-forget, Mongo TTL 90 dní. Eventy: funnel (`persona_chosen`, `step_done`, `aha`) + obsahové díry (`topic_open`, `search_miss`, `no_topic`, `feedback ±`, `dismissed`). `return_d2/d7` ze seznamu FE eventů **vyškrtnuto**. Feedback ± vzniká v patičce TopicView *„Pomohlo ti to?"* [Ano] [Ne] (textově, bez emoji — style-guide 02) (oprava kritiky — event musí mít odkud vzniknout; UI viz [03-interakcni-model.md](03-interakcni-model.md)). Flush přes `sendBeacon`/`visibilitychange`, localStorage první.

**GDPR (oprava kritiky):** telemetrie nese `userId` = osobní identifikátor („GDPR-lite bez entity ID" platí jen pro ID světů/stránek a truncate query na 200 znaků). Proto: kolekce telemetrie + `UserOnboardingState` **zapojené do self-delete cleanup eventu** (smazat/anonymizovat), přesný popis v `/soukromi`: co se sbírá, TTL 90 dní, vazba na účet, výmaz při smazání účtu.

### 9.4 Vyhodnocení

MVP: `npm run vypravec:gaps` + funnel skript, ruční týdenní odečet; admin UI v `/admin?tab=prehled` = v2 (navázat na 15B.7/19.1, nevymýšlet paralelní systém). Sekundárně: drop-off per krok (= konkrétní bug Vypravěče), % implicitních vs. explicitních vypnutí (vysoké implicitní = Vypravěč otravuje).

**Kvalita > kvantita:** kohorty ~10–30 testerů = statistický šum → každého odpadlého dohnat osobně (Discord) a ptát se „kde ses zasekl"; čísla číst jako indicie, ne důkazy; **design cest neměnit uprostřed vlny**.

---

## 10. Anti-dark-patterns kodex (závazný)

- Žádné streaky, badges, body, žebříčky; done-log je popisný, ne soutěžní.
- Push jen s reálnou událostí (beta: žádný nový push vůbec, §8).
- Vše zavíratelné 1 tapem; zavřené se **nikdy** neopakuje (persistováno, set-union merge — [04-architektura.md](04-architektura.md)).
- Globální vypínač v profilu; auto-tichý režim po 3 zavřených tipech (§7).
- Vypravěč nikdy nelže a nepřehání; u 🚧 funkcí říká pravdu (zdroj `docs/funkce/`, pole `status` topiku).
- Nikdy neradí k akci v done-logu; nikdy nepřerušuje aktivní vstup.
- Vypravěč = doručovací vrstva nad jedním registrem — nikdy šestá kopie textů.
- Timeout čekacího stavu (§4) nabízí alternativu, nikdy neviní uživatele ani PJ.
