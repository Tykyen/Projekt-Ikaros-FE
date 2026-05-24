import { useEffect, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { RichTextEditor } from '@/shared/ui/RichTextEditor';
import { useUpdatePage } from '../../api/useUpdatePage';
import type { Page, InfoBlock } from '../../api/pages.types';
import s from './PostavaLayout.module.css';
import sk from './soukrome.module.css';

interface Props {
  page: Page;
  worldId: string;
  worldSlug: string;
  canEdit: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * D-NEW-soukrome-tab — záložka „Soukromé" = privateContent + privateInfoBlocks.
 * Vidí jen PomocnyPJ+ a vlastník postavy (PostavaLayout filtruje tab).
 *
 * Inline edit (stejný pattern jako Notes/Finance) — auto-save debounced 800 ms.
 * Read-only fallback pro uživatele bez `canEdit` (např. budoucí role co
 * vidí, ale neupravují).
 */
export function SoukromeTab({
  page,
  canEdit,
  onDirtyChange,
}: Props) {
  if (!canEdit) {
    return <SoukromeView page={page} />;
  }
  return <SoukromeEditInline page={page} onDirtyChange={onDirtyChange} />;
}

// ── Read-only view ────────────────────────────────────────────────

function SoukromeView({ page }: { page: Page }) {
  const blocks = page.privateInfoBlocks ?? [];
  const hasContent = page.privateContent && page.privateContent.trim() !== '';

  if (blocks.length === 0 && !hasContent) {
    return (
      <div className={s.tabContent}>
        <p className={s.empty}>Soukromé informace zatím prázdné.</p>
      </div>
    );
  }

  return (
    <div className={s.tabContent}>
      <section className={s.privateSection}>
        <h2 className={s.sectionTitle}>
          <Lock size={14} aria-hidden /> Soukromé
        </h2>
        {blocks.length > 0 && <InfoBlockReadList blocks={blocks} />}
        {hasContent && (
          <div className={s.proseWrap}>
            <RichTextEditor
              value={page.privateContent ?? ''}
              readOnly
              className={s.prose}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function InfoBlockReadList({ blocks }: { blocks: InfoBlock[] }) {
  return (
    <dl className={s.blocks}>
      {blocks.map((b, i) => (
        <div key={i} className={s.blockRow}>
          <dt
            className={s.blockLabel}
            dangerouslySetInnerHTML={{ __html: b.label }}
          />
          <dd
            className={s.blockValue}
            dangerouslySetInnerHTML={{ __html: b.value || '—' }}
          />
        </div>
      ))}
    </dl>
  );
}

// ── Inline edit ───────────────────────────────────────────────────

interface EditProps {
  page: Page;
  onDirtyChange: (dirty: boolean) => void;
}

function SoukromeEditInline({ page, onDirtyChange }: EditProps) {
  const update = useUpdatePage(page.worldId ?? '', '');
  const [privateContent, setPrivateContent] = useState(
    page.privateContent ?? '',
  );
  const [blocks, setBlocks] = useState<InfoBlock[]>(
    page.privateInfoBlocks ?? [],
  );
  const [savedContent, setSavedContent] = useState(privateContent);
  const [savedBlocksJSON, setSavedBlocksJSON] = useState(JSON.stringify(blocks));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const blocksJSON = JSON.stringify(blocks);
  const dirty =
    privateContent !== savedContent || blocksJSON !== savedBlocksJSON;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setStatus('saving');
      update.mutate(
        {
          id: page.id ?? '',
          input: {
            privateContent,
            privateInfoBlocks: blocks,
          },
        },
        {
          onSuccess: () => {
            setSavedContent(privateContent);
            setSavedBlocksJSON(blocksJSON);
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 1500);
          },
          onError: () => {
            setStatus('idle');
            toast.error('Uložení selhalo');
          },
        },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privateContent, blocksJSON, dirty]);

  function updateBlock(index: number, patch: Partial<InfoBlock>) {
    setBlocks((prev) =>
      prev.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    );
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { label: '', value: '' }]);
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className={s.tabContent}>
      <section className={sk.card}>
        <header className={sk.headerRow}>
          <h2 className={sk.title}>
            <Lock size={14} aria-hidden /> Soukromé
          </h2>
          <StatusIndicator status={status} dirty={dirty} />
        </header>

        <div className={sk.blocks}>
          {blocks.map((b, i) => (
            <div key={i} className={sk.row}>
              <input
                type="text"
                className={`${sk.input} ${sk.inputLabel}`}
                placeholder="Štítek (např. Tajný kontakt)"
                value={b.label}
                onChange={(e) => updateBlock(i, { label: e.target.value })}
              />
              <input
                type="text"
                className={`${sk.input} ${sk.inputValue}`}
                placeholder="Hodnota"
                value={b.value}
                onChange={(e) => updateBlock(i, { value: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeBlock(i)}
                title="Smazat řádek"
                aria-label="Smazat řádek"
                className={sk.iconBtn}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          ))}
          <button type="button" onClick={addBlock} className={sk.addBtn}>
            + Přidat řádek
          </button>
        </div>

        <div className={sk.proseWrap}>
          <RichTextEditor
            value={privateContent}
            onChange={setPrivateContent}
            placeholder="Soukromé poznámky k postavě (vidí jen PJ a vlastník)…"
          />
        </div>
      </section>
    </div>
  );
}

function StatusIndicator({
  status,
  dirty,
}: {
  status: 'idle' | 'saving' | 'saved';
  dirty: boolean;
}) {
  if (status === 'saving') return <span className={sk.status}>Ukládám…</span>;
  if (status === 'saved')
    return <span className={`${sk.status} ${sk.statusSaved}`}>Uloženo ✓</span>;
  if (dirty)
    return (
      <span className={sk.status}>
        Nezapsáno…
      </span>
    );
  return null;
}
