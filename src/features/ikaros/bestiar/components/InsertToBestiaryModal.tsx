/**
 * 16.2b-2 — „Vlož do mého bestiáře": klon zvolené pravidlové verze globální
 * bytosti do Můj (user) NEBO konkrétního světa (world). Nabízí jen světy, kde
 * jsi PomocnyPJ+ a jejichž systém sedí na vkládanou pravidlovou verzi.
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { WorldRole } from '@/shared/types';
import { resolveSystemId } from '@/features/world/systemId';
import { useKomunitniBestiarMutations } from '../hooks/useKomunitniBestiarMutations';
import { systemLabel } from './systems';
import type { GlobalBestie } from '../types';
import s from './KomunitniBestiarForms.module.css';

interface Props {
  bestie: GlobalBestie;
  /** Kterou pravidlovou verzi (systemId) vkládáš (aktivní záložka). */
  systemId: string;
  onClose: () => void;
  onInserted?: (targetLabel: string) => void;
}

export function InsertToBestiaryModal({
  bestie,
  systemId,
  onClose,
  onInserted,
}: Props) {
  const {
    data: myWorlds,
    isError: worldsError,
    refetch: refetchWorlds,
  } = useMyWorlds();
  const { clone } = useKomunitniBestiarMutations();
  const sys = resolveSystemId(systemId);

  const worldTargets = (myWorlds ?? []).filter(
    (e) =>
      e.membership.role >= WorldRole.PomocnyPJ &&
      resolveSystemId(e.world.system) === sys,
  );

  const [target, setTarget] = useState('user'); // 'user' | worldId
  const [newName, setNewName] = useState(bestie.name);

  const submit = () => {
    const isWorld = target !== 'user';
    clone.mutate(
      {
        id: bestie.id,
        payload: {
          scope: isWorld ? 'world' : 'user',
          systemId,
          worldId: isWorld ? target : undefined,
          newName: newName.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          const label = isWorld
            ? (worldTargets.find((w) => w.world.id === target)?.world.name ??
              'svět')
            : 'Můj bestiář';
          onInserted?.(label);
          onClose();
        },
      },
    );
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button variant="primary" loading={clone.isPending} onClick={submit}>
        Vložit
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title="Vlož do mého bestiáře"
      size="sm"
      footer={footer}
    >
      <p className={s.hint}>
        Vloží se pravidlová verze <b>{systemLabel(systemId)}</b> jako nezávislá
        kopie (snapshot).
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="insert-target">
          Kam vložit
        </label>
        <select
          id="insert-target"
          className={s.select}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          <option value="user">Můj bestiář (osobní, napříč světy)</option>
          {worldTargets.map((e) => (
            <option key={e.world.id} value={e.world.id}>
              Svět: {e.world.name}
            </option>
          ))}
        </select>
      </div>

      {worldsError ? (
        // `myWorlds` je undefined i při chybě → bez tohohle by „žádný svět"
        // tvrdilo, že nemáš svět daného systému, i když se jen nenačetl seznam.
        <p className={s.hint}>
          Seznam tvých světů se teď nepodařilo načíst — vložit do osobního můžeš
          i tak.{' '}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetchWorlds()}
          >
            Zkusit znovu
          </Button>
        </p>
      ) : worldTargets.length === 0 ? (
        <p className={s.hint}>
          Žádný tvůj svět neběží na systému {systemLabel(systemId)} — vlož zatím
          do osobního.
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="insert-name">
          Název
        </label>
        <input
          id="insert-name"
          className={s.input}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          maxLength={100}
        />
      </div>

      {clone.isError ? (
        <p className={s.err}>Vložení se nepodařilo. Zkus to prosím znovu.</p>
      ) : null}
    </Modal>
  );
}
