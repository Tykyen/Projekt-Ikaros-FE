import { useState } from 'react';
import { Button, Input, Modal } from '@/shared/ui';
import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import type {
  CampaignSubject,
  CampaignSubjectStatus,
  CampaignSubjectType,
  CreateSubjectInput,
} from '../types';
import s from './campaign.module.css';

/**
 * Formulář subjektu (modal). Prezentační — `onSubmit` dostane hotový vstup,
 * mutaci řeší rodič. `initial.id` rozlišuje create vs edit.
 */
export function SubjectForm({
  open,
  initial,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Partial<CampaignSubject>;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSubjectInput) => void;
}) {
  // Stav se inicializuje z `initial` při mountu; rodič komponentu remountuje
  // přes `key` při každém otevření (React-doporučená alternativa k reset-efektu).
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<CampaignSubjectType>(initial?.type ?? 'NPC');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<CampaignSubjectStatus>(
    initial?.status ?? 'active',
  );
  const [linkedPageSlug, setLinkedPageSlug] = useState(
    initial?.linkedPageSlug ?? '',
  );
  const [linkedCharacterSlug, setLinkedCharacterSlug] = useState(
    initial?.linkedCharacterSlug ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState('');

  function submit() {
    if (!name.trim()) {
      setError('Jméno je povinné');
      return;
    }
    onSubmit({
      name: name.trim(),
      type,
      status,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedPageSlug: linkedPageSlug.trim() || undefined,
      linkedCharacterSlug: linkedCharacterSlug.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Upravit subjekt' : 'Nový subjekt'}
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
        <Input
          label="Jméno"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error || undefined}
          placeholder="Jméno subjektu"
          autoFocus
        />
        <div className={s.formRow}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Typ</span>
            <select
              className={s.select}
              value={type}
              onChange={(e) => setType(e.target.value as CampaignSubjectType)}
            >
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
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
                setStatus(e.target.value as CampaignSubjectStatus)
              }
            >
              <option value="active">Aktivní</option>
              <option value="archived">Archivovaný</option>
            </select>
          </label>
        </div>
        <Input
          label="Štítky (oddělené čárkou)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="politika, magie"
        />
        <Input
          label="Slug wiki stránky (volitelné)"
          value={linkedPageSlug}
          onChange={(e) => setLinkedPageSlug(e.target.value)}
          placeholder="napr-mesto-kamenec"
        />
        <Input
          label="Slug postavy (volitelné)"
          value={linkedCharacterSlug}
          onChange={(e) => setLinkedCharacterSlug(e.target.value)}
          placeholder="napr-aragorn"
        />
        <label className={s.field}>
          <span className={s.fieldLabel}>Poznámka</span>
          <textarea
            className={s.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Interní poznámka…"
          />
        </label>
      </div>
    </Modal>
  );
}
