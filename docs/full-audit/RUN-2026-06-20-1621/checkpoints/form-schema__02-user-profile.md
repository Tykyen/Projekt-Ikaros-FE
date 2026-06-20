# form-schema / 02-user-profile — checkpoint RUN-2026-06-20-1621

> Auditor: hloubkový agent (read-only). Datum: 2026-06-20. FE HEAD: 2a6c8e1c / BE HEAD: 9cf98be.

---

## Pokrytí

Prošel jsem CELÝ povrch oblasti 02:

- **FE kód:** `profileSchemas.ts`, `ProfileHeader.tsx`, `AppearanceSection.tsx`, `ChatColorPicker.tsx`, `SecuritySection.tsx`, `useProfile.ts`, `useAdminUsers.ts`, `useRequestUsernameChange.spec.tsx`
- **FE typy:** `shared/types/index.ts` (User, UpdateUserRequest, ChangePasswordRequest, UsernameChangeRequest)
- **BE DTO:** `update-user.dto.ts`, `change-password.dto.ts`, `request-username-change.dto.ts`, `update-user.dto.spec.ts`
- **BE schema:** `user.schema.ts`, `username-change-request.schema.ts`
- **BE mapper:** `users.repository.ts` (`toEntity`)
- **BE service:** `users.service.ts` (`toRequestDto`)
- **BE interface:** `user.interface.ts`, `username-change-request.interface.ts`
- **THEME_IDS dual-source parita:** FE `themes/registry.ts` ↔ BE `constants/theme-ids.ts` (skript diff)

Osy: `LN` `RG` `EN` `WL` `NL` `NM` `DF` `TY` — plná statická L1–L3.

---

## Dosažená L vs cílová L

| Oblast | Dosažená | Cílová | Poznámka |
|---|---|---|---|
| UP-01 displayName | **L3** | L2+ | DTO spec test F-24 zelený + FE `max(32)` + `maxLength={32}` |
| UP-02 city | **L2** | L2+ | FE/DTO/DB shodné max(100) |
| UP-03 bio | **L2** | L2+ | FE/DTO/DB shodné max(1000) |
| UP-04 characterName | **L2** | L2+ | FE/DTO/DB shodné max(64) |
| UP-05 characterBio | **L2** | L2+ | FE/DTO/DB shodné max(1000) |
| UP-06 username (change) | **L3** | L2+ | DTO spec test F-23 + kontraktový test F-27 zelené |
| UP-07 password (change) | **L2** | L2+ | FE `{oldPassword, newPassword}` = DTO |
| UP-08 chatColor | **L3** | L2+ | DTO spec test F-28 + FE gate `isValidChatColor` před submit |
| UP-09 themeId | **L2** | L2+ | THEME_IDS 33/33 parita ověřena skriptem |
| UP-10 profileVisibility | **L2** | L2+ | 3-vrstvá shoda |
| UP-11 defaultAvatarType | **L2** | L2+ | enum 3-vrstvě |
| UP-12 hiddenPresence/hiddenInDirectory | **L2** | L2+ | bool shoda |
| UP-13 characterAvatarUrl | **L2** | L2+ | by-design dedikovaný endpoint |
| UP-14 avatarUrl | **L2** | L2+ | by-design dedikovaný endpoint |
| UP-15 characterPath | **L2** | L2+ | FE nezapisuje |
| acceptedTermsAt/termsVersion | **L2** | — | nový nález: toEntity WL gap (viz F-RUN-02) |
| usernameChangeCooldownDays | **L2** | — | nový nález: FE typ nevyplněn z BE (viz F-RUN-03) |

Celková L oblasti: **L2–L3** (nad cílem L2+ pro všechna funkční pole).

---

## Nálezy

### Předchozí nálezy z registru — stav v HEAD:

| ID | Závažnost | Stav HEAD |
|---|---|---|
| F-24 (UP-01 displayName max64≠32) | 🟡 | ✅ **SJEDNOCENO** — FE `max(32)`, `maxLength={32}`, DTO `@MaxLength(32)`, DTO spec test |
| F-27 (UP-06 requestedUsername≠newUsername → 400) | 🔴 | ✅ **OPRAVENO** — FE posílá `{ newUsername: requestedUsername }`, kontraktový test zelený |
| F-28 (UP-08 chatColor submit bez gate → 400) | 🟡 | ✅ **OPRAVENO** — `isValidChatColor` gate + `saveDisabled={!isValidChatColor}` |
| F-23 (username 3 různá pravidla) | 🟡 | ✅ **SJEDNOCENO** — DTO spec test F-23 cross-DTO, lživý komentář odstraněn/upraven |

