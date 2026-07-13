/**
 * 21.5f — editor komunitního ceníku. `create` = nový ceník (status 'draft');
 * `edit` = úprava všech polí (autor draftu / kurátor).
 *
 * Položky se editují inline (kompaktní řádek název · sekce · zl/st/md +
 * rozbalovací detail s popisem/obrázkem/atribucí/linkem na Předmět). Stav
 * drží CELÉ objekty položek — pole, která editor nemění (focal/zoom/fit,
 * imageBytes), projdou do payloadu beze změny (update = plná náhrada pole).
 */
import { useState } from 'react';
import { Modal, Button } from '@/shared/ui';
import { HeroUploadCard } from '@/features/world/pages/PageEditor/components/HeroUploadCard';
import { useKomunitniCenikyMutations } from '../hooks/useKomunitniCenikyMutations';
import {
  PRICE_LIST_MAX_ITEMS,
  type GlobalPriceList,
  type PriceListItemPayload,
  type CreatePriceListPayload,
} from '../types';
import s from './KomunitniCenikyForms.module.css';

interface Props {
  mode: 'create' | 'edit';
  cenik?: GlobalPriceList;
  onClose: () => void;
  onSaved?: (l: GlobalPriceList) => void;
}

function emptyItem(): PriceListItemPayload {
  return { name: '', gold: 0, silver: 0, copper: 0 };
}

