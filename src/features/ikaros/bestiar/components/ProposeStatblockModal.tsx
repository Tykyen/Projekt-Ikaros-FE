/**
 * 16.2b-2 — návrh / úprava pravidlové verze statů.
 * - Bez `editSystemId` = návrh nového statbloku pro systém, který bytost nemá
 *   (uloží se jako draft, §2a; kurátor ho pak schválí).
 * - S `editSystemId` = kurátorská úprava už existujícího statbloku (draft i
 *   approved). Systém je zamčený, staty se předvyplní. BE `POST …/statblock` je
 *   upsert a existující verzi přepíše jen kurátorovi (zachová status/autora).
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { EntitySchemaForm } from '@/features/world/tactical-map/components/schema-form/EntitySchemaForm';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { validateForCreate } from '@/features/world/tactical-map/utils/validateSystemStats';
import { resolveSystemId } from '@/features/world/systemId';
import { useKomunitniBestiarMutations } from '../hooks/useKomunitniBestiarMutations';
import { BESTIE_SYSTEMS, systemLabel } from './systems';
import type { GlobalBestie } from '../types';
import s from './KomunitniBestiarForms.module.css';

interface Props {
  bestie: GlobalBestie;
  /** Když je uvedeno, jde o kurátorskou úpravu existujícího statbloku. */
  editSystemId?: string;
  onClose: () => void;
  onSaved?: (b: GlobalBestie) => void;
}

export function ProposeStatblockModal({
  bestie,
  editSystemId,
  onClose,
  onSaved,
}: Props) {
  const { propose } = useKomunitniBestiarMutations();
  const isEdit = !!editSystemId;
  const existing = Object.keys(bestie.statblocks ?? {});
  const available = BESTIE_SYSTEMS.filter((sy) => !existing.includes(sy.id));

  const [systemId, setSystemId] = useState(
    editSystemId ?? available[0]?.id ?? 'generic',
  );
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>(() =>
    editSystemId
      ? { ...(bestie.statblocks?.[editSystemId]?.systemStats ?? {}) }
      : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const schema = useMemo(
    () => systemEntitySchemaRegistry.get(resolveSystemId(systemId), 'bestie'),
    [systemId],
  );

  const submit = () => {
    setFormError('');
    if (!schema) {
      setFormError('Pro tento systém není schéma statů.');
      return;
    }
    const v = validateForCreate(systemStats, schema);
    if (!v.valid) {
      setErrors(v.errors);
      setFormError('Zkontroluj vyplněné staty.');
      return;
    }
    propose.mutate(
      { id: bestie.id, payload: { systemId, systemStats: v.filled } },
      { onSuccess: (b) => { onSaved?.(b); onClose(); } },
    );
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button variant="primary" loading={propose.isPending} onClick={submit}>
        {isEdit ? 'Uložit staty' : 'Navrhnout staty'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Upravit staty' : 'Navrhnout pravidlovou verzi'}
      size="lg"
      footer={footer}
    >
      <p className={s.hint}>
        {isEdit
          ? 'Kurátorská úprava — změna se uloží rovnou a nahradí staty této pravidlové verze (stav i autor zůstávají).'
          : 'Navrhni staty pro další herní systém. Uloží se jako návrh a komunita ho vyladí v diskusi, než ho kurátor schválí.'}
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="ps-system">
          Herní systém
        </label>
        {isEdit ? (
          <div className={s.input} aria-readonly="true">
            {systemLabel(systemId)}
          </div>
        ) : (
          <select
            id="ps-system"
            className={s.select}
            value={systemId}
            onChange={(e) => {
              setSystemId(e.target.value);
              setSystemStats({});
              setErrors({});
            }}
          >
            {available.map((sy) => (
              <option key={sy.id} value={sy.id}>
                {sy.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {schema ? (
        <EntitySchemaForm
          schema={schema}
          value={systemStats}
          onChange={setSystemStats}
          errors={errors}
        />
      ) : (
        <p className={s.hint}>Pro tento systém zatím není schéma statů.</p>
      )}

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
