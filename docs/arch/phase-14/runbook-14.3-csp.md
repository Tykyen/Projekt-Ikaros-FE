# Runbook 14.3 — Rollout CSP (report-only → enforce)

Provozní příručka k nasazení bezpečnostních hlaviček. Cíl: zavést CSP bez rozbití webu.
Princip: **nejdřív report-only** (jen hlásí porušení, nic neblokuje) → posbírat reálná porušení → doladit → **enforce** (tvrdé vynucení).

Detaily/rozhodnutí: [spec-14.3.md](spec-14.3.md). Klíčové soubory: [default.conf.template](../../../default.conf.template), [check-csp-hash.mjs](../../../scripts/check-csp-hash.mjs), BE [main.ts](../../../../Projekt-ikaros/backend/src/main.ts).

---

## 0. Předpoklady
- BE commit `e165830` (helmet) na main + FE 14.3 změny na main.
- `VITE_API_URL` GitHub var správně (z ní se odvozuje `BACKEND_HOST` = holý host backendu).

## 1. Nasazení report-only (výchozí, nic se nezablokuje)
1. **GitHub var `CSP_HEADER_NAME` NENASTAVOVAT** → compose default = `Content-Security-Policy-Report-Only`.
2. Spustit FE deploy (Actions → *Deploy to Server* → Run). `BACKEND_HOST` se odvodí automaticky.
3. **Redeploy/restart BE** (helmet nenaběhne ze starého bundle — `feedback_be_restart_required`).

## 2. Ověření, že hlavičky jedou
```
curl -sI https://<FE_DOMÉNA>/        # → Content-Security-Policy-Report-Only, Strict-Transport-Security, Referrer-Policy, Permissions-Policy
curl -sI https://<BE_DOMÉNA>/api/... # → Content-Security-Policy: default-src 'none', Strict-Transport-Security, X-Content-Type-Options
```
- ⚠️ **Ověřit `/static/`**: otevřít mapu s obrázkovým pozadím → textury se načtou = helmet CORP nerozbil PixiJS.

## 3. Sběr porušení (Chrome DevTools → Console)
Report-only porušení se hlásí jako `Refused to … because it violates … Content Security Policy` (neblokuje).
Projít scénáře a vypsat hlášky:
- login → vstup do světa
- **mapa**: obrázkové pozadí + **dice 3D** (kostky) ← nejpravděpodobnější WASM nález
- chat (vč. RichText editoru / TipTap)
- **registrace** (Cloudflare Turnstile)
- přepnutí **motivu** (Google Fonts)
- **push** subscribe (service worker)

## 4. Ladění (per porušení rozhodnout: legitimní → povolit; podezřelé → neřešit)
Uprav direktivu v [default.conf.template](../../../default.conf.template) (`location /`, řádek s `${CSP_HEADER_NAME}`):

| Symptom v konzoli | Pravděpodobná příčina | Fix v CSP |
|---|---|---|
| `… 'unsafe-eval' / wasm …` u kostek | dice-box-threejs WASM | přidat `'wasm-unsafe-eval'` do `script-src` |
| `… inline style …` | knihovna injektuje `<style>` (TipTap/Pixi) | přidat `'unsafe-inline'` **jen** do `style-src` (skripty nech tvrdé) |
| `… connect/img … <doména>` | nová externí služba | přidat doménu do `connect-src` / `img-src` |

Po úpravě: **rebuild + redeploy FE** → znovu sběr (krok 3), dokud konzole čistá.
- 💡 Změna **inline pre-hydration skriptu** v `index.html` → přepočítat hash: `npm run audit:csp --` (resp. build guard selže a vypíše nový `sha256-…`).

## 5. Enforce (tvrdé vynucení)
1. Až 0 porušení v běžných scénářích → GitHub var **`CSP_HEADER_NAME` = `Content-Security-Policy`**.
2. Redeploy FE (žádná změna kódu).
3. Ověřit `curl -sI https://<FE>/` → hlavička `Content-Security-Policy` (bez `-Report-Only`).
4. Projít kritické cesty — nic zablokovaného.
5. Zaškrtnout 14.3 jako ✅ v [roadmap2.md](../../roadmap2.md) + status ve [spec-14.3.md](spec-14.3.md).

## 6. Rollback (když enforce něco rozbije)
- GitHub var `CSP_HEADER_NAME` → zpět `Content-Security-Policy-Report-Only` (nebo var smazat → compose default) + redeploy FE.
- Okamžitá náprava, **bez změny kódu**. Web hned funguje, porušení se jen zase hlásí.

---

**Follow-up 14.3-a:** serverový sběr porušení přes `report-uri`/`report-to` (teď jen DevTools konzole — ruční).
