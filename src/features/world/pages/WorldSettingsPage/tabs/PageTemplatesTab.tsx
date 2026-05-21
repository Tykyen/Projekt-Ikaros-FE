import { useState } from 'react';
import { toast } from 'sonner';
import {
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
  Plus,
  Pencil,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button, Spinner, ConfirmDialog } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldPageTemplates } from '@/features/world/pages/api/useWorldPageTemplates';
import { useCreateWorldPageTemplate } from '@/features/world/pages/api/useCreateWorldPageTemplate';
import { useUpdateWorldPageTemplate } from '@/features/world/pages/api/useUpdateWorldPageTemplate';
import { useDeleteWorldPageTemplate } from '@/features/world/pages/api/useDeleteWorldPageTemplate';
import type {
  WorldPageTemplate,
  WorldPageTemplateIcon,
} from '@/features/world/pages/api/worldPageTemplates.types';
import { SettingsPanel } from '../components/SettingsPanel';
import { TemplateEditorModal } from '../components/TemplateEditorModal';
import s from './PageTemplatesTab.module.css';

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
 * 8.1d — Správa per-svět šablon stránek. CRUD pro Korektor+ ve světě.
 * Šablony se používají v editoru stránek (DataTemplatePanel) jako stripe
 * karet pod Identity panelem.
 */
export default function PageTemplatesTab() {
  const { world } = useWorldContext();
  const worldId = world?.id ?? '';
  const { data: templates = [], isLoading } = useWorldPageTemplates(worldId);
  const createMut = useCreateWorldPageTemplate(worldId);
  const updateMut = useUpdateWorldPageTemplate(worldId);
  const deleteMut = useDeleteWorldPageTemplate(worldId);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingTpl, setDeletingTpl] = useState<WorldPageTemplate | null>(
    null,
  );

  if (!world) return null;

  const editing = editingId
    ? (templates.find((t) => t.id === editingId) ?? null)
    : null;

  async function handleDelete() {
    if (!deletingTpl) return;
    try {
      await deleteMut.mutateAsync(deletingTpl.id);
      toast.success(`Šablona „${deletingTpl.label}" smazána.`);
      setDeletingTpl(null);
    } catch {
      toast.error('Smazání šablony selhalo.');
    }
  }

  return (
    <SettingsPanel
      title="Šablony stránek"
      description="Šablony tabulky atributů pro nové stránky. PJ vytváří podle potřeb světa."
      action={
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setEditorOpen(true);
          }}
        >
          <Plus size={14} aria-hidden /> Nová šablona
        </Button>
      }
    >
      {isLoading ? (
        <Spinner center />
      ) : templates.length === 0 ? (
        <p className={s.empty}>
          Žádné šablony zatím nejsou. Vytvoř první kliknutím na <strong>Nová
          šablona</strong>. PJ stránek pak v editoru vidí šablony jako stripe
          karet a může je aplikovat na atributovou tabulku.
        </p>
      ) : (
        <ul className={s.list}>
          {templates.map((tpl) => {
            const Icon = getIcon(tpl.icon);
            return (
              <li key={tpl.id} className={s.card}>
                <div className={s.cardIcon}>
                  <Icon size={20} aria-hidden />
                </div>
                <div className={s.cardBody}>
                  <h3 className={s.cardLabel}>{tpl.label}</h3>
                  <p className={s.cardMeta}>
                    {tpl.headers.length}{' '}
                    {tpl.headers.length === 1 ? 'pole' : 'polí'}
                    {tpl.defaultTitle && (
                      <>
                        {' · '}
                        <span className={s.cardSubtle}>
                          „{tpl.defaultTitle}"
                        </span>
                      </>
                    )}
                  </p>
                  <p className={s.cardHeaders}>{tpl.headers.join(' · ')}</p>
                </div>
                <div className={s.cardActions}>
                  <button
                    type="button"
                    className={s.iconBtn}
                    onClick={() => {
                      setEditingId(tpl.id);
                      setEditorOpen(true);
                    }}
                    aria-label={`Upravit šablonu ${tpl.label}`}
                  >
                    <Pencil size={14} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={`${s.iconBtn} ${s.iconBtnDanger}`}
                    onClick={() => setDeletingTpl(tpl)}
                    aria-label={`Smazat šablonu ${tpl.label}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TemplateEditorModal
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingId(null);
        }}
        existing={editing}
        existingKeys={templates
          .filter((t) => t.id !== editingId)
          .map((t) => t.key)}
        onSubmit={async (input) => {
          try {
            if (editing) {
              await updateMut.mutateAsync({ id: editing.id, input });
              toast.success(`Šablona „${input.label}" uložena.`);
            } else {
              await createMut.mutateAsync({
                ...input,
                order: templates.length,
              });
              toast.success(`Šablona „${input.label}" vytvořena.`);
            }
            setEditorOpen(false);
            setEditingId(null);
          } catch (err) {
            const code = (
              err as { response?: { data?: { error?: { code?: string } } } }
            )?.response?.data?.error?.code;
            if (code === 'TEMPLATE_KEY_TAKEN') {
              toast.error('Klíč šablony už existuje v tomto světě.');
            } else {
              toast.error('Uložení šablony selhalo.');
            }
          }
        }}
        isPending={createMut.isPending || updateMut.isPending}
      />

      <ConfirmDialog
        open={deletingTpl !== null}
        title="Smazat šablonu?"
        message={`Šablona „${deletingTpl?.label ?? ''}" bude trvale odstraněna. Stávající stránky, které ji použily, zůstanou beze změny.`}
        confirmLabel="Smazat"
        cancelLabel="Zrušit"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeletingTpl(null)}
        isPending={deleteMut.isPending}
      />
    </SettingsPanel>
  );
}
