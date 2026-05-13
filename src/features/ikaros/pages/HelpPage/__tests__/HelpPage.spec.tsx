import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import HelpPage from '../HelpPage';
import { HELP_TABS, parseTab } from '../helpers';

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="probe-search">{loc.search}</div>;
}

function renderHelp(initialEntry = '/ikaros/napoveda') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/ikaros/napoveda"
          element={
            <>
              <HelpPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HelpPage', () => {
  it('vykreslí 5 tlačítek tabů s českými popisky', () => {
    renderHelp();
    expect(screen.getByRole('tab', { name: 'Začni tady' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stránky' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Účet & profil' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Role & oprávnění' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FAQ' })).toBeInTheDocument();
    expect(HELP_TABS).toHaveLength(5);
  });

  it('default (bez ?sekce=) → tab „Začni tady" aktivní + obsah obsahuje intro', () => {
    renderHelp();
    const tab = screen.getByRole('tab', { name: 'Začni tady' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Co je Projekt Ikaros/i)).toBeInTheDocument();
  });

  it('klik na „Stránky" → URL ?sekce=stranky + obsah obsahuje název stránek', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Stránky' }));
    expect(screen.getByTestId('probe-search').textContent).toBe('?sekce=stranky');
    expect(screen.getByText(/Adresář uživatelů/)).toBeInTheDocument();
    expect(screen.getAllByText(/Pošta/).length).toBeGreaterThan(0);
  });

  it('klik na „Role & oprávnění" → dva bloky (globální + svět) s kartami a maticemi', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Role & oprávnění' }));

    // Hlavní bloky
    expect(
      screen.getByRole('heading', { level: 2, name: /Globální role/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /Role ve světech/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hierarchie a omezení adminů/)).toBeInTheDocument();

    // Globální karty: Superadmin, Admin, 3× Správce, Ikaros (6 karet)
    expect(screen.getAllByText(/Superadmin/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Správce diskuzí').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Správce článků').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Správce galerie').length).toBeGreaterThan(0);

    // World karty — Pomocný PJ + nově Čtenář a Žadatel
    expect(screen.getAllByText(/Pomocný PJ/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Čtenář/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Žadatel/).length).toBeGreaterThan(0);

    // Matice — typické řádky oprávnění z obou matic
    expect(screen.getByText('Schvalování diskuzí')).toBeInTheDocument();
    expect(screen.getByText('Systémová nastavení')).toBeInTheDocument();
    expect(screen.getByText('Vytváření obsahu')).toBeInTheDocument();
    expect(screen.getByText('Nastavení světa')).toBeInTheDocument();

    // 2 matice oprávnění (aria-label)
    expect(
      screen.getByRole('table', { name: /Matice oprávnění globálních rolí/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /Matice oprávnění světových rolí/ }),
    ).toBeInTheDocument();
  });

  it('klik na „FAQ" → render details s otázkou o přezdívce', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'FAQ' }));
    expect(
      screen.getByText(/Jak si změním přezdívku\?/),
    ).toBeInTheDocument();
  });

  it('?sekce=role v URL → tab Role aktivní rovnou po načtení', () => {
    renderHelp('/ikaros/napoveda?sekce=role');
    const tab = screen.getByRole('tab', { name: 'Role & oprávnění' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('neznámé ?sekce=xyz → fallback na „Začni tady"', () => {
    renderHelp('/ikaros/napoveda?sekce=neznama');
    const tab = screen.getByRole('tab', { name: 'Začni tady' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('klik zpět na „Začni tady" → URL bez parametru sekce', () => {
    renderHelp('/ikaros/napoveda?sekce=faq');
    fireEvent.click(screen.getByRole('tab', { name: 'Začni tady' }));
    expect(screen.getByTestId('probe-search').textContent).toBe('');
  });

  it('parseTab: neznámý input fallback na start; známý projde', () => {
    expect(parseTab(null)).toBe('start');
    expect(parseTab('')).toBe('start');
    expect(parseTab('xyz')).toBe('start');
    expect(parseTab('faq')).toBe('faq');
    expect(parseTab('role')).toBe('role');
  });
});
