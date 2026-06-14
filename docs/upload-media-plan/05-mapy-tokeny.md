# 05 — Mapy & tokeny (taktická mapa, world maps atlas)

> **Otázka:** Zůstane background privátní mapy privátní, smí token image nahrát jen oprávněný, uklidí se bloby při smazání scény/mapy?

**Stav: 🐛 hotovo** (sweep 2026-06-14) — **UM-05** 🟠 (deleteScene/removeMap bez blob cleanup ani eventu) + **UM-02** 🟠 (privátní mapa background = veřejná URL). Token image se bere z `characterData.imageUrl` (Page enrich), žádný dedikovaný token upload endpoint, `toToken` mapper imageUrl nemá. Viz [registr](../upload-media-audit.md).

## Dotčené

- BE: maps modul (`mapScenes`/`mapOperations`), world-maps atlas (`worldMapEntries`, `visibleToPlayerIds`, `isPublic`), token image upload endpoint (VERIFY), `toToken`/`toEntity` whitelist mapper
- FE: [`MapEditorModal.tsx`](../../src/features/world/maps/components/MapEditorModal.tsx) (`isPublic`/`visibleToPlayerIds`) · `MapBackground.tsx` · token creation modal · `MapVisibilityField`

## Hypotézy

- **K-UM2** 🔴 PV — privátní mapa (`visibleToPlayerIds`/`!isPublic`) má background na veřejné Cloudinary URL → hráč mimo seznam zná-li URL ji stáhne. GET filtruje, ale blob ne.
- **K-UM4** 🟠 DL — token image / map background replace → orphan; smazání scény (inline subdoc, žádný event z [cascade-delete](../cascade-delete-audit.md)) → token bloby leak

## Co ověřit

- [ ] token image — kterým endpointem se nahrává? guard (PJ only? owner?)? folder? cleanup?
- [ ] background privátní mapy — URL forma, leak test (M-IDOR: hráč mimo `visibleToPlayerIds` zkusí přímou URL)
- [ ] smazání scény/mapy → bloky (background, token images) cleanup? (cascade-delete měl scénu jako „žádný event" — bloby leak)
- [ ] world-maps atlas `isPublic`/`visibleToPlayerIds` — GET leak-safe (cross-ref [project_world_maps_atlas]); ale obrázek sám?
- [ ] `toToken` whitelist mapper — token image pole tam je? (drift past z map-token auditu)
- [ ] knihovna map (per-PJ snapshot) — sdílí bloby mezi světy? smazání jednoho světa nesmí zabít blob druhého
