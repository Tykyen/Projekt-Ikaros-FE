# DB integrity plán — je databáze konzistentní (osiřelé, rozbité, duplicitní, nemožné)?

> **Účel:** systematicky ověřit, že **stav databáze je vnitřně konzistentní** — bez ohledu na to, jak
> se tam data dostala (zápis, migrace, race, ruční zásah, partial write). Ne „uklidí se po mazání"
> (to řeší cascade-delete), ale „**je to, co tam teď leží, vůbec platné?**". Tři otázky, tři patra
> hloubky:
> 1. **Strukturální:** drží graf? (reference existují, žádné duplicity, žádní sirotci)
> 2. **Sémantické:** jsou data *logicky* možná, i když všechny reference sedí? (rovnosti, kardinalita,
>    protichůdné flagy, cykly)
> 3. **Reprezentační:** jsou ID napříč kolekcemi vůbec **stejného typu**, aby šly porovnat?
>
> Osmý sourozenec [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md), [`state-consistency-plan/`](../state-consistency-plan/README.md)
> a [`cascade-delete-plan/`](../cascade-delete-plan/README.md). Tenhle testuje **integritu stavu DB**:
> vrstvu pod všemi ostatními — ty řeší zápis, oprávnění, real-time, obnovu a mazání; žádný neověřuje,
> jestli **data v klidu vůbec dávají smysl**.
>
> **Stav:** zahájeno 2026-06-13. Plán napsán, sweep nezačal. Nálezy → [`../db-integrity-audit.md`](../db-integrity-audit.md) (ID `DI-xx`).

---

## Proč samostatný plán (co ostatních 7 auditů míjí)

Databáze Ikara drží **70 kolekcí** a drtivou většinu cross-collection vazeb jako **prosté stringy bez
Mongoose `ref:`** (`worldId`, `characterId`, `userId`, slugy…). MongoDB tedy **nevynucuje žádnou
referenční integritu** — žádný FK constraint, žádné kaskády na úrovni DB. Konzistenci drží **jen
aplikační kód**, a ten je nejednotný. Výsledek: nekonzistence vznikne tiše a **nikdo ji nevidí**,
dokud nespadne resolve, nezobrazí se prázdno, nebo se dvakrát nezaloguje totéž.

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Orphan (osiřelé dítě)** | postava v `matrix` s `worldId`, který se nenamigroval | 🔴 leak dat, mrtvé entity |
| **Broken ref (visící odkaz)** | `campaign.linkedPageSlug` → stránka přejmenovaná/smazaná | 🟠 broken resolve / prázdno |
| **Duplicita** | dvě měny se stejným kódem (žádný unique index) | 🟠 nejednoznačnost, dvojí zápis |
| **Chybějící write-validace** | service uloží child s `worldId` bez ověření světa | 🔴 dangling už **při zrodu** |
| **Partial write** | `world→membership→currencies→calendar` bez transakce, selže #3 | 🟠 svět bez kalendáře |
| **Invariant porušen** | `account.balance` ≠ Σ transakcí; `playerCount` ≠ skutečný počet | 🟠 lživá čísla |
| **Kardinalita** | postava má 0 nebo 2 deníky místo přesně 1 | 🟠 crash / nejednoznačnost |
| **Protichůdný stav** | `isNpc=true` ale `userId` vyplněno; `deletedAt` ale `isActive=true` | 🟠 logická nemožnost |
| **Typ/kódování** | `worldId` jako `ObjectId` v emotech, `string` jinde | 🔴 `$lookup` tiše selže, scan lže |

> 💡 **Závěr:** ostatních 7 auditů ověřuje, že se data správně **vytvoří, zobrazí, zabezpečí, real-time
> šíří, obnoví a zničí**. Žádný neověřuje, že **stav, který v DB leží, je platný**. Tahle vrstva je
> nejhůř viditelná (chyba se neprojeví requestem, ale tichou hnilobou) a po **právě běžící migraci
> Matrix→Ikaros** nejaktuálnější — migrace je historicky #1 zdroj orphanů a rozbitých referencí.

---

## Tři patra hloubky (čím hloub, tím tišší chyba)

### Patro 1 — Strukturální integrita
„Drží graf pohromadě?" Reference míří na existující dokumenty, nic není osiřelé, nic není duplicitní.
Osy `OR` `RR` `DUP` `WV` `AT` `IDX`. **Tohle je jádro, co uživatel chtěl.**

