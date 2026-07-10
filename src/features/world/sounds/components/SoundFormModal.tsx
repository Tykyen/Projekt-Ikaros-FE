/**
 * 13.3 — SoundFormModal (create/edit zvuku světa).
 *
 * Plain useState form (konzistence s BestieEditorModal). Povinné name +
 * youtubeUrl (validace přes extractYoutubeId). Ostatní metadata = selecty.
 */
import { useState } from 'react';
import { Modal, Button, Input } from '@/shared/ui';
import { extractYoutubeId } from '../player/youtubeId';
import { useSoundMutations } from '../hooks/useSoundMutations';
import type { Sound, CreateSoundDto } from '../types';
import {
  MEDIA_TYPE_LABELS,
  PRIMARY_FUNCTION_LABELS,
  ENVIRONMENT_LABELS,
  EMOTIONAL_TONE_LABELS,
  FACTION_STYLE_LABELS,
  TECH_LEVEL_LABELS,
  MAGIC_LEVEL_LABELS,
  COMBAT_ENERGY_LABELS,
  toOptions,
} from '../lib/soundEnums';
import styles from './SoundFormModal.module.css';

interface Props {
  worldId: string;
  existing: Sound | null;
  onClose: () => void;
  onSaved: () => void;
}

export function SoundFormModal({
  worldId,
  existing,
  onClose,
  onSaved,
}: Props): React.ReactElement {
  const [form, setForm] = useState<CreateSoundDto>(() => ({
    name: existing?.name ?? '',
    youtubeUrl: existing?.youtubeUrl ?? '',
    mediaType: existing?.mediaType ?? 'music',
    primaryFunction: existing?.primaryFunction ?? 'safe',
    environment: existing?.environment ?? 'neutral',
    emotionalTone: existing?.emotionalTone ?? 'calm',
    intensity: existing?.intensity ?? 1,
    loop: existing?.loop ?? true,
    factionStyle: existing?.factionStyle ?? 'civilian',
    techLevel: existing?.techLevel ?? 'modern',
    magicLevel: existing?.magicLevel ?? 'none',
    combatEnergy: existing?.combatEnergy ?? 'none',
    tags: existing?.tags ?? [],
    notes: existing?.notes ?? '',
  }));
  const [saving, setSaving] = useState(false);

  const mutations = useSoundMutations(worldId);

  const urlValid = extractYoutubeId(form.youtubeUrl) !== null;
  const canSave = form.name.trim().length > 0 && urlValid && !saving;

  const set = <K extends keyof CreateSoundDto>(
    key: K,
    v: CreateSoundDto[K],
  ) => setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const dto: CreateSoundDto = {
        ...form,
        name: form.name.trim(),
        youtubeUrl: form.youtubeUrl.trim(),
        notes: form.notes?.trim() ?? '',
      };
      if (existing) {
        await mutations.update.mutateAsync({ id: existing.id, dto });
      } else {
        await mutations.create.mutateAsync(dto);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={existing ? 'Upravit zvuk' : 'Nový zvuk'}
    >
      <div className={styles.form}>
        <label className={styles.field} htmlFor="sound-name">
          <span className={styles.label}>Název *</span>
          <Input
            id="sound-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="např. Bitva u brány"
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>YouTube odkaz *</span>
          <Input
            value={form.youtubeUrl}
            onChange={(e) => set('youtubeUrl', e.target.value)}
            placeholder="https://youtu.be/…"
          />
          {form.youtubeUrl && !urlValid && (
            <span className={styles.error}>Neplatný YouTube odkaz.</span>
          )}
        </label>

        <div className={styles.grid}>
          <Sel label="Druh" value={form.mediaType!} onChange={(v) => set('mediaType', v as CreateSoundDto['mediaType'])} options={toOptions(MEDIA_TYPE_LABELS)} />
          <Sel label="Funkce" value={form.primaryFunction!} onChange={(v) => set('primaryFunction', v as CreateSoundDto['primaryFunction'])} options={toOptions(PRIMARY_FUNCTION_LABELS)} />
          <Sel label="Prostředí" value={form.environment!} onChange={(v) => set('environment', v as CreateSoundDto['environment'])} options={toOptions(ENVIRONMENT_LABELS)} />
          <Sel label="Tón" value={form.emotionalTone!} onChange={(v) => set('emotionalTone', v as CreateSoundDto['emotionalTone'])} options={toOptions(EMOTIONAL_TONE_LABELS)} />
          <Sel label="Frakce" value={form.factionStyle!} onChange={(v) => set('factionStyle', v as CreateSoundDto['factionStyle'])} options={toOptions(FACTION_STYLE_LABELS)} />
          <Sel label="Technologie" value={form.techLevel!} onChange={(v) => set('techLevel', v as CreateSoundDto['techLevel'])} options={toOptions(TECH_LEVEL_LABELS)} />
          <Sel label="Magie" value={form.magicLevel!} onChange={(v) => set('magicLevel', v as CreateSoundDto['magicLevel'])} options={toOptions(MAGIC_LEVEL_LABELS)} />
          <Sel label="Energie boje" value={form.combatEnergy!} onChange={(v) => set('combatEnergy', v as CreateSoundDto['combatEnergy'])} options={toOptions(COMBAT_ENERGY_LABELS)} />
          <label className={styles.field}>
            <span className={styles.label}>Intenzita</span>
            <select className={styles.select} value={form.intensity} onChange={(e) => set('intensity', Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={form.loop}
            onChange={(e) => set('loop', e.target.checked)}
          />
          <span>Přehrávat ve smyčce</span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Poznámky</span>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
          />
        </label>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSave}>
            {saving ? 'Ukládám…' : 'Uložit'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}): React.ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
