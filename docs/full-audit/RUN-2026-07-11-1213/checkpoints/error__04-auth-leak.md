# error__04-auth-leak (AL) — checkpoint RUN-2026-07-11-1213

Oblast: `docs/error-contract-plan/04-auth-leak.md` · osa `AL` · registr `docs/error-contract-audit.md` (prefix EC-)
Hloubka dosažena: **L2** (statika worlds/characters/pages/chat access checks; namátkový vzorek per modul). READ-ONLY — L4 per-modul M-SHAPE nespuštěno. Cross-ref role-audit R-20, `auth-leak-policy.md`.
Verdikt: **žádný 🔴, žádný ⭐**. Status-as-contract (401/403/404) drží dle politiky. Žádný nový leak. `K-EC6` zůstává jak registr nechal (world no-leak ✅, per-modul 403-pro-přihlášeného by-design).

## Co ověřeno (pozitiva — L2)
- **World no-leak 404** (`worlds.service.ts:~177,187` → `NotFoundException{code:'WORLD_NOT_FOUND'}`) — privátní svět bez přístupu = 404 (skrytí existence), ne 403. ✅ (cross-ref R-20).
- **Parita characters** (`characters.service.ts:172-195`): bez membership ve světě → **404 `CHARACTER_NOT_FOUND`** („jako kdyby postava neexistovala", anti-leak); member s nedostatečnou rolí → **403 `CHARACTER_ACCESS_DENIED`**. Přesně dle politiky (nepřihlášený/mimo svět = skrytí; uvnitř+bez práv = 403).
- **Parita pages** (`pages.service.ts:267…1128,1257`): chybějící stránka → 404 `PAGE_NOT_FOUND`; existující-ale-vyhrazená uvnitř přístupného světa → **403 `PAGE_ACCESS_DENIED`** (ForbiddenException). Konzistentní.
- **Parita chat** (`chat.service.ts:355…591`): neexistující kanál → `CHAT_CHANNEL_NOT_FOUND`; bez členství/práv → `CHAT_FORBIDDEN`. Rozlišuje not-found vs forbidden.
- **Guardy:** `JwtAuthGuard` 401 (`BANNED/DELETED/DELETION_PENDING`), `AdminGuard` 403 `NOT_PLATFORM_ADMIN`, `RolesGuard` false→403.

## Nálezy

### ✅ K-EC6 — parita no-leak napříč moduly, žádný protidůkaz — ⚖️ L2
Vzorek worlds/characters/pages/chat: **world-level privacy → no-leak 404; sub-resource uvnitř viditelného světa + bez práv → 403**. To je správný model politiky (skrývá se jen existence světa, ne existence stránky/postavy uvnitř světa, který už uživatel vidí). Žádný modul neleakuje 403 tam, kde má být no-leak 404. Neeskaluji — jako registr. Plná L4 per-modul M-SHAPE parita zůstává otevřený follow-up (READ-ONLY tento běh).

### ℹ️ Pozn — 401 vs 403 pro anonyma řízeno JwtAuthGuard (401), FE refreshuje na 401
Chráněné endpointy bez tokenu → 401 (chybí/expirovaný token), což FE interceptor (`client.ts:94`) správně vede na refresh→retry→login. Politika „403 pro nepřihlášený+forbidden" se v praxi projeví jako 401 (guard běží dřív než access check) — konzistentní s FE logikou, bez leaku. Není nález.

## Kontrolní body (04-auth-leak.md)
- [x] World no-leak ✅ (404 privátní)
- [x] Parita napříč moduly — characters/pages/chat sledují stejný vzor (404 mimo/neexistuje · 403 uvnitř+bez práv) ✅
- [x] 401 vs 403 anonym — JwtAuthGuard 401, FE refresh-aware ✅
- [x] FE rozlišení — 403 → „Nemáš oprávnění" (ikaros/world komponenty větví `401||403`); žádný slepý `catch→navigate('/login')` swallow nalezen
- [x] Guard bez kódu — `RolesGuard` false→403 generic (by-design)

Metoda: M1 (Read worlds/characters/pages/chat service access checks) + grep kódů, 2026-07-11. L4 M-SHAPE per modul nespuštěno (READ-ONLY). Cross-ref role-audit R-20.
