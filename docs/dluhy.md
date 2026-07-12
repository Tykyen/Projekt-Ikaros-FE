# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-07-12 (po hromadné opravě dluhů — vyřešené smazány, viz git log + chybový deník ✅ ŘEŠENÍ).

---

## Otevřené

### D-063 — Identita správce (spolek) + zpracovatelé nedoplněni na legal stránkách (20A)
> `CodeOfConductPage` + `TermsPage` už placeholdery nemají (ověřeno 2026-07-12) — zbývají 2 soubory níže.
**Soubor:** `src/features/ikaros/pages/PrivacyPage.tsx:35-200`, `ContactPage.tsx:27-52` — placeholdery `[DOPLNIT: …]`
**Problém:** Zásady OÚ (`/soukromi`), Kontakt (`/kontakt`) a Podmínky nemají doplněnou totožnost správce: chybí název spolku, IČO, sídlo, spisová značka + soud spolkového rejstříku a kontaktní/provozní e-mail (pro uživatele i orgány). Navíc seznam zpracovatelů v Zásadách OÚ má u části služeb (hosting, SMTP, AI/LLM, error tracking, platební brána) nepotvrzené konkrétní poskytovatele + jejich EU/třetí-země status a transfer mechanismus (DPF vs. SCC).
**Dopad:** Vysoký (blokuje **veřejné spuštění**) — GDPR čl. 13 vyžaduje totožnost správce, DSA čl. 11/12 kontaktní místa; bez nich nelze web pustit veřejně. NEblokuje implementaci ani beta.
**Řešení:** Až uživatel/advokát dodá údaje spolku, nahradit všechny `[DOPLNIT]` (grep `dopisat` / `DOPLNIT`), potvrdit seznam zpracovatelů a u každé US služby uvést DPF/SCC. Poté bumpnout verzi dokumentů.
**Kdy:** Před veřejným spuštěním (spolek se teprve zakládá). Součást Přílohy C (20.1–20.3). **Blokováno na vstupu uživatele/advokáta.**

---

### D-17.8-A11Y-BACKLOG — Přístupnost: odložené vrstvy nad rámec 17.8 v1
> Většina backlogu vyřešena 2026-07-05 (jsx-a11y lint, sdílený `useFocusTrap`, KebabMenu roving-tabindex, aria-label audit) — viz git log. Zbývá (nízká priorita, vyžaduje živou kontrolu):
- **IconButton adopce** — ~16 ručních `<button>+lucide` (chat: `ChannelItem/Group/View`, `EmoteCard`, rail `*Panel`…) má aria-label, ale neadoptovalo primitiv. Čistě konzistenční refactor; POZOR `IconButton .iconBtn` = ghost/transparent styl → migrace MĚNÍ vzhled → nutný `mobil-desktop` per skin, ne slepě.
- **Storybook axe** (`.storybook/preview.tsx`) — zůstává `test:'todo'`. Přepnutí na `error` je **no-op**, dokud jsou storybook component testy mimo `vitest run` (D-033, ESM/CJS race) → axe se v CI nespouští. Trigger: browser-mode axe v CI (vyřešení D-033) + ověřená čistota 14 stories.
- **Focus trap do in-app overlayů**: `WorldChatRoom` mobilní sidebar + scrim, `ChatContextRail` (bez Escape/trap/dialog), `MapNotebookOverlay` + `TokenInfoPanel` (mají Escape+`role=dialog`, chybí trap/restore). Sdílený `useFocusTrap` je připraven — chybí napojení. **Odloženo:** vyžaduje živý mobilní/mapový test (trap ve špatně posouzeném kontextu zhorší UX), proto ne naslepo.
**Dopad:** Nízký — základní a11y funguje, hlídá lint. Roadmap 17.8 značené 🔁 (průběžné).
**Kdy:** IconButton+overlaye při příští práci na daných plochách (s `mobil-desktop`); axe s D-033.

---

### D-DATA-SYNC-ZBYTKY — zbytky po D-NEW-INV-DATA-SYNC (2026-07-12)
> Jádro dluhu vyřešeno 2026-07-12 (currencies optimistic lock + FE hydratace, subdocy jen pro PC + úklidový skript, token→deník HP sync 8 systémů) — viz git log. Zbývá:
**Soubory:** BE `characters/characters.repository.ts` + controller (legacy directory), `maps/operations/token-hp-diary-map.ts` (sync mapa).
**Problém:** (a) legacy `GET /worlds/:id/characters/directory` žije vedle Pages directory (dvojí zdroj) — **nejde smazat**, FE ho volá z ~9 míst (`useCharacterDirectory`) a BE `chat.service` interně (enrich); (b) token→deník HP sync přeskočen u systémů s nejednoznačným mapováním: shadowrun (odvozenina `sr_attr_bod`+`sr_cond_phys`), fae/fate (stress boxy = pole), drdplus (pásma zranění), drd2 (3 zdroje) + pole `systemStats`/`injury`/`initiative` (nemají v deníku domov).
**Dopad:** Nízký/střední — dvojí zdroj adresáře (maintainability), HP z mapy se u 5 systémů nepropíše (chování jako dřív).
**Řešení:** (a) FE migrace `useCharacterDirectory` → Pages directory, pak smazat legacy endpoint; (b) per-system rozhodnutí mapování (produktové — jak má HP z mapy zapisovat do stress boxů / pásem).
**Kdy:** (a) při příští práci na adresáři postav; (b) při ladění daných systémů.

