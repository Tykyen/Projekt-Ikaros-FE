/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import type * as React from 'react';
import type { Decorator } from '@storybook/react-vite';
import { applyTheme } from '../src/themes/applyTheme';
import { listThemes } from '../src/themes/registry';
import '../src/index.css';

function ThemeDecoratorWrapper({ themeId, children }: { themeId: string; children: React.ReactNode }) {
  useEffect(() => {
    void applyTheme(themeId);
  }, [themeId]);

  return (
    <div data-theme={themeId} style={{ padding: 24, minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {children}
    </div>
  );
}

export const themeDecorator: Decorator = (Story, context) => {
  const themeId = (context.globals.theme as string) ?? 'modre-nebe';
  return (
    <ThemeDecoratorWrapper themeId={themeId}>
      <Story />
    </ThemeDecoratorWrapper>
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