### Patro 2 — Sémantická integrita
„Jsou data logicky možná, i když **všechny reference sedí**?" Ref-scan z patra 1 tohle mine — vidí
platné odkazy, ne nesmyslné hodnoty. Osy `INV` `CARD` `STATE` `SET` `TEMP`. Příklady: účetní zůstatek
≠ součet transakcí; postava se „dvěma deníky"; `isNpc` v rozporu s `userId`; cyklus ve stromu složek.

### Patro 3 — Reprezentační integrita
„Jsou ID **vůbec porovnatelná**?" Osa `TYPE`. **Musí běžet první** — pokud část kolekcí drží `worldId`
jako `ObjectId` a zbytek jako `string`, každý scan porovnávající stringy dá **false-negative** (mine
reálné orphany) a runtime `$lookup`/rovnost tiše selže. Otravuje výsledky všech ostatních os.

> ⚠️ **Patro 3 napřed, patro 2 nakonec.** TYPE mismatch dělá z čistého scanu lháře; invarianty zase
> nemají smysl ověřovat, dokud strukturální vrstva nestojí.

---

## Architektura integrity v Ikarovi (kde se drží / kde ne)

> Zmapováno Explore sweepem 2026-06-13 (BE schémata + create/update services + indexy).

| Vrstva | Mechanika | Stav |
|---|---|---|
| **Referenční integrita (DB)** | FK jako string bez `ref:` → MongoDB nic nevynucuje | ❌ žádná, jen aplikační |
| **Unikátnost (DB index)** | `unique` / compound unique (slug per world, email, membership) | ⚠️ část pokryta, část jen logikou |
| **Write-time validace ref** | `findById(parent)` před zápisem childu | ⚠️ **nekonzistentní** (6+ services slepě věří `worldId`) |
| **Atomicita zápisu** | session/transakce u multi-collection write | ⚠️ jen 2 místa (membership approve, finance transfer); kaskádní create bez TX |
| **Denormalizace / mirror** | snapshoty (`avatarUrl`, owner enrich, `itemSnapshot`, counts) | ⚠️ část bez sync → drift |
| **Typ ID** | `string` napříč… kromě `custom_emotes` (`ObjectId`) | ❌ nejednotnost = mina |

> ⚠️ **Tři systémové kořeny:** (1) **FK jsou stringy bez constraintu** → integrita stojí a padá s
> aplikačním kódem. (2) **Write-validace je nekonzistentní** → dangling ref vzniká už při zápisu, ne
> až mazáním. (3) **Typ `worldId` není jednotný** → otravuje detekci všeho ostatního.

---

## Kontrolní osy (14 ve 3 patrech)

### Patro 1 — Strukturální
| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Orphans** | `OR` | child záznam, jehož **parent ID už neexistuje** (příčinně agnostické) | M-SCAN: child bez parenta |
| **Broken refs** | `RR` | pole míří na **neexistující ID/slug** (cizí dokument drží mrtvou referenci) | M-SCAN: ref ∉ cílová kolekce |
| **Duplicates** | `DUP` | porušená **zamýšlená unikátnost** (s indexem i bez) | M-SCAN: aggregate group-by |
| **Write validation** | `WV` | ověřuje create/update **existenci reference** před zápisem? | M1: čtení service |
| **Write atomicity** | `AT` | je **kaskádní create** transakční, nebo partial-write orphan? | M1: session vs sekvence |
| **Index integrity** | `IDX` | existují reálně **unique/TTL indexy**, které kód předpokládá? | M-IDX: `getIndexes` vs schema |

### Patro 2 — Sémantické
| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Invarianty** | `INV` | platí **účetní/početní rovnosti**? (balance=Σtx, count=real, worldId shoda) | M-SCAN: dopočet vs uložené |
| **Kardinalita** | `CARD` | drží **1:1 / 1:N** vztahy? (1 postava = přesně 1 od každého subdoc) | M-SCAN: group count ≠ 1 |
| **Cross-field stav** | `STATE` | neodporují si **pole v jednom dokumentu**? (flagy, enum↔timestamp) | M-SCAN: nemožné kombinace |
| **Množinová** | `SET` | dávají smysl **pole-polí**? (dup v array, self-ref, cyklus stromu) | M-SCAN: array introspekce |
| **Časová/řazení** | `TEMP` | sedí **pořadí a meze**? (`createdAt≤updatedAt`, seqNumber, kalendář) | M-SCAN: porovnání |

### Patro 3 — Reprezentační
| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Typ/kódování** | `TYPE` | je `worldId`/`userId`/… ve **všech** kolekcích **stejný bsonType**? | M-TYPE: `$type` agregace |

