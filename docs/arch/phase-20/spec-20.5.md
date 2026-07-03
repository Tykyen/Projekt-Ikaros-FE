# Spec 20.5 — Interní chat správy platformy

**Fáze:** 20 (Governance, právo & moderace — Platforma + Provoz)
**Stav:** ✅ implementováno (2026-07-03) — BE modul `platform-chat` (konverzace/zprávy/WS + dokumenty + úkoly) + FE napojení; **čeká BE restart** + mobil-desktop + přílohy/member-picker (follow-up)
**Typ:** nová feature (FE napřed + BE kontrakt) — ad-hoc zadání mimo původní karty 20.1–20.4
**Souvisí:** světový chat (`features/world/chat`), globální chat „Hospoda" (`features/chat`), Administrace (`features/admin`)

---

## 1. Cíl

Samostatná stránka **Chat správy platformy** (`/admin/chat`) pro tým správy (Superadmin + Admin). Slouží k interní koordinaci: vícero konverzací, sdílené PDF dokumenty ke čtení a společný přehled úkolů týmu. Vstupní bod = položka „Chat" v horní navigaci Administrace, která **naviguje na vlastní route** (ne in-place tab).

Tři subsystémy na jedné stránce:
- **A · Konverzace** — vícekanálový chat (Hlavní, Vedení, + další), zakládá a spravuje členství jen superadmin.
- **B · Dokumenty** — sdílené PDF ke stažení a čtení (prostý sklad, žádné AI).
- **C · Úkoly týmu** — společný přehled úkolů všech adminů (rozevírací per osoba).

---

## 2. Kontext / motivace

Tým správy dnes nemá vyhrazený interní komunikační prostor uvnitř platformy — koordinace se děje mimo systém. Světový chat je vázaný na svět a hráče; Hospoda je veřejná/anonymní. Vzniká potřeba **privátního koordinačního prostoru jen pro provozní tým** s vlastními dokumenty a úkolníkem.

Feature je ad-hoc zadání (2026-07-03), zařazená do Fáze 20 (Platforma + Provoz / governance) jako bod 20.5. HTML návrh vzhledu (frontend-design) odsouhlasen před spec: `C:\tmp\admin-chat-navrh.html`.

---

## 3. Audit současného stavu

