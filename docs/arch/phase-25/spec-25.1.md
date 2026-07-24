# Spec 25.1 — In-app hlášení chyb (Vypravěč jako kanál)

**Status:** Draft — čeká na schválení
**Rozsah:** BE (nový modul `bug-reports`) + FE (Vypravěč persona-aware formulář + admin inbox) — střední
**Repo:** `Projekt-ikaros` (BE) + `Projekt-ikaros-FE` (FE), větev `main` (pravidlo work-on-main)
**Velikost:** odhad BE ~10 souborů / ~350 ř., FE ~8 souborů / ~450 ř.
**Autor:** PJ + Claude
**Datum:** 2026-07-24
**Souvisí:** roadmap3 §25.1 · spec-26.1 (VypravecRoot) · modul `moderation` (strukturní vzor, NE sdílená entita) · 25.3 (beta banner odkáže sem) · 28.3 (support triage)

---

## 1. Cíl

Hráč nahlásí chybu **pod minutu odkudkoli**, aniž opustí appku. Kanál = **Vypravěč**: tlačítko „Nahlásit chybu" v jeho menu otevře formulář, který **mluví hlasem postavy, jež je zrovna na řadě** (Ishida na platformě · Joe ve světě · Měďák na taktické mapě). Zpětná vazba teče do platformy (dnes se rozteče na neexistující e-mail), admin ji čte v inboxu.

---

## 2. Kontext / motivace

Dnes slepá smyčka: FAQ → „napiš e-mailem" → ContactPage má `[DOPLNIT: e-mail]`. Tlačítko „Nahlásit" u obsahu je jen DSA obsahová moderace, ne technická vada. Discord v UI není. **Bez 25.1 se beta zpětná vazba (fáze 25) rozteče mimo platformu** a autor ji nezachytí. Vypravěč je už globálně namontovaný (FAB + `Shift+V` + event `vypravec:otevrit` i na kolizních plochách) — je to jediné místo, které je *fakticky* „odkudkoli", takže je přirozený hostitel.

---

## 3. Audit současného stavu

