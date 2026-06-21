---
name: governance
aliases: [governance, R-20, world governance, admin bypass, vládnutí světu]
category: role-a-prava
related: [[pan-jeskyne], [superadmin], [globalni-role], [soft-delete-sveta], [elevation]]
status: draft
---

# Governance (R-20)

**TL;DR:** Princip, že autoritou uvnitř [[svet|světa]] je [[pan-jeskyne|PJ]] — platform Admin/Superadmin nemá ve světě governance moc.

> **Aktualizace 2026-06-21:** R-20 „admin natvrdo bez moci" bylo nahrazeno modelem [[elevation]] — admin moc je ve světě **uspaná, ale per-svět nahoditelná** (toggle). Princip „autorita = PJ" platí dál pro de-elevated admina; po nahození má admin plnou moc v daném světě.

## Detail

R-20 (2026-06-13): platform [[globalni-role|Admin/Superadmin]] **nemá** pravomoc uvnitř cizího světa. Bypass byl odebrán ze 4 bran `worlds.service` (approve / canAdminWorld / transfer / calendar). **Od 2026-06-21** je tento bypass dostupný znovu, ale jen přes vědomou [[elevation|elevaci]] (per-svět, auditovaná).

Jediná pojistka admina: **obnova opuštěného [[soft-delete-sveta|soft-smazaného]] světa** (30denní okno) a dosazení PJ. Read viditelnost zůstává; ostatní moduly (obsah) se řeší zvlášť.

## Kde se objevuje

- v dokumentaci: [09-svet-vstup-clenstvi.md](docs/funkce/09-svet-vstup-clenstvi.md)
- v kódu: `worlds.service` (brány approve/canAdminWorld/transfer/calendar)

## Nepleť s

- **[[superadmin]]** — globální role; governance říká, že ani superadmin nevládne uvnitř světa.
