import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { PageSections } from './PageSections';
import { printModeAtom } from '@/features/world/export/print';
import type { PageSection } from '../../api/pages.types';

function section(over: Partial<PageSection> = {}): PageSection {
  return {
    id: 's1',
    title: 'Tajná sekce',
    content: '<p>Skrytý obsah</p>',
    order: 0,
    isCollapsed: true,
    items: [],
    ...over,
  };
}

afterEach(() => {
  getDefaultStore().set(printModeAtom, false);
});

describe('PageSections — tisk', () => {
  it('sbalená sekce mimo tisk svůj obsah nevykreslí', () => {
    getDefaultStore().set(printModeAtom, false);
    render(<PageSections sections={[section()]} />);
    expect(screen.queryByText('Skrytý obsah')).not.toBeInTheDocument();
  });

  it('v print módu se sbalená sekce rozbalí', () => {
    getDefaultStore().set(printModeAtom, true);
    render(<PageSections sections={[section()]} />);
    expect(screen.getByText('Skrytý obsah')).toBeInTheDocument();
  });
});