**FE:**
- [VypravecPanel.tsx:593-595](../../../src/shared/vypravec/ui/VypravecPanel.tsx#L593-L595) — `const mluvci = naTM ? 'tm' : scope` → `AVATARY[mluvci]`; patička podepisuje „Ishida/Joe/Měďák · Vypravěč". **Tuhle logiku formulář znovupoužije** — žádný nový stav mluvčího.
- [VypravecPanel.tsx:818-876](../../../src/shared/vypravec/ui/VypravecPanel.tsx#L818-L876) — menu (Cesty/Návody/Kronika/Co je nového/Plná nápověda); pod-pohledy jako `pohled === 'cesty'` s vlastní `*View` komponentou. Nový pohled `'chyba'` sem zapadne 1:1.
- Auto-kontext je dostupný: `pattern`+`pathname` (props/`useLocation`), `currentUserAtom` (userId), `navigator.userAgent`, build verze (viz §4.4).
- [faq.tsx:749-756](../../../src/shared/vypravec/registry/faq.tsx#L749-L756) — „Kde nahlásit chybu" → e-mail = **slepá smyčka k opravě**.
- Admin: `/admin` (RoleGuard Sa/Admin), `PlatformAdminPage` (taby). Sem admin inbox.

**BE:**
- Modul `bug-reports` **neexistuje**. Vzor = `modules/moderation` (schema/dto/service/controller/repository). `content-report.schema.ts` = předloha entity (audit stopa, status pending→resolved, reporter volitelný).
- `@Throttle` k dispozici (`common/throttler/throttler.config.ts`).
- `community-notify` modul existuje → Discord webhook.

---

## 4. Návrh řešení

### 4.1 BE — modul `bug-reports` (oddělená entita)

💡 **Proč oddělená entita, ne rozšíření `moderation`:** moderace řeší *obsah od uživatelů* (kategorie, appelace, GDPR režim oznamovatele) — bug je *technická vada* s jiným lifecyclem. Sloučení by mísilo GDPR režimy a lifecycle.

**Schema `BugReport`** (`collection: 'bug_reports'`, NEmaže se — audit):
```
text: string (required, maxlength 4000)
email?: string           // nepovinný, pro follow-up (i anon)
context: {
  route?: string         // pattern, např. /svet/:worldSlug/takticka-mapa
  url: string            // location.href (bez query? viz §8 riziko PII)
  scope: 'ikaros'|'world'
  speaker: 'ikaros'|'world'|'tm'   // kdo byl „na řadě"
  worldId?: string
  buildVersion?: string
  userAgent?: string
}
reporterId?: string      // z JWT, když přihlášen; jinak nevyplněno (anon)
status: 'new'|'resolved' (default 'new')
createdAtUtc: Date
resolvedByUserId?: string
resolvedAtUtc?: Date
```

**Endpointy** (`bug-reports.controller.ts`):
- `POST /bug-reports` — **veřejný** (anon i auth; controller BEZ `JwtAuthGuard`, userId čte volitelně). `@Throttle` (5/min/IP). Body: `{ text, email?, context }`. Server doplní `reporterId` z JWT pokud přihlášen. Vrací `{ id }`.
- `GET /bug-reports` — **RoleGuard Admin+**. Query `status?`, `offset?`, `limit?`. Vrací list (desc dle `createdAtUtc`).
- `POST /bug-reports/:id/resolve` — **Admin+**. Přepne `status:'resolved'` + `resolvedByUserId`/`resolvedAtUtc`.

**Discord notifikace:** po `POST` fire-and-forget přes `community-notify` (webhook). Selhání se **spolkne** — report je už uložený. Bez konfigurace webhooku = no-op.

### 4.2 FE — formulář v Vypravěči (persona-aware)

Nový pohled `'chyba'` v `VypravecPanel` (vedle `'cesty'` atd.) + položka menu **„Nahlásit chybu"** (s `<Klic />` ornamentem). Komponenta `ChybaView`:

- **Hlavička mluvčího** = avatar `AVATARY[mluvci]` + úvodní hláška **tónem postavy**:
  - Ishida (platforma): „Něco skřípe? Popiš mi, co se stalo — projdu to."
  - Joe (svět, ženský rod): „Narazil jsi na chybu? Napiš mi, co zlobí — předám to dál."
  - Měďák (TM, strohý dril): „Hlášení závady. Stručně — co selhalo?"
- **`<textarea>`** „Co se stalo?" (povinné, max 4000).
- **Nepovinný e-mail** — „Když chceš vědět, jak to dopadlo (nepovinné)."
- **Transparentní kontext** — řádek „Přiložím: kde jsi (route), verzi appky, prohlížeč." (uživatel vidí, co odesílá).
- **Odeslat** → `POST /bug-reports` → potvrzení tónem postavy (Ishida „Mám to, podívám se." / Joe „Díky, zapsala jsem to — sledujeme." / Měďák „Zaznamenáno. Předávám výš."). Chyba sítě → „Nepodařilo se odeslat, zkus to prosím znovu." + retry.

Persona texty jako `Record<'ikaros'|'world'|'tm', {...}>` v modulu (konzistentní s kánonem 02).

### 4.3 FE — napojení „odkudkoli" + oprava slepé smyčky

- [faq.tsx:749](../../../src/shared/vypravec/registry/faq.tsx#L749) — odpověď „Kde nahlásit chybu" přepsat: primárně tlačítko ve Vypravěči (otevři přes `vypravec:otevrit` → Nahlásit chybu), e-mail jako fallback.
- HelpPage — odkaz na formulář (dtto).
- **ContactPage — doplnit provozní e-mail** místo `[DOPLNIT: e-mail]` (fallback kanál; přesná adresa = otázka §9).

### 4.4 FE — admin inbox

Nová stránka `/admin/chyby` (RoleGuard Sa/Admin) **nebo** tab v `PlatformAdminPage` — *rozhodnutí v impl. plánu dle struktury PlatformAdminPage*. Výpis reportů (text, kdo/anon, route, verze, čas, status), filtr `new`/`resolved`, tlačítko „Vyřešeno". Odkaz z `/admin` rozcestníku.

### 4.5 Build verze

`buildVersion` z `import.meta.env` (Vite) — pokud projekt nemá inject verze, přidat `define: { __APP_VERSION__ }` ve `vite.config` z `package.json` (ověřím v impl. plánu; když už existuje `fe_deploy_stale_bundle` mechanismus verzování, reuse).

---

## 5. Out of scope (→ V2)

- **Screenshot příloha** — html2canvas/CSP/upload; V1 = text + auto-kontext.
- **Kategorie bugů** — V1 volný text (bug ≠ moderace s kategoriemi).
- **Notifikace reportera o vyřešení** (e-mail „opraveno") — V1 se e-mail jen uloží.
- **Appelace/threading** — bug je jednosměrný.

---

## 6. Acceptance kritéria

1. ✅ Tlačítko „Nahlásit chybu" v menu Vypravěče na platformě, ve světě i na TM.
2. ✅ Formulář ukazuje avatar + hlášky **správné postavy** dle plochy (Ishida/Joe/Měďák).
3. ✅ Odeslání přihlášeným i **anonymem** uloží report s auto-kontextem (route, url, verze, UA, scope, speaker, userId|—).
4. ✅ `@Throttle` limituje spam z jedné IP.
5. ✅ Admin (Sa/Admin) vidí inbox, filtruje `new`/`resolved`, označí „Vyřešeno".
6. ✅ Non-admin dostane 403 na `GET /bug-reports` i admin stránce.
7. ✅ FAQ + HelpPage vedou na formulář; ContactPage má reálný e-mail.
8. ✅ Discord webhook (když nakonfigurován) pošle notifikaci; jeho selhání report NEshodí.
9. ✅ Mobil i desktop (bottom-sheet i rohový panel) — `mobil-desktop`.

---

## 7. Test plán

- **BE unit/e2e:** POST anon uloží (reporterId prázdný) · POST auth doplní reporterId · GET jako Hráč → 403 · GET jako Admin → list · resolve přepne status · throttle po N req → 429.
- **FE vitest:** `ChybaView` renderuje správné hlášky per `mluvci` · odeslání volá API s kontextem · potvrzení po 201.
- **Manuál (uživatel na živém webu):** nahlásit z platformy/světa/TM → ověřit personu; anon nahlášení; admin inbox + resolve; screenshoty mobil+desktop.

---

## 8. Riziko & rollback

| Riziko | Mitigace |
|---|---|
| **PII v `url`/textu** (GDPR) | `url` bez query stringu (jen path); textarea placeholder varuje před osobními údaji; retence = řeší data-export/erasure politika |
| Anon spam | `@Throttle` per IP + maxlength; bez příloh |
| Discord webhook down | fire-and-forget, report se uloží nezávisle |
| Persona hlášky mimo kánon | texty odsouhlaseny ve specu (§4.2), tón dle 02 |
| Build verze chybí | fallback `context.buildVersion = undefined` (nezablokuje odeslání) |

**Rollback:** modul `bug-reports` je izolovaný; FE tlačítko za jednou menu položkou — odebrání položky + skrytí admin route vrátí stav. Data zůstanou (audit).

---

## 9. Otázky k autorovi

Autor delegoval, volby:
- **Rozsah:** celý 25.1 (BE modul + POST + admin inbox UI + FE) — potvrzeno.
- **Anon:** povolen — potvrzeno.
- **Screenshot:** V2 (delegováno).
- **Discord webhook:** V1 volitelný fire-and-forget (delegováno).

- **Provozní e-mail** do ContactPage (fallback) = **`tyky.projekt.ikaros@gmail.com`** (potvrzeno; ≠ SMTP odesílací účet).
- **Persona hlášky** (§4.2) — potvrzeny.

---

**Po schválení specu napíšu implementační plán** (přesné CLI / file diff, pořadí BE→FE dávek — nemíchám).
