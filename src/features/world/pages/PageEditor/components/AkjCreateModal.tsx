import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ShieldAlert } from 'lucide-react';
import { Modal } from '@/shared/ui';
import { toast } from 'sonner';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldSettings } from '@/features/world/api/useWorldSettings';
import { useUpdateAkjTypes } from '@/features/world/api/useUpdateAkjTypes';
import { useCreatePage } from '../../api/useCreatePage';
import { slugify, slugifyWithFallback, uniqueSlug } from '../lib/slugify';
import type { AkjType } from '@/shared/types';
import s from './AkjCreateModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Volá se po úspěšném vytvoření nebo výběru existujícího AKJ.
   * Parent přidá do `accessRequirements` aktuální stránky.
   */
  onSelected: (akjKey: string) => void;
}

/**
 * 7.2e — Modal pro výběr existujícího nebo vytvoření nového AKJ.
 *
 * Sekce 1: Vyhledávání existujících AKJ (fuzzy match `name`).
 * Sekce 2: Vytvořit nový AKJ s detekcí duplicit:
 *  - exact name match → disabled „Vytvořit", banner navrhne použít existující
 *  - slug collision → auto-suffix `-2`, `-3`
 *  - meta page slug collision → silent skip toast
 *
 * Checkbox „Vytvořit i meta stránku" (default zapnuto) → auto-create
 * `akj-<key>` typu Ostatní s defaultním obsahem.
 */
