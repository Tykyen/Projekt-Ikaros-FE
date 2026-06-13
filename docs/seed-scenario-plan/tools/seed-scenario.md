# M-E2E — seed-scenario (jeden hlavní průchod aplikací)

> **Spustitelný** scénář (na rozdíl od ostatních 8 auditů). Jeden lineární průchod = páteř; u každého
> uzlu mřížka 13 os. Běží přes [`createTestApp`](../../../../Projekt-ikaros/backend/test/helpers/app-factory.ts)
> (supertest HTTP) + **in-process `connection`** (DB tvrzení = L4 v testu). Nálezy →
> [`../../seed-scenario-audit.md`](../../seed-scenario-audit.md) (`SS-xx`).
>
> Sourozenec [`integrity-scan.md`](../../db-integrity-plan/tools/integrity-scan.md), ale opačná osa: scan
> měří **stav jednorázově nad celou DB**, tenhle prochází **lineárně a tvrdí po každém kroku v kompozici**.
> Sdílí FK orphan seznam (jeden zdroj pravdy).

---

## Páteř — kroky a tvrzení (happy-path + mřížka)

> `H` = hráč, `PJ` = zakladatel světa. Status = očekávaný HTTP. „DB po kroku" = in-process introspekce.

### 01 — Uživatel
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST /api/auth/register` PJ + H | 201 | `users` ×2, bcrypt hash (ne plaintext), unique username/email | `EX` |
| `POST /api/auth/login` (identifier=email i username) | 200 | accessToken + refreshToken vráceny | `EX` |
| register duplicitní username | 409 | žádný 2. user | `RC`/`ID` |
| chráněný endpoint bez tokenu | 401 | — | `AC` |

### 02 — Svět (PJ)
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST /api/worlds` (PJ) | 201 | **side-effecty:** `worldmemberships` owner (PJ), `world_currencies`, `world_calendar_configs`, `worldsettings`, diary version — **všechny vznikly** | `SE` |
| — orphan check | — | `pages`/`characters`/`memberships`.worldId ∈ worlds (zatím jen owner membership) | `IN` |
| — `FA`: spy `calendar.save` → reject | 500 | svět **úplný-nebo-čistý** (DI-04); ne svět bez kalendáře | `FA` |
| — `OB`: pošli `__bogus` field | 201 | pole **není** v DB (ValidationPipe drop), žádný error-log | `OB` |

### 03 — Člen (H vstupuje)
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST .../access-request` (H, private svět) | 201/200 | access-request záznam | `EX` |
| `POST .../access-requests/:id/approve` (PJ) | 200 | `worldmemberships` H vznikl (role default) | `SE` |
| `PATCH .../members/:id/role` → `Hrac` | 200 | role=Hrac **+ `world.playerCount` == count(Hrac)** (DI-05) | `SE`/`INV` |
| `PATCH .../members/:id/character` → přiřaď PC | 200 | `membership.characterPath` set **+ auto soukromá konverzace** v kanálu Postavy (chat 6.7) | `SE` |
| — `AC`: H zkusí approve sám sebe / cizí | 403 | — | `AC` |
| — `RC`: 2× join/approve naráz | 1×OK | `worldmemberships {userId,worldId}` count = 1 | `RC` |
| — `RT`: approve → broadcast | — | (L5 wire) socket klient H dostane membership event | `RT` |

### 04 — Stránka (PJ)
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST .../pages` běžná | 201 | `pages` doc, `{worldId,slug}` unique, slug v directory | `EX`/`SE` |
| `POST .../pages` **persona** | 201 | **`characters` doc vznikl** (persona → Character, 9.1) + 5 subdoců | `SE` |
| `POST .../pages` **Lokace** | 201 | Character `kind:location` + jen calendar subdoc (project_lokace_kalendar) | `SE` |
| — `FA`: spy `pagesRepo.save` reject po char create | 500 | **0 osiřelých postav+subdoců** (DI-04 rollback) | `FA` |
| — `RC`: paralelní create stejný slug | 1×OK | `pages {worldId,slug}` count=1 | `RC` |

### 05 — Postava
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST .../characters` PC | 201 | `characters` + subdocy **přesně 1× od typu** (diary/finance/inventory/notes/accounts — CARD) | `SE`/`CARD` |
| `POST .../characters` NPC (`isNpc`) | 201 | `isNpc=true` ∧ `userId=null` (STATE konzistence) | `SE`/`STATE` |
| přiřaď PC vlastníkovi (H) | 200 | owner vidí AKJ default (project_akj_owner_visibility) | `SE`/`AC` |
| — `IN` | — | character.worldId ∈ worlds; subdoc.characterId ∈ characters | `IN` |

### 06 — Chat
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST .../chat/groups` (kanál) | 201 | `chatgroups` doc | `EX` |
| `POST .../chat/groups/:id/channels` (konverzace) | 201 | `chatchannels` doc, toEntity mapper neztratil pole (project_chat_channel_field_checklist) | `SE` |
| `POST .../chat/channels/:id/messages` | 201 | `chatmessages` doc, senderId = autor | `EX` |
| — `AC`: H bez access do kanálu | 403 | hasChannelAccess gate | `AC` |
| — `RT`: message → broadcast room | — | (L5 wire) 2. klient dostane zprávu, leak-safe room | `RT` |

