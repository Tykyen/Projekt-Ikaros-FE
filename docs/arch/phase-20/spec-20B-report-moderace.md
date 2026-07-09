# Spec 20B — Generický report & moderace (Příloha C, páteř 20.1 + 20.3)

> Fáze B ze série 20.1–20.3. Nahrazuje minimální report na diskuze jedním
> generickým subsystémem nahlašování + moderace pro všechny plochy. Zdroj
> požadavků: DSA čl. 16 (notice), čl. 17 (statement of reasons), čl. 18
> (eskalace), čl. 20 (odvolání) + provozní rámec `30-dsa-klasifikace`,
> `31-notice-action`, `32-moderacni-matice`, `73-report-krize`.

## Cíl
Uživatel může nahlásit **jakýkoli** veřejný i soukromý UGC. Moderátor v jedné
frontě rozhodne (M0–M7), obě strany dostanou vyrozumění (potvrzení příjmu +
odůvodnění), zásah lze napadnout odvoláním, vše je v moderačním logu.

## Rozhodnutí (locked, od uživatele)
| # | Rozhodnutí |
|---|---|
| R1 | Nahlašování **všude** — veřejné (články, galerie, profily, nábory, bestiář, diskuze, wiki, novinky) i soukromé (chat, pošta, deníky). Veřejné = B2, soukromé = B5. |
| R2 | **Plná hloubka M0–M7** + odvolání + snapshoty. |
| R3 | „**Správce komunity**" = existující role `SpravceClanku`/`SpravceGalerie`/`SpravceDiskuzi` dostanou pravomoc moderovat **generickou** frontu reportů (nejen svou plochu). Account-level zásahy (M5–M7) jen `Admin`+. |
| R4 | Etická komise = **kanál v `/admin/chat`** (reuse 20.5), ne nová role/UI. Citlivé reporty (minor_safety, eskalace) se tam notifikují. → B5. |
| R5 | In-app nahlašování je primární; provozní e-mail = DSA čl. 11/12 kontakt (řešeno v 20A `/kontakt`). |
| R6 | Kategorie **copyright** pokrývá takedown pro 20.3 (žádný druhý formulář). CSAM = kategorie `minor_safety` + **anonymní režim** (bez jména/e-mailu). |

## Datový model (BE, nový modul `moderation`)

### Enumy
```ts
enum ReportTargetType {
  Article='article', Gallery='gallery', Profile='profile', Nabor='nabor',
  Bestie='bestie', DiscussionPost='discussion_post', Page='page',
  CharacterDiary='character_diary', WorldNews='world_news',
  ChatMessage='chat_message', MailMessage='mail_message',
}
enum ReportCategory {
  Copyright='copyright', PersonalData='personal_data', Harassment='harassment',
  MinorSafety='minor_safety', Illegal='illegal', Spam='spam', Other='other',
}
// M0–M7 (provozní rámec 32-moderacni-matice)
enum ModerationAction {
  None='M0_none', Notice='M1_notice', HidePart='M2_hide_part',
  HideTemp='M3_hide_temp', Remove='M4_remove', RestrictAccount='M5_restrict',
  TerminateAccount='M6_terminate', EscalateExternal='M7_escalate',
}
```

### Kolekce `content_reports` (nahradí `ikaros_discussion_reports`)
```
targetType, targetId, targetUrl, worldId?          // kam míří (worldId u world obsahu)
targetSnapshot (string), targetAuthorId?, targetAuthorName   // denormalizace (obsah může zmizet)
category (ReportCategory), reason (string, max 2000)
reporterId?, reporterName?, reporterEmail?         // volitelné (anonymní CSAM)
goodFaith (bool), evidence? (string), notifyMe (bool), anonymous (bool)
status: 'pending'|'triaged'|'resolved', createdAtUtc, ackSentAt?
```
Reporty se **nemažou** (audit stopa) — po vyřízení `status:'resolved'`.
Index `{ status:1, category:1, createdAtUtc:-1 }`.

### Kolekce `moderation_decisions` (statement of reasons, čl. 17)
```
reportId? (může být i proaktivní zásah bez reportu)
targetType, targetId, targetSnapshot, worldId?
action (ModerationAction), reasonText, category?
legalOrPolicyGround (string)     // právní/smluvní důvod
automated (bool = false; zatím žádná automatizace)
moderatorId, moderatorName, createdAtUtc
authorNotifiedAt?, reporterNotifiedAt?, appealId?
```
= moderační log (nikdy se nemaže). Index `{ targetType:1, targetId:1 }`.

### Kolekce `moderation_appeals` (čl. 20)
```
decisionId, appellantId, appellantName, reason (max 2000)
status: 'pending'|'upheld'|'overturned'
reviewerId?, reviewerNote?, createdAtUtc, resolvedAtUtc?
```
⚠️ Invariant: `reviewerId != decision.moderatorId` (jiný, nezapojený moderátor).