### D-066-ZBYTKY — moderace deníku: FE vstup + interní čtecí cesty (2026-07-12)
> Enforcement deníku a chatu (M2/M3 skrýt, M4 smazat) **implementován 2026-07-12** — viz git log. Zbývají okraje:
**Problém:** (a) FE nemá report tlačítko pro `character_diary` (typ je jen v enumu) — BE kontrakt definován: `targetId = characterId`; (b) `world-export` a `maps.enrichTokens` čtou diary repo přímo mimo moderation gate → PJ export/HP bar tokenu skrytý deník stále čte (interní/whitelistované cesty, ne veřejné zobrazení obsahu).
**Dopad:** Nízký — report deníku jde zatím jen nepřímo, interní cesty nejsou leak veřejnosti.
**Řešení:** (a) ReportButton do UI deníku (posílat characterId); (b) rozhodnout, zda export/enrich má skrytý deník vynechávat.
**Kdy:** při příští práci na deníku/moderaci.

### D-DROBNE-2026-07-12 — drobné follow-upy z hromadné opravy
- **Admin změna e-mailu bez notifikace na starou adresu** — `PATCH /admin/users/:id/email` mění tiše; vzor `sendEmailChangeNotice` existuje v auth. Doplnit mail „tvůj e-mail byl změněn správcem".
- **Nativní `GET /ikaros-discussions/my`** — profil „Moje diskuze" filtruje klientsky (`creatorId`), stejný vzor jako tab „Moje" na DiscussionsPage; nativní endpoint by byl čistší (výkon při stovkách diskuzí).
- **Undo UI stále nezapojené** — BE inverses doplněny (deactivate/bulkAssign/drawing.clear), ale FE undo tlačítko/endpoint není; při zapojení doplnit FE typy nových ops (`scene.activate`, `scene.drawings.replace`, `member.bulkRestoreAssignments`).
**Dopad:** Nízký. **Kdy:** příležitostně při práci na daných plochách.

---

### D-SEC-GAP-2026-07-11 — bezpečnostní/compliance nálezy čekající na rozhodnutí nebo infra krok
> Z původního seznamu **vyřešeno 2026-07-12:** Redis lock cronů (`CronLockService`), offset-paginace `_id` tiebreak (21 míst), anti-abuse creation capy (13 entit, env-konfigurovatelné, `LIMIT_REACHED`), camp cron timeZone (byl už dřív). Zbývá:
**⭐ ROZHODNUTÍ UŽIVATELE (nelze opravit bez něj):**
- **Erasure: `content` zpráv + `username` tombstone** — plná content-erasure = právní rozhodnutí, které zatím nepadlo. + **Registrace <15 let** (`isMinor` neblokuje registraci) — produktově-právní rozhodnutí (věková brána 15+).
- **Account enumeration** přes `/auth/check-email`/`check-username` (vrací existenci; login timing srovnán) — endpoint je záměrná UX opora registrace; rozhodnout throttle vs. redesign.
- **`chatSkin` bez supporter gate** — dle `world-membership.schema` vědomě self-service (motiv světa); rozhodnout, zda gate vůbec chceme.
**~ TECHNICKÉ (větší zásah / migrace):**
- **Ekonomika na float** — IEEE-754 drift → overdraft guard může selhat na haléřích; čistý fix = celočíselné minor units (migrace dat + FE formátování).
- **FE error telemetrie = 0** + vzor „prázdný stav místo chyby" na části ploch — rozhodnout nástroj (Sentry free?) a zavést; souvisí `monitoring` skill.
- **Mongo bez `cs` collation** + slug strhává diakritiku (kolize „šíp"/„sip") — collation = per-kolekce migrace.
- **MeiliSearch bez českého stemmingu** — infra/konfigurační rešerše.
**Dopad:** střední–vysoký (veřejná 15+ platforma). **Kdy:** rozhodovací položky = až rozhodneš; technické = první běh stylů 32–41.

