# Routing

## Routes

| Cesta | Komponenta | Layout | Guard |
|-------|------------|--------|-------|
| `/xxx` | `XxxPage` | `IkarosLayout` | `authLoader` |

## URL parametry

| Parametr | Typ | Popis |
|----------|-----|-------|
| `:id` | string (UUID) | (popis) |

## Guards

**Auth:** `authLoader` — redirect na `/login` pokud chybí JWT v localStorage.

**Role:** `<RoleGuard roles={[...]}>` — zobrazí `ForbiddenPage` pokud uživatel nemá požadovanou roli.

## Redirecty

(Popis redirect pravidel — po přihlášení kam, po odhlášení kam, atd.)
