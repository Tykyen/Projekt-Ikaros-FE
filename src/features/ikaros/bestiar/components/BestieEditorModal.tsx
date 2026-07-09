/**
 * 16.2b-2 — editor globální bytosti. `create` = nová bytost (lore + první
 * pravidlová verze statů); `editLore` = jen lore (staty se mění návrhem, §2a).
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { EntitySchemaForm } from '@/features/world/tactical-map/components/schema-form/EntitySchemaForm';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { validateForCreate } from '@/features/world/tactical-map/utils/validateSystemStats';
import { resolveSystemId } from '@/features/world/systemId';
import { useKomunitniBestiarMutations } from '../hooks/useKomunitniBestiarMutations';
import { BESTIE_SYSTEMS } from './systems';
import type { GlobalBestie } from '../types';
import s from './KomunitniBestiarForms.module.css';

interface Props {
  mode: 'create' | 'editLore';
  bestie?: GlobalBestie;
  onClose: () => void;
  onSaved?: (b: GlobalBestie) => void;
}

export function BestieEditorModal({ mode, bestie, onClose, onSaved }: Props) {
  const { create, updateLore } = useKomunitniBestiarMutations();
  const [name, setName] = useState(bestie?.name ?? '');
  const [latin, setLatin] = useState(bestie?.latin ?? '');
  const [kind, setKind] = useState(bestie?.kind ?? '');
  const [tags, setTags] = useState((bestie?.tags ?? []).join(', '));
  const [description, setDescription] = useState(bestie?.description ?? '');
  const [imageUrl, setImageUrl] = useState(bestie?.imageUrl ?? '');
  const [systemId, setSystemId] = useState('generic');
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const schema = useMemo(
    () => systemEntitySchemaRegistry.get(resolveSystemId(systemId), 'bestie'),
    [systemId],
  );
  const pending = create.isPending || updateLore.isPending;

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej jméno bytosti.');
      return;
    }
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isCreate) {
      if (!schema) {
        setFormError('Pro tento systém není schéma statů.');
        return;
      }
      const v = validateForCreate(systemStats, schema);
      if (!v.valid) {
        setErrors(v.errors);
        setFormError('Zkontroluj vyplněné staty.');
        return;
      }
      create.mutate(
        {
          systemId,
          name: name.trim(),
          latin: latin.trim() || undefined,
          kind: kind.trim() || undefined,
          tags: tagList.length ? tagList : undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
          systemStats: v.filled,
        },
        { onSuccess: (b) => { onSaved?.(b); onClose(); } },
      );
    } else {
      if (!bestie) return;
      updateLore.mutate(
        {
          id: bestie.id,
          patch: {
            name: name.trim(),
            latin: latin.trim(),
            kind: kind.trim(),
            tags: tagList,
            description: description.trim(),
            imageUrl: imageUrl || '',
          },
        },
        { onSuccess: (b) => { onSaved?.(b); onClose(); } },
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
      title={isCreate ? 'Nová globální bytost' : 'Upravit popis'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — hned ho máš i ve svém osobním bestiáři a
          komunita ho může vyladit.
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="be-name">
          Jméno
        </label>
        <input
          id="be-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="be-latin">
            Latinský název
          </label>
          <input
            id="be-latin"
            className={s.input}
            value={latin}
            onChange={(e) => setLatin(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="be-kind">
            Typ (drak, nemrtvý…)
          </label>
          <input
            id="be-kind"
            className={s.input}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            maxLength={60}
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="be-tags">
          Štítky (oddělené čárkou)
        </label>
        <input
          id="be-tags"
          className={s.input}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="be-desc">
          Popis (lore)
        </label>
        <textarea
          id="be-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
      </div>

      <div className={s.field}>
        <label className={s.label}>Obrázek</label>
        <HeroUploadCard
          value={imageUrl}
          onChange={setImageUrl}
          compact
          uploadCta="Nahrát obrázek bytosti"
        />
      </div>

      {isCreate ? (
        <>
          <h4 className={s.sectionTitle}>První pravidlová verze statů</h4>
          <div className={s.field}>
            <label className={s.label} htmlFor="be-system">
              Herní systém
            </label>
            <select
              id="be-system"
              className={s.select}
              value={systemId}
              onChange={(e) => {
                setSystemId(e.target.value);
                setSystemStats({});
                setErrors({});
              }}
            >
              {BESTIE_SYSTEMS.map((sy) => (
                <option key={sy.id} value={sy.id}>
                  {sy.label}
                </option>
              ))}
            </select>
          </div>
          {schema ? (
            <EntitySchemaForm
              schema={schema}
              value={systemStats}
              onChange={setSystemStats}
              errors={errors}
            />
          ) : (
            <p className={s.hint}>Pro tento systém zatím není schéma statů.</p>
          )}
        </>
      ) : null}

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
