# Checkpoint — cache / 02-uzivatele-pratele

> RUN-2026-07-11-1213 · styl cache (TanStack invalidace) · registr `docs/cache-audit.md` (prefix C-)
> READ-ONLY re-audit oblasti proti HEAD. Předchozí sweep 2026-06-05 (C-12/13/14 + D-02-1..4).

## Dosažená vs cílová L

- **Cílová:** běžné mutace L2+; destruktivní/optimistic L3+.
- **Dosažená:** **L2** (statický key-match / prefix-match ověřen element-po-elementu; grep-potvrzený orphan).
  Pro opravené nálezy C-12/C-13 existují vitest specy (`useAdminUsers.spec.tsx`, `useFriendshipsSocket.spec.tsx`) = **L3 test-exists** (nespuštěno v tomto běhu).

## Verdikt regrese známých nálezů (♻️ — NEhlásit jako nové)

Všechny fixy z 2026-06-05 jsou **přítomné v HEAD kódu** (potvrzeno čtením + komentáři + testy):

- **♻️ C-12** — admin role/ban/delete/permissions/bulk mutace invalidují `['public-users']` + `['public-user-profile']`. Kde: `useAdminUsers.ts:129-130,156-157,192-193,213-214,238-239,259-260,295-296,336-337,378-379,395-396,412-413`. Ověřeno testem `useAdminUsers.spec.tsx:48-49`. **Nefiltrováno = OK.**
- **♻️ C-13** — WS handlery `friend:request:accepted`/`friend:removed` mají `['pending-actions']` (`useFriendshipsSocket.ts:51,68`), `friend:request:canceled` má `['friendship-status']` (`:62`). Sdílená množina WS↔REST. `useSocketReconnect` (`:88-93`) doplněn (S-05). **Opraveno.**
- **♻️ C-14** — `useAdminApproveUsernameRequest` (`:333-342`) i `useAdminRejectUsernameRequest` (`:463-467`) invalidují `usernameRequests`+`users`+`auditLog`+`pending-actions`. **Opraveno.**
- **♻️ C-31** — WS `user:identity:changed` → `['users','me']` + `['public-user-profile']` (`useFriendshipsSocket.ts:81-84`). **Přítomno.**
- **♻️ C-45/C-51/C-52** — pending-actions badge + admin stats + audit-log invalidace v admin mutacích. **Přítomno.**
- **♻️ C-54** — `adminKeys` factory (`admin/api/adminKeys.ts`) používaná query i invalidacemi (drift eliminován; rozšířeno o `analytics`/`growth`/`costs`). **Přítomno.**

## Nové nálezy (🆕)

