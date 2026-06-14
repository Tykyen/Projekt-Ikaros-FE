# 07 — FE browser console

> **Otázka:** loguje FE do konzole prohlížeče **syrový err / BE payload** a zůstává `console.*` v prod
> bundlu? **Osy:** `FE` `LVL`. **Plocha:** 18 `console.*` / 12 souborů, `GlobalErrorBoundary`, `socket.ts`,
> `vite.config.ts` (stripping).

## Povrch (recon — všech 18)

| Soubor:ř | Volání | Třída | Verdikt-hypotéza |
|---|---|---|---|
| GlobalErrorBoundary.tsx:19 | `error('[GEB]', error, componentStack)` | render chyba | ✅ legitimní |
| socket.ts:38 | `error('[socket] server error event', payload)` | **BE error payload** | 🟡 `FE` — co je v payloadu? |
| WorldDiarySchemaEditorPage.tsx:289 | `error(err)` | syrový `err` | 🟡 `FE` — response data? |
| useMapScene.ts:178,203 | `error` catch-up/reconnect `err` | tactical-map | ⚖️ debug, ale prefix |
| MapBackground.tsx:68, useTokenTexture.ts:35 | `warn` texture load | ⚖️ |
| TacticalMapView.tsx:750 | `error` spawn | ⚖️ |
| applyOperationToScene.ts:402, formula.ts:207 | `warn` race/syntax | ⚖️ |
| useThemeSync.ts:46,81 | `warn('[theme] ... ', err)` | ⚖️ |
| DiarySystemProvider.tsx:40 | `error` | ověřit obsah |
| parity.spec.ts:23,26 | `log` dump | ⚖️ test |

## Co ověřit

1. **K-LOG9** `FE` — [socket.ts:38] loguje **celý BE error payload** do browser konzole. Pokud BE error nese
   citlivá data (díky error-contract F1 by neměl — generická hláška), je to OK; ověřit reálný tvar payloadu
   `error` eventu. [WorldDiarySchemaEditorPage:289] `console.error(err)` — `err` může nést axios `response.data`
   → ověřit.
2. **`LVL` — console stripping** — `vite.config.ts` nemá `drop` → vše v prod bundlu (cross-ref prod-config
   K-PC9). Návrh: `esbuild: { drop: ['debugger'], pure: ['console.log','console.debug'] }` v prod — smaž
   `log`/`debug`, **ponech `warn`/`error`** (error boundary, diagnostika reálných problémů uživatelem).
3. **Severity** — FE leak je **jen do konzole toho uživatele** (žádný egress — žádný Sentry/sendBeacon).
   Takže `FE` je max 🟡: debug šum + teoretický leak BE dat, kterou uživatel stejně dostal. Není to
   server-side artefakt.

## Pasti
- Nesmazat `console.error` z `GlobalErrorBoundary` — je to legitimní diagnostika; `drop: ['console']`
  paušálně by ji odstranil.
- FE `eslint --fix`, **žádný prettier** ([paměť `feedback_fe_no_prettier`]).
- Po grafické změně není relevantní (žádné UI), ale build ověřit `npm run build` ([paměť
  `project_fe_build_preexisting_errors`]) pokud sáhnu na `vite.config.ts`.
