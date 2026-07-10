import { useMemo, useState } from 'react';
import { Button, Input, Modal } from '@/shared/ui';
import {
  STORYLINE_LEVELS,
  STORYLINE_LEVEL_LABELS,
  STORYLINE_STATUSES,
  STORYLINE_STATUS_LABELS,
  TYPE_LABELS,
} from '../labels';
import type {
  CampaignStoryline,
  CampaignStorylineLevel,
  CampaignStorylineStatus,
  CampaignSubject,
  CreateStorylineInput,
} from '../types';
import s from './campaign.module.css';

/** Hledatelný multi-výběr subjektů (zapojené do linky). */
function SubjectMultiPicker({
  subjects,
  selectedIds,
  onChange,
}: {
  subjects: CampaignSubject[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('cs');
    const pool = subjects.filter((x) => !selectedIds.includes(x.id));
    const filtered = q
      ? pool.filter((x) => x.name.toLocaleLowerCase('cs').includes(q))
      : pool;
    return filtered.slice(0, 8);
  }, [subjects, selectedIds, query]);

  const nameOf = (id: string) => subjects.find((x) => x.id === id)?.name ?? '?';

  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>Zapojené subjekty</span>
      {selectedIds.length > 0 && (
        <div className={s.tagRow}>
          {selectedIds.map((id) => (
            <span key={id} className={s.tag}>
              {nameOf(id)}{' '}
              <button
                type="button"
                className={s.pickedClear}
                aria-label={`Odebrat ${nameOf(id)}`}
                onClick={() => onChange(selectedIds.filter((x) => x !== id))}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={s.autocomplete}>
        <input
          className={s.input}
          placeholder="Hledat a přidat subjekt…"
          value={query}
          aria-label="Přidat subjekt do linky"
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        />
        {open && results.length > 0 && (
          <div className={s.acDropdown} role="listbox">
            {results.map((x) => (
              <button
                key={x.id}
                type="button"
                role="option"
                aria-selected="false"
                className={s.acOption}
                onMouseDown={() => {
                  onChange([...selectedIds, x.id]);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className={s.acTitle}>{x.name}</span>
                <span className={s.acType}>{TYPE_LABELS[x.type]}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Formulář příběhové linky (modal). Tajná pole (pravda, záměr PJ) jen pro PJ.
 * Rodič remountuje přes `key` při otevření.
 */
export function StorylineForm({
  open,
  subjects,
  initial,
  isPJ,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  subjects: CampaignSubject[];
  initial?: CampaignStoryline;
  isPJ: boolean;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStorylineInput) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [level, setLevel] = useState<CampaignStorylineLevel>(
    initial?.level ?? 'mid',
  );
  const [status, setStatus] = useState<CampaignStorylineStatus>(
    initial?.status ?? 'active',
  );
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [whatHappened, setWhatHappened] = useState(initial?.whatHappened ?? '');
  const [truth, setTruth] = useState(initial?.truth ?? '');
  const [playersBelief, setPlayersBelief] = useState(
    initial?.playersBelief ?? '',
  );
  const [gmIntent, setGmIntent] = useState(initial?.gmIntent ?? '');
  const [nextStep, setNextStep] = useState(initial?.nextStep ?? '');
  const [subjectIds, setSubjectIds] = useState<string[]>(
    initial?.subjectIds ?? [],
  );
  const [error, setError] = useState('');

  function submit() {
    if (!title.trim()) {
      setError('Název je povinný');
      return;
    }
    onSubmit({
      title: title.trim(),
      level,
      status,
      summary: summary.trim() || undefined,
      whatHappened: whatHappened.trim() || undefined,
      truth: truth.trim() || undefined,
      playersBelief: playersBelief.trim() || undefined,
      gmIntent: gmIntent.trim() || undefined,
      nextStep: nextStep.trim() || undefined,
      subjectIds,
      relationshipIds: initial?.relationshipIds ?? [],
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={initial?.id ? 'Upravit linku' : 'Nová linka'}
      footer={
        <div className={s.formActions}>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} loading={isPending}>
            {initial?.id ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      }
    >
      <div className={s.form}>
        {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
        <Input
          label="Název"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError('');
          }}
          error={error || undefined}
          placeholder="Název linky"
          autoFocus
        />
        {/* eslint-enable jsx-a11y/no-autofocus */}
        <div className={s.formRow}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Úroveň</span>
            <select
              className={s.select}
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as CampaignStorylineLevel)
              }
            >
              {STORYLINE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {STORYLINE_LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Status</span>
            <select
              className={s.select}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CampaignStorylineStatus)
              }
            >
              {STORYLINE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STORYLINE_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={s.field}>
          <span className={s.fieldLabel}>Shrnutí</span>
          <textarea
            className={s.textarea}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Co se stalo</span>
          <textarea
            className={s.textarea}
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            rows={3}
          />
        </label>
        {isPJ && (
          <label className={s.field}>
            <span className={s.fieldLabel}>🔒 Pravda (jen PJ)</span>
            <textarea
              className={s.textarea}
              value={truth}
              onChange={(e) => setTruth(e.target.value)}
              rows={2}
            />
          </label>
        )}
        <label className={s.field}>
          <span className={s.fieldLabel}>Co si myslí hráči</span>
          <textarea
            className={s.textarea}
            value={playersBelief}
            onChange={(e) => setPlayersBelief(e.target.value)}
            rows={2}
          />
        </label>
        {isPJ && (
          <label className={s.field}>
            <span className={s.fieldLabel}>🔒 Záměr PJ (jen PJ)</span>
            <textarea
              className={s.textarea}
              value={gmIntent}
              onChange={(e) => setGmIntent(e.target.value)}
              rows={2}
            />
          </label>
        )}
        <label className={s.field}>
          <span className={s.fieldLabel}>→ Další krok</span>
          <textarea
            className={s.textarea}
            value={nextStep}
            onChange={(e) => setNextStep(e.target.value)}
            rows={2}
          />
        </label>

        <SubjectMultiPicker
          subjects={subjects}
          selectedIds={subjectIds}
          onChange={setSubjectIds}
        />
      </div>
    </Modal>
  );
}