`OR`/`RR`/`INV`/`CARD` jsou osy **tiché hniloby** (data zůstanou nesmyslná navždy). `WV`/`AT` jsou
osy **prevence** (zabraň zrodu). `TYPE` je osa **viditelnosti** (bez ní lžou všechny ostatní).

---

## Hloubkové perspektivy (5)

### P1 — FK dependency graph (osy `OR`/`RR`) — páteř
Master matice „kdo referencuje koho": pro každou kolekci (a) **child kolekce** keyed na její ID
(orphan kandidát), (b) **cizí dokumenty** držící její ID/slug (dangling kandidát). Sestaveno
Explore sweepem → oblast 00. Každá hrana je kandidát na scan dotaz.

### P2 — Integrity-scan (osy všech pater, metoda M-SCAN) — tvrdý důkaz
Read-only sken DB ([`tools/integrity-scan.md`](tools/integrity-scan.md)): rozšířený orphan-scan přes
**všech 64 kolekcí × všechna FK pole** + **dup detekce** (aggregate) + **type detektor** + **invariant
dotazy** (balance≠Σ, count≠real, kardinalita≠1, self-ref cyklus). Vrátí **reálná čísla** = L4 důkaz.
Pustitelný i na svět `matrix`.

### P3 — Write-path prevence (osy `WV`/`AT`/`IDX`)
Čtení create/update services: validuje se existence reference **před** zápisem? je multi-collection
zápis **atomický**? existuje **unique index** tam, kde kód spoléhá na unikátnost? **Tady se chyby
rodí** — oprava prevence je trvalejší než dočištění orphanů.

### P4 — Migrace integrity — nejaktuálnější
Migrace Matrix→Ikaros (F1–F12, většina nalitá) je **jednorázový hromadný zápis mimo běžné services**
→ obešel write-validace. Pro každou fázi (F1 účty, F3 postavy, F4 stránky, F5 odkazy, F7 kalendáře…)
ověř, jaké referenční invarianty mohla porušit: úplnost ID-remapu, placeholder-email kolize vs unique
index, slug autolinky co neresolvují, validita bcrypt formátu. Scan světa `matrix` = reálný terč.

### P5 — Mirror & shape drift (osy `MIR`/`SHAPE`)
- **Mirror:** denormalizovaný snapshot ↔ zdroj — `membership.avatarUrl` vs profil, owner enrich,
  `itemSnapshot`, counts. Rozejdou se bez sync mechanismu.
- **Shape:** schema-verze a pozůstatky — 9.1 sjednocení odebralo `character.imageUrl` ap.; nesou staré
  docy odebraná pole? chybí nová required (`characterRef`, `kind`)? je `diarySchema` aktuální verze?

### Dopad / závažnost (povinné u každého nálezu)
Ikaros **běží s reálnými uživateli a čerstvě migrovanými daty**. U každého nálezu uveď **co je špatně**
(orphan / mrtvá ref / duplicita / nemožný stav), **kolik toho je** (scan číslo, ne hypotéza), **kde se
to projeví** (crash / prázdno / lživé číslo / leak) a **je to vratné?** (orphan dočistíš skriptem;
ztracená referenční hodnota po rename většinou ne).

---

## Inventura (povrch auditu)

> Zmapováno Explore sweepem 2026-06-13. Detail → oblast 00.

- **70 kolekcí** (64 top-level + 6 character subdoc kolekcí keyed na `characterId`).
- **Hlavní FK cíle:** `worlds._id` (~40 kolekcí), `users._id` (~všude), `characters._id`/`.slug`,
  `pages.slug`, `mapScenes._id`, `world_calendar_configs._id`/`.slug`, self-ref (`worldMapFolders`,
  `campaignShopGroups`, threads).
- **Slug-FK (křehké na rename):** `membership.characterPath`, `campaign.linkedPageSlug/CharacterSlug`,
  `worldnews.linkPageSlug`, `timeline.pageSlug`, `worldsettings.timelineCalendarSlug`, kategorie `key`.
- **Unique indexy:** ~25 (email, username, world slug, `{worldId,slug}` pages/characters/calendar,
  membership `{userId,worldId}`, …). **Bez indexu, ale logicky unique:** měna `code`, weather name.
- **TYPE mina:** `custom_emotes.worldId/createdBy` = `Types.ObjectId` vs `string` jinde.

---

