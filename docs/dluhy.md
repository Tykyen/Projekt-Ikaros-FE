# Technické dluhy

> Soubor obsahuje **pouze otevřené a odložené** dluhy.
> Historie uzavřených dluhů dohledatelná v git logu (`git log --all -- docs/dluhy.md`).
> Stav k 2026-06-01.

---

## Otevřené

### D-NEW-SYS-DIARY-DRIFT — Dračí Hlídka: nesladěné id mezi nabídkou systémů a deníkem
**Soubor:** `src/features/ikaros/pages/CreateWorldPage/constants/systems.ts` (RPG_SYSTEMS) ↔ `src/features/world/pages/CharacterDetailPage/diary-systems/registry.ts` + `presets/drdh.ts`
**Problém:** **Jeden systém (Dračí Hlídka) má dvě různá id.** Nabídka při vytvoření světa ho ukládá jako `world.system = 'draci-hlidka'`, ale jeho deník je registrovaný pod klíčem **`drdh`** (`drdh.ts`: `id: 'drdh'`, `name: 'Dračí Hlídka'`; `types.ts` whitelist zná jen `drdh`). Diary registry nezná `draci-hlidka` → **svět vytvořený jako Dračí Hlídka svůj deník nenajde a dostane prázdné/generic schema.** (Žádný samostatný „Dračí Doupě Hero" neexistuje — `drdh` JE Dračí Hlídka.)
**Dopad:** Střední — funkční bug: existující/nové světy „Dračí Hlídka" nemají svůj deníkový list. Blokuje dotažení systému (roadmap2 16.2h).
**Řešení:** Sjednotit na **jedno** id napříč vrstvami (nabídka systems.ts · FE diary registry/types/preset · BE `system-presets` + export-schemas). Doporučeno sladit deník na `draci-hlidka` (id z nabídky, které se ukládá do `world.system`) — nebo přidat alias `draci-hlidka → drdh` v registry. Ověřit migraci případných existujících světů.
**Kdy:** Před rozjezdem fáze 16.2 (hloubková podpora systémů). Zaznamenáno i v `docs/roadmap2.md` (16.2 drift blok + otevřená otázka #10).

---

---

> _(Shop-purchase atomicita přesunuta jako `FA` cíl do
> [`seed-scenario-plan/00-cross-cutting.md`](seed-scenario-plan/00-cross-cutting.md) — opraví se tam s důkazem rollbacku.)_

---

## Odložené (čeká na trigger)

### D-NEW-UM02-private-media-delivery — Privátní média mají veřejnou Cloudinary URL
**Soubory:** BE `upload.service.ts` (upload type), `images.controller.ts` (proxy); FE render privátních obrázků (mapy, AKJ, chat)
**Stav:** Cloudinary assety se nahrávají jako `type: 'upload'` (public). Privátní obsah (AKJ obrázky ve stránkách, privátní mapy `visibleToPlayerIds`, přílohy privátních zpráv) má veřejnou URL → kdo zná link, stáhne i bez oprávnění. BE access správně filtruje JSON odpovědi, ale URL samotná není chráněná. **Vědomě akceptováno (upload/media audit UM-02, 2026-06-14):** publicId je 20+ znaků náhodný (enumerace nemožná), únik vyžaduje aktivní sdílení oprávněným uživatelem. Pro single-svět hobby provoz je obscurity dostatečná.
**Trigger:** veřejný / komerční / multi-tenant provoz, kdy svět/postavy uvidí cizí lidé a obscurity přestane stačit (riziko hromadného scrape).
**Co bude potřeba:** rozhodnout (a) proxy endpoint s ACL pro NE-TipTap média (mapy/page.imageUrl/chat — jdou přes komponenty) vs (b) Cloudinary `authenticated` type + signed delivery URL (čistší, ale re-upload migrace ~3000+ assetů + signed URL expirace rozbije TipTap embedy). **Pozor:** AKJ obrázky vložené přímo v TipTap HTML (`section.content`) nezavře ani jedna varianta bez přepsání uloženého obsahu — known gap.

### D-NEW-UM10-storage-quota — Žádná per-user storage kvóta na uploady
**Soubory:** BE `upload.controller.ts` (rate-limit ✓ hotový), chybí storage tracking
**Stav:** Upload routy mají rate-limit (`@Throttle` 20/min/IP — UM-10, 2026-06-14), což brání rychlému spamu. Chybí ale **kumulativní per-user kvóta** (celková velikost nahraného obsahu) → trpělivý uživatel může postupně zaplnit Cloudinary úložiště.
**Trigger:** Cloudinary se blíží limitu free/placeného tieru, nebo komerční provoz s neznámými uživateli.
**Co bude potřeba:** sledovat součet `size` per uživatel (kolekce/agregace), gate v upload service při překročení.

### D-NEW-PC21-embedding-model-host — Embedding modely fyzicky hostovat (zbývá OPS krok)
**Soubor:** BE `backend/src/modules/search/embedding-search.service.ts:370-396` + `docker-compose.prod.yml` + `.env.example`
**Stav:** Production-config audit **PC-21 — konfigurační část HOTOVÁ:** model URL (granite107/278 ONNX+tokenizer) jsou teď explicitní a přepsatelné přes env (`EMBEDDING_GRANITE*_ONNX_URL`/`_TOKENIZER_URL`) v compose i `.env.example` (default = `www.patrikzplzne.cz`). Skrytá závislost zviditelněna. **Zbývá jen OPS krok** (mimo kód): nahrát model soubory na vlastní hosting (Cloudinary/S3/BE image) a přepsat ty env vars — to nelze udělat bez přístupu k souborům modelů.
**Trigger:** příprava ostrého provozu se sémantickým search, nebo nedostupnost `patrikzplzne.cz` ([[project_server_swap]] — sourozenec `newmatrix.patrikzplzne.cz` je mrtvý).
**Co bude potřeba:** stáhnout 4 model soubory, nahrát na vlastní úložiště, nastavit 4 env vars v GitHub vars / serverovém `.env`.

### D-NEW-chat-presence-scale — In-memory presence světového chatu × více instancí BE
**Soubory:** BE `chat/chat-presence.service.ts`
**Stav:** `ChatPresenceService` drží presence konverzací v `Map` v paměti procesu. Pro
single-instance BE (aktuální stav — žádné repliky, `SOCKET_IO_REDIS` vypnuté) je to
**správné rozhodnutí** — nulová latence, žádná infra závislost. Stejný vzor jako
in-memory rate-limiter (D-028).
**Trigger:** nasazení víc instancí BE (load balancer / horizontální scaling) — presence
by se mezi instancemi neviděla (BE-1 vidí jen své sockety, BE-2 své).
**Infra ready:** Redis je v projektu (`ioredis`, `@socket.io/redis-adapter`, RedisModule,
docker-compose), Socket.IO Redis adapter je opt-in přes `SOCKET_IO_REDIS=1` v
`backend/src/socket-io.adapter.ts`. Chybí jen migrace samotné presence z `Map` na Redis
hash (~8-16 h: refactor join/leave/list na ioredis hash/set + TTL cleanup + failover
fallback na Map + testy).
**Kdy:** Při přechodu na multi-instance BE. **Dělat dřív = mrtvý kód** pro neexistující infru.

### D-NEW-color-tokens — Hardcoded barvy → theme tokeny (chrome drift)
**Plán:** [n2-color-mapping.md](n2-color-mapping.md) (mapa kategorií + tokeny + postup).
**Stav (2026-06-16):** `npm run lint:colors` hlásí **2340**, ale rozbor ukázal, že jde o dvě věci:
**1271 datové identity** (kostkové skiny `/chat/dice/` 454 + herní systémy `/diary-systems/` 817) = záměrně fixní napříč tématy, **patří do ALLOW** (stejně jako vyňatý `tactical-map/system-panels`), NE tokenizovat; **1069 skutečný chrome drift** ve 160 souborech k tokenizaci na theme-aware tokeny.
**Bezpečný první krok (bez vizuálu):** rozšířit `ALLOW` v `scripts/lint-no-hardcoded-colors.mjs` o `/chat/dice/lib/`+`/chat/dice/components/models/`+`polyhedralDice.css`+`/diary-systems/styles/`+`/diary-systems/sheets/` → číslo spadne na ~1069. (Dice UI pickery do ALLOW NE — jsou chrome.)
**Zbytek:** vizuální projití per komponenta napříč 2–3 tématy (proto ne v automatickém commitu). Top cíle: `TemplateEditorModal`(34), `NotificationCenter`(28), `PostavaLayout`(27)…
**Trigger:** sjednocení vzhledu / nový skin odhalí drift. **Měření:** `npm run lint:colors`.