### 🆕 C-RUN-02a · `FO`/orphan · 🟡 — grant/revoke Podporovatel neobnoví veřejnou zeď `['supporters']`
- **Osa:** FO (P1 konzumentská inventura / P6 orphan). Nová feature 19.4 (Podporovatel) přidaná **po** sweepu 2026-06-05 → není v registru.
- **Mutace:** `useAdminSetSupporter` — [useAdminUsers.ts:143-170](../../../../src/features/admin/users/api/useAdminUsers.ts#L143). Invaliduje `adminKeys.users` + `['public-users']` + `['public-user-profile']` + `adminKeys.stats` + `adminKeys.auditLog`.
- **Konzument (vynechaný):** `['supporters']` — [useSupporters.ts:11](../../../../src/features/ikaros/api/useSupporters.ts#L11), veřejná zeď Podporovatelé na [SupportersPage.tsx:73](../../../../src/features/ikaros/pages/SupportersPage.tsx#L73) (`GET /users/supporters`, staleTime 60s).
- **Rozpor:** `['supporters']` je **orphan** — grep přes celý FE nenašel jedinou `invalidateQueries` na tento klíč (jediný writer supporter statusu je `useAdminSetSupporter`, ten ho míjí). Stejná třída jako C-12 (admin mutace míjí veřejného konzumenta), ale nová konzumentská plocha.
- **Trigger:** admin udělí/odebere status Podporovatel a má zároveň otevřenou veřejnou zeď `/ikaros/podporovatele` (jiný tab/sekce). **Viditelnost:** nový podporovatel tiše chybí (resp. odebraný stále svítí) na zdi. **Workaround:** F5 / staleTime 60s.
- **Bonus (VERIFY):** pokud BE filtruje z `GET /users/supporters` **banované/smazané** usery, měly by i `useAdminBanUser`/`useAdminRequestDeletion`/bulk invalidovat `['supporters']` (banovaný supporter jinak drží na zdi do staleTime). → PROOF-REQUEST BE-1.
- **Závažnost:** 🟡 — zeď je marketing/read-only, staleTime 60s tlumí, admin obvykle needituje s otevřenou zdí. Orphan třída.
- **Návrh:** do `useAdminSetSupporter.onSuccess` přidat `qc.invalidateQueries({ queryKey: ['supporters'] })`; případně i do ban/delete/bulk dle verdiktu BE-1.

## Latentní / VERIFY (neeskalováno)

- **D-02-3 (z 2026-06-05, `LC`/auth 🟡) — nyní pravděpodobně NEAPLIKOVATELNÉ.** `usePublicUserProfile` ([:1-24](../../../../src/features/users/api/usePublicUserProfile.ts)) je dle docstringu „dostupný každému přihlášenému"; error path řeší jen 404 (tombstone/pending-deletion) + 401/403 `retry:false`. Žádný friends-only privacy 403 gate v kódu → původní obava (accept neodemkne 403 z error cache) se nepotvrzuje. Bez nového nálezu; ponechat jako uzavřené VERIFY.
- **D-02-4 (z 2026-06-05, `WS` drift-trap 🟡) — částečně přetrvává.** WS↔REST friendship invalidace jsou stále **dvě nezávislé kopie** množiny klíčů (WS hook `useFriendshipsSocket.ts:42-77` ručně vs REST helper `invalidateFriendshipQueries` v `useFriendshipMutations.ts:10-14`). Dnes se shodují (C-13 fix), ale sdílený helper se do WS hooku neextrahoval → refactor jednoho zapomene druhý. Preventivní 🟡, ne nový nález.
- **D-02-1/D-02-2** — `friends` prefix fan-out správný; `invalidateBlockQueries` redundantní `['friends','blocked']` (pokryto prefixem `['friends']`) neškodný. Beze změny.

## PROOF-REQUESTy

- **BE-1 (+db/+contract):** Filtruje `GET /users/supporters` banované/soft-deleted usery? Pokud ano → C-RUN-02a se rozšiřuje i na ban/delete/bulk mutace (musí invalidovat `['supporters']`).
- **BE-2 (+ws parita):** Emituje BE `user:identity:changed` (nebo ekvivalent) při **supporter grant/revoke**? Cílový uživatel má vlastní supporter status (badge Ikara + gating světů/skinů) v `['users','me']`; FE listener `useFriendshipsSocket.ts:81-84` invaliduje `['users','me']` na jakýkoli `user:identity:changed`, takže FE strana je připravená — chybět může jen BE emit. Bez emitu target user neodemkne gating do refetche/F5. (WS-parita, mimo čistý FE cache scope.)

## Pokrytí

- **Query hooky (konzumenti):** useFriends, useOutgoingFriendRequests, useBlockedFriends, useFriendshipStatus, usePendingActions(Count), usePublicUsers, usePublicUserProfile, useUserLookup, useMyUsernameRequest, useMyLastUnseenDecidedRequest, useAdminUsers, useAdminUsernameRequests, useAdminAuditLog, useAdminFriendshipByPair, useAdminFriendshipsByUser, **useSupporters (nový)** — všechny přečteny.
- **Mutace (writers):** 6× friendship (`useFriendshipMutations.ts`), 15× admin users (`useAdminUsers.ts` vč. nového `useAdminSetSupporter`), 1× admin friendships (`useAdminResetCooldown`), WS hook (`useFriendshipsSocket.ts`) — všechny přečteny do plné hloubky.
- **Orphan sken:** grep `['supporters']` / `public-user*` / `friends` / `friendship-status` / `pending-actions` přes celý `src` — jediný nový orphan = `supporters`.
- **Mimo scope (jen zmíněno):** cross-feature writers `pending-actions` (useNabory 19.3, useModeration, useGallery, useArticles, useWorldJoin, useWorldAccessSocket) — patří oblastem 03/10/11, zde jen potvrzeno, že sdílený namespace nekolidují.

## Shrnutí

- **🆕 1** (C-RUN-02a 🟡 — supporters wall orphan po admin grant/revoke).
- **♻️ 6** známých (C-12/13/14/31/45/51/52) potvrzeno **opravených** v HEAD — NEhlásit jako nové.
- **2 PROOF-REQUESTy** (BE supporters filtr + supporter WS emit).
- Dosažená hloubka **L2** (fixy mají L3 test-exists).
