/**
 * Spec 26.1 — VypravecRoot: skrytí na kolizních routách, otevření/zavření,
 * Esc + focus restore, Shift+V (ne v inputu), a11y atributy.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WorldRole } from '@/shared/types';
import { VypravecRoot } from '../VypravecRoot';

function mountAt(path: string, scope: 'ikaros' | 'world' = 'ikaros') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <VypravecRoot
        scope={scope}
        world={
          scope === 'world'
            ? { name: 'Askalon', userRole: WorldRole.Hrac, isPJ: false }
            : undefined
        }
      />
    </MemoryRouter>,
  );
}

const FAB_LABEL = 'Vypravěč — nápověda a průvodce';

describe('VypravecRoot — skrytí na kolizních plochách (03 §5)', () => {
  it('na dashboardu je FAB viditelný', () => {
    mountAt('/');
    expect(screen.getByRole('button', { name: FAB_LABEL })).toBeInTheDocument();
  });

  for (const cesta of [
    '/chat',
    '/svet/askalon/chat',
    '/svet/askalon/takticka-mapa',
    '/svet/askalon/nova-stranka',
    '/svet/askalon/edit/moje-stranka',
  ]) {
    it(`na kolizní ploše ${cesta} FAB není`, () => {
      mountAt(cesta, cesta.startsWith('/svet') ? 'world' : 'ikaros');
      expect(screen.queryByRole('button', { name: FAB_LABEL })).toBeNull();
    });
  }

  it('wiki catch-all (:slug) kolizní není', () => {
    mountAt('/svet/askalon/libovolna-wiki', 'world');
    expect(screen.getByRole('button', { name: FAB_LABEL })).toBeInTheDocument();
  });
});

describe('VypravecRoot — panel: otevření, Esc, focus restore', () => {
  it('klik otevře panel (dialog s hlavičkou Kde jsem), Esc zavře a vrátí focus na FAB', async () => {
    mountAt('/');
    const fab = screen.getByRole('button', { name: FAB_LABEL });
    expect(fab).toHaveAttribute('aria-haspopup', 'dialog');
    expect(fab).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(fab);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Kde jsem')).toBeInTheDocument();
    // ikaros scope, routa '/' má RouteHeader (spec 26.2) → hlavička Úvodník
    expect(screen.getByText('Úvodník')).toBeInTheDocument();
    expect(screen.getByText(/Rozcestník celé platformy/)).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(fab);
  });

  it('world scope → RouteHeader s role-aware dovětkem pro Hráče (mluví Joe)', async () => {
    mountAt('/svet/askalon/stranky', 'world');
    fireEvent.click(screen.getByRole('button', { name: FAB_LABEL }));
    expect(await screen.findByText('Encyklopedie')).toBeInTheDocument();
    // audience dovětek pro Hráče (spec 26.2 R3 — aditivní)
    expect(screen.getByText(/Navrhnout/)).toBeInTheDocument();
    expect(screen.getByText(/Joe · Vypravěč/)).toBeInTheDocument();
  });

  it('nepokrytá routa → poctivý fallback, žádný stub', async () => {
    mountAt('/ikaros/akce');
    fireEvent.click(screen.getByRole('button', { name: FAB_LABEL }));
    expect(
      await screen.findByText(/Tenhle kout je neprobádaný i pro mě/),
    ).toBeInTheDocument();
  });
});

describe('VypravecRoot — zkratka Shift+V', () => {
  it('Shift+V otevře panel; v inputu nic nedělá', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <input aria-label="pole" />
        <VypravecRoot scope="ikaros" />
      </MemoryRouter>,
    );
    const input = container.querySelector('input')!;
    input.focus();
    fireEvent.keyDown(input, { key: 'V', shiftKey: true });
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.keyDown(document.body, { key: 'V', shiftKey: true });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
