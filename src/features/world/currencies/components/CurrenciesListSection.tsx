import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/Button/Button';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog/ConfirmDialog';
import type { WorldCurrencyItem } from '../types';
import { useUpdateCurrencies } from '../api';
import { CurrencyRow } from './CurrencyRow';
import { CurrencyFormModal } from './CurrencyFormModal';
import { SetAsBaseModal } from './SetAsBaseModal';
import s from './CurrenciesListSection.module.css';

interface CurrenciesListSectionProps {
  worldId: string;
  items: WorldCurrencyItem[];
  canEdit: boolean;
  canAddOrDelete: boolean;
}

/**
 * Spec 11.4 §4.3 — sekce „Měny ve světě".
 *
 * - Hráč (canEdit=false, canAddOrDelete=false): read-only tabulka
 * - PomocnyPJ (canEdit=true, canAddOrDelete=false): Upravit + Nastavit jako základ
 * - PJ+/Admin (canEdit=true, canAddOrDelete=true): vše navíc Smazat a + Přidat měnu
 */
export function CurrenciesListSection({
  worldId,
  items,
  canEdit,
  canAddOrDelete,
}: CurrenciesListSectionProps) {
  const [formState, setFormState] = useState<
    | { mode: 'add' }
    | { mode: 'edit'; item: WorldCurrencyItem }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<WorldCurrencyItem | null>(
    null,
  );
  const [setBaseTarget, setSetBaseTarget] = useState<WorldCurrencyItem | null>(
    null,
  );
  const updateMutation = useUpdateCurrencies(worldId);

  const baseCode = items[0]?.code;

  function handleDelete() {
    if (!deleteTarget) return;
    const nextItems = items.filter((i) => i.code !== deleteTarget.code);
    updateMutation.mutate(
      { items: nextItems },
      {
        onSuccess: () => {
          toast.success(`Měna „${deleteTarget.name}" smazána.`);
          setDeleteTarget(null);
        },
        onError: () => {
          toast.error('Smazání selhalo. Zkus to znovu.');
        },
      },
    );
  }

  if (items.length === 0) {
    return (
      <section className={s.section} aria-labelledby="currencies-h">
        <h2 id="currencies-h" className={s.heading}>
          Měny ve světě
        </h2>
        {canAddOrDelete ? (
          <div className={s.emptyState}>
            <p>Tento svět zatím nemá žádné měny.</p>
            <Button onClick={() => setFormState({ mode: 'add' })}>
              + Přidat první měnu
            </Button>
          </div>
        ) : (
          <p className={s.emptyState}>
            Tento svět zatím nemá měny. Kontaktuj PJ.
          </p>
        )}

        {formState?.mode === 'add' && (
          <CurrencyFormModal
            worldId={worldId}
            items={items}
            mode="add"
            onClose={() => setFormState(null)}
          />
        )}
      </section>
    );
  }

  return (
    <section className={s.section} aria-labelledby="currencies-h">
      <div className={s.header}>
        <h2 id="currencies-h" className={s.heading}>
          Měny ve světě
        </h2>
        {canAddOrDelete && (
          <Button onClick={() => setFormState({ mode: 'add' })} size="sm">
            + Přidat měnu
          </Button>
        )}
      </div>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th className={s.thCode}>Kód</th>
              <th className={s.thName}>Název</th>
              <th className={s.thSymbol}>Symbol</th>
              <th className={s.thRate}>Kurz</th>
              <th className={s.thActions} aria-label="Akce" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <CurrencyRow
                key={item.code}
                item={item}
                isBase={item.code === baseCode}
                canEdit={canEdit}
                canAddOrDelete={canAddOrDelete}
                onEdit={(i) => setFormState({ mode: 'edit', item: i })}
                onDelete={(i) => setDeleteTarget(i)}
                onSetAsBase={(i) => setSetBaseTarget(i)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {formState && (
        <CurrencyFormModal
          worldId={worldId}
          items={items}
          mode={formState.mode}
          initial={formState.mode === 'edit' ? formState.item : undefined}
          onClose={() => setFormState(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title="Smazat měnu?"
          message={
            <>
              Opravdu smazat měnu <strong>{deleteTarget.name}</strong> (
              <code>{deleteTarget.code}</code>)?
              <br />
              Tato akce ovlivní všechny obchody / postavy, které tuto měnu
              používají.
            </>
          }
          confirmLabel="Smazat"
          confirmVariant="danger"
          onConfirm={handleDelete}
          isPending={updateMutation.isPending}
        />
      )}

      {setBaseTarget && (
        <SetAsBaseModal
          worldId={worldId}
          items={items}
          target={setBaseTarget}
          onClose={() => setSetBaseTarget(null)}
        />
      )}
    </section>
  );
}