export function AkjCreateModal({ open, onClose, onSelected }: Props) {
  const { worldId, worldSlug } = useWorldContext();
  const { data: settings } = useWorldSettings(worldId);
  const updateAkjTypes = useUpdateAkjTypes(worldId);
  const createPage = useCreatePage(worldId, worldSlug);

  const existingAkj = useMemo(() => settings?.akjTypes ?? [], [settings]);
  const nextLevelDefault = useMemo(
    () => (existingAkj.length > 0 ? Math.max(...existingAkj.map((a) => a.level)) + 1 : 1),
    [existingAkj],
  );

  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState<number>(nextLevelDefault);
  const [createMetaPage, setCreateMetaPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Reset při open
  useEffect(() => {
    if (open) {
      setQuery('');
      setName('');
      setLevel(nextLevelDefault);
      setCreateMetaPage(true);
    }
  }, [open, nextLevelDefault]);

  // Fuzzy match existing (sekce 1)
  const filtered = useMemo(() => {
    if (!query.trim()) return existingAkj.slice(0, 8);
    const q = query.toLowerCase();
    return existingAkj
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.key.toLowerCase().includes(q) ||
          String(a.level).includes(q),
      )
      .slice(0, 8);
  }, [existingAkj, query]);

  // Duplicate detection při psaní name (sekce 2)
  const exactMatch = useMemo(
    () =>
      name.trim().length > 0
        ? existingAkj.find(
            (a) => a.name.toLowerCase() === name.trim().toLowerCase(),
          )
        : undefined,
    [name, existingAkj],
  );

  const substringMatches = useMemo(() => {
    if (name.trim().length < 3 || exactMatch) return [];
    const q = name.toLowerCase();
    return existingAkj
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 3);
  }, [name, existingAkj, exactMatch]);

  const canCreate = name.trim().length > 0 && !exactMatch && !submitting;

  function applyExisting(akj: AkjType) {
    onSelected(akj.key);
    onClose();
    toast.success(`Přidán AKJ „${akj.name}"`);
  }

  async function handleCreate() {
    if (!canCreate) return;
    setSubmitting(true);
    try {
      // 1. Generate unique key (suffix collision)
      const baseKey = slugifyWithFallback(name, 'akj');
      const existingKeys = new Set(existingAkj.map((a) => a.key));
      const finalKey = uniqueSlug(baseKey, existingKeys);

      const trimmedName = name.trim();

      // 2. Update akjTypes
      const newAkj: AkjType = { key: finalKey, name: trimmedName, level };
      await updateAkjTypes.mutateAsync([...existingAkj, newAkj]);

      // 3. Optional: auto-create meta page
      if (createMetaPage) {
        try {
          await createPage.mutateAsync({
            slug: `akj-${finalKey}`,
            title: `AKJ ${trimmedName}`,
            type: 'Ostatní',
            content: `<p>Meta stránka úrovně přístupového klíče <strong>${trimmedName}</strong> (level ${level}). Doplň informace pro PJ.</p>`,
            accessRequirements: [{ type: 'AKJType', value: finalKey }],
          });
          toast.success(`AKJ „${trimmedName}" vytvořen, meta stránka založena`);
        } catch (err: unknown) {
          const errObj = err as {
            response?: { data?: { error?: { code?: string } } };
          };
          if (errObj?.response?.data?.error?.code === 'PAGE_SLUG_TAKEN') {
            toast.success(
              `AKJ „${trimmedName}" vytvořen, meta stránka už existovala`,
            );
          } else {
            toast.success(
              `AKJ „${trimmedName}" vytvořen (meta stránku se nepodařilo založit)`,
            );
          }
        }
      } else {
        toast.success(`AKJ „${trimmedName}" vytvořen`);
      }

      onSelected(finalKey);
      onClose();
    } catch {
      toast.error('Vytvoření AKJ selhalo');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="AKJ přístupový klíč" size="md">
      {/* SEKCE 1: Najít existující */}
      <section className={s.section}>
        <h3 className={s.sectionHeading}>
          <Search size={14} aria-hidden /> Najít existující AKJ
        </h3>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat podle názvu nebo úrovně…"
          className={s.searchInput}
        />
        {filtered.length === 0 ? (
          <p className={s.emptyHint}>
            {existingAkj.length === 0
              ? 'V tomto světě ještě nejsou žádné AKJ. Vytvoř první níže.'
              : 'Nic neodpovídá.'}
          </p>
        ) : (
          <ul className={s.list}>
            {filtered.map((a) => (
              <li key={a.key} className={s.card}>
                <div className={s.cardInfo}>
                  <strong className={s.cardName}>{a.name}</strong>
                  <span className={s.cardMeta}>
                    level {a.level} • <code>{a.key}</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyExisting(a)}
                  className={s.useBtn}
                >
                  Použít
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <hr className={s.divider} />

      {/* SEKCE 2: Vytvořit nový */}
      <section className={s.section}>
        <h3 className={s.sectionHeading}>
          <Plus size={14} aria-hidden /> Vytvořit nový AKJ
        </h3>

        {exactMatch && (
          <div className={s.warningBanner}>
            <ShieldAlert size={16} aria-hidden />
            <div>
              AKJ s názvem <strong>{exactMatch.name}</strong> už existuje
              (level {exactMatch.level}). Použij existující nahoře, nebo zvol
              jiný název.
              <button
                type="button"
                onClick={() => applyExisting(exactMatch)}
                className={s.bannerBtn}
              >
                Použít existující
              </button>
            </div>
          </div>
        )}

        {substringMatches.length > 0 && (
          <p className={s.suggestion}>
            Možná myslíš:{' '}
            {substringMatches.map((m, i) => (
              <span key={m.key}>
                <button
                  type="button"
                  onClick={() => applyExisting(m)}
                  className={s.suggestionChip}
                >
                  {m.name}
                </button>
                {i < substringMatches.length - 1 && ', '}
              </span>
            ))}
          </p>
        )}

        <div className={s.formGrid}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Název *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tajný spis"
              className={s.input}
              maxLength={60}
            />
            {name && (
              <small className={s.hint}>
                Slug: <code>{slugify(name)}</code>
              </small>
            )}
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>Úroveň</span>
            <input
              type="number"
              value={level}
              onChange={(e) =>
                setLevel(Math.max(0, Number(e.target.value) || 0))
              }
              min={0}
              max={99}
              className={s.input}
            />
          </label>
        </div>

        <label className={s.checkbox}>
          <input
            type="checkbox"
            checked={createMetaPage}
            onChange={(e) => setCreateMetaPage(e.target.checked)}
          />
          <span>
            <strong>Vytvořit i meta stránku</strong>
            <small className={s.hint}>
              Založí prázdnou stránku <code>akj-{slugify(name) || 'klic'}</code>
              , kterou pak doplníš.
            </small>
          </span>
        </label>

        <div className={s.actions}>
          <button type="button" onClick={onClose} className={s.cancelBtn}>
            Zrušit
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canCreate}
            className={s.createBtn}
          >
            {submitting ? 'Vytvářím…' : 'Vytvořit AKJ'}
          </button>
        </div>
      </section>
    </Modal>
  );
}
