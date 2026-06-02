import { Modal, Button } from '@/shared/ui';
import {
  useScenarioTemplates,
  useDeleteScenarioTemplate,
  type ScenarioTemplate,
} from '../scenarioTemplates';
import s from './storyboard.module.css';

/** 11.2-ext E — výběr scény z knihovny šablon (per-PJ, cross-world). */
export function ScenarioTemplatesDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (template: ScenarioTemplate) => void;
}) {
  const { data: templates = [], isLoading } = useScenarioTemplates();
  const del = useDeleteScenarioTemplate();

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Knihovna scén — vlož šablonu">
      <div className={s.moveList}>
        {isLoading && <div className={s.linkEmpty}>Načítám…</div>}
        {!isLoading && templates.length === 0 && (
          <div className={s.linkEmpty}>
            Zatím žádné šablony. Ulož scénu přes „📑 Šablona".
          </div>
        )}
        {templates.map((t) => (
          <div key={t.id} className={s.templateRow}>
            <button
              type="button"
              className={s.templatePick}
              onClick={() => {
                onPick(t);
                onClose();
              }}
            >
              🎬 {t.name}
            </button>
            <Button
              variant="danger"
              size="sm"
              disabled={del.isPending}
              onClick={() => del.mutate(t.id)}
            >
              Smazat
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
