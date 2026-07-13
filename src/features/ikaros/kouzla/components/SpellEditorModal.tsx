/**
 * 21.5c — editor globálního kouzla. `create` = nové kouzlo (jádro/oznámení +
 * první pravidlová verze dle šablony systému); `editLore` = jen jádro (staty
 * se mění návrhem statbloku). Vzor: BestieEditorModal.
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { useKouzlaMutations } from '../hooks/useKouzlaMutations';
import {
  SPELL_SYSTEM_TEMPLATES,
  getSpellTemplate,
  validateSpellStats,
} from '../systems/spellTemplates';
import { SpellStatsFields } from './SpellStatsFields';
import type { GlobalSpell } from '../types';
import s from './KouzlaForms.module.css';

interface Props {
  mode: 'create' | 'editLore';
  spell?: GlobalSpell;
  onClose: () => void;
  onSaved?: (sp: GlobalSpell) => void;
}

export function SpellEditorModal({ mode, spell, onClose, onSaved }: Props) {
  const { create, updateLore } = useKouzlaMutations();
  const [name, setName] = useState(spell?.name ?? '');
  const [aliases, setAliases] = useState(spell?.aliases ?? '');
  const [tags, setTags] = useState((spell?.tags ?? []).join(', '));
  const [description, setDescription] = useState(spell?.description ?? '');
  const [imageUrl, setImageUrl] = useState(spell?.imageUrl ?? '');
  const [systemId, setSystemId] = useState('generic');
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const template = useMemo(() => getSpellTemplate(systemId), [systemId]);
  const pending = create.isPending || updateLore.isPending;

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej název kouzla.');
      return;
    }
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isCreate) {
      const errs = validateSpellStats(template, systemStats);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setFormError('Vyplň povinná pole statbloku (škola magie je povinná).');
        return;
      }
      create.mutate(
        {
          systemId,
          name: name.trim(),
          aliases: aliases.trim() || undefined,
          tags: tagList.length ? tagList : undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
          systemStats,
        },
        {
          onSuccess: (sp) => {
            onSaved?.(sp);
            onClose();
          },
        },
      );
    } else {
      if (!spell) return;
      updateLore.mutate(
        {
          id: spell.id,
          patch: {
            name: name.trim(),
            aliases: aliases.trim(),
            tags: tagList,
            description: description.trim(),
            imageUrl: imageUrl || '',
          },
        },
        {
          onSuccess: (sp) => {
            onSaved?.(sp);
            onClose();
          },
        },
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
      title={isCreate ? 'Nové kouzlo' : 'Upravit kouzlo'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita ho vyladí v diskusi a kurátor pak
          schválí (kouzlo i balanc statů per systém).
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="sp-name">
          Název kouzla
        </label>
        <input
          id="sp-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="sp-aliases">
            Alternativní jména
          </label>
          <input
            id="sp-aliases"
            className={s.input}
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            maxLength={200}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="sp-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="sp-tags"
            className={s.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="sp-desc">
          Oznámení / popis účinku
        </label>
        <textarea
          id="sp-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="Co kouzlo dělá, jak vypadá seslání, lore…"
        />
      </div>

      <div className={s.field}>
        {/* skupinový popisek uploadu (HeroUploadCard = vlastní widget) → span */}
        <span className={s.label}>Obrázek</span>
        <HeroUploadCard
          value={imageUrl}
          onChange={setImageUrl}
          compact
          uploadCta="Nahrát obrázek kouzla"
        />
      </div>

      {isCreate ? (
        <>
          <h4 className={s.sectionTitle}>
            První pravidlová verze (statblok dle systému)
          </h4>
          <div className={s.field}>
            <label className={s.label} htmlFor="sp-system">
              Herní systém
            </label>
            <select
              id="sp-system"
              className={s.select}
              value={systemId}
              onChange={(e) => {
                setSystemId(e.target.value);
                setSystemStats({});
                setErrors({});
              }}
            >
              {SPELL_SYSTEM_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <SpellStatsFields
            template={template}
            value={systemStats}
            onChange={setSystemStats}
            errors={errors}
          />
        </>
      ) : null}

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
