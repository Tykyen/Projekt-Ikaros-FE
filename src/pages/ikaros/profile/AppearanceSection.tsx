import { useState } from 'react';
import { useAtom } from 'jotai';
import { ChatColorPicker, EditCard } from '../../../components/ui';
import { ThemeSwitcher } from '../../../themes/ThemeSwitcher';
import { themeAtom } from '../../../themes/state';
import { useUpdateProfile } from '../../../api/hooks/useProfile';
import type { User } from '@/shared/types';
import styles from './ProfileSections.module.css';

interface Props {
  user: User;
}

/**
 * 1.3a — Sekce „Vzhled" — globální motiv (ThemeSwitcher) + barva chatu.
 * Globální motiv se ukládá do localStorage (themeAtom) a synchronizuje
 * na BE přes themeId v useThemeSync (separátně).
 * Barva chatu se ukládá hned přes PATCH /users/me { chatColor }.
 */
export function AppearanceSection({ user }: Props) {
  const [editingColor, setEditingColor] = useState(false);
  const [color, setColor] = useState(user.chatColor);
  const [theme] = useAtom(themeAtom);
  const update = useUpdateProfile();

  async function saveColor() {
    await update.mutateAsync({ chatColor: color });
    setEditingColor(false);
  }

  function cancelColor() {
    setColor(user.chatColor);
  }

  return (
    <>
      <section className={styles.card}>
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Globální motiv</h2>
        </header>
        <div className={styles.themeRow}>
          <div>
            <p className={styles.text}>
              Aktuální: <strong>{theme}</strong>
            </p>
            <p className={styles.placeholderHint}>
              Změna se uloží lokálně i na server (synchronizace přes všechna
              zařízení).
            </p>
          </div>
          <ThemeSwitcher />
        </div>
      </section>

      <EditCard
        title="Barva chatu"
        isEditing={editingColor}
        setEditing={setEditingColor}
        onSave={saveColor}
        onCancel={cancelColor}
        isSaving={update.isPending}
        editView={
          <ChatColorPicker value={color} onChange={setColor} />
        }
      >
        <div className={styles.swatchRow}>
          <span
            className={styles.swatchLg}
            style={{ backgroundColor: user.chatColor }}
            aria-hidden="true"
          />
          <code className={styles.swatchHex}>
            {user.chatColor.toUpperCase()}
          </code>
          <span
            className={styles.chatPreview}
            style={{ color: user.chatColor }}
          >
            Tvé zprávy budou vypadat takto
          </span>
        </div>
      </EditCard>
    </>
  );
}
