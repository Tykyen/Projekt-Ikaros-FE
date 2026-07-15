import type { SlugStatus } from '@/features/world/api/useSlugAvailability';
import { SectionCard } from './SectionCard';
import s from './sections.module.css';

interface Props {
  name: string;
  description: string;
  slugStatus: SlugStatus;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
}

const NAME_MAX = 60;
const DESC_MAX = 1000;

export function BasicInfoSection({
  name,
  description,
  slugStatus,
  onNameChange,
  onDescriptionChange,
}: Props) {
  const nameError =
    name.length > 0 && (name.length < 2 || name.length > NAME_MAX)
      ? 'Název musí mít 2–60 znaků.'
      : null;

  // Adresa (slug) je před uživatelem schovaná a odvozuje se z názvu. Zpětnou
  // vazbu o kolizi/nevalidnosti proto vážeme na pole Název.
  const slugFeedback =
    slugStatus === 'taken'
      ? 'Svět s tímto názvem už existuje, zvol jiný.'
      : slugStatus === 'invalid'
        ? 'Z názvu nejde vytvořit adresa — použij aspoň 2 písmena nebo číslice.'
        : null;

  const nameFeedback = nameError ?? slugFeedback;

  return (
    <SectionCard index={1} title="Základ">
      <div className={s.field}>
        <label htmlFor="cw-name" className={`${s.label} ${s.required}`}>
          Název světa
        </label>
        <input
          id="cw-name"
          type="text"
          className={`${s.input} ${nameFeedback ? s.inputError : ''}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="Zadej název..."
          autoComplete="off"
        />
        <div className={s.fieldFooter}>
          {nameFeedback && <p className={s.error}>{nameFeedback}</p>}
          <span
            className={`${s.counter} ${name.length >= NAME_MAX * 0.9 ? s.counterWarn : ''}`}
          >
            {name.length} / {NAME_MAX}
          </span>
        </div>
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
          maxLength={DESC_MAX}
          rows={4}
          placeholder="Krátký text popisující svět a přivolávající hráče k zážitku."
        />
        <div className={s.fieldFooter}>
          <span
            className={`${s.counter} ${description.length >= DESC_MAX * 0.9 ? s.counterWarn : ''}`}
          >
            {description.length} / {DESC_MAX}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
