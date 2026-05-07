import type { Preview } from '@storybook/react-vite';
import { themeDecorator, themeGlobalType } from './themeDecorator';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
  globalTypes: themeGlobalType,
  decorators: [themeDecorator],
};

export default preview;
