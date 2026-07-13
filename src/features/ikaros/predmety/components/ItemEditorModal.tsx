/**
 * 21.5e — editor globálního předmětu. `create` = nový předmět (jádro: druh —
 * řídí variantu polí statbloku — + oznámení + cena, + první pravidlová verze);
 * `editLore` = jen jádro. Vzor: PotionEditorModal (21.5b); form CSS + statblok
 * pole reuse z kouzel.
 */
import { useState, useMemo } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { SpellStatsFields } from '../../kouzla/components/SpellStatsFields';
import { usePredmetyMutations } from '../hooks/usePredmetyMutations';
import {
  ITEM_KINDS,
  ITEM_SYSTEM_TEMPLATES,
  getItemTemplate,
  validateItemStats,
} from '../systems/itemTemplates';
import type { GlobalItem } from '../types';
import s from '../../kouzla/components/KouzlaForms.module.css';

interface Props {
  mode: 'create' | 'editLore';
  item?: GlobalItem;
  onClose: () => void;
  onSaved?: (it: GlobalItem) => void;
}

export function ItemEditorModal({ mode, item, onClose, onSaved }: Props) {
  const { create, updateLore } = usePredmetyMutations();
  const [name, setName] = useState(item?.name ?? '');
  const [aliases, setAliases] = useState(item?.aliases ?? '');
  const [kind, setKind] = useState(item?.kind ?? '');
  const [tags, setTags] = useState((item?.tags ?? []).join(', '));
  const [description, setDescription] = useState(item?.description ?? '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? '');
  const [price, setPrice] = useState(
    item?.suggestedPrice != null ? String(item.suggestedPrice) : '',
  );
  const [systemId, setSystemId] = useState('generic');
  const [systemStats, setSystemStats] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  // Šablona závisí na systému I druhu (spec R1) — druh přepíná variantu polí.
  const template = useMemo(
    () => getItemTemplate(systemId, kind),
    [systemId, kind],
  );
  const pending = create.isPending || updateLore.isPending;

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej název předmětu.');
      return;
    }
    if (!kind.trim()) {
      setFormError('Zadej druh předmětu.');
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
      const errs = validateItemStats(template, systemStats);
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
          tags: tagList.length ? tagList : undefined,
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
          suggestedPrice: priceNum,
          systemStats,
        },
        {
          onSuccess: (it) => {
            onSaved?.(it);
            onClose();
          },
        },
      );
    } else {
      if (!item) return;
      updateLore.mutate(
        {
          id: item.id,
          patch: {
            name: name.trim(),
            aliases: aliases.trim(),
            kind: kind.trim(),
            tags: tagList,
            description: description.trim(),
            imageUrl: imageUrl || '',
            suggestedPrice: priceNum,
          },
        },
        {
          onSuccess: (it) => {
            onSaved?.(it);
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
      title={isCreate ? 'Nový předmět' : 'Upravit předmět'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita ho vyladí v diskusi a kurátor pak
          schválí (předmět i balanc statů per systém). Druh předmětu určuje,
          jaká pole statblok nabídne (zbraň / zbroj / obecné).
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="it-name">
          Název předmětu
        </label>
        <input
          id="it-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="it-kind">
            Druh předmětu <span className={s.req}>*</span>
          </label>
          <input
            id="it-kind"
            className={s.input}
            value={kind}
            list="it-kind-list"
            placeholder="vyber, nebo napiš vlastní"
            onChange={(e) => setKind(e.target.value)}
            maxLength={60}
          />
          <datalist id="it-kind-list">
            {ITEM_KINDS.map((k) => (
              <option key={k.label} value={k.label} />
            ))}
          </datalist>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="it-aliases">
            Alternativní jména
          </label>
          <input
            id="it-aliases"
            className={s.input}
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="it-desc">
          Oznámení / popis
        </label>
        <textarea
          id="it-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="Jak předmět vypadá, odkud pochází, lore…"
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="it-price">
            Navrhovaná cena (bez měny)
          </label>
          <input
            id="it-price"
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
          <label className={s.label} htmlFor="it-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="it-tags"
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
          uploadCta="Nahrát obrázek předmětu"
        />
      </div>

      {isCreate ? (
        <>
          <h4 className={s.sectionTitle}>
            První pravidlová verze (mechanika dle systému a druhu)
          </h4>
          <div className={s.field}>
            <label className={s.label} htmlFor="it-system">
              Herní systém
            </label>
            <select
              id="it-system"
              className={s.select}
              value={systemId}
              onChange={(e) => {
                setSystemId(e.target.value);
                setSystemStats({});
                setErrors({});
              }}
            >
              {ITEM_SYSTEM_TEMPLATES.map((t) => (
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
