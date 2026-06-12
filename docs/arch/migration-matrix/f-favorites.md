# F-favorites — migrace osobních oblíbených stránek

**Status:** připraveno (čeká na běh)
**Navazuje na:** [spec-5.2-followup-osobni-oblibene.md](../phase-5/spec-5.2-followup-osobni-oblibene.md), F1 (účty), F4 (stránky)

---

## Účel

Starý Matrix měl per-hráč oblíbené stránky (`User.FavoritePagesSlugs: List<string>` — plochý, jednosvětový, s reorderem). Ikaros zavedl ekvivalent `User.favoritePageSlugs: Map<worldId, slug[]>` (spec 5.2-followup). Tato fáze **doveze stará data** pro svět `matrix`.

## Mapování

| Staré | Nové |
|---|---|
| `User.FavoritePagesSlugs: string[]` (globální) | `User.favoritePageSlugs[<matrix worldId>]: string[]` |
| starý `User._id` | Ikaros `userId` přes F1 mapu (`C:/tmp/f1-user-map.json`) |
| pořadí pole | **zachováno** (starý reorder) |
| slug smazané stránky | **odfiltrován** (import proti `pages` světa) |

## Skripty

1. **`migration/f-favorites-build.mjs`** — čte `Users.bson` z dumpu, mapuje `_id` přes F1, dedup (pořadí drží), vypíše `f-favorites-data.json(.gz)` = `{ favorites: [{ userId, slugs }] }`. Uživatelé bez F1 mapy → SKIP s varováním.
2. **`migration/f-favorites-import.js`** — mongosh tělo (workflow injektuje `DRY`/`WORLD`/`data`). Filtruje propadlé slugy proti `db.pages` světa, zapisuje `favoritePageSlugs.<WORLD>` per uživatel. **Idempotentní** (replace klíče `WORLD`).

## Postup

```
node migration/f-favorites-build.mjs        # dump → f-favorites-data.json
# DRY-run přes workflow (WORLD = matrix worldId), zkontrolovat počty kept/dropped
# ostrý import
```

## Pozn / rizika

- **Závislost:** F1 (účty) + F4 (stránky) musí být hotové (jsou — live dle migrace).
- **Propadlé slugy:** stránka, která se v Ikaru nezmigrovala / byla smazaná, se z oblíbených tiše vypustí (import loguje `dropped`).
- **Re-run** přepíše `favoritePageSlugs[matrix]` daného uživatele → bezpečné opakovat.
- Pole v dumpu se očekává jako `FavoritePagesSlugs` (PascalCase, .NET model dle `docs/old/uzivatele.md`). Build loguje, kolik uživatelů ho má — `0` ⇒ ověřit název pole.
