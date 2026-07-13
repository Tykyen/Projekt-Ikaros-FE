/**
 * 21.5b — editor globálního lektvaru. `create` = nový lektvar (jádro: druh +
 * suroviny + oznámení + cena, + první pravidlová verze dle šablony systému);
 * `editLore` = jen jádro (staty se mění návrhem statbloku). Vzor:
 * SpellEditorModal (21.5c); form CSS + statblok pole reuse z kouzel.
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { SpellStatsFields } from '../../kouzla/components/SpellStatsFields';
import { useLektvaryMutations } from '../hooks/useLektvaryMutations';
import {
  POTION_KINDS,
  POTION_SYSTEM_TEMPLATES,
  getPotionTemplate,
  validatePotionStats,
} from '../systems/potionTemplates';
import { IngredientsFields } from './IngredientsFields';
import type { GlobalPotion, PotionIngredient } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  mode: 'create' | 'editLore';
  potion?: GlobalPotion;
  onClose: () => void;
  onSaved?: (p: GlobalPotion) => void;
}

/** Ořízne prázdné řádky surovin; validní = aspoň 1 s názvem. */
function cleanIngredients(list: PotionIngredient[]): PotionIngredient[] {
  return list
    .map((i) => ({ name: i.name.trim(), amount: i.amount?.trim() || undefined }))
    .filter((i) => i.name);
}

export function PotionEditorModal({ mode, potion, onClose, onSaved }: Props) {
  const { create, updateLore } = useLektvaryMutations();
  const [name, setName] = useState(potion?.name ?? '');
  const [aliases, setAliases] = useState(potion?.aliases ?? '');
  const [kind, setKind] = useState(potion?.kind ?? '');
  const [ingredients, setIngredients] = useState<PotionIngredient[]>(
    potion?.ingredients?.length ? potion.ingredients : [{ name: '', amount: '' }],
  );
  const [tags, setTags] = useState((potion?.tags ?? []).join(', '));
  const [description, setDescription] = useState(potion?.description ?? '');
  const [imageUrl, setImageUrl] = useState(potion?.imageUrl ?? '');
  const [price, setPrice] = useState(
    potion?.suggestedPrice != null ? String(potion.suggestedPrice) : '',
  );
  const [systemId, setSystemId] = useState('generic');
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ingError, setIngError] = useState('');
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const template = useMemo(() => getPotionTemplate(systemId), [systemId]);
  const pending = create.isPending || updateLore.isPending;

  const submit = () => {
    setFormError('');
    setIngError('');
    if (!name.trim()) {
      setFormError('Zadej název lektvaru.');
      return;
    }
    if (!kind.trim()) {
      setFormError('Zadej druh lektvaru.');
      return;
    }
    const ings = cleanIngredients(ingredients);
    if (!ings.length) {
      setIngError('Zadej aspoň jednu surovinu.');
      setFormError('Lektvar musí mít aspoň jednu surovinu.');
      return;
    }
    const priceNum = price.trim() === '' ? null : Number(price);
    if (priceNum !== null && (!Number.isFinite(priceNum) || priceNum < 0)) {
      setFormError('Navrhovaná cena musí být nezáporné číslo.');
      return;
    }
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isCreate) {
      const errs = validatePotionStats(template, systemStats);
      if (Object.keys(errs).length) {
        setErrors(errs);
        setFormError('Vyplň povinná pole statbloku.');
        return;
      }
      create.mutate(
        {
          systemId,
          name: name.trim(),
          aliases: aliases.trim() || undefined,
          kind: kind.trim(),
          ingredients: ings,
          tags: tagList.length ? tagList : undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
          suggestedPrice: priceNum,
          systemStats,
        },
        {
          onSuccess: (p) => {
            onSaved?.(p);
            onClose();
          },
        },
      );
    } else {
      if (!potion) return;
      updateLore.mutate(
        {
          id: potion.id,
          patch: {
            name: name.trim(),
            aliases: aliases.trim(),
            kind: kind.trim(),
            ingredients: ings,
            tags: tagList,
            description: description.trim(),
            imageUrl: imageUrl || '',
            suggestedPrice: priceNum,
          },
        },
        {
          onSuccess: (p) => {
            onSaved?.(p);
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
      title={isCreate ? 'Nový lektvar' : 'Upravit lektvar'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita ho vyladí v diskusi a kurátor pak
          schválí (lektvar i balanc statů per systém).
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="po-name">
          Název lektvaru
        </label>
        <input
          id="po-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="po-kind">
            Druh lektvaru <span className={s.req}>*</span>
          </label>
          <input
            id="po-kind"
            className={s.input}
            value={kind}
            list="po-kind-list"
            placeholder="vyber, nebo napiš vlastní"
            onChange={(e) => setKind(e.target.value)}
            maxLength={60}
          />
          <datalist id="po-kind-list">
            {POTION_KINDS.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="po-aliases">
            Alternativní jména
          </label>
          <input
            id="po-aliases"
            className={s.input}
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <IngredientsFields
        value={ingredients}
        onChange={setIngredients}
        error={ingError}
      />

      <div className={s.field}>
        <label className={s.label} htmlFor="po-desc">
          Oznámení / popis účinku
        </label>
        <textarea
          id="po-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="Co lektvar dělá, jak chutná, lore…"
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="po-price">
            Navrhovaná cena (bez měny)
          </label>
          <input
            id="po-price"
            className={s.input}
            value={price}
            inputMode="numeric"
            placeholder="např. 50"
            onChange={(e) => setPrice(e.target.value)}
          />
          <span className={s.fieldHint}>
            Předvyplní se při vkladu do obchodu světa.
          </span>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="po-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="po-tags"
            className={s.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>

      <div className={s.field}>
        {/* skupinový popisek uploadu (HeroUploadCard = vlastní widget) → span */}
        <span className={s.label}>Obrázek</span>
        <HeroUploadCard
          value={imageUrl}
          onChange={setImageUrl}
          compact
          uploadCta="Nahrát obrázek lektvaru"
        />
      </div>

      {isCreate ? (
        <>
          <h4 className={s.sectionTitle}>
            První pravidlová verze (výroba a mechanika dle systému)
          </h4>
          <div className={s.field}>
            <label className={s.label} htmlFor="po-system">
              Herní systém
            </label>
            <select
              id="po-system"
              className={s.select}
              value={systemId}
              onChange={(e) => {
                setSystemId(e.target.value);
                setSystemStats({});
                setErrors({});
              }}
            >
              {POTION_SYSTEM_TEMPLATES.map((t) => (
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