### Nové nálezy:

#### F-RUN-02 🟡 `WL` — `acceptedTermsAt`/`termsVersion` chybí v `toEntity` mapperu
- **Pole / entita:** `acceptedTermsAt: Date` + `termsVersion: string` v `User`.
- **BE schema:** `user.schema.ts:84-85` — `@Prop({ type: Date }) acceptedTermsAt`, `@Prop() termsVersion` — pole existují.
- **BE interface:** `user.interface.ts:94-95` — pole jsou v User interfacu.
- **BE mapper:** `users.repository.ts:315-388` (`toEntity`) — pole **chybí** v mapovaném objektu. Pole se zapíší při registraci (`auth.service.ts:150`: `acceptedTermsAt: new Date()`), ale žádný endpoint je nikdy nevrátí (GET `/users/me` → `findById` → `toEntity` → chybí).
- **FE typ:** `shared/types/index.ts` — `acceptedTermsAt`/`termsVersion` v User nejsou (FE typ pole nezná).
- **Dopad:** GDPR consent data jsou zapsána do DB (OK), ale nedostupná přes API — admin nemůže ověřit souhlas konkrétního uživatele přes API (jen direct DB query). Žádný FE crash. Bezpečnostně/funkčně benigní pro běžný provoz; problém jen pro compliance audit.
- **Dopad na existující data:** žádný (pole se jen nečtou, neztrácí se).
- **Návrh:** doplnit do `toEntity` + event. do admin GET `/admin/users/:id` response pro compliance přístup.
- **Stav:** ⬜ nový nález · L2 · 🆕

#### F-RUN-03 ⚪ `DF` — `usernameChangeCooldownDays` v FE User typu, BE nikdy neposílá
- **Pole / entita:** `usernameChangeCooldownDays?: number` v `shared/types/index.ts:75`.
- **FE:** `SecuritySection.tsx:63` čte `profile?.usernameChangeCooldownDays ?? DEFAULT_COOLDOWN_DAYS` — fallback 30 dní.
- **BE:** pole v `user.interface.ts` neexistuje, `toEntity` ho neobsahuje, žádný endpoint ho neposílá. Env `USERNAME_CHANGE_COOLDOWN_DAYS` zmíněna jen v service komentáři (`users.service.ts:619-620` — „configurable odloženo → 30"), není implementována.
- **Dopad:** FE vždy bere fallback 30 dní = stejné jako hardcoded BE cooldown. Funkčně OK. Typ je stale dead code z plánované feature.
- **Dopad na existující data:** žádný.
- **Návrh:** buď (a) implementovat BE endpoint posílající cooldownDays z env (pokud je konfigurovatelnost žádoucí), nebo (b) z FE typu odebrat a hardcoded 30 ponechat oboustranně.
- **Stav:** ⚪ kosmetika · L2 · 🆕

---

## PROOF-REQUEST

Živá infra pro L4 (round-trip / red-team payload) není k dispozici — statická analýza dosáhla L2–L3.

**PR-1:** Round-trip smoke `acceptedTermsAt` — po registraci GET `/admin/users/:id` vrátí pole? (ověří, zda admin view má přístup i bez `toEntity` nebo jde přes jiný mapper). Bez live infra.

**PR-2:** Red-team payload `chatColor = "#ABC"` na `/users/me` → ověřit 400 z BE `@Matches` (test F-28 v `update-user.dto.spec.ts` to pokrývá staticky; PR-2 = L4 e2e/live potvrzení).

---

## Shrnutí stavu oblasti po HEAD sweep

Všechny 4 původní nálezy oblasti 02 (F-24, F-27, F-28, F-23) jsou **opraveny + testovány** v HEAD. Dva nové nálezy: F-RUN-02 🟡 (GDPR consent pole chybí v `toEntity` — read-only gap) + F-RUN-03 ⚪ (stale typ pro budoucí feature). Žádný nález nevyžaduje migraci dat. Žádný aktivní 400/ztráta dat nález.