/** `/ikaros/predmety/<id>` nebo holé id → id (tolerantní vstup). */
function normalizeLinkedItemId(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const m = t.match(/predmety\/([^/?#]+)/);
  return (m ? m[1] : t).slice(0, 64);
}

export function CenikEditorModal({ mode, cenik, onClose, onSaved }: Props) {
  const { create, update } = useKomunitniCenikyMutations();
  const [name, setName] = useState(cenik?.name ?? '');
  const [description, setDescription] = useState(cenik?.description ?? '');
  const [imageUrl, setImageUrl] = useState(cenik?.imageUrl ?? '');
  const [tags, setTags] = useState((cenik?.tags ?? []).join(', '));
  const [items, setItems] = useState<PriceListItemPayload[]>(
    () => (cenik?.items ?? []).map((it) => ({ ...it })),
  );
  const [expanded, setExpanded] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const isCreate = mode === 'create';
  const pending = create.isPending || update.isPending;

  const patchItem = (idx: number, patch: Partial<PriceListItemPayload>) =>
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );

  const moveItem = (idx: number, dir: -1 | 1) =>
    setItems((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setExpanded(null);
  };

  const addItem = () => {
    if (items.length >= PRICE_LIST_MAX_ITEMS) return;
    setItems((prev) => [...prev, emptyItem()]);
    setExpanded(items.length);
  };

  const submit = () => {
    setFormError('');
    if (!name.trim()) {
      setFormError('Zadej název ceníku.');
      return;
    }
    const bad = items.findIndex((it) => !it.name.trim());
    if (bad >= 0) {
      setFormError(`Položka č. ${bad + 1} nemá název.`);
      setExpanded(bad);
      return;
    }
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: CreatePriceListPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl || undefined,
      tags: tagList.length ? tagList : undefined,
      items: items.map((it) => ({
        ...it,
        name: it.name.trim(),
        description: it.description?.trim() || undefined,
        section: it.section?.trim() || undefined,
        imageUrl: it.imageUrl || undefined,
        imageCredit: it.imageCredit?.trim() || undefined,
        gold: Math.max(0, Math.floor(it.gold || 0)),
        silver: Math.max(0, Math.floor(it.silver || 0)),
        copper: Math.max(0, Math.floor(it.copper || 0)),
      })),
    };

    if (isCreate) {
      create.mutate(payload, {
        onSuccess: (l) => {
          onSaved?.(l);
          onClose();
        },
        onError: () => setFormError('Ceník se nepodařilo vytvořit.'),
      });
    } else {
      if (!cenik) return;
      // edit = mění všechna pole; prázdné → vyprázdnit ('' místo undefined)
      update.mutate(
        {
          id: cenik.id,
          patch: {
            ...payload,
            description: description.trim(),
            imageUrl: imageUrl || '',
            tags: tagList,
          },
        },
        {
          onSuccess: (l) => {
            onSaved?.(l);
            onClose();
          },
          onError: () => setFormError('Změny se nepodařilo uložit.'),
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
      title={isCreate ? 'Nový ceník' : 'Upravit ceník'}
      size="lg"
      footer={footer}
    >
      {isCreate ? (
        <p className={s.hint}>
          Vytvoří se jako návrh — komunita a kurátoři ho můžou doladit a
          schválit.
        </p>
      ) : null}

      <div className={s.field}>
        <label className={s.label} htmlFor="cl-name">
          Název
        </label>
        <input
          id="cl-name"
          className={s.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="cl-desc">
          Popis
        </label>
        <textarea
          id="cl-desc"
          className={s.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
      </div>

      <div className={s.row2}>
        <div className={s.field}>
          {/* HeroUploadCard = vlastní widget → skupinový popisek span */}
          <span className={s.label}>Obrázek ceníku</span>
          <HeroUploadCard
            value={imageUrl}
            onChange={setImageUrl}
            compact
            uploadCta="Nahrát obrázek ceníku"
          />
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="cl-tags">
            Štítky (oddělené čárkou)
          </label>
          <input
            id="cl-tags"
            className={s.input}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="např. jídlo, služby"
          />
        </div>
      </div>

      {/* ── Položky ── */}
      <div className={s.itemsHead}>
        <span className={s.itemsTitle}>Položky</span>
        <span className={s.itemsCount}>
          {items.length} / {PRICE_LIST_MAX_ITEMS}
        </span>
      </div>
      <p className={s.priceLegend}>ceny: zlaté · stříbrné · měďáky</p>

      {items.length > 0 ? (
        <ul className={s.itemList}>
          {items.map((it, idx) => (
            <li key={it.id ?? `new-${idx}`} className={s.itemRow}>
              <div className={s.itemGrid}>
                <input
                  className={s.input}
                  value={it.name}
                  onChange={(e) => patchItem(idx, { name: e.target.value })}
                  placeholder="Název položky"
                  maxLength={120}
                  aria-label={`Název položky ${idx + 1}`}
                />
                <input
                  className={s.input}
                  value={it.section ?? ''}
                  onChange={(e) => patchItem(idx, { section: e.target.value })}
                  placeholder="Sekce"
                  maxLength={80}
                  aria-label={`Sekce položky ${idx + 1}`}
                />
                <input
                  className={s.input}
                  type="number"
                  min={0}
                  value={it.gold}
                  onChange={(e) =>
                    patchItem(idx, { gold: Number(e.target.value) })
                  }
                  aria-label={`Zlaté — položka ${idx + 1}`}
                />
                <input
                  className={s.input}
                  type="number"
                  min={0}
                  value={it.silver}
                  onChange={(e) =>
                    patchItem(idx, { silver: Number(e.target.value) })
                  }
                  aria-label={`Stříbrné — položka ${idx + 1}`}
                />
                <input
                  className={s.input}
                  type="number"
                  min={0}
                  value={it.copper}
                  onChange={(e) =>
                    patchItem(idx, { copper: Number(e.target.value) })
                  }
                  aria-label={`Měďáky — položka ${idx + 1}`}
                />
                <span className={s.itemBtns}>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    title="Posunout výš"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === items.length - 1}
                    title="Posunout níž"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                    title="Detail položky"
                    aria-expanded={expanded === idx}
                  >
                    {expanded === idx ? '▾' : '▸'}
                  </button>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => removeItem(idx)}
                    title="Smazat položku"
                  >
                    ✕
                  </button>
                </span>
              </div>

              {expanded === idx ? (
                <div className={s.itemDetail}>
                  <div className={s.field}>
                    <label className={s.label} htmlFor={`cl-it-desc-${idx}`}>
                      Popis položky
                    </label>
                    <textarea
                      id={`cl-it-desc-${idx}`}
                      className={s.textarea}
                      value={it.description ?? ''}
                      onChange={(e) =>
                        patchItem(idx, { description: e.target.value })
                      }
                      maxLength={2000}
                    />
                  </div>
                  <div className={s.field}>
                    <span className={s.label}>Obrázek položky</span>
                    <HeroUploadCard
                      value={it.imageUrl ?? ''}
                      onChange={(url) => patchItem(idx, { imageUrl: url })}
                      compact
                      uploadCta="Nahrát obrázek položky"
                    />
                  </div>
                  <div className={s.row2}>
                    <div className={s.field}>
                      <label
                        className={s.label}
                        htmlFor={`cl-it-credit-${idx}`}
                      >
                        Atribuce obrázku (autor · zdroj · licence)
                      </label>
                      <input
                        id={`cl-it-credit-${idx}`}
                        className={s.input}
                        value={it.imageCredit ?? ''}
                        onChange={(e) =>
                          patchItem(idx, { imageCredit: e.target.value })
                        }
                        placeholder="u převzatých obrázků povinná"
                        maxLength={300}
                      />
                    </div>
                    <div className={s.field}>
                      <label className={s.label} htmlFor={`cl-it-link-${idx}`}>
                        Předmět se staty (odkaz / id)
                      </label>
                      <input
                        id={`cl-it-link-${idx}`}
                        className={s.input}
                        value={it.linkedItemId ?? ''}
                        onChange={(e) =>
                          patchItem(idx, {
                            linkedItemId: normalizeLinkedItemId(e.target.value),
                          })
                        }
                        placeholder="/ikaros/predmety/…"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={s.hint}>Ceník zatím nemá položky.</p>
      )}

      <Button
        variant="secondary"
        onClick={addItem}
        disabled={items.length >= PRICE_LIST_MAX_ITEMS}
      >
        ＋ Přidat položku
      </Button>

      {formError ? <p className={s.err}>{formError}</p> : null}
    </Modal>
  );
}