## Metody ověření + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — create/update service, schema, index definice | Read/Grep |
| **M-GRAPH** | FK dependency graph — kdo referencuje koho (ID/slug pole napříč kolekcemi) | Grep schémat |
| **M-SCAN** | Integrity-scan — orphan / dangling / dup / invariant dotazy na DB (read-only) | mongo skript |
| **M-TYPE** | Type detektor — `$type` agregace FK pole napříč kolekcemi → mismatch | mongo skript |
| **M-IDX** | Index audit — `db.coll.getIndexes()` vs schema (unique/TTL existuje a sedí?) | mongo shell |
| **M-MIG** | Migrace cross-check — per fáze invarianty, scan světa `matrix` | skript + docs/arch |
| **M2** | Cross-ref — překryv s [cascade-delete](../cascade-delete-audit.md) (OR/DR), [form-schema](../form-schema-audit.md) (tvar) | čtení |
| **M3** | Existující test — integrity/validation spec | jest |
| **M5** | Invariant test (jest) — vytvoř stav → assert invariant drží / scan vrátí 0 | jest + mongodb-memory-server |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno — integrita *vypadá* zajištěná kódem | nejslabší |
| **L2** | FK graf ověřen (M-GRAPH) — každá hrana má buď constraint, nebo write-validaci | strukturální |
| **L3** | existující test / unique index pokrývá a je zelený (M3/M-IDX) | chování zajištěno |
| **L4** | **integrity-scan (M-SCAN)** vrátil reálné číslo (0 = čisto, N = N skutečných nálezů) | tvrdý důkaz |

**Cíl:** strukturální (`OR`/`RR`/`DUP`) na L4 (scan dá čísla); `WV`/`AT`/`IDX` na L2–L3 (čtení + index);
sémantické (`INV`/`CARD`) na L4 přes invariant dotazy; **`TYPE` na L4 hned na začátku** (bez něj L4 ostatních lže).

---

## Baseline + pasti prostředí

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| TYPE detektor (`worldId`/`userId` bsonType) | BE (DB) | ⬜ spustit **první** | mina `custom_emotes` |
| FK dependency graph úplnost | BE | ✅ Explore sweep (oblast 00) | potvrdit proti kódu |
| M-SCAN integrity dotaz | BE (dev/matrix DB) | ⬜ spustit | reálné orphan/dangling/dup |
| Unique indexy reálně v DB | BE (DB) | ⬜ `getIndexes` vs schema | drift schema↔DB |

⚠️ **Pasti (z paměti):**
- Produkční cíl je teď **`www.projekt-ikaros.com`** (server swap 12.6. — [project_server_swap]); scan jen
  read-only, ale **nejdřív dev/staging nebo svět `matrix`**, ne ostrý provoz.
- Po BE změně **restart** ([feedback_be_restart_required]); jest ručně ([feedback_be_precommit_prettier]).
- **Page+Character sjednoceny** (9.1) — Character drží jen 5–6 subdoců, `imageUrl` čte z Page
  ([project_pages_character_unification]); pozor na shape drift po migraci.
- `api.get` obaluje params, mutace berou `worldId` z path/body ([project_api_client_params_contract]) —
  ale to nezaručuje, že BE existenci světa ověří (viz `WV`).
- **Přesah s cascade-delete:** `OR`/`RR` se překrývají, ale CD čte *delete kód*, DI měří *stav DB*.
  Sdílené nálezy křížově odkázat (M2), nezdvojovat.

---

## Seed kandidáti (z inventury — verdikt až při sweepu)

> Hypotézy. Sweep každý povýší na `🐛 DI-xx`, `✅ shoda` nebo `⚖️ by-design`.

