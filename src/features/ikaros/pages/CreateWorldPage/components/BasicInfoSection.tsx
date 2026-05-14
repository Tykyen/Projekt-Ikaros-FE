import type { SlugStatus } from '@/features/world/api/useSlugAvailability';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  name: string;
  slug: string;
  description: string;
  slugStatus: SlugStatus;
  onNameChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

const SLUG_STATUS_LABEL: Record<SlugStatus, string> = {
  idle: '',
  invalid: 'Adresa musí být 2–40 znaků, jen a–z, 0–9, pomlčka.',
  checking: 'Ověřuji…',
  available: '✓ k dispozici',
  taken: '✗ obsazeno',
};

export function BasicInfoSection({
  name,
  slug,
  description,
  slugStatus,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
}: Props) {
  const nameError =
    name.length > 0 && (name.length < 2 || name.length > 60)
      ? 'Název musí mít 2–60 znaků.'
      : null;

  return (
    <SectionCard index={1} title="Základ">
      <div className={s.field}>
        <label htmlFor="cw-name" className={`${s.label} ${s.required}`}>
          Název světa
        </label>
        <input
          id="cw-name"
          type="text"
          className={`${s.input} ${nameError ? s.inputError : ''}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={60}
          placeholder="Zadej název..."
          autoComplete="off"
        />
        {nameError && <p className={s.error}>{nameError}</p>}
      </div>

      <div className={s.field}>
        <label htmlFor="cw-slug" className={s.label}>
          Adresa
        </label>
        <div className={s.adressRow}>
          <span className={s.adressPrefix}>/svet/</span>
          <input
            id="cw-slug"
            type="text"
            className={`${s.input} ${s.adressInput} ${
              slugStatus === 'taken' || slugStatus === 'invalid'
                ? s.inputError
                : ''
            }`}
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            maxLength={40}
            placeholder="auto-derive z názvu"
            autoComplete="off"
            aria-describedby="cw-slug-status"
          />
        </div>
        <p
          id="cw-slug-status"
          className={
            slugStatus === 'available'
              ? s.helperOk
              : slugStatus === 'taken' || slugStatus === 'invalid'
                ? s.error
                : s.helper
          }
        >
          {slugStatus === 'idle' || slugStatus === 'checking'
            ? 'Použije se v URL světa. Auto-doplňuje se z názvu, ale můžeš ji změnit.'
            : SLUG_STATUS_LABEL[slugStatus]}
          {slugStatus === 'checking' && ' (ověřuji)'}
        </p>
      </div>

      <div className={s.field}>
        <label htmlFor="cw-desc" className={s.label}>
          Identita
        </label>
        <textarea
          id="cw-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Krátký text popisující svět a přivolávající hráče k zážitku."
        />
      </div>
    </SectionCard>
  );
}
