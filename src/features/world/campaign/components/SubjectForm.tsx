import { useMemo, useState } from 'react';
import { Button, Input, Modal } from '@/shared/ui';
import { usePagesDirectory } from '@/features/world/pages/api/usePagesDirectory';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import type { PageDirectoryEntry } from '@/features/world/pages/api/pages.types';
import { SUBJECT_TYPES, TYPE_LABELS } from '../labels';
import type {
  CampaignSubject,
  CampaignSubjectStatus,
  CampaignSubjectType,
  CreateSubjectInput,
} from '../types';
import s from './campaign.module.css';

/** Typ stránky (adresář světa) → typ subjektu. `null` = ponech zvolený. */
function pageTypeToSubjectType(pageType: string): CampaignSubjectType | null {
  switch (pageType) {
    case 'Postava hráče':
      return 'PC';
    case 'NPC':
      return 'NPC';
    case 'Lokace':
      return 'LOCATION';
    default:
      return null;
  }
}

const MAX_SUGGESTIONS = 8;

/**
 * Formulář subjektu (modal). Prezentační — `onSubmit` dostane hotový vstup,
 * mutaci řeší rodič. `initial.id` rozlišuje create vs edit.
 *
 * Pole „Jméno" našeptává existující stránky světa (postavy / CP / lokace…) —
 * výběr doplní slug a typ. Volný text zůstává možný (kampaňový subjekt bez vazby).
 */
export function SubjectForm({
  open,
  worldId,
  initial,
  isPending,
  onClose,
  onSubmit,
}: {
  open: boolean;
  worldId: string;
  initial?: Partial<CampaignSubject>;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSubjectInput) => void;
}) {
  // Stav se inicializuje z `initial` při mountu; rodič komponentu remountuje
  // přes `key` při každém otevření (React-doporučená alternativa k reset-efektu).
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<CampaignSubjectType>(initial?.type ?? 'NPC');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [status, setStatus] = useState<CampaignSubjectStatus>(
    initial?.status ?? 'active',
  );
  const [linkedPageSlug, setLinkedPageSlug] = useState(
    initial?.linkedPageSlug ?? '',
  );
  const [linkedCharacterSlug, setLinkedCharacterSlug] = useState(
    initial?.linkedCharacterSlug ?? '',
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? '');
  const [error, setError] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  // Dva zdroje: persona adresář (PC/NPC — to co je v Postavách) + adresář
  // stránek (lokace a ostatní). Sloučeno dedupem dle slugu (persona má přednost).
  const { data: personaDir } = usePersonaDirectory(worldId);
  const { data: pagesDir } = usePagesDirectory(worldId);
  const directory = useMemo(() => {
    const bySlug = new Map<string, PageDirectoryEntry>();
    for (const e of pagesDir ?? []) bySlug.set(e.slug, e);
    for (const e of personaDir ?? []) bySlug.set(e.slug, e);
    return [...bySlug.values()];
  }, [personaDir, pagesDir]);

  const suggestions = useMemo(() => {
    const q = name.trim().toLocaleLowerCase('cs');
    if (!q) return [];
    return directory
      .filter(
        (p) =>
          p.title.toLocaleLowerCase('cs').includes(q) ||
          p.slug.toLocaleLowerCase('cs').includes(q),
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [directory, name]);

  function applyEntry(entry: PageDirectoryEntry) {
    setName(entry.title);
    setLinkedPageSlug(entry.slug);
    if (entry.imageUrl) setAvatarUrl(entry.imageUrl);
    const mapped = pageTypeToSubjectType(entry.type);
    if (mapped) {
      setType(mapped);
      if (mapped === 'PC' || mapped === 'NPC') setLinkedCharacterSlug(entry.slug);
    }
    setShowSuggest(false);
  }

  function onNameChange(value: string) {
    setName(value);
    setError('');
    setShowSuggest(true);
    // Přesná shoda názvu (ci) → automaticky doplň slug + typ i bez kliknutí.
    if (!linkedPageSlug.trim()) {
      const q = value.trim().toLocaleLowerCase('cs');
      const exact = directory.find((p) => p.title.toLocaleLowerCase('cs') === q);
      if (exact) applyEntry(exact);
    }
  }

  function submit() {
    if (!name.trim()) {
      setError('Jméno je povinné');
      return;
    }
    onSubmit({
      name: name.trim(),
      type,
      status,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      linkedPageSlug: linkedPageSlug.trim() || undefined,
      linkedCharacterSlug: linkedCharacterSlug.trim() || undefined,
      avatarUrl: avatarUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? 'Upravit subjekt' : 'Nový subjekt'}
      footer={
        <div className={s.formActions}>
          <Button variant="ghost" onClick={onClose}>
            Zrušit
          </Button>
          <Button onClick={submit} loading={isPending}>
            {initial?.id ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      }
    >
      <div className={s.form}>
        <div className={s.autocomplete}>
          <Input
            label="Jméno"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onFocus={() => name.trim() && setShowSuggest(true)}
            onBlur={() => window.setTimeout(() => setShowSuggest(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && suggestions.length > 0) {
                e.preventDefault();
                applyEntry(suggestions[0]!);
              } else if (e.key === 'Escape') {
                setShowSuggest(false);
              }
            }}
            error={error || undefined}
            placeholder="Jméno subjektu nebo hledej existující…"
            autoComplete="off"
            autoFocus
          />
          {showSuggest && suggestions.length > 0 && (
            <div className={s.acDropdown} role="listbox">
              {suggestions.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className={s.acOption}
                  onMouseDown={() => applyEntry(p)}
                >
                  <span className={s.acTitle}>{p.title}</span>
                  <span className={s.acType}>{p.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={s.formRow}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Typ</span>
            <select
              className={s.select}
              value={type}
              onChange={(e) => setType(e.target.value as CampaignSubjectType)}
            >
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Status</span>
            <select
              className={s.select}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CampaignSubjectStatus)
              }
            >
              <option value="active">Aktivní</option>
              <option value="archived">Archivovaný</option>
            </select>
          </label>
        </div>
        <Input
          label="Štítky (oddělené čárkou)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="politika, magie"
        />
        <Input
          label="Slug wiki stránky (volitelné)"
          value={linkedPageSlug}
          onChange={(e) => setLinkedPageSlug(e.target.value)}
          placeholder="napr-mesto-kamenec"
        />
        <Input
          label="Slug postavy (volitelné)"
          value={linkedCharacterSlug}
          onChange={(e) => setLinkedCharacterSlug(e.target.value)}
          placeholder="napr-aragorn"
        />
        <label className={s.field}>
          <span className={s.fieldLabel}>Poznámka</span>
          <textarea
            className={s.textarea}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Interní poznámka…"
          />
        </label>
      </div>
    </Modal>
  );
}
