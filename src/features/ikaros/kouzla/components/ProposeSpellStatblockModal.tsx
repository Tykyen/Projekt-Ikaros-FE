/**
 * 21.5c — návrh / úprava pravidlové verze kouzla.
 * - Bez `editSystemId` = návrh statbloku pro systém, který kouzlo nemá
 *   (uloží se jako draft; kurátor pak schválí = balancnuté).
 * - S `editSystemId` = kurátorská úprava existujícího statbloku (draft i
 *   approved). Systém zamčený, staty předvyplněné. BE upsert zachová
 *   status/autora. Vzor: ProposeStatblockModal (bestiář).
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useKouzlaMutations } from '../hooks/useKouzlaMutations';
import {
  SPELL_SYSTEM_TEMPLATES,
  getSpellTemplate,
  spellSystemLabel,
  validateSpellStats,
} from '../systems/spellTemplates';
import { SpellStatsFields } from './SpellStatsFields';
import type { GlobalSpell } from '../types';
import s from './KouzlaForms.module.css';

interface Props {
  spell: GlobalSpell;
  /** Když je uvedeno, jde o kurátorskou úpravu existujícího statbloku. */
  editSystemId?: string;
  onClose: () => void;
  onSaved?: (sp: GlobalSpell) => void;
}

export function ProposeSpellStatblockModal({
  spell,
  editSystemId,
  onClose,
  onSaved,
}: Props) {
  const { propose } = useKouzlaMutations();
  const isEdit = !!editSystemId;
  const existing = Object.keys(spell.statblocks ?? {});
  const available = SPELL_SYSTEM_TEMPLATES.filter(
    (t) => !existing.includes(t.id),
  );

  const [systemId, setSystemId] = useState(
    editSystemId ?? available[0]?.id ?? 'generic',
  );
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>(() =>
    editSystemId
      ? { ...(spell.statblocks?.[editSystemId]?.systemStats ?? {}) }
      : {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const template = useMemo(() => getSpellTemplate(systemId), [systemId]);

  const submit = () => {
    setFormError('');
    const errs = validateSpellStats(template, systemStats);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError('Vyplň povinná pole (škola magie je povinná).');
      return;
    }
    propose.mutate(
      { id: spell.id, payload: { systemId, systemStats } },
      {
        onSuccess: (sp) => {
          onSaved?.(sp);
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
          : 'Navrhni verzi kouzla pro další herní systém. Uloží se jako návrh a komunita ho vyladí v diskusi, než ho kurátor schválí jako balancnutý.'}
      </p>

      <div className={s.field}>
        <label className={s.label} htmlFor="psb-system">
          Herní systém
        </label>
        {isEdit ? (
          <div className={s.input} aria-readonly="true">
            {spellSystemLabel(systemId)}
          </div>
        ) : (
          <select
            id="psb-system"
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
