# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-07-13 (po hromadné opravě dluhů 12.–13. 7. — vyřešené smazány, viz git log + chybový deník ✅ ŘEŠENÍ).

---

## Otevřené

### D-063 — Identita správce (spolek) + zpracovatelé nedoplněni na legal stránkách (20A)
**Soubor:** `src/features/ikaros/pages/PrivacyPage.tsx:35-200`, `ContactPage.tsx:27-52` — placeholdery `[DOPLNIT: …]`
**Problém:** Zásady OÚ (`/soukromi`), Kontakt (`/kontakt`) a Podmínky nemají doplněnou totožnost správce: chybí název spolku, IČO, sídlo, spisová značka + soud spolkového rejstříku a kontaktní/provozní e-mail (pro uživatele i orgány). Navíc seznam zpracovatelů v Zásadách OÚ má u části služeb (hosting, SMTP, AI/LLM, error tracking, platební brána) nepotvrzené konkrétní poskytovatele + jejich EU/třetí-země status a transfer mechanismus (DPF vs. SCC).
**Dopad:** Vysoký (blokuje **veřejné spuštění**) — GDPR čl. 13 vyžaduje totožnost správce, DSA čl. 11/12 kontaktní místa; bez nich nelze web pustit veřejně. NEblokuje implementaci ani beta.
**Řešení:** Až uživatel/advokát dodá údaje spolku, nahradit všechny `[DOPLNIT]` (grep `dopisat` / `DOPLNIT`), potvrdit seznam zpracovatelů a u každé US služby uvést DPF/SCC. Poté bumpnout verzi dokumentů.
**Kdy:** Před veřejným spuštěním (spolek se teprve zakládá). Součást Přílohy C (20.1–20.3). **Blokováno na vstupu uživatele/advokáta.**

---

### D-17.8-A11Y-BACKLOG — Přístupnost: odložené vrstvy nad rámec 17.8 v1
Zbývá (nízká priorita, vyžaduje živou kontrolu):
- **IconButton adopce** — ~16 ručních `<button>+lucide` (chat: `ChannelItem/Group/View`, `EmoteCard`, rail `*Panel`…) má aria-label, ale neadoptovalo primitiv. Čistě konzistenční refactor; POZOR `IconButton .iconBtn` = ghost/transparent styl → migrace MĚNÍ vzhled → nutný `mobil-desktop` per skin, ne slepě.
- **Storybook axe** (`.storybook/preview.tsx`) — zůstává `test:'todo'`. Přepnutí na `error` je **no-op**, dokud jsou storybook component testy mimo `vitest run` (D-033, ESM/CJS race) → axe se v CI nespouští. Trigger: browser-mode axe v CI (vyřešení D-033) + ověřená čistota 14 stories.
- **Focus trap do in-app overlayů**: `WorldChatRoom` mobilní sidebar + scrim, `ChatContextRail` (bez Escape/trap/dialog), `MapNotebookOverlay` + `TokenInfoPanel` (mají Escape+`role=dialog`, chybí trap/restore). Sdílený `useFocusTrap` je připraven — chybí napojení. **Odloženo:** vyžaduje živý mobilní/mapový test (trap ve špatně posouzeném kontextu zhorší UX), proto ne naslepo.
**Dopad:** Nízký — základní a11y funguje, hlídá lint. Roadmap 17.8 značené 🔁 (průběžné).
**Kdy:** IconButton+overlaye při příští práci na daných plochách (s `mobil-desktop`); axe s D-033.

---

