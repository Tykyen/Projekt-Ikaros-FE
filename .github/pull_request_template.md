## Shrnutí

<!-- Co se mění a proč. 1–3 odrážky. -->

## Checklist

### Před mergem

- [ ] `npm run lint` ✓
- [ ] `npx tsc -b` ✓ (žádné TS chyby)
- [ ] `npm run test:run` ✓
- [ ] Lokální `npm run dev` projeden — manuální smoke test
- [ ] UI změny otestovány na mobilu i desktopu (skill `mobil-desktop`)

### Synchronizace dokumentace

- [ ] **HelpPage** (`/ikaros/napoveda`) aktualizována, pokud PR přidává/mění:
      - novou stránku v aplikaci → sekce **Stránky** (✅/🚧 značky)
      - novou roli nebo oprávnění → sekce **Role**
      - funkčnost popsanou v FAQ → sekce **FAQ**
      <br>(tracking D-080 — viz `docs/dluhy.md`; pomocí skillu `napoveda`)
- [ ] `docs/roadmap-fe.md` reflektuje stav (✅/⬜/🟡 + datum dokončení)
- [ ] `docs/dluhy.md` — uzavřené dluhy přesunuté, nové zapsané (skill `dluh`)

### Bezpečnostní zámky

- [ ] Žádné hardcoded barvy mimo `src/styles/themes/*` (`npm run lint:colors`)
- [ ] Theme úpravy scoped pouze na `[data-theme="<id>"]` (D — viz memory `feedback_theme_isolation`)
- [ ] Žádné `--no-verify`, `--no-gpg-sign`, ani jiné skip flagy v commit historii PR

## Souvisí

<!-- Spec / plán / dluh, např.:
- Spec: docs/arch/phase-2/spec-2.3.md
- Plán: docs/arch/phase-2/plan-2.3.md
- Uzavírá dluh: D-XYZ -->

## Screenshoty / Video

<!-- Pro UI změny: desktop + mobil. -->