## Role & routování
- `PendingActionType.ContentReport = 'content_report'` (nový). `DiscussionReport` se migruje sem (diskuze = jedna z ploch) a starý typ se odstraní.
- **Reviewer set (content-level M0–M4):** `Superadmin, Admin, SpravceClanku, SpravceGalerie, SpravceDiskuzi` (= „správce komunity").
- **Account-level (M5–M7) + minor_safety:** jen `Superadmin, Admin`.
- `ContentReportProvider` (IPendingActionProvider) → fronta „Zpracovat"; `countForUser`/`listForUser` gate dle reviewer setu.
- World obsah (deníky, wiki, novinky): report jde do stejné globální fronty (moderace platformy), ne PJ — R-20 (platform Admin nemá governance moc uvnitř světa) platí pro world-internal správu, ale nahlašování protiprávního obsahu je platformní věc.

## BE endpointy (modul `moderation`)
```
POST /moderation/reports                 // vytvořit report (auth i guest? — viz Q)
GET  /moderation/reports?status=pending  // fronta (reviewer-gated) — přes pending-actions
POST /moderation/reports/:id/decide      // rozhodnout (M0–M7) → vytvoří decision + akci
GET  /moderation/decisions/mine          // odůvodnění zásahů vůči mně (autor)
GET  /moderation/reports/mine            // stav mých hlášení (oznamovatel)
POST /moderation/decisions/:id/appeal    // odvolání
POST /moderation/appeals/:id/review      // přezkum (jiný moderátor)
```
Akce M2–M7 volají do cílových modulů (skrýt/smazat/ban) — viz níže.

## Napojení zásahu na cílové moduly (M2–M7)
- M2/M3 (skrýt část/dočasně): nový `hiddenByModeration` flag na cílové entitě (nebo status). M4 (smazat): existující delete daného modulu.
- M5/M6 (omezit/ukončit účet): existující `bannedAt/bannedUntil/banReason` na users.
- M7 (eskalace): záznam + notifikace do etického kanálu `/admin/chat` (B5).
- ⚠️ Každá plocha potřebuje `applyModeration(targetId, action)` cestu — whitelist per modul (stejný princip jako maps toToken/toEntity whitelist).

## FE
- **`ReportButton` + `ReportModal`** (`src/shared/moderation/`) — nahradí ad-hoc `RejectReasonModal` u diskuzí. Pole: kategorie (select), důvod, e-mail (předvyplněný u přihlášeného), checkbox dobré víry, notifyMe, anonymní varianta (CSAM); předvyplněné `targetType/targetId/targetUrl`.
- Umístění (B2 veřejné): ArticleDetailPage, GalleryDetailPage, nábor, UserProfilePage, bestiář, PageViewer, WorldNews, DiscussionDetailPage (migrace). (B5 soukromé: MessageItem chatu, MailPage.)
- **Fronta „Zpracovat"** — generický `ContentReportRenderer` se statement-of-reasons formulářem (výběr M0–M7 + důvod + právní/smluvní základ) místo „Smazat/Ponechat".
- **UI oznamovateli** — stav hlášení; **UI autorovi** — obdržené odůvodnění + tlačítko „Odvolat se".

## Sub-kroky (každý kompletní, žádný dluh)
- **B1** — BE modul `moderation`: enumy, 3 schémata, DTO, repo, `ContentReportProvider`, `POST /reports`, registrace typu. Migrace `ikaros_discussion_reports` → `content_reports`.
- **B2** — FE `ReportButton`/`ReportModal` + osazení veřejných ploch + generický `ContentReportRenderer` ve frontě.
- **B3** — statement of reasons (čl. 17) + potvrzení příjmu + notifikace (mail/push/in-app) + moderační log view.
- **B4** — plná M0–M7 (applyModeration per plocha) + odvolání (entita + review jiným moderátorem) + snapshoty.
- **B5** — soukromé plochy (chat/pošta/deníky) + etický kanál v `/admin/chat` + čl. 18 eskalace.

## Otevřené otázky (rozhodnu default, pokud neřekneš jinak)
1. **Guest report?** Anonym (Guest 99) může nahlásit? Default: ANO pro CSAM/illegal (bezpečnostní), jinak přihlášení. (Rámec chce nízkou bariéru u nebezpečného obsahu.)
2. **Migrace dat** starých `ikaros_discussion_reports`: přepsat do `content_reports` migračním skriptem, nebo nechat doběhnout staré + nové jinam? Default: migrační skript (čistota, žádný dvojí systém).

## Ověření
- BE: jest na provider gating + decision invariant (reviewer≠moderator) + report nezmizí.
- FE: tsc, ReportModal validace, renderer akce.
- `funkce` (nová schopnost nahlašování + role) + `napoveda` (hráč: jak nahlásit, co se stane, jak se odvolat) — závěrečný průchod.
- `mobil-desktop` na ReportModal + frontu.
