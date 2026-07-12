---
name: granular-permissions
aliases: [granularní oprávnění, admin permissions]
category: role-a-prava
related: [[superadmin]], [[globalni-role]]
status: draft
---

# Granular permissions

**TL;DR:** Jemné permission flagy nad rámec [[globalni-role]] — nastavuje výhradně [[superadmin]] a přiděluje konkrétní pravomoci konkrétním adminům.

## Detail

Granularita umožňuje Superadminovi udělit adminovi jen vybrané pravomoci místo zapínat celou roli. Příklady flagů:

- `canManageAdmins` — přidávat/odebírat další adminy
- `canModerateContent` — schvalovat/vracet obsah

(Třetí flag `canEditPlatformPages` byl mrtvý — nikde nevynucován — a 2026-07-12 odstraněn z BE i FE.)

Flagy nastavuje **jen Superadmin** — admin si je sám nemůže přidělit.

## Kde se objevuje

- v kódu (FE):
  - [src/features/admin/](../../src/features/admin/) — admin UI s permission checky
- v kódu (BE):
  - backend/src/modules/admin/admin.service.ts — hierarchie + permissions
- v dokumentaci:
  - HelpPage RolesSection — „Granular permissions … nastavuje výhradně Superadmin"
- v UI:
  - Administrace → Uživatelé → detail admina → permission flagy

## Nepleť s

- **[[globalni-role]]** — hrubé rozdělení (Admin / Ikarus / …); granular permissions ladí, co konkrétní admin smí.
- **[[world-role]]** — role uvnitř světa; granular permissions řeší platformovou úroveň.
