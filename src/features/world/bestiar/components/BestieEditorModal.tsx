/**
 * 10.2d-prep-B — Bestie editor modal (create + edit).
 *
 * Form pole:
 * - name (text)
 * - imageUrl (upload souboru přes <HeroUploadCard>, jako u postav/stránek;
 *   fallback „Vložit URL ručně" zachován)
 * - scope (jen při create; user/world)
 * - systemStats (přes <EntitySchemaForm schema={bestieSchema}>)
 * - notes (textarea)
 *
 * BE volá `create` / `update` mutation. Obrázek se nahrává přes sdílený
 * `useUploadImage` (uvnitř HeroUploadCard); ukládá se jen výsledná URL.
 */
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { EntitySchemaForm } from '@/features/world/tactical-map/components/schema-form/EntitySchemaForm';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { Modal, Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import type { ImageFit } from '@/shared/lib/imageStyle';
import { useBestieMutations } from '../hooks/useBestieMutations';
import { validateForCreate } from '@/features/world/tactical-map/utils/validateSystemStats';
import type { Bestie, BestieScope } from '../types';
import styles from './BestieEditorModal.module.css';

interface Props {
  worldId: string;
  systemId: string;
  /** existing bestie pro edit; null pro create. */
  existing: Bestie | null;
  defaultScope?: BestieScope;
  onClose: () => void;
  onSaved: (bestie: Bestie) => void;
}

export function BestieEditorModal({
  worldId,
  systemId,
  existing,
  defaultScope = 'world',
  onClose,
  onSaved,
}: Props): React.ReactElement {
  const schema = systemEntitySchemaRegistry.get(systemId, 'bestie');
  const { create, update } = useBestieMutations(worldId, systemId);
  const currentUser = useAtomValue(currentUserAtom);
  const isGlobalAdmin =
    currentUser?.role === UserRole.Superadmin ||
    currentUser?.role === UserRole.Admin;

  const [name, setName] = useState(existing?.name ?? '');
  const [imageUrl, setImageUrl] = useState(existing?.imageUrl ?? '');
  // Výřez obrázku (parity s GameEvent): focal bod + zoom + fit.
  const [focal, setFocal] = useState<{ x: number; y: number }>({
    x: existing?.imageFocalX ?? 50,
    y: existing?.imageFocalY ?? 50,
  });
  const [imageZoom, setImageZoom] = useState<number | null>(
    existing?.imageZoom ?? null,
  );
  const [imageFit, setImageFit] = useState<ImageFit | null>(
    existing?.imageFit ?? null,
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [scope, setScope] = useState<BestieScope>(
    existing ? existing.scope : defaultScope,
  );
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>(
    existing?.systemStats ?? {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!schema) {
    return (
      <Modal open onClose={onClose} title="Chyba" size="md">
        <p>Schema pro {systemId}:bestie není zaregistrované.</p>
      </Modal>
    );
  }

  const handleSubmit = (): void => {
    setSubmitError(null);
    if (!name.trim()) {
      setErrors({ name: 'Jméno je povinné' });
      return;
    }
    const validation = validateForCreate(systemStats, schema);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const hasImage = !!imageUrl.trim();
    const payload = {
      systemId,
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      // Výřez dává smysl jen s obrázkem — bez něj null (jako GameEvent/WorldNews).
      imageFocalX: hasImage ? focal.x : null,
      imageFocalY: hasImage ? focal.y : null,
      imageZoom: hasImage ? imageZoom : null,
      imageFit: hasImage ? imageFit : null,
      notes: notes.trim(),
      systemStats: validation.filled,
    };

    if (existing) {
      update.mutate(
        { id: existing.id, patch: payload },
        {
          onSuccess: (b) => onSaved(b),
          onError: (e) =>
            setSubmitError(e instanceof Error ? e.message : 'Neznámá chyba'),
        },
      );
    } else {
      create.mutate(
        {
          ...payload,
          scope,
          worldId: scope === 'world' ? worldId : undefined,
        },
        {
          onSuccess: (b) => onSaved(b),
          onError: (e) =>
            setSubmitError(e instanceof Error ? e.message : 'Neznámá chyba'),
        },
      );
    }
  };

  const pending = create.isPending || update.isPending;

  const footer = (
    <div className={styles.footer}>
      <Button variant="ghost" onClick={onClose} disabled={pending}>
        Zrušit
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={pending || !name.trim()}
        loading={pending}
      >
        Uložit
      </Button>
    </div>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={existing ? `Upravit: ${existing.name}` : 'Nová bestie'}
      size="lg"
      footer={footer}
    >
      <div className={styles.body}>
        <div className={styles.row}>
          <label className={styles.label}>
            Jméno *
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
          </label>
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Obrázek</span>
          <HeroUploadCard
            value={imageUrl}
            onChange={setImageUrl}
            compact
            uploadCta="Nahrát obrázek"
            focal={focal}
            onFocalChange={setFocal}
            zoom={imageZoom}
            onZoomChange={setImageZoom}
            fit={imageFit}
            onFitChange={setImageFit}
          />
        </div>

        {!existing && (
          <div className={styles.row}>
            <label className={styles.label}>
              Kam uložit
              <select
                className={styles.input}
                value={scope}
                onChange={(e) => setScope(e.target.value as BestieScope)}
              >
                <option value="user">Můj bestiář (napříč mými světy)</option>
                <option value="world">Bestiář tohoto světa</option>
                {isGlobalAdmin && (
                  <option value="system">
                    Globální (systémový — pro všechny světy systému)
                  </option>
                )}
              </select>
            </label>
          </div>
        )}

        <EntitySchemaForm
          schema={schema}
          value={systemStats}
          onChange={setSystemStats}
          errors={errors}
          disabled={pending}
        />

        <div className={styles.row}>
          <label className={styles.label}>
            Poznámky
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </label>
        </div>

        {submitError && (
          <p className={styles.error} role="alert">
            {submitError}
          </p>
        )}
      </div>
    </Modal>
  );
}
