import { useEffect } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { applyTheme } from '../src/themes/applyTheme';
import { listThemes } from '../src/themes/registry';
import '../src/index.css';

export const themeDecorator: Decorator = (Story, context) => {
  const themeId = (context.globals.theme as string) ?? 'modre-nebe';

  useEffect(() => {
    void applyTheme(themeId);
  }, [themeId]);

  return (
    <div data-theme={themeId} style={{ padding: 24, minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Story />
    </div>
  );
};

export const themeGlobalType = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'modre-nebe',
    toolbar: {
      icon: 'paintbrush',
      items: listThemes().map((t) => ({ value: t.id, title: t.name })),
      dynamicTitle: true,
    },
  },
};
