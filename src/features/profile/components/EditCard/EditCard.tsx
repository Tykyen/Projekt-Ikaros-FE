import { type ReactNode } from 'react';
import { Button } from '@/shared/ui';
import styles from './EditCard.module.css';

interface Props {
  title: string;
  icon?: ReactNode;
  /** Read-only zobrazení hodnoty */
  children: ReactNode;
  /** Editační formulář (zobrazí se po kliknutí na „Upravit") */
  editView?: ReactNode;
  isEditing: boolean;
  setEditing: (v: boolean) => void;
  onSave?: () => void | Promise<unknown>;
  onCancel?: () => void;
  isSaving?: boolean;
  /** Zakáže tlačítko „Uložit" (např. neplatný vstup). */
  saveDisabled?: boolean;
  /** Disabled — sekce „Připravujeme" (1.3b/c) */
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * EditCard — společná struktura pro sekce profilu (BioSection, CharacterSection, …).
 * Read view ↔ Edit view toggle, save/cancel akce.
 */
export function EditCard({
  title,
  icon,
  children,
  editView,
  isEditing,
  setEditing,
  onSave,
  onCancel,
  isSaving,
  saveDisabled,
  disabled,
  disabledReason,
}: Props) {
  function handleCancel() {
    onCancel?.();
    setEditing(false);
  }

  async function handleSave() {
    if (!onSave) return;
    await onSave();
    // editing state vypne onSave consumer (po success) — viz BioSection apod.
  }

  return (
    <section className={styles.card} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {icon && <span className={styles.icon}>{icon}</span>}
          {title}
        </h2>
        {!isEditing && editView && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            title={disabled ? disabledReason : undefined}
            onClick={() => setEditing(true)}
          >
            Upravit
          </Button>
        )}
      </header>

      <div className={styles.body}>
        {isEditing && editView ? editView : children}
      </div>

      {isEditing && (
        <footer className={styles.footer}>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || saveDisabled}
          >
            {isSaving ? 'Ukládám…' : 'Uložit'}
          </Button>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Zrušit
          </Button>
        </footer>
      )}
    </section>
  );
}
