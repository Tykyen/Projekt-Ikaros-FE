# 06 — Obsah a údržba (výrobní linka, šablony, priority, CI)

Stav: podklad · 2026-07-20 · Vazby: roadmap3 fáze 25.3 (rytmus komunikace), 26.1–26.5 (cesty a návody), 28.2 (vyhodnocení bety), 28.4 (changelog)
Sousedé: [01-mapa-prostoru.md](01-mapa-prostoru.md) (odkud se bere CO psát) · [04-architektura.md](04-architektura.md) (registr, typy, persistence)

---

## 1. Řetěz pravdy

**kód → `docs/funkce/` (kódem ověřená inventura) → registr (`src/shared/vypravec/registry/`) → doručovací plochy** (panel Vypravěče, HelpPage, in-situ „?", empty-states).

Pravidla:
- Topik nesmí obsahovat tvrzení mimo příslušnou kapitolu `docs/funkce/`. Kotví to pole `source: {kapitola, sekce?}` + `verifiedAt` (datum posledního ověření proti funkce).
- Kdo mění funkčnost: nejdřív skill `funkce`, pak topik. HelpPage a „?" modaly se postupně stávají renderery registru — přestávají mít vlastní text.
- **Od dne 1: nové help texty vznikají VÝHRADNĚ v registru** (PR konvence). Hardcoded bublina „na rychlo" = zárodek šestého zdroje pravdy, hlavní riziko celé feature.
- Doručovací plocha nikdy netransformuje význam — jen renderuje (jiný ořez délky ano, jiné tvrzení ne).

## 2. Vztah k friendly-messaging vrstvě (závazná oprava kritiky)

Projekt už má hotovou vrstvu přívětivých 403/404 hlášek FE+BE (rule friendly-messaging). Vypravěč ji **nenahrazuje ani neduplikuje** — deklarovaný vztah dvou linií:

| Linie | Co | Kdo doručí | Zdroj textu |
|---|---|---|---|
| 1. linie | krátká friendly hláška v místě chyby („co se stalo") | existující FE error UI | pole `shortMessage` chybového topiku (postupná migrace; do migrace dnešní hardcoded text) |
| 2. linie | „PROČ a co dál" + akce | Vypravěč (bublina po 2. výskytu / kontextová karta) | `body` chybového topiku |

- Chybový topik nese OBĚ vrstvy: `shortMessage` (1 věta, 1. linie) + `body` (vysvětlení + akce). Jeden registrový záznam = jeden errorCode = žádný drift dvou formulací.
- Migrace hlášek na `shortMessage` běží postupně (per errorCode, ne big-bang); dokud errorCode má hardcoded friendly hlášku I topik, **CI kontroluje, že znění nejsou protichůdná** (min.: test drží tabulku errorCode → očekávaný klíčový termín/směr akce sdílený oběma texty; plná shoda až po migraci).
- Dvojí ozvání (hláška + bublina naráz) zakázáno: bublina Vypravěče se váže až na **2. výskyt téže chyby za session** (interceptor), 1. výskyt řeší jen 1. linie.

## 3. Výrobní linka (1 vývojář + AI)

```
docs/funkce/ kapitola
  ├─ sloupec „ZTRÁCÍ SE"  → chybové topiky + TIPy
  └─ sloupec „HOOKS"      → TOPIKy + NÁVODY
        ↓
AI draft dle šablon §4  (prompt ZAKAZUJE tvrzení mimo zdrojovou kapitolu)
        ↓
voice pass  (style-guide + few-shot repliky; ZDE se ručně plní HelpTopic.status)
        ↓
dev review diffu (čtení, ne psaní) → commit (git = verzování obsahu, deploy = deploy obsahu)
```

- Odhad: 1 kapitola `docs/funkce/` ≈ 8–15 jednotek ≈ ~2 h s AI (generace po kapitolách, review po dávkách).
- Zásada kvality: **raději poctivý fallback („Tenhle kout je neprobádaný i pro mě") než halucinace nebo strohý stub** — špatná odpověď postavy ničí důvěru víc než žádná. Žádné plošné AI stuby v MVP.
- **`HelpTopic.status: 'funkcni' | 'castecne' | 'stub'`** (oprava kritiky): `docs/funkce/` je markdown mimo build, runtime z něj číst nejde — pole status se plní **ručně při voice passu** podle značek 🚧/✅ zdrojové kapitoly. Vypravěč z něj za běhu poctivě říká, co reálně funguje. Strojová pojistka: CI soft-report §7.
- Backlog pro AI dodávají skripty: `vypravec:stale` (topiky starší než zdrojová kapitola) + `vypravec:gaps` (telemetrie děr §9) — každá položka je hotové zadání („na /svet/:slug/pocasi se 6× hledalo ‚posunout čas' → topik svet.pocasi.advance-day").

## 4. Šablony 6 jednotek

Společná pole všech jednotek: `id` (stabilní, deep-linkovatelný) · `source {kapitola, sekce?}` · `verifiedAt` · `audience?` · `since?`. Typy viz [04-architektura.md](04-architektura.md).

### 4.1 TOPIK — „co to je a co tu smím"

Struktura body (pořadí závazné): **Co to je** (1 věta) → **Co tu smíš TY** (role-aware; `minAudienceNote` pro to, co nesmí) → **1–3 akce** s deep-linkem/`navigate:` → **Souvisí s** (links). Délka 3–6 vět + akce. Patička TopicView: **„Pomohlo ti to? [Ano] [Ne]"** (textově dle style-guide; jediný zdroj telemetrického `feedback` eventu — oprava kritiky, bez patičky event nemá odkud vzniknout).

```ts
{
  id: 'svet.chat.kostky', title: 'Kostky v chatu',
  tags: ['kostky','dice','hod','házení','whitelist'],
  routes: ['/svet/:worldSlug/chat'], audience: undefined, status: 'funkcni',
  body: { kind: 'md', md: `
Kostky se hází přímo v chatu světa tlačítkem 🎲 v composeru — deník kostky nemá.
Jako hráč smíš házet jen kostkami, které PJ povolil (whitelist per svět).
**Akce:** [Otevři chat světa](navigate:/svet/:worldSlug/chat) · PJ: [Nastav whitelist](navigate:/svet/:worldSlug/nastaveni#zakladni)` },
  minAudienceNote: 'Whitelist kostek nastavuje tvůj PJ v Nastavení světa.',
  links: [{ label: 'Kanál vs. konverzace', to: 'svet.chat.kanal-vs-konverzace' }],
  source: { kapitola: '13', sekce: 'Hod kostkou' }, verifiedAt: '2026-07-20',
}
```

### 4.2 NÁVOD — „proveď mě úkonem" (= 26.5)

3–7 kroků; každý krok = **imperativ (1–2 věty) + deep-link na místo činu + done-signál** (co uživatel uvidí, když se to povedlo). Bez persistence — návod lze číst opakovaně, nic se neodškrtává.

```
NÁVOD 'navod.pozvi-hrace' — „Pozvi hráče do světa" (source: kap. 09)
1. Otevři Nastavení světa → tab Přístup a zkontroluj režim vstupu — svět vzniká Soukromý. [→ #pristup]
   ✓ Vidíš 4 režimy; Soukromý = jen na žádost/pozvánku.
2. Jdi na stránku Hráči a klikni „Přidat hráče". [→ /svet/:worldSlug/hraci]
3. Zkopíruj pozvací odkaz, nebo pozvi cíleně jménem.  ✓ Odkaz je ve schránce.
4. Pozvaný přijde jako Čtenář — povyš ho na Hráče v Nastavení → Členové. [→ #clenove]
5. Nemáš koho pozvat? Vypiš nábor. [→ /ikaros/nabory]
```

### 4.3 KROK CESTY — návod s persistencí a progresem

= `JourneyStep` ([04-architektura.md](04-architektura.md)): `narratorLine` (Ishidova replika, flavor limit 1/8) + `cta` deep-link + `done: DoneCondition` (probe = zdroj pravdy, event = jen trigger oslavy) + `topicId?` („chci vědět víc") + `skipAllowed: true` + `estMin`. Kroky 2+ cesty se scopují na `contextWorldId` cesty; deep-linky i probe z něj doplňují worldSlug. Krok cílící na kolizní plochu doručí repliku PŘED vstupem (viz interakční model), completion event ji jen potvrdí.

Ukázka = doslovná citace kanonického kroku `pj.otevri-branu` z [05-retence-a-cesty.md](05-retence-a-cesty.md) §3 (kroky se definují JEN tam, tady se necitují ve třetí variantě):

```ts
{ id:'pj.otevri-branu', title:'Otevři bránu a pozvi lidi',
  narratorLine:'Tvůj svět je zatím soukromý — nikdo cizí se dovnitř nedostane. Otevři přístup, pošli pozvánku, nebo vyvěs nábor.',
  cta:{ label:'Nastavení přístupu', to:'/svet/:slug/nastaveni#pristup' },
  // accessMode NENÍ event — probe z WorldContext.world.accessMode
  done:{ kind:'probe', key:'gateOpened' },
  // gateOpened(ctx) = accessMode !== 'private' ∨ invite.created{worldId} ∨ nábor pro contextWorldId
  topicId:'svet.vstup', skipAllowed:true, estMin:3 }
```

### 4.4 TIP — proaktivní bublina

`trigger` (jen povolené momenty: první vstup do sekce z whitelistu · reportEmpty(key) · 2× chyba · maintenance) + `dismissKey` (persistováno; zavřené se **nikdy** neopakuje) + text ≤ 200 znaků, max 2 věty + 1 CTA. Nemizí sám (kromě oslav).

```ts
{ id: 'tip.putyka-ttl', trigger: { kind: 'first-visit', route: '/chat' },
  dismissKey: 'tip.putyka-ttl',
  text: 'Tady se nepíše kronika — zprávy v Putyce mizí po hodině. Na trvalé řeči máš chat svého světa.',
  cta: { label: 'Rozumím' }, source: { kapitola: '05' }, verifiedAt: '2026-07-20' }
```

### 4.5 VYSVĚTLENÍ CHYBY — errorCode → dvě linie

`errorCode` (klíč mapy `ERROR_TOPICS`) + `shortMessage` (1. linie, friendly hláška, 1 věta) + `body` (2. linie: **PROČ** — je to záměr/pravidlo, ne rozbité → **co dál** → případná akce). Humor v chybách zakázán.

```ts
{ id: 'chyba.owner-cannot-leave', errorCode: 'WORLD_OWNER_CANNOT_LEAVE',
  shortMessage: 'Jako vlastník nemůžeš ze světa odejít — nejdřív ho předej.',
  body: { kind: 'md', md: `
Svět nesmí zůstat bez vlastníka, proto tě brána nepustí. Není to chyba.
Předej svět v Nastavení → Členství (kandidát musí být aspoň Hráč; ty se staneš Pomocným PJ).
Nechceš předávat? Svět můžeš smazat (30 dní na rozmyšlenou).
**Akce:** [Nastavení → Členství](navigate:/svet/:worldSlug/nastaveni#clenstvi)` },
  source: { kapitola: '09', sekce: 'Předání světa' }, verifiedAt: '2026-07-20' }
```

### 4.6 OSLAVA — milník

1 replika + zápis do done-logu; max 1 emoji; auto-zmizí po 8 s; žádná konfeta/badge/modal. Spouští ji **jen event** (probe milník doplní bez oslavy — pojistka proti retroaktivnímu slavení u starých účtů).

```ts
{ id: 'oslava.prvni-svet', milestone: 'first-world', event: 'world.created',
  text: 'Nový svět stojí. A není prázdný — předchystal jsem ti do něj pravidla, měny i kalendář. Pojď se rozhlédnout.' }
```

## 5. Priority plnění

Strategie: **hluboko na zlatých cestách, poctivý fallback jinde.** Žádné plošné AI stuby v MVP (strohá odpověď škodí víc než odkaz na plnou nápovědu).

### 5.1 Tier 0 (MVP, před vlnou 1)

**a) RouteHeaders — 25 rout** (`{route, name, blurb, audienceNotes?}`; názvy sdílené s `buildFullWorldNav`). Množina = přesně Tier 0 z [01-mapa-prostoru.md](01-mapa-prostoru.md) §1 (tam je tier per routa zdůvodněn guardy). ★ = route na cestě 26.1.

| # | Route | Poznámka k blurbu |
|---|---|---|
| 1 | `/` (úvodník) | anonym showcase + „Začni tady"; `?openLogin=1`/`?openRegister=1` |
| 2 | `/ikaros/vesmiry` | katalog světů; 4 accessMode; „Chci hrát" vs. „Jen číst" |
| 3 | `/ikaros/vytvorit-svet` ★ | wizard; povinná jen 3 pole; pasti TÚ/magie jen teď |
| 4 | `/ikaros/nabory` | LFG nástěnka; filtr systém+žánr |
| 5 | `/ikaros/napoveda` | Ishidova knihovna (dlouhé čtení) |
| 6 | `/ikaros/profil` | 2 avatary (osobní vs. Postava v Campu); 3 přepínače soukromí |
| 7 | `/ikaros/uzivatele` | 3 taby vč. „Zpracovat" = osobní fronta |
| 8 | `/ikaros/posta` | soukromá vlákna + systémové zprávy |
| 9 | `/ikaros/tvorba` | hub Společné tvorby (články, galerie, diskuze…) |
| 10 | `/chat` (Putyka) | TTL 1 h; host mód |
| 11 | `/chat/camp` (+2,3) | sdílená scéna; rotace 12:00/00:00; Uložit/Načíst 1 slot |
| 12 | `/invite/:token` | pozvánka do světa; přijetí dává roli Čtenář |
| 13 | `/svet/:slug` ★ | dashboard 3 sloupce / JoinCTA / pending banner dle stavu |
| 14 | `/svet/:slug/hraci` ★ | adresář + žádosti + pozvánky; role se mění JINDE |
| 15 | `/svet/:slug/nastaveni` ★ | 19 hash tabů dle role; ⚙ na mobilu v draweru |
| 16 | `/svet/:slug/stranky` ★ | Encyklopedie; plochý seznam, filtr, oblíbené |
| 17 | `/svet/:slug/:pageSlug` | PageViewer; AKJ záložky; zkratky f/e/Ctrl+K |
| 18 | `/svet/:slug/nova-stranka` ★ | PJ+ tvoří; Hráč jen „+ Navrhnout" |
| 19 | `/svet/:slug/edit/:pageSlug` | PageEditor; auto-draft; 409 konflikt |
| 20 | `/svet/:slug/postavy` ★ | adresář PC+NPC; „Nová postava" jen PJ+ |
| 21 | `/svet/:slug/moje-postava` | zkratka na vlastní PC; bez postavy → empty state |
| 22 | `/svet/:slug/chat` ★ | kanály vs. konverzace; 🎲 kostky |
| 23 | `/svet/:slug/novinky` | novinky světa (≠ platformní `/ikaros/novinky`) |
| 24 | `/svet/:slug/bestiar` | 3 scope; spawn = snapshot; gate PomocnyPJ+ |
| 25 | `/svet/:slug/takticka-mapa` | hraní; per-player scény; header „?" zůstává vstupem |

Kandidáti hned za hranou (Tier 1, headery ve v2): `/ikaros/akce` · `/ikaros/bestiar` · `/svet/:slug/mapy` (atlas) · `/svet/:slug/kalendar` (gate PomocnyPJ+) · `/svet/:slug/obchod` (INSUFFICIENT_FUNDS).

**b) 21 hlubokých topiků** (top zákysy dle map „ZTRÁCÍ SE", [01-mapa-prostoru.md](01-mapa-prostoru.md)). **Tato tabulka = kanonický číselník topic ID — ID definuje výhradně ona**; 01 §2 a topicId v kódech 05 na ni jen odkazují („~20" v 00/01 je odhad téhož seznamu):

| # | id | Obsah (jádro) |
|---|---|---|
| 1 | `role.dve-patra` | globální vs. světová role; Admin je v cizím světě nikdo (R-20) |
| 2 | `role.svetove` | hierarchie Čtenář→Hráč→Korektor→PomocnýPJ→PJ; co která smí; asymetrie (PomocnýPJ nesch­valuje žádosti) |
| 3 | `role.admin-elevace` | „Aktivovat admina"; co ani elevace neumí (předání světa) |
| 4 | `svet.vstup` | 4 accessMode; co které tlačítko udělá; pozvánka/odkaz dává Čtenáře |
| 5 | `svet.vstup.hrat-vs-cist` | „Chci hrát" (žádost + postava po schválení) vs. „Jen číst" (Čtenář bez postavy) |
| 6 | `svet.zadatel` | Žadatel není role; čekání není chyba; kde vidím stav; kde zrušit |
| 7 | `svet.zalozeni` | minimální pole; pasti: TÚ/magie/náboženství jen při vzniku; svět vzniká Soukromý |
| 8 | `svet.neni-prazdny` | 6 seedovaných stránek + měny + kalendář (mezi-aha kroku 2 cesty 26.1) |
| 9 | `svet.sprava-lidi` | rozcestník: Hráči (žádosti/pozvánky) vs. #clenove (role/skupiny/AKJ) vs. #clenstvi (předání/odchod) |
| 10 | `svet.nastaveni.taby` | proč nevidím tab X (role gate + per-systém taby); mapa 19 tabů |
| 11 | `svet.chat.kanal-vs-konverzace` | terminologie UI („kanál"=ChatGroup, „konverzace"=ChatChannel); kanál Postavy |
| 12 | `svet.chat.kostky` | 🎲 v chatu/na mapě, NE v deníku; whitelist PJ |
| 13 | `postava.zaklada-pj` | Hráč sám postavu nezaloží; workflow žádost→schválení→Moje postava |
| 14 | `postava.3-tier` | PC (5 subdoc) · NPC (bez financí/výbavy — záměr) · Bestie (šablona v katalogu) |
| 15 | `akj.zamky` | AKJ úrovně; 🔒 záložky = clearance; kde se definují (#akj) vs. přiřazují (#clenove); PomocnýPJ bez auto-bypassu záložek |
| 16 | `stranky.navrhy` | Hráč tvoří přes „+ Navrhnout" → pending → PJ schválí; proč ostatní návrh nevidí |
| 17 | `rozcestnik.mapy` | 3 „mapy": atlas Mapy · taktická mapa (hraní) · Stavitel (tvorba podkladů) |
| 18 | `rozcestnik.kalendare` | 3 „kalendáře": platformní akce (/ikaros/akce) · kalendář světa (PomocnyPJ+) · kalendář postavy/timeline |
| 19 | `oblibene.dvoji` | globální oblíbené (/ikaros/oblibene, jen diskuze/články/obrázky) vs. in-world hvězdička/f |
| 20 | `vzhled.tri-urovne` | globální motiv (profil) vs. Vzhled světa (sdílený) vs. Můj vzhled (osobní, follow-PJ) |
| 21 | `chat.globalni` | Putyka/Camp/Voice; TTL 1 h; host mód; emoty jen ve světě |

**c) ~16 chybových topiků** (mapa `errorCode → topicId`; každý s `shortMessage` + „proč + co dál"):

| # | errorCode / stav | Jádro 2. linie |
|---|---|---|
| 1 | 403 role-floor | kterou roli sekce vyžaduje + jak ji získat (oslov PJ) |
| 2 | 403 / pending Žadatel | žádost leží u PJ; čekání není chyba; kde stav |
| 3 | 401/404 private svět | svět je soukromý; přihlas se / požádej o vstup |
| 4 | 409 LIMIT_REACHED | kumulativní anti-abuse stropy tvorby (50 světů vč. soft-deleted, 2000 stránek/svět, 1000 bestií); „ozvi se správci" |
| 5 | 403 WORLD_QUOTA_REACHED | 30 aktivních světů/účet; co s tím (smazat svět / kontakt na správce) |
| 6 | 429 REJECTED_RECENTLY | cooldown 7 dní po odmítnutí žádosti o přátelství; druhá strana může psát hned |
| 7 | SOLE_PJ_BLOCK | svět nesmí zůstat bez PJ; nejdřív jmenuj nástupce |
| 8 | WORLD_OWNER_CANNOT_LEAVE | předání světa v #clenstvi (příklad §4.5) |
| 9 | INSUFFICIENT_FUNDS | účet postavy nekryje nákup; kde vidět zůstatek; allowPlayerSelfAdjust je na PJ |
| 10 | USERNAME_CHANGE_VIA_REQUEST | přezdívka jde přes žádost (Bezpečnost) + admin + cooldown 30 dní |
| 11 | 404 NOT_APPLICABLE | NPC nemá Finance/Výbavu — záměr 3-tier modelu, ne chyba |
| 12 | NOT_SUPPORTER | funkce pro Podporovatele; co dává, kde aktivovat |
| 13 | prázdný dice whitelist | „PJ nepovolil žádné kostky" — replika 6; PJ: #zakladni |
| 14 | AKJ 🔒 záložka | obsah za clearance; kdo ji uděluje (PJ/#clenove) |
| 15 | SESSION_REVOKED | přihlášení jinde/odvoláno; přihlas se znovu; nic se neztratilo |
| 16 | MaintenanceOverlay | replika 7 — uklidnění, stránka se sama obnoví |

Kandidáti hned za hranou (Tier 1): PIN_LIMIT/NOT_FAVORITE, 403 profil jen pro přátele, 409 konflikt PageEditoru, limit avataru 5 MB.

**d) Zbytek Tier 0:** 4 wrapnuté in-situ komponenty (ChatHelp, TacticalMapHelp, OrchestraceHelp, EfektyKresleniHelp jako `bodyComponent`, MVP-B) · empty-states 3–5 (moje-postava bez postavy, dashboard čerstvého světa, prázdné stránky, TM hráče bez scény, Žadatel banner) · kroky cesty 26.1 + rozcestníky 26.2/26.3 + oslavy MVP.

### 5.2 Tier 1 (v2)

Tenké topiky všech zbylých rout (s voice passem, ne stroje) · slovníček ~15 hesel (sdílet s docs/glossary/) · 10 návodů 26.5: Založ a otevři svět · První postava · První hod · Pozvi hráče · Od prázdné mapy k boji · Mlha války/LoS · První wiki + [[wikilink]] · Kalendář a herní čas · Obchod a peníze · Najdi spoluhráče · prohloubení dle telemetrie děr (P1 oblasti: TM, wiki+AKJ, profil/soukromí, nábory, Putyka/Camp TTL).

### 5.3 Tier 2 (v3)

Per-system kostky (13 systémů) · admin/moderátorská témata · komunitní katalogy detailně · kalendáře/timeline/počasí do hloubky · Stavitel · sezónní flavor.

## 6. Deep-link politika (závazná oprava kritiky)

Kontrakt `?sekce=X&topik=Y` na HelpPage se implementuje až v MVP-B — proto **v MVP-A odkazy do plné nápovědy linkují jen holé `/ikaros/napoveda`, příp. `?sekce=X` (ta už dnes funguje — parseTab, WorldHelpModal); nikdy `&topik=` před MVP-B** (viz [07-migrace-napovedy.md](07-migrace-napovedy.md) §7.2). `&topik=` odkazy se do registru doplní **hromadně jednou dávkou** až s MVP-B implementací (jeden grep-and-replace nad `links`/md body, ne průběžné dopisování). Schválení kontraktu vlastníkem musí proběhnout **před D8** (než se začnou psát odkazy v obsahu cesty) — kontrakt je veřejný a po zveřejnění se nemění. `deepLink` pole topiku smí být v MVP-A prázdné; CI test mrtvých odkazů parametrické tvary do MVP-B odmítá.

## 7. CI validace (vitest, v existujícím `npm run test:run`)

**Prerekvizita:** typovaný route registr extrahovaný z router.tsx + parity test router↔registr (1–2 dny, v plánu MVP-A; `routes` a `links.to` se pak typují — překlep spadne v `tsc -b`).

| Kdy | Kontrola | Režim |
|---|---|---|
| MVP | unikátní topic ID; validní audience; media klíče v HELP_MEDIA; `source.kapitola` existuje | hard-fail |
| MVP | mrtvé odkazy: `links.to` + `[text](/cesta)` v md proti route registru a topic ID (chytilo by renamy Rozcestí→Camp, Hospoda→Putyka) | hard-fail |
| MVP | audience sanity: tabulka route→minimální role v paritě s guardy/`buildFullWorldNav` (topik na PomocnyPJ+ routě nesmí mít audience jen 'hrac') | hard-fail |
| MVP | existence kotev `data-vypravec` v renderu klíčových stránek | hard-fail |
| MVP | žádné parametrické `?sekce&topik` odkazy před MVP-B (§6) | hard-fail |
| MVP | **friendly-messaging soulad**: errorCode s hláškou i topikem — znění nejsou protichůdná (§2) | hard-fail |
| MVP | route coverage: kolik rout nemá header/topik | soft report |
| MVP | **status vs. docs/funkce/**: `status` topiku porovnat proti značkám 🚧/✅ zdrojové kapitoly (grep `source.kapitola`) — topik `funkcni` u 🚧 funkce = řádek reportu | soft report |
| MVP | staleness: `verifiedAt` < git datum poslední změny `docs/funkce/<kapitola>.md` (`npm run vypravec:stale`) | soft report |
| v2 | coverage hard-fail s viditelným allowlistem (`UNCOVERED_ALLOWLIST`: technické routy — reset-password, email-verify, karta-tokenu pop-out, redirecty), čištěným v obsahové směně | hard-fail |
| v3 | staleness přes hash konkrétní `### sekce` kapitoly (přesná detekce místo git data) | soft report |

## 8. Integrace skillů — žádný nový rituál

- **Skill `funkce`** +1 krok: „vypiš dotčené topiky" (`npm run vypravec:touched -- --kapitola NN`, grep `source.kapitola`) a předej seznam skillu `napoveda`. `funkce` zůstává jediné místo ověřování kódu.
- **Skill `napoveda`** rozšířit o tabulku „změna → topik": nová route → topik/RouteHeader · stub→funkční → update body + `status` + `verifiedAt` · změna rolí → update `audience` · nový pojem → tag (+ v2 heslo slovníčku) · user-facing změna → řádek `changelog.ts`. U dosud nemigrovaných HelpPage sekcí dočasně upravit i JSX — dvojí údržba je přiznaná dočasná daň, mizí kapitola po kapitole. Rename skillu na `vypravec-obsah` + úprava base.md až po betě (méně churn).
- **Definition of done každé fáze: kód + `funkce` + topik + changelog.** Tím base.md pravidlo („změna funkčnosti → `funkce` + `napoveda`") pokrývá Vypravěče automaticky.
- **Týdenní obsahová směna 30 min** (v betě 2× týdně): projít `vypravec:stale` + `vypravec:gaps` → AI nadraftuje → voice pass → dev schválí. Bottleneck = 1 vývojář; jediná systémová pojistka proti mlčení na nové funkce je skill-vynucený krok při každé změně.

## 9. Metriky děr a changelog

**Telemetrie obsahu** (jedna kolekce s funnel eventy, detaily [04-architektura.md](04-architektura.md)): `topic_open {topicId, route}` · `search_miss {query≤200 zn., route}` · `no_topic {route}` · `feedback {topicId, helpful}` (zdroj = patička TopicView §4.1) · `dismissed {topicId}`. Vyhodnocení `npm run vypravec:gaps`: top search_miss, top no_topic routy, topiky s 👎>👍, top dismissed → backlog položky = přesná zadání pro AI. Admin dashboard až v2 (/admin?tab=prehled, vzor 20.6).

**Changelog „Co je nového"** (`changelog.ts`, `{version, date, title, body, topicId?}`): záložka v panelu + badge na kotvě při nepřečteném; topiky se `since` dostávají štítek „nové"; lastSeen MVP localStorage → v2 BE preference. Zápis záznamu = povinný krok skillu `napoveda` u user-facing změn (changelog se píše průběžně, ne zpětně; interní změny se nezapisují). Plní rytmus komunikace s testery (25.3/28.4).

## 10. Rizika údržby (výtah)

| Riziko | Pojistka |
|---|---|
| Šestý zdroj pravdy (hardcode texty ve spěchu; migrace HelpPage uvízne v půlce) | PR konvence „jen registr" od dne 1; skilly vynucují topiky; dvojí údržba explicitně řízená skillem; CI mrtvé odkazy |
| Drift dvou znění téže chyby (friendly hláška × topik) | jeden záznam s `shortMessage` + CI soulad (§2, §7) |
| Vypravěč lže o 🚧 | `status` při voice passu + CI soft-report proti docs/funkce/ (§3, §7) |
| AI halucinace / strohost | prompt „jen ze zdrojové kapitoly"; voice pass; dev review; poctivý fallback místo stubu |
| Allowlist inflace u coverage hard-failu | v MVP jen soft report; hard-fail až v2 s allowlistem viditelným v review a čištěným ve směně |
| Staleness heuristika (git datum) hlásí falešně / mlčí | jen report, ne fail; v3 hash sekce; řetěz stojí na disciplíně skillu `funkce` |
| search_miss zachytí osobní údaje | truncate 200 znaků, TTL 90 dní, věta v /soukromi |
