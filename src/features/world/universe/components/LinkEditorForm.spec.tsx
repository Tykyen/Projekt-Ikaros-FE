import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LinkEditorForm } from './LinkEditorForm';
import type { UniverseNode, UniverseLink } from '../types';

function n(id: string, name: string): UniverseNode {
  return {
    id,
    name,
    color: '#fff',
    size: 5,
    isPublic: true,
    visibleToPlayerIds: [],
  };
}

const nodes = [n('a', 'Alfa'), n('b', 'Beta')];

describe('LinkEditorForm', () => {
  it('přidá spojení s vybraným source/target', () => {
    const onAdd = vi.fn();
    render(
      <LinkEditorForm
        nodes={nodes}
        links={[]}
        onAddLink={onAdd}
        onRemoveLink={() => {}}
      />,
    );
    const [from, to] = screen.getAllByRole('combobox');
    fireEvent.change(from, { target: { value: 'a' } });
    fireEvent.change(to, { target: { value: 'b' } });
    fireEvent.click(screen.getByRole('button', { name: /Přidat spojení/ }));
    expect(onAdd).toHaveBeenCalledWith({
      source: 'a',
      target: 'b',
      isOrbit: false,
    });
  });

  it('nepřidá self-link (source == target)', () => {
    const onAdd = vi.fn();
    render(
      <LinkEditorForm
        nodes={nodes}
        links={[]}
        onAddLink={onAdd}
        onRemoveLink={() => {}}
      />,
    );
    const [from, to] = screen.getAllByRole('combobox');
    fireEvent.change(from, { target: { value: 'a' } });
    fireEvent.change(to, { target: { value: 'a' } });
    fireEvent.click(screen.getByRole('button', { name: /Přidat spojení/ }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('vypíše existující hrany se jmény a maže', () => {
    const onRemove = vi.fn();
    const links: UniverseLink[] = [
      { source: 'a', target: 'b', isOrbit: true },
    ];
    render(
      <LinkEditorForm
        nodes={nodes}
        links={links}
        onAddLink={() => {}}
        onRemoveLink={onRemove}
      />,
    );
    expect(screen.getByText(/Alfa → Beta \(orbit\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Smazat spojení'));
    expect(onRemove).toHaveBeenCalledWith('a', 'b');
  });
});
