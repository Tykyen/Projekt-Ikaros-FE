# Cascade delete plán — uklidí se po smazání všechno?

> **Účel:** systematicky projít smazání **každé hlavní entity** Ikara (svět, stránka, postava,
> mapa/scéna, obrázek, uživatel) a ověřit, že se **uklidí celý závislý strom** — žádná osiřelá data,
> žádné visící odkazy, žádné nevyčištěné externí bloby, a nic navíc (cizí/sdílený zdroj). Cílová
> otázka u každé entity:
> „když tohle smažu, zmizí **všechno, co na tom viselo** — a **jen** to — a zůstane DB i úložiště konzistentní?"
>
> Sedmý sourozenec [`bug-plan/`](../bug-plan/README.md), [`ws-contract-plan/`](../ws-contract-plan/README.md),
> [`role-plan/`](../role-plan/README.md), [`form-schema-plan/`](../form-schema-plan/README.md),
> [`cache-plan/`](../cache-plan/README.md) a [`state-consistency-plan/`](../state-consistency-plan/README.md).
> Tenhle testuje **integritu mazání**: vrstvu, kterou žádný z předchozích neprochází — ti řeší zápis,
> oprávnění, real-time a obnovu, ne **destrukci a úklid po ní**.
>
> **Stav:** zahájeno 2026-06-13. Nálezy → [`../cascade-delete-audit.md`](../cascade-delete-audit.md) (ID `CD-xx`).

---

## Proč samostatný plán (co ostatních 6 auditů míjí)

Mazání je **jednosměrná destruktivní operace bez UI feedbacku o úklidu**. Request projde (200),
oprávnění sedí (role OK), cache se invaliduje (cache OK) — a přesto v DB zůstane osiřelá postava,
na Cloudinary mrtvý blob, a token na mapě ukazuje na neexistujícího vlastníka. **Nikdo si toho
nevšimne**, dokud se to neprojeví jako broken odkaz, leak úložiště nebo crash při resolve.

| Slepá skvrna | Příklad reálného rizika v Ikarovi | Dopad |
|---|---|---|
| **Orphan (osiřelé dítě)** | smažu svět, ale `pages`/`characters` zůstanou (cascade na kolekci se zapomene) | 🔴 leak dat + místo + leak-safety |
| **Dangling ref (visící odkaz)** | smažu scénu, `membership.currentSceneId` ukazuje na neexistující → hráč na mrtvé mapě | 🔴 broken resolve / crash |
| **External blob leak** | smažu stránku, ale `imageUrl` blob zůstane na Cloudinary navždy | 🔴 storage leak (platí se za to) |
| **Over-cascade** | sdílený obrázek 2 stránek — smazání jedné zabije blob → druhá má broken url | 🟠 poškození cizí entity |
| **Neúplná kaskáda** | event-driven cascade přes 3 listenery — jeden selže → půlka úklidu | 🟠 částečný orphan |
| **Ne-atomicita** | hard-delete 40 kolekcí best-effort — selže na #15 → #1–14 pryč, #15–40 orphan | 🟠 nekonzistentní mezistav |
| **Soft/hard záměna** | soft-delete skryje, ale recovery nevrátí vše / hard cron nedočistí | 🟠 zombie data |
| **GDPR neúplnost** | smazaný uživatel — osobní data přežijí v chatu/poště/přátelství | 🔴 právní + privacy |

> 💡 **Závěr:** všech 6 předchozích auditů ověřuje, že se data správně **vytvoří, zobrazí, zabezpečí,
> obnoví a real-time šíří**. Žádný neověřuje, že se správně **zničí**. Mazání je jediná operace, kde
> chyba = trvalá nekonzistence bez self-healingu (na rozdíl od stale cache, kterou spraví F5).

---

## Architektura mazání v Ikarovi (kde se úklid děje)

> Zmapováno průzkumem 2026-06-13. Tři různé vzory napříč entitami — **nejednotnost je sama o sobě riziko**.

