# 01 — HTTP exception shape & status (`EX`)

> **Otázka:** má každá HTTP chyba jednotný tvar `{error:{code,message,timestamp}}` a **sémanticky správný
> status**? Kde se status volí špatně (400 místo 404/409), kde je message string místo objektu, a co s mrtvým
> polem `statusCode`?

## Povrch
- `HttpExceptionFilter` ([common/filters/http-exception.filter.ts:10-44]) — kanonický formátovač.
- 818 `throw new *Exception` / 73 souborů — zdroje.
- `getStatus()` jako zdroj statusu vs `statusCode` v těle (mrtvé).

## Kontrolní body
- [ ] **Tvar** — projde každý `*Exception` filtrem do `{error:{code,message,timestamp}}`? (ano pro vše extends `HttpException`; ne pro #3 → oblast 05)
- [ ] **Status sémantika** — namátkou + M-GREP: používá se 404 pro „nenalezeno", 409 pro konflikt, 403 pro zákaz, 410 Gone správně? Hledat `BadRequestException` tam, kde má být `NotFound`/`Conflict` (anti-pattern „všechno je 400").
- [ ] **String vs objekt message** — kolik throwů má **string** message (→ `code = HttpStatus[status]` generický, FE nemůže field-mapovat)? `K-EC12`. M-GREP spočítá.
- [ ] **Mrtvé `statusCode`** — 159× `statusCode` v těle, filtr ho **ignoruje** (ř.15-17). Ověřit, že **nikde** kód nečte `statusCode` z těla (jinak by drift `statusCode≠getStatus()` byl bug). `K-EC4` → 🟡 kosmetika.
- [ ] **`code` fallback** — `HttpStatus[status]` (ř.36-39) je validní string pro všechny statusy? (`HttpStatus[418]`?) Edge.
- [ ] **`message: 'Error'` fallback** — kdy nastane (objekt bez `message`)? Leak prázdné chyby?

## Metoda
M-GREP (klasifikace) → M-SHAPE (e2e: vystřel 400/404/409/410 → assert status+tvar) → L4.

## Seed
`K-EC4` (mrtvé statusCode 🟡), `K-EC12` (string-only message → generic code 🟠).
