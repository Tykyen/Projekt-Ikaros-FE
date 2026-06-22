# Spec 15.9 — Notifikační preference + rozšíření push triggerů

**Stav:** 📝 NÁVRH v2 — čeká finální schválení (brainstorming 2026-06-22, upřesněno hráčem) · **Fáze:** 15 (H1 Viditelnost / komunita) · **Navazuje:** [15.8 Hospoda](spec-15.8-hospoda-anon.md), push systém (krok 13) · **Souvis.:** [project_web_push_chat_status], chat, game-events 9.x, ikaros-news, world-news, ikaros-discussions, ikaros-articles, ikaros-gallery

**Cíl:** Push notifikace má hráč dostávat **jen na věci, které ho zajímají**, a vše si **vypnout/zapnout podle sebe** v osobním nastavení. Dnes push chodí i z míst, kde obtěžuje (Hospoda → `notifyAll` všem), a naopak nechodí odtud, kde ho hráč chce (vlastní diskuse, vlastní článek/galerie, novinky světa). Krok: (a) zavede uživatelské preference s filtrem na BE, (b) doplní chybějící push triggery, (c) přidá druhou připomínku hry (1h před začátkem).

---

## 0. Rozhodnutí (brainstorming 2026-06-22 + upřesnění)

| # | rozhodnutí | volba |
|---|---|---|
| R1 | **Co preference řídí** | jen **push bublinu**. Zvoneček/notifikační centrum = **kompletní záznam** (vidíš tam vše vždy), vypnutí kategorie ho neschová. |
| R2 | **Granularita** | **per-kategorie** (7). Per-svět ztlumení = pozdější rozšíření. |
| R3 | **Defaulty** | dle přání hráče (matice §1). Vše ZAP kromě **Hospody (VYP)**. |
| R4 | **Akce ve světě** | = **vytvoření herní akce** + obě připomínky (24h, 1h). Jeden přepínač pokrývá celý tok. NE membership/postava/role (ty push nemají a nepřidávají se). |
| R5 | **Plánovaná hra** | připomínka **24h** (existuje) **i 1h** (nová) před začátkem. Spadá pod „Akce ve světě". |
| R6 | **Novinky** | **dvě** kategorie: **Novinky světa** (world-news, ZAP) **i** **Novinky Ikarosu** (ikaros-news, ZAP). |
| R7 | **Vlastní diskuse** | jen diskuse, kde jsem **autor**. (Ne manager/přispěvatel.) |
| R8 | **Vlastní článek/galerie** | obsah, kde jsem **autor** — články i galerie; push při **schválení, zamítnutí i novém hodnocení**. |
| R9 | **Hospoda** | push default **VYP** (dnešní `notifyAll` se stává opt-in). |
| R10 | **Rozcestí** | beze změny — push nikdy negenerovalo. |
| R11 | **1h připomínka — přesnost** | upozornění dorazí **~1h předem**; aby to bylo přesné, cron poběží **každých 15 min** (interní detail, ne „připomínka 15/30 min předem"). |

---

## 1. Kategorie a defaulty

7 přepínačů (+ master) v osobním nastavení. Klíč = pole v `notificationPreferences`. Default platí i pro existující uživatele (`undefined` → default).

| # | Kategorie (UI) | Klíč | Default | Zdroj události | Push dnes? |
|---|---|---|---|---|---|
| 1 | Chat ve vlastním světě | `worldChat` | ✅ ZAP | `ChatService.notifyUsers` | ✅ existuje |
| 2 | Akce ve světě (vytvoření + připomínky) | `worldEvent` | ✅ ZAP | `game-events` create + reminder job | ⚠️ částečně (1h chybí) |
| 3 | Vlastní diskuse | `ownDiscussion` | ✅ ZAP | `IkarosDiscussionsService` nový příspěvek | ❌ doplnit |
| 4 | Vlastní článek a galerie | `ownContent` | ✅ ZAP | `ikaros-articles` + `ikaros-gallery` (approve/reject/rating) | ❌ doplnit |
| 5 | Novinky světa | `worldNews` | ✅ ZAP | `WorldNewsService.create` | ❌ doplnit |
| 6 | Novinky Ikarosu | `ikarosNews` | ✅ ZAP | `IkarosNewsService.create` (`notifyAll`) | ✅ existuje |
| 7 | Hospoda | `hospoda` | ⛔ VYP | `GlobalChatService` room `hospoda` (`notifyAll`) | ✅ existuje → opt-in |

**Rozcestí:** mimo matici — `global-chat` místnosti `rozcesti-*` push neposílají a nebudou.
**Master:** `pushEnabled` (default ZAP). Vypnutí = žádný push bez ohledu na kategorie. Ne plést s per-device přepínačem (`usePush`) — viz §4.

---

## 2. Sémantika kategorií

- **`worldChat`** — zpráva v kanálu světa, kde jsem člen a mám přístup; odesílatel vyloučen (existuje). Nově respektuje preferenci.
- **`worldEvent`** — tři momenty jedné herní akce, vše jedním přepínačem:
  1. **vytvoření** akce (`game-events.service.ts:265 notifyOnCreate`) — push existuje, doplnit respekt preference,
  2. **24h** připomínka (`game-event-reminder.job.ts`) — existuje,
  3. **1h** připomínka — **nová** (§3).
  Příjemci = členové světa mimo `Zadatel`, group-only jen cílová skupina + PJ (existuje).
- **`ownDiscussion`** — nový příspěvek v diskusi, kde jsem **autor** (`creatorId === já`). Vlastní příspěvek push nevyvolá. Dnes jen in-app → doplnit push.
- **`ownContent`** — událost u **mého** článku (`ikaros-articles`, `authorId===já`) nebo **mé** galerie (`ikaros-gallery`, `authorId===já`): **schválení, zamítnutí, nové hodnocení**. Dnes approve/reject jen in-app (`notifyUser`), rating žádný → doplnit push pro obě entity.
- **`worldNews`** — nová novinka světa, jehož jsem člen (`WorldNewsService.create`, dnes jen event emitter, žádný push) → doplnit push členům světa.
- **`ikarosNews`** — nová platformová novinka, všem subscriberům s `ikarosNews=ZAP` (existuje `notifyAll`, doplnit filtr).
- **`hospoda`** — nová zpráva v Hospodě jen subscriberům s `hospoda=ZAP`; odesílatel vyloučen.

---

## 3. Akce ve světě — dvě připomínky (R5, R11)

Dnes: `GameEventReminderJob` (cron hourly) hledá eventy v okně **23–25h** a označí `reminderSent` (jeden bool). Pro dvě připomínky jeden bool nestačí.

**Návrh:**
- Dva nezávislé příznaky na `GameEvent`: **`reminder24hSentAt?: Date`** + **`reminder1hSentAt?: Date`** (migrace dnešního `reminderSent` → `reminder24hSentAt`).
- **24h:** okno 23–25h, gate `reminder24hSentAt`, tělo `„{title} — začíná za 24 hodin"` (beze změny).
- **1h:** okno cca **0.75–1.25h**, gate `reminder1hSentAt`, tělo `„{title} — začíná za hodinu"`.
- **Cron** zjemnit z `EVERY_HOUR` na **`EVERY_15_MINUTES`**, aby 1h okno trefilo přesně (±~7 min). Časové pole eventu = `date` (ISO 8601 string).
- Obě připomínky + vytvoření respektují jeden přepínač `worldEvent`.

⚠️ **Dopad cronu:** 4× častější `findUpcoming` (úzký dotaz na indexovaném `date`), zanedbatelné. Migrace bool → `reminder24hSentAt` u běžících eventů.

---

## 4. Architektura filtrování (jádro)

💡 Dnes `notifyAll`/`notifyUsers` střílí bez ptaní. Preference musí filtrovat **na BE před odesláním**.

- **Centrální brána** v push vrstvě: helper `notifyUsersFiltered(userIds, category, payload)` načte `notificationPreferences` příjemců a propustí jen ty s `category=ZAP` **a** `pushEnabled !== false`. `undefined` → default kategorie (jediný resolver defaultů, §5).
- Každý volající push předá svou **kategorii**. `notifyAll` (Ikaros novinky, Hospoda) → varianta, co vezme `userId` ze subscriptions a profiltruje (1 dotaz, bez N+1).
- **Dvě brány nad sebou:** (1) **per-device** — existuje subscription na tomto zařízení (`usePush`, hardware brána); (2) **per-kategorie** — chce daný typ (nové). Žádná subscription = nic (jako dnes).

---

## 5. Datový model

**BE — `User`** (`users/interfaces/user.interface.ts`, vedle `chatPreferences`/`themeSettings`):

```ts
notificationPreferences?: {
  pushEnabled?: boolean;    // master, default true
  worldChat?: boolean;      // default true
  worldEvent?: boolean;     // default true
  ownDiscussion?: boolean;  // default true
  ownContent?: boolean;     // default true
  worldNews?: boolean;      // default true
  ikarosNews?: boolean;     // default true
  hospoda?: boolean;        // default false
};
```

- Projít field-checklist schema/DTO/service/`toEntity` ([project_be_field_checklist], jinak GET zahodí).
- **Endpoint** `PATCH /users/me/notification-preferences` (JWT), **delta merge** (ne full replace — [feedback_persist_across_variants]). Čtení přes `/users/me` (sanitizovaný výřez).
- **Resolver** `resolvePref(prefs, key)` + tabulka defaultů = jediný zdroj pravdy, sdílený BE filtrem i FE UI (default stav přepínače).

**BE — `GameEvent` schema:** `reminder24hSentAt?: Date`, `reminder1hSentAt?: Date` (migrace z `reminderSent`).

---

## 6. Frontend

- **Stránka:** sekce v profilu — `features/profile/components/NotificationPreferencesSection.tsx`, navázat do `ProfilePage` (vedle Privacita/Bezpečnost).
- **UI (rozhodnutí R, výběr na mně):** master „Push notifikace" nahoře + 7 přepínačů ve **4 skupinách** s amatérsky srozumitelnými popisky:
  - *Můj svět:* Chat ve světě · Akce ve světě
  - *Můj obsah:* Vlastní diskuse · Vlastní článek a galerie
  - *Novinky:* Novinky světa · Novinky Ikarosu
  - *Komunita:* Hospoda
- **API hook:** `useNotificationPreferences()` — GET z `/users/me`, `PATCH` mutace + cache invalidace ([project_cache_invalidation_audit]).
- **Per-device:** stránka ukáže i stav push na tomto zařízení (reuse `PushToggle`) + krátké vysvětlení dvou vrstev (zařízení vs. typy).
- **Responsive:** přepínače sloupec na mobilu, mřížka na desktopu → po implementaci `mobil-desktop`.
- Zvoneček/centrum (`NotificationCenter`) **beze změny** (R1).

---

## 7. Otevřené otázky

*(Vše z v1 vyřešeno hráčem. Zbývá jen drobnost k potvrzení při implementaci:)*
1. **Hodnocení galerie/článku** — push při **každém** novém hodnocení, nebo throttle (např. souhrn, ať deset hodnocení = ne deset bublin)? Návrh: zatím 1 push / hodnocení, throttle jako pozdější rozšíření.

---

## 8. Dotčené soubory (předběžně)

- **BE nové:** defaulty/resolver util, `notifyUsersFiltered` (+ filtrovaná varianta `notifyAll`).
- **BE změna:**
  - `users` — interface/schema/DTO/service/`toEntity` + endpoint `PATCH /users/me/notification-preferences`.
  - `push.service.ts` — filtr dle preferencí.
  - volající push s kategorií: `chat.service.ts` (`worldChat`), `game-events.service.ts` + `game-event-reminder.job.ts` + `GameEvent` schema/repo (`worldEvent`, 1h flag, cron 15 min), `ikaros-discussions.service.ts` (+push `ownDiscussion`), `ikaros-articles.service.ts` + `ikaros-gallery.service.ts` (+push `ownContent`), `world-news.service.ts` (+push `worldNews`), `ikaros-news.service.ts` (`ikarosNews` filtr), `global-chat.service.ts` (`hospoda` filtr; rozcestí beze změny).
- **FE nové:** `NotificationPreferencesSection.tsx`, `useNotificationPreferences.ts`, defaulty util (sdílené).
- **FE změna:** `ProfilePage.tsx` (sekce), `src/types` notif preferences typ — [type-sync].

---

## 9. Testy

- **BE:** filtr propustí/zahodí dle kategorie + default · filtrovaný `notifyAll` (Hospoda opt-in, Ikaros novinky respekt) · 24h i 1h připomínka jednou (idempotence dvou flagů) · vytvoření akce respektuje `worldEvent` · nové triggery (diskuse/článek/galerie/world-news) respektují preferenci · delta merge PATCH (A→B→A).
- **FE:** sekce vykreslí master + 7 ve skupinách · PATCH + invalidace · default stav bez uloženého nastavení.

---

## 10. Návaznost (po implementaci)

`funkce` (změna funkčnosti — notifikace, nové push triggery, profilová sekce, 1h připomínka) + `napoveda` (hráčský výtah: kde a co si nastavím) — měnit oba.
