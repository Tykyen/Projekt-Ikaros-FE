# Zlaté cesty (golden paths) — certifikované jádro

**Co to je:** pět ucelených uživatelských průchodů přes víc modulů, testovaných jako jeden e2e řetěz. Chrání *švy* mezi moduly — přesně tam vznikají cross-repo regrese, které unit/modulové testy nechytnou. Běží v CI (23.7 brány) a **blokují deploy**, když zčervenají.

**Zdroj pravdy:** tento registr + testy níže. Zavedeno kartou 27.1 (spec `docs/arch/phase-27/spec-27.1.md`).

📚 **Certifikováno** = existuje dedikovaný e2e test, běží v CI, deploy jen po zelené. Ne „ručně ověřeno".

---

## Registr

| # | Cesta | BE e2e (harness) | FE e2e (Playwright, průchodnost UI) | Stav |
|---|-------|------------------|-------------------------------------|------|
| ① | pozvánka → členství → postava | `backend/test/golden/golden-path-1-invite-member-character.e2e-spec.ts` | `e2e/golden-path-1.spec.ts` | ✅ certifikováno |
| ② | postava → deník → chat → hod | `backend/test/golden/golden-path-2-character-diary-chat-dice.e2e-spec.ts` | `e2e/golden-path-2.spec.ts` | ✅ certifikováno |
| ③ | mapa → token → iniciativa → výsledek | `backend/test/golden/golden-path-3-map-token-initiative-result.e2e-spec.ts` | — (BE pokrývá líp; FE mimo rozsah) | ✅ certifikováno |
| ④ | wiki → scénář → událost → kronika | `backend/test/golden/golden-path-4-wiki-scenario-event-chronicle.e2e-spec.ts` | — | ⚠️ částečně — viz níže |
| ⑤ | komunitní položka → schválení → klon do světa | `backend/test/scene-template-share.e2e-spec.ts` (`[GOLDEN ⑤]`) | — | ✅ certifikováno (scény) |

## Šev, který každá cesta hlídá (ne jen 2xx)

- **①** — přijetí pozvánky vytvoří membership se **správnou rolí** (Čtenář), PJ ji povýší; cizí uživatel cílenou pozvánku přijmout nesmí.
- **②** — deník delta-merge zapíše klíč; hod je označen `isDiceRoll` a server **dopočítá `total` z faces** (klientův `total:999` je zahozen = anti-forge); nesmyslný payload → 400.
- **③** — combat `start` → `currentCombatantId` = první v pořadí, `turn` posune dalšího; HP delta je server-autoritativní a **clampuje 0..maxHp**.
- **④** — každý uzel žije, všechny nesou **stejný worldId**, cizí PJ do světa nic z toho nevytvoří (tenant izolace).
- **⑤** — publish šablony → kurátor schválí → klon do světa; read-only klon 403, cizí nepublikovaná 403.

## ⚠️ Cesta ④ — jen „4 uzly v jednom světě" (dokončí 27.1b)

Produkt dnes **nemá** datové vazby scénář→událost→kronika (žádné `scenarioId`/`sourceGameEventId`). 27.1 proto certifikuje ④ jako „ty 4 moduly fungují v jednom světě", ne referenční řetěz. Vazbu (a tím reálný řetěz) přidá karta **27.1b** (spec `docs/arch/phase-27/spec-27.1b.md`); golden-path-4 se pak povýší o assert řetězu (`TODO(27.1b)` přímo v testu).

## Jak spustit

- **BE:** `cd backend && npm run test:e2e -- --testPathPatterns golden` (+ `scene-template-share` pro ⑤). In-memory Mongo, sériově.
- **FE:** `npm run build` (jednou) → `npm run test:e2e -- golden-path`. Proti mock-API (`e2e/mock-api.ts`), žádný backend.
- **CI:** joby `backend-e2e` a `frontend-e2e` (z 23.7) chytnou nové specy globem; deploy gate „jen po zelené" je tím pádem brání automaticky.
