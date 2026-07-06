import { useState } from 'react';
import { toast } from 'sonner';
import { Button, ConfirmDialog } from '@/shared/ui';
import type { World } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useUpdateWorld } from '@/features/world/api/useUpdateWorld';
import { PillChips } from '@/features/ikaros/pages/CreateWorldPage/components/PillChips';
import sec from '@/features/ikaros/pages/CreateWorldPage/components/sections.module.css';
import { SettingsPanel } from '../components/SettingsPanel';

const OPTIONS: {
  id: World['accessMode'];
  label: string;
  description: string;
}[] = [
  {
    id: 'public',
    label: 'Veřejný',
    description:
      'Kdokoli svět vidí a může do něj rovnou vstoupit (role Čtenář), bez schvalování.',
  },
  {
    id: 'open',
    label: 'Veřejný se schválením',
    description:
      'Kdokoli svět vidí, ale vstup vyžaduje žádost — PJ ji potvrdí nebo zamítne.',
  },
  {
    id: 'private',
    label: 'Soukromý',
    description:
      'Svět vidí jen členové a žadatelé. Vstup přes žádost schválenou PJ.',
  },
  {
    id: 'closed',
    label: 'Uzavřený',
    description:
      'Svět je zamčený — nikdo nový nevstoupí, ani žádostí. Stávající členové zůstávají.',
  },
];

/**
 * 5.3b — přepínač přístupového režimu světa. Přechod na „Uzavřený" je
 * potvrzen dialogem (citelná změna join flow).
 */
export default function AccessModeTab() {
  const { world } = useWorldContext();
  const mutation = useUpdateWorld(world?.id ?? '');
  const [mode, setMode] = useState<World['accessMode']>(
    world?.accessMode ?? 'private',
  );
  // FIX-5 — bez resyncu zůstane `mode` na hodnotě z prvního mountu; když
  // accessMode změní jiný PJ (nebo tenhle tab zůstane otevřený dlouho),
  // další „Uložit" tady tiše přepíše jeho změnu. Vzor MapDefaultsTab.
  const [prevAccessMode, setPrevAccessMode] = useState(world?.accessMode);
  if (world && world.accessMode !== prevAccessMode) {
    setPrevAccessMode(world.accessMode);
    setMode(world.accessMode);
  }
  const [confirmClosed, setConfirmClosed] = useState(false);

  if (!world) return null;

  const current = OPTIONS.find((o) => o.id === mode);
  const dirty = mode !== world.accessMode;

  async function save(next: World['accessMode']) {
    try {
      await mutation.mutateAsync({ accessMode: next });
      toast.success('Přístupový režim uložen.');
    } catch {
      toast.error('Uložení selhalo. Zkus to znovu.');
    }
  }

  function handleSave() {
    if (mode === 'closed' && world!.accessMode !== 'closed') {
      setConfirmClosed(true);
      return;
    }
    void save(mode);
  }

  return (
    <SettingsPanel
      title="Přístupový režim"
      description="Kdo svět vidí a jak se do něj dostane."
      action={
        <Button
          type="button"
          onClick={handleSave}
          loading={mutation.isPending}
          disabled={!dirty}
        >
          Uložit
        </Button>
      }
    >
      <PillChips
        options={OPTIONS.map((o) => o.label)}
        value={current ? [current.label] : []}
        onChange={(next) => {
          const picked = next[next.length - 1] ?? current?.label;
          const found = OPTIONS.find((o) => o.label === picked);
          if (found) setMode(found.id);
        }}
        ariaLabel="Přístupový režim"
      />
      {current && (
        <div className={sec.accessOption}>
          <p className={sec.accessDescription}>{current.description}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmClosed}
        onClose={() => setConfirmClosed(false)}
        title="Uzavřít svět?"
        message="Uzavřený svět nepřijme žádné nové členy ani žádosti o vstup. Stávající členové zůstávají. Režim lze kdykoli změnit zpět."
        confirmLabel="Uzavřít svět"
        confirmVariant="danger"
        isPending={mutation.isPending}
        onConfirm={async () => {
          await save('closed');
          setConfirmClosed(false);
        }}
      />
    </SettingsPanel>
  );
}
