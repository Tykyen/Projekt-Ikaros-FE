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
  it('vykreslí 6 tlačítek tabů s českými popisky', () => {
    renderHelp();
    expect(screen.getByRole('tab', { name: 'Začni tady' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Platforma' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Svět' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Role & oprávnění' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Účet & profil' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'FAQ' })).toBeInTheDocument();
    expect(HELP_TABS).toHaveLength(6);
  });

  it('default (bez ?sekce=) → tab „Začni tady" aktivní + intro', () => {
    renderHelp();
    const tab = screen.getByRole('tab', { name: 'Začni tady' });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/Co je Projekt Ikaros/i)).toBeInTheDocument();
  });

  it('klik na „Platforma" → URL ?sekce=platforma + obsah nástrojů', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Platforma' }));
    expect(screen.getByTestId('probe-search').textContent).toBe('?sekce=platforma');
    expect(screen.getByText(/Hospoda \(globální chat\)/)).toBeInTheDocument();
  });

  it('klik na „Svět" → URL ?sekce=svet + taktická mapa', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Svět' }));
    expect(screen.getByTestId('probe-search').textContent).toBe('?sekce=svet');
    expect(screen.getAllByText(/Taktická mapa/).length).toBeGreaterThan(0);
  });

  it('klik na „Role & oprávnění" → collapsible skupiny + matice', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Role & oprávnění' }));

    // Dvě collapsible skupiny (HelpAccordion summary)
    expect(screen.getByText('Globální role')).toBeInTheDocument();
    expect(screen.getByText('Světové role')).toBeInTheDocument();

    // Role karty
    expect(screen.getAllByText(/Superadmin/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pomocný PJ/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Čtenář/).length).toBeGreaterThan(0);

    // Matice oprávnění (aria-label)
    expect(
      screen.getByRole('table', { name: /Matice oprávnění globálních rolí/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /Matice oprávnění světových rolí/ }),
    ).toBeInTheDocument();
  });

  it('klik na „Účet & profil" → harmonika sekcí', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'Účet & profil' }));
    expect(screen.getByText('Smazání účtu (tombstone)')).toBeInTheDocument();
    expect(screen.getByText('Heslo & reset')).toBeInTheDocument();
  });

  it('klik na „FAQ" → kategorie + otázka o přezdívce', () => {
    renderHelp();
    fireEvent.click(screen.getByRole('tab', { name: 'FAQ' }));
    expect(screen.getByText(/Jak si změním přezdívku\?/)).toBeInTheDocument();
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

  it('parseTab: neznámý input fallback na start; známé projdou', () => {
    expect(parseTab(null)).toBe('start');
    expect(parseTab('')).toBe('start');
    expect(parseTab('xyz')).toBe('start');
    expect(parseTab('faq')).toBe('faq');
    expect(parseTab('svet')).toBe('svet');
    expect(parseTab('platforma')).toBe('platforma');
  });
});