### Administrace (vstupní bod)
- [PlatformAdminPage.tsx](src/features/admin/pages/PlatformAdminPage.tsx) — taby `TABS` (ř. 29–49), union `AdminTab` (ř. 19–25), set `VALID` (ř. 51–58). **Ale Chat NEbude tab** — bude to nav odkaz na `/admin/chat` (viz Návrh).
- [router.tsx](src/app/router.tsx#L220-L228) — route `admin` + `<RoleGuard roles={[UserRole.Superadmin, UserRole.Admin]}>`. Nová route `/admin/chat` dostane stejný guard.
- [IkarosLayout.tsx](src/app/layout/IkarosLayout/IkarosLayout.tsx#L491-L498) — odkaz „Správa platformy" (`isAdmin`).

### Role
- [shared/types/index.ts](src/shared/types/index.ts#L6-L16) — `UserRole`: Superadmin=1, Admin=2, Ikarus=9, SpravceClanku=10, SpravceGalerie=11, SpravceDiskuzi=12, Guest=99. **Generická role „Správce" neexistuje** → přístup = Superadmin + Admin.

### Chat (co znovupoužít)
- **Sdílená primitiva (beze změny):** [features/chat/api/socket.ts](src/features/chat/api/socket.ts), [useSocket.ts](src/features/chat/api/useSocket.ts) (`useSocketEvent`, `useSocketReconnect`), `MessageList`, `MessageItem`, `ChatInput`, `TypingIndicator`, `lib/chatItems`, typy `ChatMessage`/`ChatAttachment`.
- **Strukturální vzor (parametrizovat):** [WorldChatRoom.tsx](src/features/world/chat/components/WorldChatRoom.tsx) (3-sloupcový grid + orchestrace), `ChannelSidebar` (kanál→konverzace), `ChannelView` (bez world-specifik: persona/emoty/skiny/deník), [useWorldChat.ts](src/features/world/chat/api/useWorldChat.ts) (query klíče, unread, search — generické, vázané jen na base URL `/worlds/:id/chat`).
- **Terminologie** ([features/world/chat/lib/types.ts](src/features/world/chat/lib/types.ts)): „kanál" = `ChatGroup`, „konverzace" = `ChatChannel`. `ChatChannel.worldId: string|null` + `isGlobal` už existuje → BE model předvídá ne-světové konverzace.
- **room:join pattern** ([ChannelView.tsx](src/features/world/chat/components/ChannelView.tsx#L264-L287)): `room:join 'chat:{channelId}'`, re-emit po reconnectu.
- **Zahodit / psát nově:** celý pravý rail (`ChatContextRail`, `ChannelMemberPanel`, combat, deník) — sem přijde panel Úkoly.

> Poznámka: v projektu je zavedená **inverzní** terminologie vůči BE (`feedback_chat_naming`): UI „kanál" = ChatGroup, „konverzace" = ChatChannel. Držet konzistentní.

---

## 4. Návrh řešení

### 4.0 Přístup & umístění
- Nová route **`/admin/chat`** (samostatná, celoobrazovková), guard `[Superadmin, Admin]`.
- V horní navigaci Administrace přibude položka **„Chat"** — vizuálně vedle tabů, ale je to `<Link to="/admin/chat">`, ne tab přepínající obsah. Zvýrazněná, když `pathname === '/admin/chat'`.
- Stránka má vlastní hlavičku s odkazem **„← Administrace"** (`/admin`).

📚 *Proč route místo tabu:* chat je plnohodnotný pracovní prostor (WS spojení, vlastní layout), ne panel v přehledu. Route ho izoluje od tab-stavu Administrace a umožní deep-link na konverzaci.

### 4.A Konverzace (chat)

**Layout** — 3 sloupce (CSS grid, vzor `WorldChatRoom`):
- **Vlevo** — seznam konverzací (Hlavní, Vedení, + další) s unread badge a preview poslední zprávy. Dole „＋ Nová konverzace" **jen pro superadmina**.
- **Uprostřed** — hlavička konverzace (název, počet členů, tlačítko „📄 Dokumenty" vedle lupy, hledání, „⋯" = správa konverzace/členů jen superadmin) + `MessageList` + composer (text + příloha PDF).
- **Vpravo** — panel Úkoly týmu (viz 4.C).

**Chování:**
- Zprávy real-time přes WS (vzor světového chatu: REST `POST` → WS echo `chat:message`).
- Přílohy: PDF (a obrázky) ve zprávě.
- **Membership:** každá konverzace má seznam členů; superadmin je zakládá a spravuje (přidá/odebere admina). Admin vidí jen konverzace, jichž je členem. Bez soukromých 1:1 (V1).
- „Hlavní" a „Vedení" jsou seed konverzace (stejné publikum = Superadmin+Admin, rozdíl tematický).

**BE kontrakt (nový modul `platform-chat` NEBO rozšíření existujícího):**
- Konverzace: `id, name, memberIds[], createdBy, lastMessageAt, isPlatform:true`.
- Zprávy: reuse tvaru `ChatMessage` (author, text, attachments[], createdAt).
- Endpointy (base `/admin/chat` nebo `/platform/chat`): list konverzací (dle členství), zprávy konverzace (stránkované), odeslat, mark-read/unread, CRUD konverzace + membership (superadmin), search.
- WS: room `chat:{conversationId}`, eventy `chat:message` / `:updated` / `:deleted` / `chat:typing` / `chat:unread`.

### 4.B Dokumenty (sdílené PDF)

- Tlačítko **„📄 Dokumenty"** v hlavičce chatu vedle lupy → prostřední panel se přepne na **seznam PDF** (levý i pravý sloupec zůstávají).
- Seznam: název, velikost, kdo nahrál (+datum), akce Přečíst / Stáhnout. Tlačítko **„Nahrát PDF"**.
- **Klik na dokument → čtečka** (náhled ke čtení) + „← Zpět na dokumenty".
  - 💡 Doporučení: náhled přes **nativní prohlížeč PDF** (`<iframe src=blob/url>` nebo nová záložka), ne vlastní `pdf.js` — méně závislostí, spolehlivé. Vlastní čtečka z mockupu je jen ilustrace vzhledu.
- Dokumenty jsou **společné pro celý tým** (ne per-konverzace) — sdílený sklad.

**BE kontrakt:**
- Kolekce `platform_documents`: `id, filename, sizeBytes, uploaderId, url/storageKey, createdAt`.
- Upload PDF → úložiště (Cloudinary raw / vlastní file storage — **BE rozhodnutí**, viz Otázky). Endpointy: list, upload, download, delete (kdo smí mazat → viz Otázky).

### 4.C Úkoly týmu

- Pravý sloupec: úkoly **všech adminů pohromadě**, seskupené per osoba, **rozevírací** (accordion — klik na jméno sbalí/rozbalí).
- Každá osoba: avatar, jméno, online tečka, počet hotových/celkem.
- Úkol: checkbox (hotovo/ne) + text. Vlastní úkoly edituje každý admin (přidat/odškrtnout/smazat), **cizí úkoly edituje jen superadmin** (tužka ✎).
- Veřejné mezi adminy (vidí navzájem — účel: „kdo má co").

**BE kontrakt:**
- Kolekce `admin_tasks`: `id, ownerId, text, done, order, createdBy, createdAt`.
- Endpointy: list (všichni admini), create (owner=self, superadmin i pro cizího), toggle done, edit, delete, reorder. Autorizace: owner NEBO superadmin.
- Real-time: nemusí být WS; stačí refetch/invalidace TanStack po mutaci (úkoly nejsou konverzace). Volitelně lehký WS signál `admin:tasks:updated`.

---

## 5. Out of scope (V1)

- ❌ AI / RAG nad PDF (odpovídání z dokumentů) — dokumenty jsou jen sklad.
- ❌ Soukromé 1:1 konverzace (self-service). Konverzace zakládá superadmin.
- ❌ Zakládání konverzací adminem (jen superadmin).
- ❌ Přístup pro role „Správce obsahu" (SpravceClanku/Galerie/Diskuzi) — jen Superadmin+Admin.
- ❌ Skiny/motivy chatu (bere barvy z aktivního motivu; žádný vlastní skin engine).
- ❌ Termíny/priority/přiřazování úkolů mezi lidmi — V1 jen text + hotovo + pořadí, per owner.
- ❌ Vlastní pdf.js čtečka (nativní náhled).

---

## 6. Acceptance kritéria

- [x] Route `/admin/chat`, guard `[Superadmin, Admin]`, ne-oprávněný → Forbidden.
- [x] V Administraci nav položka „Chat" naviguje na `/admin/chat`; stránka full-bleed s „← Administrace".
- [x] Levý sloupec listuje konverzace dle členství (BE-enforced); „＋ Nová konverzace" vidí jen superadmin.
- [x] Superadmin založí konverzaci; admin vidí jen své. **Follow-up:** FE picker členů + rename/delete UI (BE endpointy `PATCH/DELETE` hotové).
- [x] Zprávy se posílají a přijímají real-time (WS `platform-chat:message`). **Follow-up:** přílohy PDF ve zprávě (dokumenty mají vlastní sklad) + role-odznak (senderRole enrich).
- [x] „Dokumenty" vedle lupy přepne panel na seznam PDF; Nahrát/Stáhnout/Smazat funguje; klik → iframe čtečka; „Zpět" vrací na seznam i na chat.
- [x] Pravý panel Úkoly: rozevírací per admin; toggle/přidat/edit/smazat; vlastní edituje admin, cizí jen superadmin.
- [ ] Responsive `mobil-desktop` — **čeká** (základní media queries hotové; živé ověření přes screenshoty od uživatele, browser sám nespouštím).

### Stav implementace (2026-07-03)
BE: modul `backend/src/modules/platform-chat/` — `PlatformChatService/Controller/Gateway` (reuse `ChatChannel`/`ChatMessage`), `PlatformDocuments*` (kolekce `platform_documents`, PDF na Cloudinary raw), `AdminTasks*` (kolekce `admin_tasks`). Prefix `admin-chat`, guard Sa/Admin. Registrováno v `app.module`. Typecheck čistý.
FE: `src/features/admin/chat/` — `AdminChatPage` (full-bleed), hooky `useAdminChat`/`useAdminDocuments`/`useAdminTasks`. Build zelený.
**Nutný BE restart** (nový modul + seed konverzace Hlavní/Vedení vzniknou v `onModuleInit`).

---

## 7. Test plán

- **Automated (FE vitest):** komponenty seznamu konverzací (membership filtr), Úkoly panel (autorizace edit self vs superadmin), přepínač Dokumenty/čtečka (stavový automat show/reading).
- **Automated (BE):** autorizace endpointů (admin nevidí cizí konverzaci; jen superadmin CRUD konverzace/členství; task edit owner|superadmin).
- **Smoke (`verify`):** superadmin založí konverzaci, přidá admina, pošle zprávu s PDF, nahraje dokument, přidá si úkol, superadmin odškrtne cizí úkol.
- **`mobil-desktop`** po UI dokončení.

---

## 8. Riziko & rollback

| Riziko | Dopad | Mitigace |
|---|---|---|
| BE model konverzace+membership je nový (ne čistě reuse) | střední | FE napřed proti kontraktu (`project_fe_be_contract_drift`); BE spec paralelně; mock v testech |
| PDF úložiště (Cloudinary umí jen obrázky?) | střední | ověřit Cloudinary raw upload vs. vlastní storage — BE rozhodnutí před impl. dokumentů (blok B) |
| Leak: admin vidí konverzaci, kde není člen | vysoký | membership filtr **BE-enforced**, ne jen FE skrytí; test na 403 |
| WS room izolace mezi platform a world chatem | střední | oddělený room prefix `chat:{conversationId}` + BE gate na členství |
| Rozsah (3 subsystémy) | střední | implementace po blocích A→C; každý blok samostatně funkční (bez dluhu dle `feedback_no_debt` — buď kompletní blok, ne půlka) |

**Rollback:** feature je izolovaná (nová route + moduly); odebrání nav položky + route ji skryje bez dopadu na zbytek.

---

## 9. Otázky k autorovi

Většina rozhodnuta v brainstormingu (viz Out of scope). Zbývá:

1. **Číslo/umístění:** OK zařadit jako **20.5** (Fáze 20)? Nebo jinam.
2. **PDF čtečka:** potvrdit **nativní náhled** (iframe/nová záložka) místo vlastní stylizované čtečky z mockupu.
3. **Mazání dokumentů:** kdo smí smazat sdílené PDF — jen superadmin, nebo i ten, kdo nahrál?
4. **Mazání/přejmenování konverzace:** superadmin může smazat i „Hlavní/Vedení", nebo jsou zamčené seed?
5. **Pořadí implementace bloků:** A (chat) → B (dokumenty) → C (úkoly)? Nebo jiná priorita.
