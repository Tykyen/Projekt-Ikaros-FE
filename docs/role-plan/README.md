# Role plán — hloubková kontrola oprávnění (FE gating ↔ BE guard)

> **Účel:** systematicky projít **celou autorizační vrstvu** Ikara a ověřit, že **frontendové
> gating (co kdo vidí / smí kliknout) přesně odpovídá backendovým guardům a service `assert*`**
> — pro každou roli a každou chráněnou akci.
>
> Tohle je třetí sourozenec [`bug-plan/`](../bug-plan/README.md) (REST/logika) a
> [`ws-contract-plan/`](../ws-contract-plan/README.md) (real-time). Role plán testuje výhradně
> **oprávnění**: „smí to ten, kdo to vidí? a vidí to ten, kdo to smí?"
>
> **Stav:** zahájeno 2026-06-04. Nálezy → [`../role-audit.md`](../role-audit.md) (ID `R-xx`).

---

## Proč samostatný plán (co bug-plan i `audit:routes` míjejí)

Bug-plan i WS plán role gating **zmiňují** v jednotlivých bodech, ale ani jeden ho neprochází
**systematicky napříč všemi rolemi**. `npm run audit:routes` páruje jen **existenci** FE volání ↔
BE endpointu (název + metoda) — **nevidí roli**. Díry, které proto nikdo neprojde:

| Slepá skvrna | Příklad reálného rizika |
|---|---|
| **Parita gatingu** — FE schová tlačítko, ale BE guard chybí | hráč pošle request ručně → projde (falešná bezpečnost) |
| **Over-restrikce** — FE schová víc, než BE zakazuje | hráč nevidí akci, kterou by směl → herní bloker (třída N-22 obchod) |
| **Práh role** — `>= PomocnyPJ` vs `>= PJ` na každé straně jinak | FE pustí PomocnyPJ k UI, BE vrátí 403 (třída N-16) |
| **Bypass** — GlobalAdmin / owner / PomocnyPJ konzistence | jedna strana bypass má, druhá ne |
| **Auth-leak** — 401 vs 403 vs 404 dle politiky | 403 místo 404 prozradí existenci privátního zdroje (třída N-7) |
| **Enum / hodnota role** — FE↔BE drift | práh `<= 3` cílí na roli, kterou jedna strana nezná (R-01) |

> 💡 **Závěr:** zelený `audit:routes` = „FE volá existující endpoint". Neříká **nic** o tom, jestli
> ho smí volat *tahle* role. Role plán tlačí kontrolu o vrstvu níž: **na guard, práh a status kód.**

---

## Kontrolní osy

Každý bod se prověřuje podél jedné/více os. U každého bodu je uvedeno, kterou osu řeší.

| Osa | Zkratka | Otázka | Jak ověřit |
|---|---|---|---|
| **Parita** | `PA` | Schová/povolí FE přesně to, co BE guard pustí/zakáže? | čtení obou stran + matice |
| **Eskalace (vertikální)** | `ES` | Zvládne **nižší role** víc, než smí? (FE schová, BE guard chybí) | čtení BE guardu/assertu |
| **Ownership (horizontální)** | `OW` | Smí role na **cizí** zdroj to, co jen na vlastní? (IDOR — `ownerId === self`) | čtení `ownerId`/scope větví |
| **Stav zdroje** | `ST` | Závisí oprávnění na **stavu** zdroje (`isLocked`, `accessMode`, draft/published, approved)? Drží to obě strany? | čtení stavových větví |
| **Over-restrikce** | `OR` | Schová FE něco, co BE **dovolí**? (role dostane prázdno/403 → bloker) | čtení FE gatingu vs BE |
| **Auth-leak** | `LK` | 401/403/404 dle [auth-leak-policy]; 404-mask vs 403; leak existence | skill `auth-policy` |
| **Bypass** | `BY` | GlobalAdmin / owner / PomocnyPJ obchází konzistentně na obou stranách? | čtení bypass větví |
| **Enum/práh** | `EN` | Role enumy + prahy (`>= PomocnyPJ`) sedí FE↔BE? | skill `type-sync` + diff |

`ES` je **vertikální** eskalace (hráč → PJ moc), `OW` je **horizontální** (hráč → cizí hráč). Obě
jsou kolmé na sebe; matice rolí vidí `ES`, ale `OW` ze své podstaty **míjí** (uvnitř jedné role).

---

## Hloubkové perspektivy (jak hluboko každou akci proklepnout)