### D-LAUNCH-GAP-2026-07-11 — launch-hardening zbytky (styly 42–46)
> **Vyřešeno 2026-07-12:** WS rate-limity (`allowWsEvent` na 4 gateway), webpush timeout, SMTP log wording + per-recipient reset throttle, HTTP `requestTimeout` (keepAlive/headers už byly), Docker healthcheck + `ulimits.nofile` + `pids_limit` (staged v compose, nasadí se příštím deployem). Zbývá:
**⭐/~ VYSOKÉ+STŘEDNÍ:**
- **Vizuální regrese = 0 automatická brána** — 96 skin CSS, edit tokenu tiše rozbije skin; Chromatic nainstalován ale mrtvý; Playwright jen chromium/desktop → mobil overflow neasertován. Velká infra položka (render brána `+render` v plny-audit).
- **SMTP bez fronty** — 1 Gmail účet ~500 mailů/den; reset-flood cap: per-recipient throttle už brání jednomu cíli, ale ne distribuovanému floodu → fronta + denní cap monitor + bounce handling (dnes „předáno SMTP" ≠ doručeno).
- **Push dedup jen na zařízení** — WS replay může vyrobit 2 reset tokeny (prošetřit reprodukci, pak fix).
- **Last-write-wins na `tokens.$.<key>`** — souběžný update HP tokenu v boji = lost update (chce per-field ops nebo verzi).
**SHARPENINGY (do existujících stylů):** styl 5 — Mongo/Redis bez `--auth` + `--bind_ip_all`, backend port `0.0.0.0:3001` obchází TLS (**vyžaduje koordinované ops okno** — vytvořit DB users + env + restart, neriskovat vzdáleně bez tebe); styl 31 — deploy bez rollbacku (prune+rebuild latest), disk-cap upload-fallbacku (sdílí disk s Mongo).
**OPS-RUNBOOK (jednorázově, mimo audit):** SPF/DKIM/DMARC záznamy, TLS cert renewal + do IaC, host firewall/`ulimit`.
**Dopad:** vysoký — doručitelnost, férovost, launch-stabilita. **Kdy:** první běh stylů 42–46; ops položky = společně s tebou u serveru.

### D-AUDIT-2026-07-11 — zbylé nálezy plného auditu (46 stylů)
> Z hlavních zbývajících **vyřešeno 2026-07-12:** Redis lock cronů, socket-swap FE listener leak (centrální `removeAllListeners` + `socketGenerationAtom` re-bind), WS rate-limity. Zbývá:
- **Bundle SLO** — bundle přes limit, chce code-split audit (velká položka).
- **Nula DB záloh** — žádný mongodump/retence. POZOR: zálohy na tentýž disk riskují zaplnění (viz nedávné disk-cleanup incidenty) → rozhodnout cíl (S3/objekt storage?) = ops rozhodnutí s tebou.
- Nefixnuté položky nižší priority v `docs/full-audit/RUN-2026-07-11-1213/report.md` + `checkpoints/`.
**Kdy:** bundle = samostatný zátah; zálohy = ops rozhodnutí.

---

## Odložené (čeká na trigger)

### D-NEW-UM02-private-media-delivery — Privátní média mají veřejnou Cloudinary URL
**Soubory:** BE `upload.service.ts` (upload type), `images.controller.ts` (proxy); FE render privátních obrázků (mapy, AKJ, chat)
**Stav:** Cloudinary assety se nahrávají jako `type: 'upload'` (public). Privátní obsah (AKJ obrázky ve stránkách, privátní mapy `visibleToPlayerIds`, přílohy privátních zpráv) má veřejnou URL → kdo zná link, stáhne i bez oprávnění. BE access správně filtruje JSON odpovědi, ale URL samotná není chráněná. **Vědomě akceptováno (upload/media audit UM-02, 2026-06-14):** publicId je 20+ znaků náhodný (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Pro single-svět hobby provoz je obscurity dostatečná.
**Trigger:** veřejný / komerční / multi-tenant provoz, kdy svět/postavy uvidí cizí lidé a obscurity přestane stačit (riziko hromadného scrape).
**Co bude potřeba:** rozhodnout (a) proxy endpoint s ACL pro NE-TipTap média (mapy/page.imageUrl/chat — jdou přes komponenty) vs (b) Cloudinary `authenticated` type + signed delivery URL (čistší, ale re-upload migrace ~3000+ assetů + signed URL expirace rozbije TipTap embedy). **Pozor:** AKJ obrázky vložené přímo v TipTap HTML (`section.content`) nezavře ani jedna varianta bez přepsání uloženého obsahu — known gap.

### D-NEW-UM10-storage-quota — Žádná per-user storage kvóta na uploady
**Soubory:** BE `upload.controller.ts` (rate-limit ✓ hotový), chybí storage tracking
**Stav:** Upload routy mají rate-limit (`@Throttle` 20/min/IP — UM-10, 2026-06-14), což brání rychlému spamu; creation capy (2026-07-12) omezují počty entit. Chybí ale **kumulativní per-user kvóta** (celková velikost nahraného obsahu) → trpělivý uživatel může postupně zaplnit Cloudinary úložiště.
**Trigger:** Cloudinary se blíží limitu free/placeného tieru, nebo komerční provoz s neznámými uživateli.
**Co bude potřeba:** sledovat součet `size` per uživatel (kolekce/agregace), gate v upload service při překročení. Souvisí D-19.2-BYTES.

### D-NEW-PC21-embedding-model-host — Embedding modely fyzicky hostovat (zbývá OPS krok)
**Soubor:** BE `backend/src/modules/search/embedding-search.service.ts:370-396` + `docker-compose.prod.yml` + `.env.example`
**Stav:** konfigurační část hotová (model URL přepsatelné přes env). **Zbývá jen OPS krok** (mimo kód): nahrát model soubory na vlastní hosting a přepsat env vars — nelze bez přístupu k souborům modelů.
**Trigger:** příprava ostrého provozu se sémantickým search, nebo nedostupnost `patrikzplzne.cz` ([[project_server_swap]]).
**Co bude potřeba:** stáhnout 4 model soubory, nahrát na vlastní úložiště, nastavit 4 env vars v GitHub vars / serverovém `.env`. **Akce uživatele.**

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** presence v `Map` v paměti procesu — pro single-instance BE správné rozhodnutí. Crony už mají `CronLockService` (2026-07-12), presence je poslední per-instance stav.
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling).
**Infra ready:** Redis + Socket.IO Redis adapter opt-in (`SOCKET_IO_REDIS=1`). Chybí migrace presence Map → Redis hash (~8-16 h). **Dělat dřív = mrtvý kód.**

### D-NEW-color-tokens — Hardcoded barvy → theme tokeny (chrome drift)
**Plán:** [n2-color-mapping.md](n2-color-mapping.md).
**Zbývá (~1622 nálezů ve ~160 souborech):** vizuální projití per komponenta napříč 2–3 tématy (proto **ne v automatickém commitu** — riziko rozbití skinů bez živé kontroly). Top cíle: `TemplateEditorModal`, `NotificationCenter`, `PostavaLayout`…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.

### D-19.1-RETENCE — Pravá week-over-week kohortní retence (chybí historie aktivity)
**Soubory:** BE `admin-growth.service.ts` (`buildRetention`) · `users` schema.
**Stav:** retence jen jako snapshot k dnešku; pravá retence T→T+1 nejde — v DB jen přepisovaný `lastSeenAt`, žádná historie návratů. Zpětný backfill nemožný.
**Trigger:** až bude potřeba skutečná retenční křivka v čase.
**Co bude potřeba:** týdenní append-only snapshot aktivity (`{ userId, isoWeek }`) — zapne pravou retenci od nasazení dál. Nový tracking = samostatné produktové rozhodnutí. Spec [19.1 §8](arch/phase-19/spec-19.1.md).

### D-19.2-BYTES — Velikost obrázkových blobů v bytech (dnes jen počty)
**Soubory:** BE upload cesta + image schémata.
**Stav:** storage se měří jako počet souborů; velikost v bytech se u obrázků neukládá (jen chat přílohy + admin PDF). Celkový objem jen přes Cloudinary `api.usage()`.
**Trigger:** až bude potřeba přesná velikost per svět/uživatel (nutná podmínka pro vynucování kvót — UM-10).
**Co bude potřeba:** ukládat `bytes` do image schémat při uploadu (retroaktivně nepokryje staré bloby). Spec [19.2 §7](arch/phase-19/spec-19.2.md).

### D-DICE-SERVER-RNG — Autoritativní hod na serveru (follow-up po Cestě A)
**Soubory:** BE `common/dice/dice-payload.validator.ts` (dnešní očista) + FE roll engine `chat/dice/lib/rollEngine.ts` (455 ř.) + `diceNotation.ts` (`@` předurčený výsledek pro 3D).
**Stav:** GI díra „klient je autorita nad total" zavřena Cestou A 2026-07-12. NEzavřené zbytky: (a) re-rolling (hráč hází lokálně dokola, pošle „šťastný" validní hod); (b) cílené podvody uvnitř systémových hodů (2d6+/roll-under/percentile/mixed); (c) kosmetická pod-pole (d100 `tens`/`ones`, `crit`, `breakdown`) se nevalidují proti faces.
**Trigger:** potřeba kompetitivní/turnajové integrity (dnes hobby + moderující PJ = přijatelné).
**Co bude potřeba:** Cesta B — FE pošle záměr, server hodí svým RNG, FE 3D přehraje přes `@` notaci. Vyžaduje port roll enginu na BE — pozor na `2d6+` (`sum≠Σfaces`) a nesčítání modifieru u GURPS/CoC/flat.

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_