### 07 — Mapa
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `POST /maps?worldId` scéna | 201 | `mapScenes` doc | `EX` |
| přidat token (PC/NPC/bestie) | 200/201 | token v scéně, HP seed (project_token_hp_architecture) | `SE` |
| assign scénu hráči (`currentSceneId`) | 200 | `membership.currentSceneId` = scéna | `SE` |
| — `IN` | — | currentSceneId ∈ mapScenes; token.worldId shoda | `IN` |

### 08 — Oprávnění + izolace (negativní + 2 světy)
| Akce | Status | Tvrzení | Osy |
|---|---|---|---|
| H: create page/character/scene | 403 | obsah jen PJ+ | `AC` |
| H: approve / remove člena / delete world | 403 | governance jen PJ+ | `AC` |
| platform Admin: approve/transfer/delete **cizího** světa | 403 | **R-20** (admin nemá moc ve světě) | `AC` |
| svět B postaven; identita A čte pages/chat/maps/members B | 403/404/[] | **0 cross-leak** | `IS` |
| H zamčená AKJ záložka cizí postavy | 🔒 bez obsahu | locked-but-visible (project_akj_locked_tabs_visible) | `AC` |

### 09 — Mazání (uzavření smyčky)
| Akce | Status | DB / tvrzení po kroku | Osy |
|---|---|---|---|
| `DELETE .../pages/:slug` | 200 | page pryč; directory entry pryč; (blob → L5-infra) | `CL` |
| `DELETE /maps/:id` scéna | 200 | **`membership.currentSceneId` vyčištěno** (CD-04) → hráč ne na mrtvé mapě | `CL`/`RR` |
| `DELETE /api/worlds/:id` (soft) | 200 | `deletedAt` set, `isActive` konzistentní; chat **NE** destruktivně (recovery-safe) | `RB` |
| restore svět | 200 | svět **PLNĚ intaktní** (membership/pages/chat/mapa zpět) | `RB` |
| hard-delete (cron / přímo) | — | **`expectWorldFullyDeleted`: 0 dokumentů s worldId** napříč ~40 kolekcí + 0 dangling | `CL` |
| — `FA`: pád na kolekci #15 z 40 | — | mezistav zdokumentován (best-effort `safeDelete`, CD-06) | `FA`/`TX` |
| — `TM`: fast-forward 30d → world-cleanup cron | — | cron smaže soft-smazaný svět; idempotentní re-run | `TM` |

---

## Jak spustit

```bash
# v backend/ — po harness upgradu (replica set) a napsání seed-scenario.e2e-spec.ts
cd backend
npm run test:e2e                          # všechny e2e včetně seed scénáře
npx jest --config ./test/jest-e2e.json seed-scenario   # jen tenhle scénář

# L5-infra (reálná docker infra — blob/Meili pravda):
docker compose up -d                      # mongo rs0 + redis + meili
SEED_INFRA=1 CLOUDINARY_FOLDER=__seedtest npm run test:e2e

# L5-teeth (mutation — má scénář zuby?):
npx stryker run                           # po přidání @stryker-mutator/core
```

⚠️ **Pořadí budování:** páteř (L2 smoke) → mřížka (L3→L4) → gauntlet (`FA`/`RC`/`IS`) → L5. Neskákat na
fault injection, dokud happy-path neprojde zeleně — jinak nevíš, jestli červená = nález, nebo rozbitý seed.

## Bezpečnost
In-memory mongo = izolované, bezpečné. L5-infra běh sahá na **reálné** Cloudinary/Meili → **vlastní test
prefix/folder + cleanup**, nikdy prod ([project_server_swap]: cíl `www.projekt-ikaros.com`). `MG` migrace
běh nad světem `matrix` jen **čte/diffuje**, nepíše do živých dat.

## Vazba na ostatní audity
`IN`/`CL` orphan tvrzení **přebírají FK seznam** z [`integrity-scan.md`](../../db-integrity-plan/tools/integrity-scan.md)
(WORLD_SCOPED + subdocs + RR). `CL` cascade povrch = [cascade-delete](../../cascade-delete-audit.md) (CD-04..10).
`AC` matice = [role-audit](../../role-audit.md) (R-20). Scénář je **prokazuje za běhu v kompozici**, registr
nezdvojuje — sdílené nálezy cross-ref.