Osy říkají *co* hledat; perspektivy říkají, *jak hluboko jít*. Neaplikují se na každý bod plošně —
jsou cílené na **hot-spoty**, kde mělká kontrola („role × endpoint") prokazatelně nestačí. Každá je
vázaná na reálný historický nález, ne na teorii.

### P1 — Field-level granularita (místo „endpoint × role")
U akcí, kde role smí PATCH, ale **ne všechna pole**: rozepiš `pole × role` sub-matici.
- `operations-authorizer.allowedPlayerFields` — hráč smí `currentHp`/`injury`, ne `initiative` (N-26).
- Account: `read ≠ write ≠ settings ≠ delete` = 4 různé prahy nad jedním zdrojem.
- AKJ tab: `clearance level × AKJType × role` (ne jen „vidí/nevidí stránku").

### P2 — Konzistence napříč přístupovými cestami (osa `PC`)
Tentýž zdroj má **víc dveří**; ověř, že **každé** mají stejný zámek. Inventura cest na zdroj:
**REST GET · WS event · search index · embedding · directory/slugs · data-export · favorite/bump.**
- N-35 — AKJ stránky tekly přes **search** (REST gate je měl, search ne).
- N-37 — slugy chráněných stránek přes **dataSlugs**.
- W-10 / W-3 — **WS** join obešel REST membership/role gate.
> 💡 Tohle je nejhlubší vrstva: bug není „špatná role", ale „**jedny dveře ze čtyř** zapomněly zamknout".

### P3 — Defense-in-depth: kde přesně je zámek (osa `DD`)
Ověř, na které **vrstvě** gating žije: `guard → service assert → DTO whitelist → repo mapper`.
Gating jen v controlleru **obejde** WS / interní volání / jiný controller. Last line of defense = service.
- Paměť projektu: `toMapper` whitelist drift (D-066), ValidationPipe `whitelist` tiše dropne pole.
- Pravidlo: každý role-gate musí být v **service** (autoritativní), guard je jen rychlý filtr.

### P4 — Red-team průlom (metoda `M8`)
Posun z „guard *vypadá* správně" na „**zkusil jsem ho prolomit a nešlo to**":
ruční request mimo FE (FE schová tlačítko — pustí to BE?), spoof `userId`/`membershipId`/`worldId`
v payloadu/URL, cizí ID, hodnota role mimo enum. Eskaluje kritické hranice na **L4**.
- N-18 (worldId v URL BE nevaliduje), W-10 (spoof `user:{id}`), RM-15 (RolesGuard bez `@Roles`).

### (mimo osy) Cross-role transitions
Tematická sekce v oblastech 01/03 — ne globální osa (úzký rozsah): stale `isPJ` po self-demote (RR-3),
access token žije 7 d po banu/self-delete (account-state gate v `JwtAuthGuard`), real-time propagace
změny role. Řeší se bodově tam, kde vznikají, ať se matice nenafoukne.

---

## Kanonická role matice (zdroj pravdy)

### Globální platformové role — `UserRole`
BE [user.interface.ts:1](../Projekt-ikaros/backend/src/modules/users/interfaces/user.interface.ts#L1) ·
FE [index.ts:6](../Projekt-ikaros-FE/src/shared/types/index.ts#L6)

| Role | Hodnota | Pozn. |
|---|---|---|
| Superadmin | 1 | bypass všude; jediný smí měnit `adminPermissions` |
| Admin | 2 | platform admin; `role <= 2` = „GlobalAdmin" bypass do světů |
| (PJ) | 3 | ⚠️ jen BE legacy; FE enum nezná; D-053 migroval na Ikarus(9) |
| (Korektor/Hrac/Ctenar/Zadatel) | 4–7 | ⚠️ BE legacy, FE nezná, migrováno |
| (Zakaz) | 8 | ⚠️ BE-only; ban; FE řeší přes 401 BANNED |
| Ikarus | 9 | běžný přihlášený uživatel |
| SpravceClanku / Galerie / Diskuzi | 10 / 11 / 12 | správci platformového obsahu |
| + `adminPermissions` | — | granular: `canManageAdmins / canModerateContent / canEditPlatformPages` |

> ⚠️ **Hierarchie globálních rolí je „nižší číslo = vyšší moc"** — `role <= Admin(2)`. Pozor: u
> world rolí je to **opačně** (vyšší číslo = víc). Mísení těchto dvou směrů je třída chyb (oblast 00).

### World role — `WorldRole`
BE [world-membership.interface.ts:9](../Projekt-ikaros/backend/src/modules/worlds/interfaces/world-membership.interface.ts#L9) ·
FE [index.ts:324](../Projekt-ikaros-FE/src/shared/types/index.ts#L324)

| Role | Hodnota | Typický práh |
|---|---|---|
| Zadatel | 0 | pending člen — **žádný** přístup (často 403 „pending") |
| Ctenar | 1 | read-only; `memberOnly` minimum pro sub-routy světa |
| Hrac | 2 | hráč — vlastní postava/token, čtení |
| Korektor | 3 | edit obsahu (šablony, `canEditWorldData`) |
| PomocnyPJ | 4 | staff — chat/stránky/události/ekonomika správa, AKJ page-bypass |
| PJ | 5 | plná správa světa, AKJ tab-bypass, postavy, mapa, transfer |

### Persony testované v matici
`guest`(anon) · `Zadatel` · `Ctenar` · `Hrac` · `Korektor` · `PomocnyPJ` · `PJ` · **`owner`**
(`world.ownerId`; zvláštní pravidla — nesmí odejít, jediný iniciuje transfer) · `Admin/Superadmin`
(GlobalAdmin bypass) · `SpravceClanku/Galerie/Diskuzi` (platformový obsah).

---

## Matice role × akce (povinný výstup každé oblasti)

Páteř auditu. Každá oblast obsahuje tabulku: **řádky = chráněné akce**, **sloupce = persony**.
Buňka = **očekávaný výsledek** (autoritativní = BE). Pod maticí se vypíše **delta parity** —
každá akce, kde se FE gating liší od BE (= kandidát na nález).

**Legenda buněk:**

| Symbol | Význam |
|---|---|
| ✅ | povoleno (oprávněně) |
| ✅ᵒ | povoleno **jen na vlastní** zdroj (ownership `OW` — cizí → ⛔/🚫) |
| ✅ˢ | povoleno **jen v určitém stavu** zdroje (`ST` — např. odemčený token, draft) |
| ✅ᶠ | povoleno **jen na podmnožinu polí** (field-level P1 — viz sub-matice) |
| ⛔ | 403 — oprávněně zakázáno |
| 🚫 | 404 — maskováno (anti-leak, neprozradí existenci) |
| 🔒 | 401 — vyžaduje přihlášení (guest) |
| 🙈 | skryto na FE (UI gating) — *uvádí se v poznámce parity, ne v hlavní buňce* |
| — | N/A (akce pro personu nedává smysl) |
| ⬜ | neověřeno |

Horní indexy (`ᵒ`/`ˢ`/`ᶠ`) signalizují, že buňka má **podmínku** → rozepiš ji v delta-paritě nebo
sub-matici. Holé `✅` u zdroje, kde *existuje* ownership/stav rozměr, je podezřelé (možná `OW`/`ST` díra).

> **Pravidlo úplnosti:** žádná buňka nesmí zůstat `⬜` po dokončení oblasti. Prázdná buňka =
> nepokrytá kombinace role × akce = díra v jistotě. Tím se „klape to u všeho?" stává měřitelným.

**Delta parity** (pod každou maticí): `AKCE — FE: <co dělá FE> · BE: <co dělá BE> · verdikt`.
Shoda → `✅ parita`. Rozpor → `🐛 R-xx` do [`../role-audit.md`](../role-audit.md).

---

## Metody ověření (`[auto]`)

Přejato z bug-planu kvůli konzistenci.

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení — guard, `assert*`, FE gating, bypass větve | Read/Grep |
| **M2** | Kontrakt FE↔BE — enum, práh role, naming | skill `type-sync` |
| **M3** | Cílený test — spustit existující auth/guard test | `vitest` / `jest` |
| **M4** | Auth gate — 401/403/404 dle politiky | skill `auth-policy` |
| **M5** | WS role gate — identita z JWT, presence role | skill `socket-contract` |
| **M6** | Baseline — `audit:routes` + plný test run | npm scripty |
| **M7** | **Gap-fill test** — matice-řízený test role→akce→status, spustit, zelený | `vitest` / `jest` |
| **M8** | **Red-team průlom** — aktivní pokus obejít gate: ruční request mimo FE, spoof `userId`/`membershipId`/`worldId`, cizí ID, role mimo enum | `jest` / ruční request |

## Úrovně jistoty (L1–L4)

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno (M1) — guard *vypadá* správně | nejslabší |
| **L2** | kontrakt ověřen (M2/M4) — práh/enum/status sedí staticky | strukturální |
| **L3** | existující test pokrývá role→akci a je zelený (M3) | chování zajištěno |
| **L4** | **doplněn role-gate test** (M7) nebo **red-team průlom** (M8) ověřil, že gate drží | trvalá pojistka / prokázaná odolnost |

**Cíl:** role/oprávnění body na **L2+**, bezpečnostní (eskalace `ES`, ownership `OW`, leak `LK`) na
**L3+**, kritické hranice (FE schová → BE musí držet) přes red-team `M8` na **L4**.

---

## Baseline (globální health)

| Check | Repo | Stav (předpoklad) | Pozn. |
|---|---|---|---|
| `npm run audit:routes` | FE | ✅ čistý (dle bug-auditu) | jen existence FE↔BE, **ne role** |
| `tsc --noEmit` | FE+BE | ✅ | dle bug-auditu |
| guard/auth jest specs | BE | ⚠️ částečné | inventura v oblasti 00 |
| FE guard testy | FE | ⚠️ částečné | `WorldMembershipGuard`, `RoleGuard` |

⚠️ **Pasti prostředí** (z paměti projektu):
- FE `npm run build` (tsc -b) pre-existing rozbitý → měř `tsc --noEmit`.
- FE vitest: `--project '!storybook'` (storybook visí na playwright).
- BE jest: čti `Tests: X failed`, ne exit kód; potřebuje mongodb-memory-server.
- Po BE změně guardu nestačí FE refresh — BE drží starý bundle bez `nest --watch`.
- **GlobalAdmin bypass** (`role <= 2`) je v BE **všudypřítomný** — při čtení assertu ho vždy
  hledej jako první větev, jinak špatně odhadneš práh pro běžné role.

---

## Index oblastí

| # | Oblast | Jádro role-povrchu | Osy / perspektivy |
|---|---|---|---|
| 00 | [Role model & guardy](00-role-model-guardy.md) | enum parita, hierarchie, prahy, bypass; guardy ↔ FE guardy; DD/PC inventura | `EN` `BY` `PA` · `DD` |
| 01 | [Auth & účet / guest](01-auth-ucet-guest.md) | anon povrch, OptionalJwt, account-state gate (ban/deleted/pending), transitions | `LK` `PA` `ST` · M8 |
| 02 | [Platforma / admin & správci](02-platforma-admin.md) | AdminGuard, @Roles, Spravce*, adminPermissions, ikaros obsah, REVIEWER_ROLES | `PA` `ES` · M8 |
| 03 | [Svět — membership & role](03-svet-membership.md) | join/access/approve, změna role, transfer, owner pravidla, Zadatel, transitions | `PA` `LK` `BY` `OW` |
| 04 | [Svět — stránky / wiki / AKJ](04-svet-stranky-akj.md) | assertAccess/Write, AKJ page+tab, PomocnyPJ nuance, slug/favorite/search leaky | `LK` `BY` `PA` · `PC` `DD` P1 |
| 05 | [Svět — postavy / bestiář / ekonomika](05-svet-postavy-ekonomika.md) | characters PJ gate, subdoc, bestiae 3-scope, shop/currency, account tiery | `PA` `OR` `OW` `BY` · P1 |
| 06 | [Svět — herní nástroje](06-svet-herni-nastroje.md) | events canManage/canView/groupOnly, kalendář, timeline, počasí, gm-notes | `PA` `LK` `ST` |
| 07 | [Svět — taktická mapa](07-svet-mapa.md) | operations-authorizer, per-token, isLocked, allowedPlayerFields, log tiery | `OR` `ES` `OW` `ST` `PA` · P1 `PC` M8 |
| 08 | [Svět — chat / zvuky / emoty](08-svet-chat-zvuky.md) | canManageChat, hasChannelAccess, accessMode, sound gate, unread filtr | `PA` `LK` `ST` · `PC` |
| 09 | [WS role-gating](09-ws-role-gating.md) | identita JWT vs payload, presence role, room membership — odkaz na `ws-audit` | `BY` `LK` · `PC` M8 |

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK (status `✅L2` apod. drží i úroveň jistoty)
- 🐛 nalezena chyba → [`../role-audit.md`](../role-audit.md) (`R-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo čistě `[human]`

---

## Pracovní postup

1. **Baseline** — `audit:routes` + guard test run, zapsat stav.
2. **Inventura cest na zdroj** (`PC`/`DD`) — než řešíš roli, zjisti, **kolika dveřmi** zdroj teče
   (REST/WS/search/slugs/export) a na **které vrstvě** je zámek (guard/service/DTO/mapper).
3. **Oblast po oblasti** — sestavit **matici role × akce**, u každé buňky očekávaný výsledek +
   `soubor:řádek` obou stran. Hot-spoty rozepsat do **field-level sub-matic** (P1).
4. **Delta parity** — každý rozpor FE↔BE → `R-xx`. Pořadí: eskalace (`ES`/`OW`) a leak (`LK`/`PC`)
   první (bezpečnost), pak over-restrikce (`OR` = herní blokery), pak `EN`/`BY`/`ST`.
5. **Red-team (M8)** na kritické hranice „FE schová → BE musí držet" → L4.
6. **Gap-fill testy (M7)** matice-řízené → trvalá pojistka proti regresi role gatingu.
7. **Nález → `R-xx`** s `soubor:řádek` + návrhem; **neopravovat tiše** (pravidlo projektu).
