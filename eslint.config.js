// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([globalIgnores(['dist']), {
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    reactRefresh.configs.vite,
  ],
  languageOptions: {
    globals: globals.browser,
  },
  rules: {
    // Underscore prefix = intentionally unused (parametr ve signatuře pro type compat).
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    // React Compiler beta rules (eslint-plugin-react-hooks v6+) — informační warning, ne hard error.
    // Naše projekt pre-9.2 byl psaný před tím, než byly tyto rules zapnuté. Postupně refaktorujeme.
    'react-hooks/set-state-in-effect': 'warn',
    'react-hooks/static-components': 'warn',
    'react-hooks/incompatible-library': 'warn',
    'react-hooks/refs': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': 'warn',
  },
}, {
  // 17.8 (dluh D-17.8) — jsx-a11y ve `warn`: statická a11y kontrola (icon-only
  // tlačítka bez jména, chybějící alt, klik bez klávesnice…), aby a11y regrese
  // nikdo nezaváděl potichu. `warn` (ne `error`), ať to neblokuje build/CI a
  // pokrytí se čistí postupně. Pravidla bereme z recommended, downgrade na warn.
  files: ['**/*.{ts,tsx}'],
  plugins: { 'jsx-a11y': jsxA11y },
  // Downgrade recommended na `warn`, ale ZACHOVEJ `off` severity — jsx-a11y má
  // 3 pravidla schválně vypnutá (control-has-associated-label, label-has-for
  // deprecated, anchor-ambiguous-text). Mapovat přes klíče by je vynutilo do
  // warn a přidalo ~942 falešných warningů (šum/deprecated). Viz docs/a11y-cleanup.
  rules: {
    ...Object.fromEntries(
      Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, sev]) => {
        // Severity je buď string ('off'/'warn'/'error') nebo pole ['off', {opce}].
        const level = Array.isArray(sev) ? sev[0] : sev
        return [rule, level === 'off' ? 'off' : 'warn']
      }),
    ),
    // aria-role: ignoruj custom komponenty — jejich `role` prop NENÍ HTML role
    // (např. <WorldRoleIcon role="pj">, kde „pj" je herní role, ne ARIA role).
    // DOM elementy s `role="…"` se dál kontrolují.
    'jsx-a11y/aria-role': ['warn', { ignoreNonDOM: true }],
  },
}, ...storybook.configs["flat/recommended"]])