| Vrstva | Mechanika | Kde | Entity |
|---|---|---|---|
| **Soft-delete + recovery** | `deletedAt`/`isActive` flag, 30d okno, restore endpoint | `worlds.service`, `users.service` | svět, uživatel |
| **Hard-delete cron** | denně sken `deletedAt < now-30d` → hard cleanup | `world-cleanup.cron` (03:30), `account-cleanup.cron` (03:00) | svět, uživatel |
| **Centrální cascade service** | explicitní seznam ~40 kolekcí, `safeDelete` best-effort | [`world-hard-delete.service.ts`](../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts) | svět |
| **Event-driven cascade** | `emitAsync('X.deleted')` → `@OnEvent` listenery | character.deleted (3 listenery), world.deleted, user.deletion.hardDeleted | postava, uživatel, svět→chat |
| **Přímý hard-delete** | `findByIdAndDelete`, žádný event, žádný cleanup | [`pages.service`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts), [`maps.service`](../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts) | **stránka, scéna** ⚠️ |
| **Inline subdokumenty** | mažou se s rodičem automaticky (embedded) | tokens/fog/effects/dice ve scéně; finance/inventory/notes v character | scéna, postava |
| **Externí blob** | Cloudinary, vlastní lifecycle — cleanup jen event-driven | [`upload.service.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts) `@OnEvent` | obrázky |

> ⚠️ **Tři systémové slabiny už z architektury:** (1) **stránka a scéna** mažou napřímo bez eventu →
> žádná cascade hook, žádný blob cleanup. (2) **Blob cleanup je event-driven jen pro pár eventů**
> (message.deleted, user.hardDeleted) → entity bez takového eventu leakují. (3) **Žádné ref-counting**
> sdílených blobů → over-cascade.

📚 **Soft vs hard delete:** soft = označí jako smazané (`deletedAt`), data zůstanou pro 30d obnovu;
hard = fyzicky pryč z DB. Svět/uživatel mají oboje (soft hned, hard cronem po 30d). Stránka/postava/scéna
jdou rovnou hard — žádná obnova. To je vědomé pro „malé" entity, ale znamená to, že chyba v jejich
cascade je **okamžitě nevratná**.

---

## Kontrolní osy (8)

| Osa | Zkr | Otázka | Jak ověřit |
|---|---|---|---|
| **Orphans** | `OR` | Zůstanou po smazání osiřelé **child** záznamy (kolekce keyed na smazané ID)? | seznam child kolekcí vs cascade seznam |
| **Dangling refs** | `DR` | Zůstanou **odkazy** na smazané ID v jiných dokumentech (FK bez cleanup)? | grep ID napříč schématy |
| **Cascade completeness** | `CC` | Smaže se **celý** závislý strom (žádná kolekce/listener nevynechán)? | strom vs reálný cascade kód |
| **Over-cascade** | `OC` | Nesmaže se **sdílený / cizí** zdroj navíc? (ref-counting blobů/assetů) | sdílené ID → maže se podmíněně? |
| **External cleanup** | `EX` | Je **externí blob** (Cloudinary/GDrive) uklizen, nebo leakuje? | delete entity → `deleteImage` volání? |
| **Atomicity** | `TX` | Je cascade **atomická** (transakce/session), nebo best-effort s částečným selháním? | session vs sekvence removeů |
| **Soft/Hard + recovery** | `SH` | Soft skryje správně? Recovery vrátí **vše**? Hard cron dočistí? | restore path + cron sken |
| **GDPR** | `GD` | Osobní data smazaného uživatele **nepřežijí** (anonymizace úplná)? | anonymize $set/$unset vs PII pole |

`OR` a `EX` jsou osy **trvalého leaku** (data/blob zůstane navždy). `DR` je osa **broken resolve**
(crash/404 při dereferenci). `OC` je osa **kolaterálního poškození** (smazání A poškodí B). `GD` má
**právní** váhu.

> 💡 `OR` vs `DR` rozdíl: orphan = osiřelé **dítě** (child kolekce keyed na parent ID — `pages.worldId`).
> Dangling = visící **odkaz** (cizí dokument drží smazané ID jako referenci — `membership.currentSceneId`).
> Orphan zabereš orphan-scanem; dangling grepem cross-collection ref.

---

## Hloubkové perspektivy (5)

### P1 — Dependency graph (osa `OR`/`CC`) — páteř
Pro každou entitu vypiš **graf závislostí**: které kolekce ji referencují (child keyed na její ID) a
které dokumenty drží její ID jako odkaz. Teprve pak porovnej s reálným cascade kódem. **Chybějící hrana
v cascade = orphan/dangling nález.** Inventura existuje (Explore sweep) — sweep ji potvrzuje proti kódu.

### P2 — Blob lifecycle (osa `EX`/`OC`)
Pro každou entitu s obrázkem (`imageUrl`, `avatarUrl`, `galleryImages[]`, emote, world image) ověř:
(a) smaže se blob z Cloudinary při delete entity? (b) je tam **ref-counting** (sdílený blob se nesmaže,
dokud ho někdo používá)? Sleduj `uploadService.deleteImage`/`deleteAttachments` volání a `@OnEvent`
mosty. **Entita bez blob-cleanup eventu = `EX` leak.**

### P3 — Orphan-scan (osa `OR`/`DR`, metoda M-SCAN)
Mechanická: pro každou child kolekci spusť (dev DB) dotaz „najdi dokumenty, jejichž parent ID už v
parent kolekci neexistuje". Totéž pro reference (`membership.currentSceneId` → scéna existuje?). Reálný
orphan/dangling count = tvrdý důkaz `OR`/`DR` nálezu.

### P4 — Atomicita & event-fragilita (osa `TX`/`CC`)
Cascade rozloženou do (a) sekvence removeů bez session nebo (b) N `@OnEvent` listenerů ověř na
**částečné selhání**: když selže krok K, je stav konzistentní (rollback / retry / idempotent re-run),
nebo zůstane půlka? Cron-based hard-delete: je idempotentní při opakování po pádu?

### P5 — Recovery & GDPR round-trip (osa `SH`/`GD`)
- **Recovery:** soft-delete → restore → je entita **kompletní** (všechny vazby, nic nezůstalo
  „polosmazané")? Co recovery světa po hard-delete jeho ownera (mrtvý owner)?
- **GDPR:** anonymizace uživatele — projdi **všechna PII pole** (email, bio, avatar, IP, lastLogin) a
  ověř, že `$unset`/`$set` je všechna pokryje; a že PII nepřežije v jiných kolekcích (chat author, mail,
  friendship, audit log).

### Dopad / závažnost (povinné u každého nálezu)
Ikaros **běží s reálnými uživateli a placeným úložištěm**. U každého nálezu uveď **co zůstane**
(orphan record / dangling ref / blob), **kde se to projeví** (leak / broken UI / náklady / GDPR),
a **je to vratné?** (orphan jde dočistit skriptem; smazaný blob s lost URL ne). Nevratná destrukce
(over-cascade smazaného sdíleného blobu) a GDPR únik jsou nejzávažnější.

---

## Inventura cascade (povrch auditu)

> Zmapováno Explore sweepem 2026-06-13 (BE `delete` services + crony + `@OnEvent`). Detail → oblast 00.

- **Soft-delete + 30d recovery:** svět ([`worlds.service`](../../../Projekt-ikaros/backend/src/modules/worlds/worlds.service.ts)), uživatel ([`users.service`](../../../Projekt-ikaros/backend/src/modules/users/users.service.ts)).
- **Hard-delete cron:** `world-cleanup.cron` (03:30), `account-cleanup.cron` (03:00).
- **Centrální cascade:** [`world-hard-delete.service.ts`](../../../Projekt-ikaros/backend/src/modules/worlds/services/world-hard-delete.service.ts) — ~40 kolekcí, `safeDelete` best-effort.
- **Event-driven cascade:** `character.deleted` → 3 listenery (accounts/subdocs/membership); `world.deleted` → chat softDelete; `user.deletion.hardDeleted` → owner safeguard + blob + audit.
- **Přímý hard-delete bez eventu:** stránka ([`pages.service`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts)), scéna ([`maps.service`](../../../Projekt-ikaros/backend/src/modules/maps/maps.service.ts)).
- **Blob cleanup (event-driven):** [`upload.service.ts`](../../../Projekt-ikaros/backend/src/modules/upload/upload.service.ts) `@OnEvent` jen pro message.deleted + user.hardDeleted.

---

## Metody ověření (`[auto]`) + úrovně jistoty

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — delete service / cron / `@OnEvent` listener, cascade seznam | Read/Grep |
| **M-GRAPH** | Dependency graph — extrakce schémat: kdo referencuje koho (ID pole napříč kolekcemi) | Grep schémat |
| **M-SCAN** | Orphan-scan — dev DB dotaz „child bez parenta" / „ref na neexistující ID" | mongo skript |
| **M-BLOB** | Blob audit — Cloudinary list vs DB refs → orphaned bloby | Cloudinary API + DB |
| **M2** | Cross-ref — cascade vs [role-audit](../role-audit.md) (kdo smí mazat), [cache](../cache-audit.md)/[ws](../ws-audit.md) (FE po delete) | čtení |
| **M3** | Existující test — delete/cascade spec | jest |
| **M5** | Cascade test (jest) — vytvoř strom → smaž kořen → assert child/ref/blob pryč | jest + mongodb-memory-server |

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno — cascade *vypadá* úplná | nejslabší |
| **L2** | graph ověřen (M-GRAPH) — každá hrana závislosti má cascade krok | strukturální |
| **L3** | existující test pokrývá cascade a je zelený (M3) | chování zajištěno |
| **L4** | **orphan-scan (M-SCAN)** nebo **cascade test (M5)** prokázal čistý úklid (0 orphans/blobů) | trvalá pojistka |

**Cíl:** běžné entity L2+; blob (`EX`) a dangling (`DR`) na L3+; **destruktivní/nevratné** (over-cascade
sdíleného blobu, GDPR) přes M-SCAN/M5 na L4.

---

## Baseline + pasti prostředí

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| `world-hard-delete` kolekce seznam | BE | ⬜ ověřit úplnost vs reálná schémata | ~40, ale chybí nějaká? |
| delete cascade specy | BE | ⬜ inventura | kolik delete cest má test? |
| M-GRAPH dependency graph | BE | ⬜ sestavit | kdo referencuje koho |
| M-SCAN orphan dotaz | BE (dev DB) | ⬜ spustit | reálné orphans/dangling |

⚠️ **Pasti (z paměti):**
- Soft-delete světa je **recovery-safe** — chat se NEmaže destruktivně (`content:null` zakázán) ([project_world_soft_delete]).
- Po BE změně **restart** ([feedback_be_restart_required]); jest ručně, ne jen precommit ([feedback_be_precommit_prettier]).
- Page+Character **sjednoceny** — Character drží jen 5 subdokumentů ([project_pages_character_unification]); pozor co je čí při cascade.
- Self-delete má **account-state gate** + event-driven cleanup ([project_self_deletion_architecture]).

---

## Seed kandidáti (z inventury — verdikt až při sweepu)

> Hypotézy. Sweep každý povýší na `🐛 CD-xx`, `✅ shoda` nebo `⚖️ by-design`.

- **K-CD1** `EX` 🔴 — stránka: `page.imageUrl` + `galleryImages[]` se při delete **nemažou z Cloudinary** ([`pages.service`](../../../Projekt-ikaros/backend/src/modules/pages/pages.service.ts) bez blob cleanup / eventu). Oblast 02/05.
- **K-CD2** `EX` 🔴 — postava: `membership.avatarUrl` blob leak při delete postavy/membershipu. Oblast 03/05.
- **K-CD3** `EX` 🔴 — svět: `world.imageUrl` se při hard-delete nemaže z Cloudinary. Oblast 01/05.
- **K-CD4** `DR` 🔴 — scéna: smazání scény nečistí `membership.currentSceneId` → hráč na mrtvé scéně (broken resolve). Oblast 04.
- **K-CD5** `OC` 🟠 — žádné **ref-counting** sdílených blobů → smazání entity zabije blob používaný jinou. Oblast 05.
- **K-CD6** `TX` 🟠 — world hard-delete `safeDelete` best-effort → selhání uprostřed nechá orphan z části kolekcí. Oblast 01.
- **K-CD7** `DR` 🟡 — odkazy v `page.content` / backlinks na smazanou stránku zůstanou (dead links). Oblast 02.
- **K-CD8** `OR` 🟡 — `User.favoritePageSlugs` neuklizen po delete stránky. Oblast 02/06.
- **K-CD9** `CC` 🟠 — character delete cascade přes 3 `@OnEvent` listenery → fragilní při selhání jednoho (partial). Oblast 03.
- **K-CD10** `GD` 🟡 — uživatel: friendship / mail / chat author po hard-delete — ověřit, že PII nepřežije. Oblast 06.

---

## Index oblastí (7)

| # | Oblast | Jádro povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Cross-cutting](00-cross-cutting.md) | delete architektura (3 vzory), blob lifecycle, atomicita, ref-counting, M-GRAPH + M-SCAN metoda | `TX` `EX` · P1 P3 P4 |
| 01 | [Svět](01-svet.md) | soft-delete 30d, WorldHardDeleteService ~40 kolekcí, world.deleted→chat, world.imageUrl, atomicita | `CC` `TX` `EX` · P1 P4 |
| 02 | [Stránka](02-stranka.md) | přímý hard-delete bez eventu, imageUrl+gallery blob, backlinks, favoritePageSlugs, directory | `EX` `DR` `OR` · P1 P2 |
| 03 | [Postava](03-postava.md) | event-driven 3 listenery, subdokumenty, membership.characterPath, account, avatar blob | `CC` `EX` `DR` · P1 P4 |
| 04 | [Mapa / scéna](04-mapa-scena.md) | inline subdokumenty, **membership.currentSceneId dangling**, knihovna, token obrázky | `DR` `OR` · P1 P3 |
| 05 | [Obrázek / blob](05-obrazek-blob.md) | Cloudinary lifecycle, event-driven cleanup, **ref-counting**, per-entita leak matice | `EX` `OC` · P2 |
| 06 | [Uživatel / účet](06-uzivatel-ucet.md) | soft 30d → anonymizace GDPR, owner safeguard, blob, chat/mail/friendship PII | `GD` `SH` `DR` · P5 |

---

## Legenda statusů

- ⬜ netestováno · ✅ ověřeno OK · 🐛 nález → [`../cascade-delete-audit.md`](../cascade-delete-audit.md) (`CD-xx`) · ⚠️ podezřelé · ⏭️ blokované/`[human]`

## Pracovní postup

1. **M-GRAPH** — sestav dependency graph (kdo referencuje koho) z BE schémat.
2. **P1 per entita** — strom závislostí vs reálný cascade kód → orphan/dangling delta.
3. **P2 blob matice** — každá entita s obrázkem → maže blob? ref-counting? → `EX`/`OC` delta.
4. **M-SCAN** (dev DB) — reálné orphans + dangling refs jako tvrdý důkaz.
5. **Oblast po oblasti** — verdikty, povýšit 10 seed `K-CDx`.
6. **Nález → `CD-xx`** s `soubor:řádek` + **co zůstane / kde / vratné?**; neopravovat tiše.
