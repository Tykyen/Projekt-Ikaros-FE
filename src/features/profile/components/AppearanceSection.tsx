import { useEffect, useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { ChatColorPicker } from './ChatColorPicker';
import { EditCard } from './EditCard';
import { ThemeSwitcher } from '@/themes/ThemeSwitcher';
import { ThemeCustomEditor } from '@/features/world/pages/WorldSettingsPage/components/ThemeCustomEditor';
import { themeAtom, platformThemePreviewAtom } from '@/themes/state';
import { Button } from '@/shared/ui';
import { useUpdateProfile } from '@/features/profile/api/useProfile';
import { DEFAULT_CHAT_COLOR } from '@/features/profile/lib/chatColor';
import type { User, UserThemeSettings } from '@/shared/types';
import styles from './ProfileSections.module.css';

interface Props {
  user: User;
}

/**
 * 1.3a / 5.9 — Sekce „Vzhled": globální motiv (ThemeSwitcher), barva chatu
 * a uživatelské doladění vzhledu platformy (jas / kontrast / barvy —
 * přístupnost). Doladění se ukládá do `User.themeSettings`.
 */
export function AppearanceSection({ user }: Props) {
  const chatColor = user.chatColor ?? DEFAULT_CHAT_COLOR;
  const [editingColor, setEditingColor] = useState(false);
  const [color, setColor] = useState(chatColor);
  const [theme] = useAtom(themeAtom);
  const update = useUpdateProfile();

  // 5.9 — doladění vzhledu platformy.
  const ts = user.themeSettings as UserThemeSettings | undefined;
  const setPreview = useSetAtom(platformThemePreviewAtom);
  const [brightness, setBrightness] = useState(ts?.adjust?.brightness ?? 1);
  const [contrast, setContrast] = useState(ts?.adjust?.contrast ?? 1);
  const [overrides, setOverrides] = useState<Record<string, string>>(
    ts?.overrides ?? {},
  );

  useEffect(() => {
    setPreview({ overrides, adjust: { brightness, contrast } });
  }, [overrides, brightness, contrast, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);

  const adjustDirty =
    brightness !== 1 || contrast !== 1 || Object.keys(overrides).length > 0;

  async function saveColor() {
    await update.mutateAsync({ chatColor: color });
    setEditingColor(false);
  }
  function cancelColor() {
    setColor(chatColor);
  }

  async function saveAdjust() {
    try {
      await update.mutateAsync({
        themeSettings: { adjust: { brightness, contrast }, overrides },
      });
      toast.success('Doladění vzhledu uloženo.');
    } catch {
      toast.error('Uložení se nezdařilo.');
    }
  }
  function resetAdjust() {
    setBrightness(1);
    setContrast(1);
    setOverrides({});
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

      <section className={styles.card}>
        <header className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Doladění vzhledu</h2>
        </header>
        <p className={styles.placeholderHint}>
          Jen pro tebe — motiv zůstává, doladíš si jas, kontrast a barvy pro
          svou čitelnost. Platí na všech zařízeních.
        </p>

        <div className={styles.themeRow}>
          <label className={styles.text} style={{ flex: 1 }}>
            Jas — {Math.round(brightness * 100)} %
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              aria-label="Jas"
              style={{ width: '100%' }}
            />
          </label>
        </div>
        <div className={styles.themeRow}>
          <label className={styles.text} style={{ flex: 1 }}>
            Kontrast — {Math.round(contrast * 100)} %
            <input
              type="range"
              min={0.7}
              max={1.3}
              step={0.05}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              aria-label="Kontrast"
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <ThemeCustomEditor
          themeId={theme}
          overrides={overrides}
          onChange={setOverrides}
        />

        <div className={styles.themeRow}>
          <Button
            type="button"
            onClick={saveAdjust}
            loading={update.isPending}
          >
            Uložit doladění
          </Button>
          {adjustDirty && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAdjust}
            >
              Výchozí
            </Button>
          )}
        </div>
      </section>

      <EditCard
        title="Barva chatu"
        isEditing={editingColor}
        setEditing={setEditingColor}
        onSave={saveColor}
        onCancel={cancelColor}
        isSaving={update.isPending}
        editView={<ChatColorPicker value={color} onChange={setColor} />}
      >
        <div className={styles.swatchRow}>
          <span
            className={styles.swatchLg}
            style={{ backgroundColor: chatColor }}
            aria-hidden="true"
          />
          <code className={styles.swatchHex}>{chatColor.toUpperCase()}</code>
          <span className={styles.chatPreview} style={{ color: chatColor }}>
            Tvé zprávy budou vypadat takto
          </span>
        </div>
      </EditCard>
    </>
  );
}
