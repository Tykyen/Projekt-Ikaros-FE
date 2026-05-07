import type { Meta, StoryObj } from '@storybook/react-vite';
import { listThemes } from './registry';

function ThemePreview({ themeId, themeName }: { themeId: string; themeName: string }) {
  return (
    <div data-theme={themeId} style={{ padding: 24, minHeight: 220, border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>{themeName}</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <button style={{ padding: '8px 16px', background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Primary
        </button>
        <button style={{ padding: '8px 16px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }}>
          Secondary
        </button>
      </div>
      <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4 }}>
        <p style={{ color: 'var(--text-primary)', margin: 0 }}>Tělo textu</p>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: 13 }}>Sekundární text</p>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Themes/Gallery',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj;

export const AllThemes: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: 16 }}>
      {listThemes().map((t) => (
        <ThemePreview key={t.id} themeId={t.id} themeName={t.name} />
      ))}
    </div>
  ),
};