**Patro 3 (běží první):**
- **K-DI0** `TYPE` 🔴 — `custom_emotes.worldId/createdBy` = `ObjectId` vs `string` jinde → `$lookup`/scan tiše selže, false-negative všude. ([`custom-emote.schema.ts:4`](../../../Projekt-ikaros/backend/src/modules/emotes/schemas/custom-emote.schema.ts#L4)) Oblast 00.

**Patro 1 (strukturální):**
- **K-DI1** `WV`/`RR` 🔴 — create services nevalidují `worldId` existenci ([`world-news:93`](../../../Projekt-ikaros/backend/src/modules/world-news/world-news.service.ts#L93), dungeon-maps:74, timeline:154, sounds:89, weather:99, maps:198) → dangling už při zrodu. Oblast 03/01.
- **K-DI2** `RR` 🔴 — slug-FK se nepřepisují při rename: `characterPath`, `campaign.linkedPageSlug/CharacterSlug`, `worldnews.linkPageSlug`, `timeline.pageSlug`, `timelineCalendarSlug`. Oblast 01/05.
- **K-DI3** `DUP`/`IDX` 🟠 — očekávaná unikátnost bez DB indexu: `world_currencies` kód, weather generator/set name. Oblast 02.
- **K-DI8** `OR` 🟠 — 6 character subdoc kolekcí keyed na `characterId` — orphan po hard-delete postavy (přesah CD-09, scan dá count). Oblast 01.
- **K-DI9** `RR` 🟡 — chat `allowedMemberIds`/`visibleTo`/`mentions` userIds nevalidované + dangling po user hard-delete. Oblast 01.
- **K-DI12** `RR`/`SET` 🟡 — self-ref stromy `worldMapFolders.parentId`, `campaignShopGroups.parentId` → dangling parent / cyklus. Oblast 01/06.

**Patro 1 — prevence:**
- **K-DI6** `AT` 🟠 — kaskádní create bez transakce: world (`world→membership→currencies→calendar`), `page→character→subdocs` → partial write orphan. Oblast 03.
- **K-DI11-IDX** `IDX` 🟡 — membership `{userId,worldId}` unique fallback (non-replica-set) → dvojí membership na race. Oblast 02/03.

**Migrace:**
- **K-DI4** `OR` 🔴 — migrací nalité orphany (F3 postavy / F4 stránky / F5 odkazy referencují nenamigrované ID) → reálný orphan count ve `matrix`. Oblast 04.
- **K-DI10** `SHAPE` 🟠 — migrace/staré docy nesou pole odebraná v 9.1 / chybí nová required (`characterRef`, `kind`). Oblast 04/05.

**Patro 2 (sémantické):**
- **K-DI5** `MIR` 🟡 — `membership.avatarUrl` statický snapshot, nesync s profilem/postavou → stale. Oblast 05.
- **K-DI7** `RR` 🟡 — `character.preferredCalendarConfigId` / `worldnews.calendarConfigId` → smazaný kalendář = dangling. Oblast 01.
- **K-DI11** `CARD` 🟠 — postava má mít přesně 1 od každého subdoc typu (partial create → 0 / dvojí); persona page ⇔ 1 character. Oblast 06.
- **K-DI13** `INV` 🟠 — `world.playerCount` manuální ≠ skutečný count; `account.balance` ≠ Σ transakcí; cross-collection `worldId` shoda (page↔character↔subdocs). Oblast 06.
- **K-DI14** `STATE` 🟡 — protichůdné flagy: `isNpc=true`⇔`userId=null`? `deletedAt`⇔`isActive`? `kind='location'`⇔jen calendar subdoc? Oblast 06.

---

## Index oblastí (7)

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | TYPE mina, FK graf, index inventura, scan metoda, write-prevence matice, invariant katalog | všechny · P1 P2 |
| 01 | [Orphans & broken refs](01-orphans-refs.md) | full FK sweep, slug-FK, self-ref stromy, subdoc orphany | `OR` `RR` · P1 P2 |
| 02 | [Duplicates & index](02-duplicates-index.md) | očekávaná-unique inventura, has-index vs ne, reálný dup count | `DUP` `IDX` · P2 |
| 03 | [Write-path prevence](03-write-prevention.md) | create/update validace ref + atomicita per modul | `WV` `AT` · P3 |
| 04 | [Migrace integrity](04-migration.md) | per fáze F1–F12 invarianty, ID-remap, email kolize, scan světa matrix | `OR` `SHAPE` · P4 |
| 05 | [Mirror & shape drift](05-mirror-shape.md) | snapshoty vs zdroj, schema-verze, pozůstatky 9.1 | `MIR` `SHAPE` · P5 |
| 06 | [Sémantické invarianty](06-invariants.md) | ledger, count, kardinalita, stav-flagy, self-ref cyklus | `INV` `CARD` `STATE` `SET` `TEMP` · P2 |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../db-integrity-audit.md`](../db-integrity-audit.md) (`DI-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`
- `K-DIx` seed kandidát (hypotéza)

## Pracovní postup

1. **M-TYPE** — spusť type detektor **první** (`worldId`/`userId`/… bsonType napříč kolekcemi). Bez něj scan lže.
2. **M-GRAPH** — potvrď FK dependency graph proti kódu (oblast 00).
3. **M-SCAN** (dev/matrix DB) — reálné orphans + dangling + dups jako tvrdý důkaz.
4. **P3 write-prevence** — kde se chyby rodí (chybějící validace / atomicita / index).
5. **P4 migrace** — scan světa `matrix`, per-fáze invarianty.
6. **P2 invarianty** — ledger/count/kardinalita/cyklus dotazy.
7. **Nález → `DI-xx`** s `soubor:řádek` + **co / kolik / kde / vratné?**; neopravovat tiše, opravy gated (dry-run → souhlas).
