import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutTemplate,
  FileText,
  MapPin,
  Users,
  Sword,
  Coins,
  BookOpen,
  Globe,
  Building2,
  Crown,
  Network,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { Modal } from '@/shared/ui';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldPageTemplates } from '../../api/useWorldPageTemplates';
import type {
  WorldPageTemplate,
  WorldPageTemplateIcon,
} from '../../api/worldPageTemplates.types';
import type { PageTable } from '../../api/pages.types';
import s from './DataTemplatePanel.module.css';

/**
 * 8.1c — Horizontální stripe karet šablon pod Identity panelem.
 *
 * První karta „Volný text" vypne `table.hasTable`. Ostatní karty aplikují
 * šablonu (headers + defaultTitle, values prázdné — PJ vyplní). Pokud má
 * stránka rozepsanou tabulku, klik na novou šablonu otevře warning modal.
 *
 * Šablony jsou per-svět (BE entity `WorldPageTemplate`). Nový svět nemá
 * šablony žádné → zobrazí se jen „Volný text" karta + tip jak vytvořit.
 */
interface Props {
  table: PageTable;
  onChange: (table: PageTable) => void;
}

const ICON_MAP: Record<WorldPageTemplateIcon, LucideIcon> = {
  FileText,
  MapPin,
  Users,
  Sword,
  Coins,
  BookOpen,
  Globe,
  Building2,
  Crown,
  Network,
};

function getIcon(icon?: string): LucideIcon {
  if (icon && icon in ICON_MAP) return ICON_MAP[icon as WorldPageTemplateIcon];
  return FileText;
}

/**
 * Čeká na potvrzení přepnutí, které přepíše rozepsanou tabulku. Discriminated
 * union — `free` = přepnout na „Volný text", `template` = aplikovat šablonu.
 */
type PendingSwitch =
  | { kind: 'free' }
  | { kind: 'template'; template: WorldPageTemplate };

export function DataTemplatePanel({ table, onChange }: Props) {
  const { worldId, worldSlug } = useWorldContext();
  const { data: templates = [], isLoading } = useWorldPageTemplates(worldId);
  const [pending, setPending] = useState<PendingSwitch | null>(null);

  // Match aktivní šablony — porovnáváme headers (kopie v table). Funkce
  // identity: pokud table.hasTable=false → aktivní je „Volný text".
  const activeKey = useMemo(() => {
    if (!table.hasTable) return '__free__';
    const joined = (table.headers ?? []).join('|');
    return templates.find((t) => t.headers.join('|') === joined)?.key ?? null;
  }, [table, templates]);

  const hasUnsavedTableData =
    table.hasTable &&
    ((table.headers ?? []).some((h) => h) ||
      (table.values ?? []).some((v) => v) ||
      (table.title ?? '').length > 0);

  function applyFree() {
    onChange({ hasTable: false, title: '', headers: [], values: [] });
    setPending(null);
  }

  function applyTemplate(t: WorldPageTemplate) {
    onChange({
      hasTable: true,
      title: t.defaultTitle ?? '',
      headers: [...t.headers],
      values: t.headers.map(() => ''),
    });
    setPending(null);
  }

  function onPickTemplate(t: WorldPageTemplate) {
    if (hasUnsavedTableData && activeKey !== t.key) {
      setPending({ kind: 'template', template: t });
    } else {
      applyTemplate(t);
    }
  }

  function onPickFree() {
    if (hasUnsavedTableData) {
      setPending({ kind: 'free' });
    } else {
      applyFree();
    }
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === 'free') applyFree();
    else applyTemplate(pending.template);
  }

  return (
    <CollapsiblePanel
      title="Datová šablona & režim editoru"
      icon={<LayoutTemplate size={18} aria-hidden />}
      defaultOpen
    >
      <div className={s.stripWrap}>
        <div className={s.strip} role="radiogroup" aria-label="Šablony tabulky">
          {/* „Volný text" karta — vždy první. */}
          <button
            type="button"
            role="radio"
            aria-checked={activeKey === '__free__'}
            className={`${s.card} ${activeKey === '__free__' ? s.cardActive : ''}`}
            onClick={onPickFree}
          >
            <span className={s.cardIcon}>
              <FileText size={20} aria-hidden />
            </span>
            <span className={s.cardLabel}>Volný text</span>
            <span className={s.cardDesc}>Bez definice</span>
          </button>

          {/* Per-svět šablony. */}
          {templates.map((t) => {
            const Icon = getIcon(t.icon);
            const active = activeKey === t.key;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${s.card} ${active ? s.cardActive : ''}`}
                onClick={() => onPickTemplate(t)}
                title={`${t.label} — ${t.headers.length} polí`}
              >
                <span className={s.cardIcon}>
                  <Icon size={20} aria-hidden />
                </span>
                <span className={s.cardLabel}>{t.label}</span>
                <span className={s.cardDesc}>
                  {t.headers.length} {t.headers.length === 1 ? 'pole' : 'polí'}
                </span>
              </button>
            );
          })}
        </div>

        {!isLoading && templates.length === 0 && (
          <p className={s.emptyHint}>
            💡 Tento svět zatím nemá žádné šablony.{' '}
            <Link
              to={`/svet/${worldSlug}/nastaveni#sablony`}
              className={s.emptyLink}
            >
              Vytvořit v Nastavení →
            </Link>
          </p>
        )}
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Přepsat existující data tabulky?"
        size="sm"
      >
        <p className={s.modalText}>
          <AlertTriangle size={16} aria-hidden />{' '}
          {pending?.kind === 'free'
            ? 'Přepnutí na „Volný text" odstraní stávající hlavičky a hodnoty tabulky.'
            : `Šablona „${pending?.template.label}" přepíše současné hlavičky tabulky.`}{' '}
          Tato akce je nevratná (dokud stránku neuložíš se starým obsahem).
        </p>
        <div className={s.modalActions}>
          <button
            type="button"
            onClick={() => setPending(null)}
            className={s.modalBtnGhost}
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={confirmPending}
            className={s.modalBtnDanger}
          >
            Přepsat
          </button>
        </div>
      </Modal>
    </CollapsiblePanel>
  );
}
