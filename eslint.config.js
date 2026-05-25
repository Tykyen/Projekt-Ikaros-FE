// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
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
}, ...storybook.configs["flat/recommended"]])
