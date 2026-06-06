import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock registru médií — deterministické klíče: jeden se src, jeden bez.
vi.mock('../../media', () => ({
  HELP_MEDIA: {
    'has.src': { src: '/help/x.png', alt: 'Snímek X', caption: 'Popisek X' },
    'no.src': { src: undefined, alt: 'Snímek Y', caption: 'Popisek Y' },
  },
}));

import { HelpAccordion, HelpSubAccordion } from '../HelpAccordion';
import { InfoCard } from '../InfoCard';
import { TagChip } from '../TagChip';
import { TermGrid } from '../TermGrid';
import { CalloutBox } from '../CalloutBox';
import { StepList } from '../StepList';
import { PermissionTable } from '../PermissionTable';
import { ScreenshotSlot } from '../ScreenshotSlot';
import { IllustrationSlot } from '../IllustrationSlot';
import type { HelpMediaKey } from '../../media';

const withSrc = 'has.src' as unknown as HelpMediaKey;
const noSrc = 'no.src' as unknown as HelpMediaKey;

describe('HelpAccordion', () => {
  it('defaultOpen → <details open>; bez něj zavřená, ale obsah je v DOM', () => {
    const { container, rerender } = render(
      <HelpAccordion title="Sekce">Tělo sekce</HelpAccordion>,
    );
    let details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('Tělo sekce')).toBeInTheDocument();

    rerender(
      <HelpAccordion title="Sekce" defaultOpen>
        Tělo sekce
      </HelpAccordion>,
    );
    details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('vykreslí titulek, tag a má klikací summary', () => {
    render(
      <HelpAccordion title="Taktická mapa" tag={<TagChip kind="pj" label="Pouze PJ" />}>
        obsah
      </HelpAccordion>,
    );
    expect(screen.getByText('Taktická mapa')).toBeInTheDocument();
    expect(screen.getByText('Pouze PJ')).toBeInTheDocument();
    // summary nesmí spadnout na kliknutí (disclosure pattern)
    const summary = screen.getByText('Taktická mapa').closest('summary');
    expect(summary).not.toBeNull();
    fireEvent.click(summary!);
  });

  it('HelpSubAccordion vykreslí titulek a obsah', () => {
    render(
      <HelpSubAccordion title="Hráčské postavy" defaultOpen>
        pohyb a HP
      </HelpSubAccordion>,
    );
    expect(screen.getByText('Hráčské postavy')).toBeInTheDocument();
    expect(screen.getByText('pohyb a HP')).toBeInTheDocument();
  });
});

describe('ScreenshotSlot', () => {
  it('se src → vykreslí <img> s alt a popisek', () => {
    render(<ScreenshotSlot media={withSrc} />);
    const img = screen.getByRole('img', { name: 'Snímek X' });
    expect(img).toHaveAttribute('src', '/help/x.png');
    expect(screen.getByText('Popisek X')).toBeInTheDocument();
  });

  it('bez src → záměrný prázdný stav s výzvou a caption', () => {
    render(<ScreenshotSlot media={noSrc} />);
    // žádný <img> element
    expect(screen.queryByRole('img', { name: 'Snímek Y' })).not.toBeNull(); // role=img na prázdném stavu
    expect(screen.getByText(/Sem doplníme snímek/)).toBeInTheDocument();
    expect(screen.getByText('Popisek Y')).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });
});

describe('IllustrationSlot', () => {
  it('se src → <img>', () => {
    const { container } = render(<IllustrationSlot media={withSrc} />);
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('bez src → nevykreslí nic', () => {
    const { container } = render(<IllustrationSlot media={noSrc} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('PermissionTable', () => {
  const columns = [
    { key: 'pj', label: 'PJ', colorVar: '--role-world-pj' },
    { key: 'player', label: 'Hráč', colorVar: '--role-world-player' },
  ];
  const rows = [
    { action: 'Prohlížení', allow: { pj: true, player: true } },
    { action: 'Spawn NPC', allow: { pj: true, player: false } },
  ];

  it('vykreslí hlavičky, řádky a ✓/— dle allow', () => {
    render(<PermissionTable columns={columns} rows={rows} caption="Test matice" />);
    expect(screen.getByRole('table', { name: 'Test matice' })).toBeInTheDocument();
    expect(screen.getByText('PJ')).toBeInTheDocument();
    expect(screen.getByText('Prohlížení')).toBeInTheDocument();
    expect(screen.getByText('Spawn NPC')).toBeInTheDocument();
    // 3× ano (Prohlížení pj+player, Spawn pj), 1× ne (Spawn player)
    expect(screen.getAllByLabelText('ano')).toHaveLength(3);
    expect(screen.getAllByLabelText('ne')).toHaveLength(1);
  });
});

describe('CalloutBox', () => {
  it('default titulky dle varianty', () => {
    render(
      <>
        <CalloutBox variant="tip">tip text</CalloutBox>
        <CalloutBox variant="pozor">pozor text</CalloutBox>
        <CalloutBox variant="priklad">priklad text</CalloutBox>
      </>,
    );
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('Pozor')).toBeInTheDocument();
    expect(screen.getByText('Příklad')).toBeInTheDocument();
    expect(screen.getByText('tip text')).toBeInTheDocument();
  });

  it('vlastní titulek přebije default', () => {
    render(<CalloutBox variant="tip" title="Vlastní">x</CalloutBox>);
    expect(screen.getByText('Vlastní')).toBeInTheDocument();
    expect(screen.queryByText('Tip')).toBeNull();
  });
});

describe('drobné bloky (smoke)', () => {
  it('TagChip vykreslí label', () => {
    render(<TagChip kind="ok" label="✅ Funguje" />);
    expect(screen.getByText('✅ Funguje')).toBeInTheDocument();
  });

  it('InfoCard vykreslí titulek a popis', () => {
    render(
      <InfoCard title="Mapa" accent="pj">
        popis nástroje
      </InfoCard>,
    );
    expect(screen.getByText('Mapa')).toBeInTheDocument();
    expect(screen.getByText('popis nástroje')).toBeInTheDocument();
  });

  it('TermGrid vykreslí pojmy i popisy', () => {
    render(
      <TermGrid
        items={[
          { term: 'HP', desc: 'životy' },
          { term: 'Iniciativa', desc: 'pořadí v boji' },
        ]}
      />,
    );
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('pořadí v boji')).toBeInTheDocument();
  });

  it('StepList vykreslí všechny kroky', () => {
    render(<StepList steps={['první', 'druhý', 'třetí']} />);
    expect(screen.getByText('první')).toBeInTheDocument();
    expect(screen.getByText('třetí')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