### D-DATA-SYNC-ZBYTKY — zbytky po D-NEW-INV-DATA-SYNC (2026-07-12)
**Soubory:** BE `characters/characters.repository.ts` + controller (legacy directory), `maps/operations/token-hp-diary-map.ts` (sync mapa).
**Problém:** (a) legacy `GET /worlds/:id/characters/directory` žil vedle Pages directory (dvojí zdroj); (b) token→deník HP sync přeskočen u systémů s nejednoznačným mapováním: shadowrun (odvozenina `sr_attr_bod`+`sr_cond_phys`), fae/fate (stress boxy = pole), drdplus (pásma zranění), drd2 (3 zdroje) + pole `systemStats`/`injury`/`initiative` (nemají v deníku domov).
**Dopad:** Nízký/střední — (a) už jen mrtvá HTTP route na BE; HP z mapy se u 5 systémů nepropíše (chování jako dřív).
**Řešení:** (a) FE migrace `useCharacterDirectory` → Pages directory ✅, pak smazat legacy endpoint; (b) per-system rozhodnutí mapování (produktové — jak má HP z mapy zapisovat do stress boxů / pásem).
**Stav (a) 2026-07-13 — FE MIGROVÁNO, zbývá smazat legacy route po živém ověření.** BE doplnil: `characterId: string | null` v pages directory entry (z `characterRef`; entry.id zůstává page ID — past `directory_id`) + `OptionalJwtAuthGuard` a `assertCanViewWorld` vždy (anonym: veřejný svět 200, privátní 403 — parita s legacy `assertCanViewDirectory`). FE: `useCharacterDirectory` = adapter nad `GET /pages/directory?type=Postava hráče,NPC,Lokace` se STEJNÝM výstupním tvarem (`id`=**characterId** → finance selecty v `SettingsAccountSection` bezpečné; `userId`=`ownerUserId` → oživena dřív mrtvá sekce „Tvé postavy" v `MapEmptyState` — legacy `userId` nevracel) i queryKey (`charactersQueryKey.directory` → C-15 invalidace z useCreate/Update/DeletePage + useCharacterMutations beze změny); všech 9 call-sites nedotčeno; testy `useCharacterDirectory.spec.tsx`. **Zbývá:** po ověření na živém webu smazat BE `GET /worlds/:id/characters/directory` HTTP route (interní `characters.service.getDirectory` pro `chat.service` enrich ZŮSTÁVÁ).
**Kdy:** (a) BE smazání route po živém ověření uživatelem; (b) při ladění daných systémů.

### D-DROBNE-2026-07-13 — drobné follow-upy z noční dávky
- **Undo `scene.image` vs. FIX-31 cleanup** — undo výměny podkladu obnoví URL, jejíž blob mohl okamžitý Cloudinary cleanup už smazat → rozbitý obrázek. MVP limitace (komentář v kódu); fix = odložit cleanup podkladů o N dní.
- **Souběžné HP úpravy PC přes deník** — bestie tokeny mají atomickou deltu (hpDelta), ale PC/NPC HP jde přes `updateWithCustomDataPatch` deníku — dva souběžné zásahy z combat panelů = stejná lost-update třída, menší dopad (jeden hráč = jeden deník).
- **DrdPlus injury strop 3×mez pod souběhem** — mez žije v systemStats, BE ji nezná → efektivní delta se ořezává lokálně; souběh může strop mírně přetéct (zásahy se neztrácejí).
**Dopad:** Nízký. **Kdy:** příležitostně při práci na daných plochách.

---

### D-SEC-GAP-2026-07-11 — bezpečnostní/compliance nálezy čekající na rozhodnutí nebo infra krok
**⭐ ROZHODNUTÍ UŽIVATELE (nelze opravit bez něj):**
- **Erasure: `content` zpráv + `username` tombstone** — plná content-erasure = právní rozhodnutí, které zatím nepadlo. (Registrace <15 už blokována ✅ 2026-07-13 — `AGE_REQUIREMENT_NOT_MET`.)
- **Account enumeration** přes `/auth/check-email`/`check-username` — mitigace hotová (throttle 10/min/IP, konstantní response ✅ 2026-07-13); zbývá rozhodnout, zda časem redesign (endpoint je záměrná UX opora registrace).
- **`chatSkin` bez supporter gate** — dle `world-membership.schema` vědomě self-service (motiv světa); rozhodnout, zda gate vůbec chceme.
**⚙️ AKCE UŽIVATELE (kód hotový, zbývá nastavení):**
- **Error telemetrie** — BE+FE Sentry/GlitchTip kód kompletní (boundary, unhandled, 5xx, non-HTTP výjimky) a deploy řetěz protažený; zbývá nastavit `SENTRY_DSN` (BE secret) + `VITE_SENTRY_DSN` (FE var) v GitHub.
**~ TECHNICKÉ (větší zásah / migrace):**
- **Ekonomika na float** — mitigace hotová (✅ 2026-07-13 `money.util`: round na 4 des., epsilon guard, NaN reject; drift se už nehromadí, historický drift v DB tolerován epsilonem). Plná migrace na celočíselné minor units = volitelný budoucí krok (migrace dat + FE formátování).
- **Mongo bez `cs` collation** — řazení českých názvů; per-kolekce migrace + indexy. (Slug diakritická kolize page↔character už suffixována ✅ 2026-07-13.)
- **MeiliSearch bez českého stemmingu** — infra/konfigurační rešerše.
- **FE vzor „prázdný stav místo chyby"** na části starších ploch (nové plochy už mají ErrorState+retry).
**Dopad:** střední (veřejná 15+ platforma). **Kdy:** rozhodovací položky = až rozhodneš; technické = první běh stylů 32–41.

### D-LAUNCH-GAP-2026-07-11 — launch-hardening zbytky (styly 42–46)
**⭐/~ VYSOKÉ+STŘEDNÍ:**
- **Vizuální regrese = 0 automatická brána** — 96 skin CSS, edit tokenu tiše rozbije skin; Chromatic nainstalován ale mrtvý; Playwright jen chromium/desktop → mobil overflow neasertován. Velká infra položka (render brána `+render` v plny-audit).
- **SMTP bounce** — outbox fronta + denní cap + retry hotové (✅ 2026-07-13); plná async bounce detekce (inbound handling / přechod na transakční službu s webhooky) zůstává — „předáno SMTP" ≠ doručeno.
**OPS (mimo kód — runbook připraven):** `docs/ops-runbook.md` (BE repo) — Mongo/Redis auth (koordinované okno, keyFile postup), backend port jen pro proxy, SPF/DKIM/DMARC, TLS/Caddyfile do IaC, firewall, deploy rollback (návrh §8 — neimplementován, nejde otestovat bez ostrého deploye).
**Dopad:** střední — doručitelnost + ops hardening. **Kdy:** vizuál = první běh stylů 42–46; ops = s tebou u serveru dle runbooku.

### D-AUDIT-2026-07-11 — zbylé nálezy plného auditu (46 stylů)
- **Bundle** — initial payload snížen o 37 % (✅ 2026-07-13: 1509→945 kB; kořen = barrel re-export → modulepreload TipTapu). Zbylí kandidáti: definice témat ~155 kB v entry (chce návrh critical-theme, jinak FOUC), auth modaly ~120 kB (vždy-mounted), vnitřní split MapPage (three.js universe, už lazy route). SLO číslo neexistuje — stanovit.
- **DB zálohy** — ruční workflow `db-backup.yml` hotový (✅ mongodump+retence+disková pojistka); zbývá TVOJE rozhodnutí off-site cíle (B2/R2/scp — runbook §6) a pak zapnout cron.
- Nefixnuté položky nižší priority v `docs/full-audit/RUN-2026-07-11-1213/report.md` + `checkpoints/`.
**Kdy:** bundle zbytky = při dalším výkonovém zátahu; zálohy = tvoje volba cíle.

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

### D-19.2-BYTES — Velikost obrázkových blobů: zbývá FE posílání + agregace
**Soubory:** FE create/update formuláře entit s obrázkem; BE agregace.
**Stav:** BE strana hotová (2026-07-13): upload endpointy vracejí `bytes`, všech ~14 image schémat má `imageBytes`/`bytes` pole vč. toEntity; server-side toky (galerie, avatary) ukládají hned. **Zbývá:** (a) FE-driven toky `imageBytes` z upload response do create/update DTO zatím NEposílají (pole zůstává prázdné); (b) agregace per svět/uživatel pro měření (podmínka kvót UM-10); (c) staré bloby bez bytes (retroaktivně nejde).
**Trigger:** až bude potřeba přesná velikost per svět/uživatel (kvóty UM-10).
**Co bude potřeba:** protáhnout `bytes` z upload response do entit ve FE formulářích (mapy, bestie, stránky, emoty, světy, rostliny…); pozor na pár imageUrl+imageBytes (výměna obrázku bez bytes = stale hodnota). Spec [19.2 §7](arch/phase-19/spec-19.2.md).

### D-DICE-SERVER-RNG — Autoritativní hod na serveru (follow-up po Cestě A)
**Soubory:** BE `common/dice/dice-payload.validator.ts` (dnešní očista) + FE roll engine `chat/dice/lib/rollEngine.ts` (455 ř.) + `diceNotation.ts` (`@` předurčený výsledek pro 3D).
**Stav:** GI díra „klient je autorita nad total" zavřena Cestou A 2026-07-12. NEzavřené zbytky: (a) re-rolling (hráč hází lokálně dokola, pošle „šťastný" validní hod); (b) cílené podvody uvnitř systémových hodů (2d6+/roll-under/percentile/mixed); (c) kosmetická pod-pole (d100 `tens`/`ones`, `crit`, `breakdown`) se nevalidují proti faces.
**Trigger:** potřeba kompetitivní/turnajové integrity (dnes hobby + moderující PJ = přijatelné).
**Co bude potřeba:** Cesta B — FE pošle záměr, server hodí svým RNG, FE 3D přehraje přes `@` notaci. Vyžaduje port roll enginu na BE — pozor na `2d6+` (`sum≠Σfaces`) a nesčítání modifieru u GURPS/CoC/flat.

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_
