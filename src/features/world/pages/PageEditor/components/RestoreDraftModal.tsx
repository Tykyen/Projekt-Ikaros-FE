import { Modal } from '@/shared/ui';
import type { PageEditorFormState } from '../hooks/usePageEditorState';
import s from './RestoreDraftModal.module.css';

interface Props {
  open: boolean;
  candidate: PageEditorFormState | null;
  onAccept: (state: PageEditorFormState) => void;
  onDiscard: () => void;
}

/**
 * 7.2l — Modal nabízí obnovu plného form draftu z localStorage při mountu.
 * Ukáže preview titulu + počet sekcí + má-li content / table / gallery,
 * aby user věděl co se obnoví.
 */
export function RestoreDraftModal({
  open,
  candidate,
  onAccept,
  onDiscard,
}: Props) {
  if (!candidate) return null;

  const summary = buildSummary(candidate);

  return (
    <Modal
      open={open}
      onClose={onDiscard}
      title="Máš rozpracovaný draft"
      size="md"
    >
      <p className={s.text}>
        V prohlížeči je uložen rozpracovaný draft, který nebyl uložen na server.
        Chceš pokračovat s ním, nebo ho zahodit?
      </p>

      <div className={s.preview}>
        <div className={s.previewItem}>
          <span className={s.previewLabel}>Titul</span>
          <span className={s.previewValue}>
            {candidate.title || <em>(beze jména)</em>}
          </span>
        </div>
        <div className={s.previewItem}>
          <span className={s.previewLabel}>Typ</span>
          <span className={s.previewValue}>{candidate.type}</span>
        </div>
        {summary.length > 0 && (
          <div className={s.previewItem}>
            <span className={s.previewLabel}>Obsah</span>
            <span className={s.previewValue}>{summary.join(' • ')}</span>
          </div>
        )}
      </div>

      <div className={s.actions}>
        <button type="button" onClick={onDiscard} className={s.btnSecondary}>
          Zahodit draft
        </button>
        <button
          type="button"
          onClick={() => onAccept(candidate)}
          className={s.btnPrimary}
        >
          Pokračovat s draftem
        </button>
      </div>
    </Modal>
  );
}

function buildSummary(state: PageEditorFormState): string[] {
  const parts: string[] = [];
  if ((state.content ?? '').trim().length > 0) {
    parts.push(`text (${countWords(state.content)} slov)`);
  }
  if ((state.sections?.length ?? 0) > 0) {
    parts.push(`${state.sections.length} sekcí`);
  }
  if ((state.table?.headers?.length ?? 0) > 0) {
    parts.push(`tabulka ${state.table.headers?.length} řádků`);
  }
  if ((state.galleryImages?.length ?? 0) > 0) {
    parts.push(`${state.galleryImages.length} obrázků v galerii`);
  }
  if ((state.videos?.length ?? 0) > 0) {
    parts.push(`${state.videos.length} videí`);
  }
  if ((state.menu?.length ?? 0) > 0) {
    parts.push(`${state.menu.length} položek v menu`);
  }
  if ((state.accessRequirements?.length ?? 0) > 0) {
    parts.push(`${state.accessRequirements.length} přístupových omezení`);
  }
  return parts;
}

function countWords(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
