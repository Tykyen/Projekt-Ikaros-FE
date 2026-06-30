import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DrdhSheet } from '../DrdhSheet';
import type { CharacterDiary } from '../../../../../api/characters.types';

function makeDiary(
  customData: Record<string, unknown> = {},
): CharacterDiary {
  return {
    id: 'd1',
    characterId: 'c1',
    worldId: 'w1',
    sections: [],
    customData,
  };
}

const commonProps = {
  worldId: 'w1',
  worldSlug: 'testw',
  characterSlug: 'aragorn',
};

describe('DrdhSheet (16b — prototyp parity)', () => {
  it('vyrenderuje 5 atributů (Síla, Obratnost, Odolnost, Inteligence, Charisma)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    ['Síla', 'Obratnost', 'Odolnost', 'Inteligence', 'Charisma'].forEach(
      (l) => {
        expect(screen.getByText(l)).toBeInTheDocument();
      },
    );
  });

  it('oprava atributu je auto = ⌊stupeň/2⌋ − 5 (read-only)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_attr_str: '16' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // 16 → ⌊16/2⌋−5 = 3
    const mod = screen.getByLabelText('Síla oprava') as HTMLInputElement;
    expect(mod.value).toBe('+3');
    expect(mod).toHaveAttribute('readonly');
  });

  it('default profession je Válečník + ukáže Válečníkovy triky + Adrenalin track', () => {
    const { container } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Válečníkovy triky')).toBeInTheDocument();
    // erb banner = Válečník
    expect(container.querySelector('.erb-banner')!.textContent).toContain(
      'Válečník',
    );
    // adrenalin track má 20 buněk
    expect(container.querySelectorAll('.adr-cell')).toHaveLength(20);
  });

  it('erb popover přepne povolání přes onChange(drdh_profession_id)', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTitle('Klikni pro výběr povolání'));
    fireEvent.click(screen.getByRole('option', { name: /Hraničář/ }));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { drdh_profession_id: 'hranicar' },
    });
  });

  it('hraničář ukazuje Duševní sílu + Hraničářova kouzla', () => {
    const { container } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_profession_id: 'hranicar' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const resBox = container.querySelector('.mega.resource');
    expect(resBox!.textContent).toContain('Duševní síla');
    expect(screen.getByText('Hraničářova kouzla')).toBeInTheDocument();
  });

  it('alchymista má dva sekundární zdroje (Mana + Suroviny)', () => {
    const { container } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_profession_id: 'alchymista' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    const resBox = container.querySelector('.mega.resource')!;
    expect(within(resBox as HTMLElement).getByText('Mana')).toBeInTheDocument();
    expect(
      within(resBox as HTMLElement).getByText('Suroviny'),
    ).toBeInTheDocument();
    expect(screen.getByText('Alchymistovy recepty')).toBeInTheDocument();
  });

  it('zloděj má kostýmy jako seznam (žádný číselný zdroj)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({
          drdh_profession_id: 'zlodej',
          drdh_costumes: JSON.stringify(['Žebrák']),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByText('+ Přidat kostým'),
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText('Kostým 1') as HTMLInputElement).value,
    ).toBe('Žebrák');
  });

  it('klerik má 3 denní checkboxy (Ráno/Odpoledne/Večer)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_profession_id: 'klerik' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Ráno')).toBeInTheDocument();
    expect(screen.getByLabelText('Odpoledne')).toBeInTheDocument();
    expect(screen.getByLabelText('Večer')).toBeInTheDocument();
  });

  it('hranice smrti se auto počítá = −(10 + oprava ODO)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_attr_con: '14' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // 14 → ⌊14/2⌋−5 = 2 → hranice = −(10+2) = −12
    const death = screen.getByLabelText('Hranice smrti') as HTMLInputElement;
    expect(death.value).toBe('-12');
  });

  it('specializace je zamčená dokud úroveň < 6', () => {
    const { rerender } = render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_lvl: '4' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Specializace')).toBeDisabled();
    rerender(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({ drdh_lvl: '6' })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    expect(screen.getByLabelText('Specializace')).not.toBeDisabled();
  });

  it('view mode disabluje inputy a skryje add/del tlačítka', () => {
    render(<DrdhSheet {...commonProps} diary={makeDiary()} mode="view" />);
    expect(screen.getByLabelText('Maximum životů')).toBeDisabled();
    expect(screen.queryByText('+ Přidat zbraň')).not.toBeInTheDocument();
    expect(screen.queryByText('+ Přidat trik')).not.toBeInTheDocument();
  });

  it('+ Přidat zbraň přidá prázdnou položku do drdh_weapons (kind=melee, bez uc/oc)', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbraň'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drdh_weapons: JSON.stringify([
          { name: '', kind: 'melee', atk: '', dmg: '', def: '' },
        ]),
      },
    });
  });

  it('zbraně tabulka: typ select (blízko / dálka) + útočnost/zranění/obrana, žádné ÚČ/OČ', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({
          drdh_weapons: JSON.stringify([
            { name: 'Luk', kind: 'ranged', atk: '5', dmg: '+1', def: '0' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // scope na tabulku zbraní (přes typ select konkrétní zbraně)
    const typeSel = screen.getByLabelText('Zbraň 1 — typ') as HTMLSelectElement;
    const weaponTable = typeSel.closest('table') as HTMLTableElement;
    const tbl = within(weaponTable);
    // hlavičky 5 sloupců (bez ÚČ/OČ)
    ['Název', 'Typ', 'Útočnost', 'Zranění', 'Obrana'].forEach((h) =>
      expect(tbl.getByRole('columnheader', { name: h })).toBeInTheDocument(),
    );
    expect(
      tbl.queryByRole('columnheader', { name: 'ÚČ' }),
    ).not.toBeInTheDocument();
    expect(
      tbl.queryByRole('columnheader', { name: 'OČ' }),
    ).not.toBeInTheDocument();
    // typ select drží uloženou hodnotu + obě možnosti
    expect(typeSel.value).toBe('ranged');
    expect(
      within(typeSel).getByRole('option', { name: 'blízko' }),
    ).toBeInTheDocument();
    expect(
      within(typeSel).getByRole('option', { name: 'dálka' }),
    ).toBeInTheDocument();
    // jen čísla, žádný výpočet
    expect(
      (screen.getByLabelText('Zbraň 1 — atk') as HTMLInputElement).value,
    ).toBe('5');
    expect(
      (screen.getByLabelText('Zbraň 1 — def') as HTMLInputElement).value,
    ).toBe('0');
    // žádné uc/oc input pole
    expect(screen.queryByLabelText('Zbraň 1 — uc')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Zbraň 1 — oc')).not.toBeInTheDocument();
  });

  it('zbraně BC: starý záznam s uc/oc + bez kind se načte jako blízko a uc/oc se ignoruje', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({
          drdh_weapons: JSON.stringify([
            { name: 'Meč', atk: '4', dmg: '+1', def: '2', uc: '7', oc: '5' },
          ]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // chybějící kind → default melee
    expect(
      (screen.getByLabelText('Zbraň 1 — typ') as HTMLSelectElement).value,
    ).toBe('melee');
    // čteme jen atk/def, uc/oc se nikde nezobrazí jako pole
    expect(screen.queryByLabelText('Zbraň 1 — uc')).not.toBeInTheDocument();
  });

  it('+ Přidat zbroj / štít přidá řádek s polem zo', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat zbroj / štít'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drdh_armors: JSON.stringify([
          { name: '', quality: '', zo: '', note: '' },
        ]),
      },
    });
  });

  it('+ Přidat trik (válečník) přidá row se sloupci name/adr/use/req/check/note', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat trik'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drdh_w_triky: JSON.stringify([
          { name: '', adr: '', use: '', req: '', check: '', note: '' },
        ]),
      },
    });
  });

  it('dovednost: součet = oprava atributu + stupeň (auto, read-only)', () => {
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary({
          drdh_attr_dex: '12', // ⌊12/2⌋−5 = 1
          drdh_skills: JSON.stringify([{ name: 'Plížení', attr: 'Obr', deg: '3' }]),
        })}
        mode="edit"
        onChange={() => {}}
      />,
    );
    // součet = 1 + 3 = +4
    const sum = screen.getByLabelText('Dovednost 1 — součet') as HTMLInputElement;
    expect(sum.value).toBe('+4');
    expect(sum).toHaveAttribute('readonly');
  });

  it('+ Přidat dovednost přidá row s polem attr', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat dovednost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drdh_skills: JSON.stringify([{ name: '', attr: 'Obr', deg: '' }]),
      },
    });
  });

  it('+ Přidat schopnost přidá row do drdh_abilities', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByText('+ Přidat schopnost'));
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: {
        drdh_abilities: JSON.stringify([{ name: '', desc: '' }]),
      },
    });
  });

  it('změna jména volá onChange s drdh_name klíčem', () => {
    const onChange = vi.fn();
    render(
      <DrdhSheet
        {...commonProps}
        diary={makeDiary()}
        mode="edit"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Jméno'), {
      target: { value: 'Aragorn' },
    });
    expect(onChange).toHaveBeenCalledWith({
      customDataPatch: { drdh_name: 'Aragorn' },
    });
  });
});
