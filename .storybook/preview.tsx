import type { Preview } from '@storybook/react-vite';
import { themeDecorator, themeGlobalType } from './themeDecorator';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      //
      // 17.8 (dluh D-17.8): ZÁMĚRNĚ zůstává 'todo', ne 'error'. Storybook
      // component testy (@storybook/addon-vitest, browser/playwright) jsou
      // odděleny z `vitest run` kvůli D-033 (ESM/CJS race shazoval unit testy),
      // takže axe se v CI vůbec nespouští → 'error' by byl no-op (falešné
      // pokrytí). Přepnout až s browser-mode axe v CI (vyřešení D-033) +
      // ověřenou čistotou stories. Statické a11y hlídání zatím nese jsx-a11y lint.
      test: 'todo',
    },
  },
  globalTypes: themeGlobalType,
  decorators: [themeDecorator],
};

export default preview;
