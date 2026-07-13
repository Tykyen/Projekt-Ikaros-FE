/**
 * 21.5e — návrh / kurátorská úprava pravidlové verze předmětu. Varianta polí
 * se odvozuje z druhu předmětu v jádru (spec R1). Vzor:
 * ProposePotionStatblockModal (21.5b); pole + CSS reuse z kouzel.
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { SpellStatsFields } from '../../kouzla/components/SpellStatsFields';
import { usePredmetyMutations } from '../hooks/usePredmetyMutations';
import {
  ITEM_SYSTEM_TEMPLATES,
  getItemTemplate,
  itemSystemLabel,
  validateItemStats,
} from '../systems/itemTemplates';
import type { GlobalItem } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  item: GlobalItem;
  /** Když je uvedeno, jde o kurátorskou úpravu existujícího statbloku. */
  editSystemId?: string;
  onClose: () => void;
  onSaved?: (it: GlobalItem) => void;
}

export function ProposeItemStatblockModal({
  item,
  editSystemId,
  onClose,
  onSaved,
}: Props) {
  const { propose } = usePredmetyMutations();
  const isEdit = !!editSystemId;
  const existing = Object.keys(item.statblocks ?? {});
  const available = ITEM_SYSTEM_TEMPLATES.filter(
    (t) => !existing.includes(t.id),
  );

  const [systemId, setSystemId] = useState(
    editSystemId ?? available[0]?.id ?? 'generic',
  );
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>(() =>
    editSystemId
      ? { ...(item.statblocks?.[editSystemId]?.systemStats ?? {}) }
      : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const template = useMemo(
    () => getItemTemplate(systemId, item.kind),
    [systemId, item.kind],
  );

  const submit = () => {
    setFormError('');
    const errs = validateItemStats(template, systemStats);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError('Vyplň povinná pole statbloku.');
      return;
    }
    propose.mutate(
      { id: item.id, payload: { systemId, systemStats } },
      {
        onSuccess: (it) => {
          onSaved?.(it);
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
          : `Navrhni verzi předmětu pro další herní systém (pole dle druhu „${item.kind}"). Uloží se jako návrh a komunita ho vyladí v diskusi, než ho kurátor schválí jako balancnutý.`}
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="pib-system">
          Herní systém
        </label>
        {isEdit ? (
          <div className={s.input} aria-readonly="true">
            {itemSystemLabel(systemId)}
          </div>
        ) : (
          <select
            id="pib-system"
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
