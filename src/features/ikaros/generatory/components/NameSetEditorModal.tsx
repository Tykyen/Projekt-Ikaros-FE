/**
 * 21.2a — editor jmenné sady. Seznamy = textarey (jedno jméno na řádek,
 * dedup dělá BE). `create` = nová sada (draft); `edit` = plná úprava
 * (autor draftu / kurátor).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { useNameSetsMutations } from '../hooks/useNameSetsMutations';
import {
  NAME_SET_CATEGORY_LABELS,
  type GlobalNameSet,
  type NameSetCategory,
  type CreateNameSetPayload,
  type FemaleSurnameRule,
} from '../types';
import s from '../Generatory.module.css';
import f from './GeneratoryForms.module.css';

interface Props {
  mode: 'create' | 'edit';
  set?: GlobalNameSet;
  onClose: () => void;
  onSaved?: (s: GlobalNameSet) => void;
}

const toLines = (arr?: string[]) => (arr ?? []).join('\n');
const fromLines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export function NameSetEditorModal({ mode, set, onClose, onSaved }: Props) {
  const { create, update } = useNameSetsMutations();
  const [name, setName] = useState(set?.name ?? '');
  const [category, setCategory] = useState<NameSetCategory>(
    set?.category ?? 'vlastni',
  );
  const [description, setDescription] = useState(set?.description ?? '');
  const [surnameNote, setSurnameNote] = useState(set?.surnameNote ?? '');
  const [male, setMale] = useState(toLines(set?.maleNames));
  const [female, setFemale] = useState(toLines(set?.femaleNames));
  const [surnames, setSurnames] = useState(toLines(set?.surnames));
  const [epithets, setEpithets] = useState(toLines(set?.epithets));
  const [femRule, setFemRule] = useState<FemaleSurnameRule>(
    set?.femaleSurnameRule ?? 'none',
  );
  const [freqSorted, setFreqSorted] = useState(set?.frequencySorted ?? false);
  const [lifespanMult, setLifespanMult] = useState(
    set?.demography?.lifespanMult?.toString() ?? '',
  );
  const [fertFrom, setFertFrom] = useState(
    set?.demography?.fertilityFrom?.toString() ?? '',
  );
  const [fertTo, setFertTo] = useState(
    set?.demography?.fertilityTo?.toString() ?? '',
  );
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const pending = create.isPending || update.isPending;

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej název sady.');
      return;
    }
    const demography =
      lifespanMult || fertFrom || fertTo
        ? {
            lifespanMult: lifespanMult ? Number(lifespanMult) : undefined,
            fertilityFrom: fertFrom ? Number(fertFrom) : undefined,
            fertilityTo: fertTo ? Number(fertTo) : undefined,
          }
        : undefined;
    const payload: CreateNameSetPayload = {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      surnameNote: surnameNote.trim() || undefined,
      maleNames: fromLines(male),
      femaleNames: fromLines(female),
      surnames: fromLines(surnames),
      epithets: fromLines(epithets),
      femaleSurnameRule: femRule,
      frequencySorted: freqSorted,
      demography,
    };
    const done = (saved: GlobalNameSet) => {
      onSaved?.(saved);
      onClose();
    };
    if (isCreate) {
      create.mutate(payload, {
        onSuccess: done,
        onError: () => setFormError('Sadu se nepodařilo vytvořit.'),
      });
    } else if (set) {
      update.mutate(
        { id: set.id, patch: { ...payload, description: description.trim(), surnameNote: surnameNote.trim() } },
        {
          onSuccess: done,
          onError: () => setFormError('Změny se nepodařilo uložit.'),
        },
      );
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button variant="primary" loading={pending} onClick={submit}>
        {isCreate ? 'Vytvořit návrh' : 'Uložit'}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isCreate ? 'Nová jmenná sada' : 'Upravit sadu'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={f.hint}>
          Vytvoří se jako návrh — kurátor ji může schválit do knihovny.
        </p>
      ) : null}

      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-name">
            Název (národ / stát)
          </label>
          <input
            id="ns-name"
            className={s.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-cat">
            Kategorie
          </label>
          <select
            id="ns-cat"
            className={s.select}
            value={category}
            onChange={(e) => setCategory(e.target.value as NameSetCategory)}
          >
            {Object.entries(NAME_SET_CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-desc">
            Popis (původ / jazyk)
          </label>
          <input
            id="ns-desc"
            className={s.input}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-snote">
            Poznámka k příjmením
          </label>
          <input
            id="ns-snote"
            className={s.input}
            value={surnameNote}
            onChange={(e) => setSurnameNote(e.target.value)}
            placeholder="např. nemá příjmení"
            maxLength={200}
          />
        </div>
      </div>

      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-male">
            Mužská jména (jedno na řádek)
          </label>
          <textarea
            id="ns-male"
            className={s.textarea}
            value={male}
            onChange={(e) => setMale(e.target.value)}
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-female">
            Ženská jména
          </label>
          <textarea
            id="ns-female"
            className={s.textarea}
            value={female}
            onChange={(e) => setFemale(e.target.value)}
          />
        </div>
      </div>
      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-surnames">
            Příjmení
          </label>
          <textarea
            id="ns-surnames"
            className={s.textarea}
            value={surnames}
            onChange={(e) => setSurnames(e.target.value)}
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-epithets">
            Přízviska (volitelná)
          </label>
          <textarea
            id="ns-epithets"
            className={s.textarea}
            value={epithets}
            onChange={(e) => setEpithets(e.target.value)}
            placeholder={'Hrbáč\nz Lipan'}
          />
        </div>
      </div>

      <div className={f.row2}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-femrule">
            Přechylování ženských příjmení
          </label>
          <select
            id="ns-femrule"
            className={s.select}
            value={femRule}
            onChange={(e) => setFemRule(e.target.value as FemaleSurnameRule)}
          >
            <option value="none">Ne</option>
            <option value="cs">Česká pravidla (-ová / -á)</option>
          </select>
        </div>
        <div className={f.field}>
          <span className={f.label}>Řazení dle četnosti</span>
          <label className={f.inlineCheck}>
            <input
              type="checkbox"
              checked={freqSorted}
              onChange={(e) => setFreqSorted(e.target.checked)}
            />
            Seznamy jsou od nejběžnějších (umožní „běžná jména častěji")
          </label>
        </div>
      </div>

      <p className={f.hint}>
        Demografický profil (volitelný — pro generátor potomků; prázdné =
        lidský):
      </p>
      <div className={f.row3}>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-mult">
            Násobek dožití
          </label>
          <input
            id="ns-mult"
            className={s.input}
            type="number"
            step="0.1"
            min={0.1}
            value={lifespanMult}
            onChange={(e) => setLifespanMult(e.target.value)}
            placeholder="1"
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-fert-from">
            Plodnost od
          </label>
          <input
            id="ns-fert-from"
            className={s.input}
            type="number"
            min={1}
            value={fertFrom}
            onChange={(e) => setFertFrom(e.target.value)}
            placeholder="16"
          />
        </div>
        <div className={f.field}>
          <label className={f.label} htmlFor="ns-fert-to">
            Plodnost do
          </label>
          <input
            id="ns-fert-to"
            className={s.input}
            type="number"
            min={1}
            value={fertTo}
            onChange={(e) => setFertTo(e.target.value)}
            placeholder="45"
          />
        </div>
      </div>

      {formError ? <p className={f.err}>{formError}</p> : null}
    </Modal>
  );
}
