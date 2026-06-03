# Bug plán — systematická kontrola platformy Ikaros

> **Účel:** poslední automatizovaný kontrolní bod před předáním lidské testovací skupině.
> Projít celou aplikaci (BE i FE) **oblast po oblasti, do puntíku**, ověřit že vše funguje,
> najít a opravit pre-existující chyby / bugy / errory / warningy, které dosud unikly.
>
> **Stav:** zahájeno 2026-06-03. Krok 10.3 roadmapy je **mimo rozsah** (vědomě vynechán).

---

## Jak to funguje

Aplikace je rozsekaná na **14 oblastí** (vertikální řezy BE↔FE — backend modul + odpovídající
frontend feature se testují společně, protože tvoří jeden funkční celek). Každá oblast má vlastní
soubor `NN-nazev.md` s konkrétními kontrolními body.

Nálezy padají do centrálního registru [`../bug-audit.md`](../bug-audit.md) (ID `N-xx`).
Skutečné technické dluhy → [`../dluhy.md`](../dluhy.md) (skill `dluh`).

### Co tahle kontrola najde a co ne

| Najdu **já** automatizovaně `[auto]` | Najde až **testovací skupina** `[human]` |
|---|---|
| TS typové chyby, lint, mrtvý kód | vizuální regrese, rozbitý layout |
| padající / chybějící testy | UX problémy, matoucí flow |
| drift FE typů ↔ BE DTO (kontrakt) | „tlačítko nedělá co čekám" |
| špatné role/auth gating (401/403/404) | estetika skinů, čitelnost |
| WS emit/listener nesoulad s kontraktem | mobil/desktop reálné prokliknutí |
| logické chyby čitelné ze zdrojáku | výkon pod zátěží, race v reálném provozu |

Každý kontrolní bod je označený `[auto]` nebo `[human]`. **Cílím na maximální pokrytí `[auto]`** —
to je hodnota, kterou doručím bez člověka.

---

## Metody ověření (jak `[auto]` body kontroluju)

| Kód | Metoda | Nástroj |
|---|---|---|
| **M1** | Statické čtení kódu — logika, edge cases, error handling | Read/Grep |
| **M2** | Kontrakt FE↔BE — FE typy/API volání vs. BE DTO/controller shape | skill `type-sync` |
| **M3** | Cílené testy — spustit existující testy oblasti; chybí-li kritická cesta → gap | `vitest` / `jest` |
| **M4** | Auth gating — 401/403/404 dle auth-leak-policy, role guardy | skill `auth-policy` |
| **M5** | WS kontrakt — emit/listener vs. `docs/websocket-api.md` | skill `socket-contract` |
| **M6** | Baseline — typecheck + lint + plný test run (globální) | npm scripty |
| **M7** | **Gap-fill test** — napsat chybějící test pro nekrytou kritickou cestu, spustit, ověřit zelený | `vitest` / `jest` |

## Úrovně jistoty (L1–L4)

Každý ověřený bod má i **úroveň jistoty** — jak tvrdý je důkaz, že to funguje. Cílem hloubkové
kontroly je tlačit kritické cesty na **L3/L4**, ne se spokojit s „přečteno".

| Úroveň | Co znamená | Důkaz |
|---|---|---|
| **L1** | přečteno (M1) — kód *vypadá* správně | nejslabší, subjektivní |
| **L2** | kontrakt ověřen (M2/M4/M5) — rozhraní/typy/role sedí | strukturální |
| **L3** | existující test pokrývá cestu a je zelený (M3) | chování zajištěno testem |
| **L4** | **doplněn nový test** pro dříve nekrytou cestu a je zelený (M7) | nová trvalá pojistka |

Status bodu se zapisuje jako `✅L3` apod. **Kritická cesta na L1 = nedostatečné** → eskalovat na M7.

---

## Baseline (globální, mimo jednotlivé oblasti)

| Check | Repo | Stav | Pozn. |
|---|---|---|---|
| `tsc --noEmit` | FE | ✅ | čistý |
| `eslint .` | FE | ✅ | čistý |
| `lint:colors` | FE | ⚠️ | 207 souborů (N-2, konzistenční) |
| `vitest run` (unit) | FE | ✅ | 2473/2473 |
| `tsc --noEmit` | BE | ✅ | čistý |
| `eslint` | BE | ✅ | čistý |
| `jest` | BE | ✅ | 1815/1815 (po opravě N-1) |

⚠️ **Pasti prostředí** (z paměti projektu):
- FE `npm run build` (tsc -b) je **pre-existing rozbitý** → měř `tsc --noEmit`, ne build.
- FE vitest config má 2 projekty; `storybook` projekt spouští **playwright browser** a visí →
  pro unit audit spouštět `vitest run --project '!storybook'`.
- BE jest potřebuje mongodb-memory-server; `exit 0` z `tee \| echo` **neznamená** zelené testy —
  čti `Tests: X failed`.
- Po BE změně nestačí FE refresh — BE drží starý bundle bez restartu (`nest --watch`).

---

## Legenda statusů

- ⬜ netestováno
- ✅ ověřeno OK
- 🐛 nalezena chyba → zapsáno do `bug-audit.md` (`N-xx`)
- ⚠️ podezřelé / nejisté / dluh
- ⏭️ blokované nebo čistě `[human]` (nelze ověřit automaticky)

---

## Oblasti

| # | Oblast | BE moduly | FE feature |
|---|--------|-----------|------------|
| 00 | [Cross-cutting](00-cross-cutting.md) | app, guards | layout, router, error pages |
| 01 | [Auth & účet](01-auth-ucet.md) | auth, security-tokens, mailer | auth, profile/security |
| 02 | [Uživatelé, role, přátelé](02-uzivatele-pratele.md) | users, friendships, pending-actions | users, friendships |
| 03 | [Profil & presence](03-profil-presence.md) | users, presence | profile, public profile |
| 04 | [Ikaros komunita](04-komunita.md) | ikaros-articles/gallery/discussions/categories/news/events | ikaros pages |
| 05 | [Chat, pošta, notifikace](05-chat-posta.md) | global-chat, ikaros-messages, push | chat, posta, notifications |
| 06 | [Svět — základ](06-svet-zaklad.md) | worlds, universe, world-news | WorldDashboard, Members, Settings |
| 07 | [Svět — chat/kostky/zvuky](07-svet-chat.md) | chat, sounds, emotes | world/chat, dice, sounds |
| 08 | [Svět — stránky/wiki/search](08-svet-stranky.md) | pages, world-page-templates, search | Pages*, search |
| 09 | [Svět — postavy/bestiář/ekonomika](09-svet-postavy.md) | characters, character-subdocs, bestiae, world-currencies, campaign | Characters, Bestiar, Shop, Currency |
| 10 | [Svět — herní nástroje](10-svet-hra.md) | game-events, calendars, world-calendar-config, timeline, world-weather | Events, Calendar, Timeline, Weather |
| 11 | [Svět — taktická mapa](11-svet-mapa.md) | maps, dungeon-maps | tactical-map, DungeonBuilder |
| 12 | [Admin & platforma](12-admin.md) | admin, stats, data-export, images, upload | PlatformAdmin |
| 13 | [Theming](13-theming.md) | — | themes (21) |

> Pozn.: `system-presets`, `world-gm-notes`, `world-calendar-config` jsou pokryté v rámci své
> domény (09, 11, 10). `storylines/scenare` a `pavucina/campaign` v oblasti 09.
