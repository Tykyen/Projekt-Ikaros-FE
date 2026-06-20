# Chybový deník — oblast: plný audit / kvalita

## CH-011 — gate v service volané i interně → 403 regrese chat kanálů — 2026-06-20

**Co nefungovalo.** R-RUN-02 fix: přidal jsem world-gate (`accessMode` member-only)
přímo do `CharactersService.getDirectory()`. Rozbilo to e2e `seed-scenario-isolation`
test „chat: člen vidí kanál B" — PJ (člen!) dostával **403** na `GET /worlds/:id/chat/groups`.

**Proč.** `getDirectory()` má **dva konzumenty**: (a) HTTP controller (s user kontextem),
(b) `chat.service.getGroupsWithChannels()` ho volá **interně** pro enrich postav —
`charactersService.getDirectory(worldId)` BEZ user. Můj gate → privátní svět + žádný
user → `ForbiddenException` → celé `getGroupsWithChannels` spadlo na 403. Brána ve
service volané i interně = past.

**Jak jsem to našel.** Bisekce přes `git stash push <soubory>` + e2e běh: vyloučil jsem
postupně skupiny (ne-moje soubory → presence → worlds skupina → characters → service vs
controller → neutralizace gate-body). Pak `grep getDirectory src/` odhalil interní volání
v `chat.service.ts:279`. Klíč: **bisekce stash+e2e** + grep všech konzumentů metody.

**Oprava.** Gate vytažen do samostatné `assertCanViewDirectory()` volané JEN z HTTP
controlleru; `getDirectory()` zůstává bez brány (interní enrich projde). e2e 21/21 zelené.

**Příznak cyklení / poučení.** Nevolaná metoda „nemůže" rozbít jiný test → ŠPATNÝ předpoklad;
metoda BYLA volaná interně. **Před přidáním guardu do service metody zgrepuj VŠECHNY její
konzumenty** (ne jen HTTP controller). Gate patří na HTTP vrstvu, ne do sdílené service.

## ✅ ŘEŠENÍ — plný audit RUN-2026-06-20-1621 (16 stylů × 103 oblastí) + 6 oprav — 2026-06-20

**Co zabralo.** Skill `plny-audit` puštěn „od začátku" na HEAD (FE 96460577 / BE fb0f8b0).
Fáze B = vyčerpávající fan-out **1 agent = 1 oblast** ve vlnách po ~8–13 (sonnet), každý agent
read-only + zapsal checkpoint do `docs/full-audit/RUN-2026-06-20-1621/checkpoints/` (103/103) a
vrátil jen TL;DR → orchestrátorův kontext zůstal lehký. Proof: e2e seed-scenario + race (26/26) ✅,
META brána (`audit:regression --ci`) 0 regresí ✅. Záchyt ~14 🔴 / ~75 🟠 / ~260 🟡.

**Proč to byl správný směr.**
- Fan-out s checkpointy = paralelizace bez zahlcení kontextu (skill to přímo předepisuje).
- **Verifikace KAŽDÉHO agentního nálezu čtením kódu PŘED opravou** — chytila false-positive:
  agent tvrdil „banUser nerevokuje refresh tokeny → zabanovaný refreshuje 30 d", ale
  `admin.service.banUser` **revokuje** (`refreshTokenRepo.revokeAllForUser`). Kdybych opravoval
  naslepo dle agentních TL;DR, přidal bych zbytečný kód a falešně hlásil 🔴 fix.
- Opravil jsem jen **bezpečné izolované** nálezy s regresním testem (XSS customData, addPost authz,
  admin permission, daysInMonth crash, search `?q=`, hasPendingDeletion). Architektonické/OPS/+db
  (reconnectSocket, WS leak-safe, WorldHardDelete blob, RC-D7, Tyky, TOTP_ENC_KEY, DI-*) jsem
  NEopravoval — gated na uživatele (base.md: neopravuj tiše riskantní).

**Jak ověřeno.** BE typecheck ✅ + jest discussions/pages 125 + admin 37; FE eslint + build (tsc-b+vite)
+ vitest calendarEngine 17. Vše working tree, NEcommitnuto (git na uživateli).

**Zhodnocení — dobře/špatně.**
- 👍 Dobře: fan-out tempo, checkpoint resumabilita, verifikace před opravou, oddělení A (sám) / B (gated).
- 👎 Drobně špatně: jednou jsem `cp` přepsal skutečný jest e2e výstup vlastním echem (ztráta počtu
  testů, ne výsledku — exit byl 0). Poučení: NEpřepisovat soubor, do kterého už směřoval běh.
- ⚠️ Past pro příště: **agentní TL;DR = hypotéza, ne fakt.** Sonnet auditoři občas přehlédnou
  protistranu (revokace, existující guard). Vždy dočíst dotčený kód, než se sáhne na opravu.
