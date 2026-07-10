/**
 * 21.5a — editor globální rostliny. `create` = nová rostlina (status 'draft');
 * `edit` = úprava všech polí (autor draftu / kurátor).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { useKomunitniHerbarMutations } from '../hooks/useKomunitniHerbarMutations';
import {
  RARITY_OPTIONS,
  type GlobalPlant,
  type PlantRarity,
  type CreatePlantPayload,
} from '../types';
import s from './KomunitniHerbarForms.module.css';

interface Props {
  mode: 'create' | 'edit';
  plant?: GlobalPlant;
  onClose: () => void;
  onSaved?: (p: GlobalPlant) => void;
}

export function PlantEditorModal({ mode, plant, onClose, onSaved }: Props) {
  const { create, update } = useKomunitniHerbarMutations();
  const [name, setName] = useState(plant?.name ?? '');
  const [aliases, setAliases] = useState(plant?.aliases ?? '');
  const [imageUrl, setImageUrl] = useState(plant?.imageUrl ?? '');
  const [habitat, setHabitat] = useState(plant?.habitat ?? '');
  const [usage, setUsage] = useState(plant?.usage ?? '');
  const [rarity, setRarity] = useState<PlantRarity | ''>(plant?.rarity ?? '');
  const [rarityNote, setRarityNote] = useState(plant?.rarityNote ?? '');
  const [description, setDescription] = useState(plant?.description ?? '');
  const [tags, setTags] = useState((plant?.tags ?? []).join(', '));
  const [price, setPrice] = useState(
    typeof plant?.suggestedPrice === 'number'
      ? String(plant.suggestedPrice)
      : '',
  );
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const pending = create.isPending || update.isPending;

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej název rostliny.');
      return;
    }
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const priceTrim = price.trim();
    const priceNum = priceTrim === '' ? null : Number(priceTrim);
    if (priceNum !== null && Number.isNaN(priceNum)) {
      setFormError('Navrhovaná cena musí být číslo.');
      return;
    }

    const payload: CreatePlantPayload = {
      name: name.trim(),
      aliases: aliases.trim() || undefined,
      imageUrl: imageUrl || undefined,
      habitat: habitat.trim() || undefined,
      usage: usage.trim() || undefined,
      rarity: rarity || undefined,
      rarityNote: rarityNote.trim() || undefined,
      description: description.trim() || undefined,
      tags: tagList.length ? tagList : undefined,
      suggestedPrice: priceNum,
    };

    if (isCreate) {
      create.mutate(payload, {
        onSuccess: (p) => {
          onSaved?.(p);
          onClose();
        },
      });
    } else {
      if (!plant) return;
      // edit = mění všechna pole; prázdné → vyprázdnit (posíláme '' místo undefined)
      update.mutate(
        {
          id: plant.id,
          patch: {
            name: name.trim(),
            aliases: aliases.trim(),
            imageUrl: imageUrl || '',
            habitat: habitat.trim(),
            usage: usage.trim(),
            rarity: rarity || undefined,
            rarityNote: rarityNote.trim(),
            description: description.trim(),
            tags: tagList,
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
      title={isCreate ? 'Nová rostlina' : 'Upravit rostlinu'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita a kurátoři ji můžou doladit a schválit.
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="pl-name">
          Název
        </label>
        <input
          id="pl-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="pl-aliases">
          Lidová jména
        </label>
        <input
          id="pl-aliases"
          className={s.input}
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="např. panenka Maria, mateřídouška…"
          maxLength={200}
        />
      </div>

      <div className={s.field}>
        {/* HeroUploadCard = vlastní widget → skupinový popisek span */}
        <span className={s.label}>Obrázek</span>
        <HeroUploadCard
          value={imageUrl}
          onChange={setImageUrl}
          compact
          uploadCta="Nahrát obrázek rostliny"
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-habitat">
            Roste
          </label>
          <input
            id="pl-habitat"
            className={s.input}
            value={habitat}
            onChange={(e) => setHabitat(e.target.value)}
            placeholder="kde se vyskytuje"
            maxLength={200}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-usage">
            Použití
          </label>
          <input
            id="pl-usage"
            className={s.input}
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="k čemu slouží"
            maxLength={200}
          />
        </div>
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-rarity">
            Vzácnost
          </label>
          <select
            id="pl-rarity"
            className={s.select}
            value={rarity}
            onChange={(e) => setRarity(e.target.value as PlantRarity | '')}
          >
            <option value="">— neurčeno —</option>
            {RARITY_OPTIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-rarity-note">
            Poznámka k vzácnosti
          </label>
          <input
            id="pl-rarity-note"
            className={s.input}
            value={rarityNote}
            onChange={(e) => setRarityNote(e.target.value)}
            maxLength={200}
          />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="pl-desc">
          Popis
        </label>
        <textarea
          id="pl-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="pl-tags"
            className={s.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="pl-price">
            Navrhovaná cena
          </label>
          <input
            id="pl-price"
            className={s.input}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
          />
        </div>
      </div>

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
