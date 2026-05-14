import type { WorldAccessMode } from '@/features/world/api/useCreateWorld';
import { SectionCard } from './SectionCard';
import { PillChips } from './PillChips';
import s from './sections.module.css';

interface Props {
  value: WorldAccessMode;
  onChange: (v: WorldAccessMode) => void;
}

const OPTIONS: { id: WorldAccessMode; label: string; description: string }[] = [
  {
    id: 'private',
    label: 'Soukromý',
    description: 'Svět vidí jen členové. Vstup přes žádost (PJ schvaluje).',
  },
  {
    id: 'open',
    label: 'Otevřený',
    description:
      'Svět vidí každý, ale o vstup se žádá. PJ žádost potvrdí nebo zamítne.',
  },
  {
    id: 'public',
    label: 'Veřejný',
    description: 'Svět vidí každý a může do něj rovnou vstoupit bez schvalování.',
  },
];

const LABELS = OPTIONS.map((o) => o.label);

export function AccessModeSection({ value, onChange }: Props) {
  const current = OPTIONS.find((o) => o.id === value);

  return (
    <SectionCard
      index={4}
      title="Přístupový režim"
      description="Kdo vidí svět a jak se do něj dostane."
    >
      <PillChips
        options={LABELS}
        value={current ? [current.label] : []}
        onChange={(next) => {
          const picked = next[next.length - 1] ?? current?.label;
          const found = OPTIONS.find((o) => o.label === picked);
          if (found) onChange(found.id);
        }}
        ariaLabel="Přístupový režim"
      />
      {current && (
        <div className={s.accessOption}>
          <p className={s.accessDescription}>{current.description}</p>
        </div>
      )}
    </SectionCard>
  );
}
