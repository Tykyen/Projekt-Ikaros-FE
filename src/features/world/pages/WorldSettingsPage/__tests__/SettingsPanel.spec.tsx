import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPanel } from '../components/SettingsPanel';

/**
 * Regrese k tiché ztrátě nastavení světa (D-SEC-GAP, „FE vzor prázdný stav
 * místo chyby"). Taby normalizují data přes `normalize(q.data?.x)`, což na
 * chybové cestě vrátí hardcoded defaulty. Dokud panel neuměl `isError`,
 * vykreslil se formulář s defaulty jako by byly uložené a „Uložit" je zapsal
 * přes reálná data v DB.
 *
 * Proto se testuje PANEL, ne jednotlivé taby: kontrakt „při chybě nepouštěj
 * formulář ven" má platit pro všechny (i budoucí) taby naráz.
 */

const FORM = <div>obsah formuláře</div>;

describe('SettingsPanel — stavy dotazu', () => {
  it('bez `query` vykreslí obsah (taby, co nečtou data, fungují beze změny)', () => {
    render(<SettingsPanel title="T">{FORM}</SettingsPanel>);
    expect(screen.getByText('obsah formuláře')).toBeTruthy();
  });

  it('při chybě NEVYKRESLÍ obsah — jinak by „Uložit" přepsal data defaulty', () => {
    render(
      <SettingsPanel
        title="T"
        query={{ isLoading: false, isError: true }}
        action={<button>Uložit</button>}
      >
        {FORM}
      </SettingsPanel>,
    );
    expect(screen.queryByText('obsah formuláře')).toBeNull();
    // Akce (Uložit) nesmí zůstat dostupná nad nenačtenými daty.
    expect(screen.queryByRole('button', { name: 'Uložit' })).toBeNull();
    expect(screen.getByText('Nastavení se nepodařilo načíst')).toBeTruthy();
  });

  it('při chybě nabídne retry a zavolá refetch', async () => {
    const refetch = vi.fn();
    render(
      <SettingsPanel
        title="T"
        query={{ isLoading: false, isError: true, refetch }}
      >
        {FORM}
      </SettingsPanel>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Zkusit znovu/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('při načítání nevykreslí obsah ani akci', () => {
    render(
      <SettingsPanel
        title="T"
        query={{ isLoading: true, isError: false }}
        action={<button>Uložit</button>}
      >
        {FORM}
      </SettingsPanel>,
    );
    expect(screen.queryByText('obsah formuláře')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Uložit' })).toBeNull();
  });

  it('po úspěšném načtení pustí obsah i akci', () => {
    render(
      <SettingsPanel
        title="T"
        query={{ isLoading: false, isError: false }}
        action={<button>Uložit</button>}
      >
        {FORM}
      </SettingsPanel>,
    );
    expect(screen.getByText('obsah formuláře')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Uložit' })).toBeTruthy();
  });
});
