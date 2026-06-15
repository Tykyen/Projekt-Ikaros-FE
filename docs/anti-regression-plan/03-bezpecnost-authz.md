# 03 — Bezpečnost & authz (nejvyšší priorita hloubky)

> Nálezy, kde regrese = únik dat nebo eskalace práv. Tady nestačí „opraveno" — chceme **cílený živý test**
> (G3) a u klíčových **zuby** (G4). Osy: `EX` `AIM` `TEETH`.

## Cílové nálezy (napříč audity)
| ID | Audit | Co | Pojistka dle registru | Podezření |
|---|---|---|---|---|
| N-7 | bug | members leak bez auth guardu | „opraveno", `audit:routes` | `audit:routes` ověří jen existenci route, **ne authz** → AIM gap |
| N-8 | bug | room:join bez membership | by-design / přijaté | bez CI checku |
| N-9 | bug | sound spoof | opraveno + test | ověřit AIM |
| R-03 | role | updateMemberRole bez stropu (eskalace) | opraveno (N-3) | cílený test? |
| R-07 | role | account-state gate mrtvý | opraveno, **test s mockem** | 🟠 podezření na bezzubost (mock maskuje) |
| R-08 | role | ban se nevynucuje | opraveno + test | přidat do login suite |
| R-11 | role | GET /maps bez auth | opraveno + 2 testy | pravděpodobně OK ✅ |
| NAV-06 | nav | campaign nečlen → 403 | opraveno (BE) | FE bez CI → G1 |
| NAV-07/08/09 | nav | admin routy parita / private→404 | opraveno (BE) | G1 (FE spec mimo CI) |
| PC-01 | prod-config | captcha fail-open | opraveno | runtime ověření? |
| PC-02 | prod-config | mailer → mrtvý starý server | opraveno | runtime ověření? |
| PC-18 | prod-config | httpOnly cookie refactor | opraveno, **post-deploy smoke čeká** | L7 limit |
| W-10 | ws | global-chat user:{id} leak | **OTEVŘENO** | 🔴 G0 — nejdřív fix |

## Checklist
1. Pro každý: existuje test pojmenovaně cílící **na ten authz scénář** (ne jen happy-path)? → `EX`+`AIM`.
2. `audit:routes` chytá jen existenci route → u N-7/N-8 **nutný cílený authz e2e test** (nečlen→403/404).
3. **R-07 M-MUT** — odeber account-state gate fix, spusť test. Pokud projde (mock obchází reálnou cestu)
   → `AR-xx` TEETH-FAIL, navrhnout e2e test bez mocku.
4. W-10 → G0, zapsat jako dluh „nejdřív fix" (mimo rozsah tohoto auditu opravit, ale zaznamenat).
5. PC-18 cross-domain cookie = L7 (jen post-deploy smoke, nelze v repu) → akceptováno s poznámkou.

## Seed kandidáti
- **K-AR5** 🟠 `TEETH` — R-07 mock → bezzubost.
- **K-AR7** 🟠 `AIM` — `audit:routes` neověřuje authz (N-7/N-8).
- **K-AR6** 🔴 `EX` — W-10 otevřený, G0.

## Výstup
- Každý authz nález na G3 (cílený test) nebo G0 s dluhem; klíčové (N-7, R-03, R-07) na G4 přes M-MUT.
- Návrh chybějících authz e2e testů (Fáze B, BE) ke schválení.
