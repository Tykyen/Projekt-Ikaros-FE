/**
 * 21.5b — návrh / kurátorská úprava pravidlové verze lektvaru.
 * Vzor: ProposeSpellStatblockModal (21.5c); pole + CSS reuse z kouzel.
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { SpellStatsFields } from '../../kouzla/components/SpellStatsFields';
import { useLektvaryMutations } from '../hooks/useLektvaryMutations';
import {
  POTION_SYSTEM_TEMPLATES,
  getPotionTemplate,
  potionSystemLabel,
  validatePotionStats,
} from '../systems/potionTemplates';
import type { GlobalPotion } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  potion: GlobalPotion;
  /** Když je uvedeno, jde o kurátorskou úpravu existujícího statbloku. */
  editSystemId?: string;
  onClose: () => void;
  onSaved?: (p: GlobalPotion) => void;
}

export function ProposePotionStatblockModal({
  potion,
  editSystemId,
  onClose,
  onSaved,
}: Props) {
  const { propose } = useLektvaryMutations();
  const isEdit = !!editSystemId;
  const existing = Object.keys(potion.statblocks ?? {});
  const available = POTION_SYSTEM_TEMPLATES.filter(
    (t) => !existing.includes(t.id),
  );

  const [systemId, setSystemId] = useState(
    editSystemId ?? available[0]?.id ?? 'generic',
  );
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>(() =>
    editSystemId
      ? { ...(potion.statblocks?.[editSystemId]?.systemStats ?? {}) }
      : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const template = useMemo(() => getPotionTemplate(systemId), [systemId]);

  const submit = () => {
    setFormError('');
    const errs = validatePotionStats(template, systemStats);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError('Vyplň povinná pole statbloku.');
      return;
    }
    propose.mutate(
      { id: potion.id, payload: { systemId, systemStats } },
      {
        onSuccess: (p) => {
          onSaved?.(p);
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
      <Button variant="primary" loading={propose.isPending} onClick={submit}>
        {isEdit ? 'Uložit statblok' : 'Navrhnout statblok'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Upravit statblok' : 'Navrhnout pravidlovou verzi'}
      size="lg"
      footer={footer}
    >
      <p className={s.hint}>
        {isEdit
          ? 'Kurátorská úprava — změna se uloží rovnou a nahradí statblok této pravidlové verze (stav i autor zůstávají).'
          : 'Navrhni verzi lektvaru pro další herní systém (výroba + mechanika). Uloží se jako návrh a komunita ho vyladí v diskusi, než ho kurátor schválí jako balancnutý.'}
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="ppb-system">
          Herní systém
        </label>
        {isEdit ? (
          <div className={s.input} aria-readonly="true">
            {potionSystemLabel(systemId)}
          </div>
        ) : (
          <select
            id="ppb-system"
            className={s.select}
            value={systemId}
            onChange={(e) => {
              setSystemId(e.target.value);
              setSystemStats({});
              setErrors({});
            }}
          >
            {available.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <SpellStatsFields
        template={template}
        value={systemStats}
        onChange={setSystemStats}
        errors={errors}
      />

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
