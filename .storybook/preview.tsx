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
      // ZÁMĚRNĚ zůstává 'todo', ne 'error'. Storybook component testy
      // (@storybook/addon-vitest, browser/playwright) v CI neběží — vizuální
      // brána se rozhodnutím nestaví (viz vitest.config.ts), takže axe by v CI
      // nikdy neproběhl → 'error' by byl no-op (falešné pokrytí). Přepnout jen
      // spolu s browser-mode axe v CI + ověřenou čistotou stories. Statické
      // a11y hlídání zatím nese jsx-a11y lint.
      test: 'todo',
    },
  },
  globalTypes: themeGlobalType,
  decorators: [themeDecorator],
};

export default preview;
