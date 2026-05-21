import { useEffect, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import s from './QuoteSelectionPopup.module.css';

interface Props {
  /** Container, ve kterém sledujeme výběr textu. */
  containerRef: RefObject<HTMLElement | null>;
  /** Title stránky — použito v citaci. */
  pageTitle: string;
  /** Min počet znaků selekce, aby se popup zobrazil. Default 5. */
  minLength?: number;
}

interface PopupState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  /** Heading nejbližšího předka (pro Anchor link). */
  anchorId: string | null;
}

/**
 * 7.1h — Floating popup po výběru textu. Dvě akce:
 *  • Kopírovat citát — `"text" — [pageTitle] (URL)`
 *  • Anchor link — URL s `#section-id` nejbližšího predchozího heading (`<h2>`/`<h3>`)
 *    s `id` od AutoTOC (nebo manuální `id`).
 *
 * Selection API native; žádná lib. Popup zmizí na mousedown mimo, na Esc,
 * nebo když selection.length === 0.
 */
export function QuoteSelectionPopup({
  containerRef,
  pageTitle,
  minLength = 5,
}: Props) {
  const [state, setState] = useState<PopupState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
    anchorId: null,
  });

  useEffect(() => {
    function onMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }
      const text = sel.toString().trim();
      if (text.length < minLength) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }
      const range = sel.getRangeAt(0);
      // Pouze pokud selection je uvnitř našeho containeru
      if (
        !containerRef.current ||
        !containerRef.current.contains(range.commonAncestorContainer)
      ) {
        setState((s) => ({ ...s, visible: false }));
        return;
      }
      const rect = range.getBoundingClientRect();
      const anchorId = findAnchorIdFor(range);

      setState({
        visible: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        text,
        anchorId,
      });
    }
    function onMouseDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-quote-popup]')) return;
      setState((s) => ({ ...s, visible: false }));
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setState((s) => ({ ...s, visible: false }));
    }
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [containerRef, minLength]);

  if (!state.visible) return null;

  const url = `${window.location.origin}${window.location.pathname}`;
  const onCopyQuote = () => {
    const quote = `„${state.text}" — ${pageTitle} (${url})`;
    void navigator.clipboard.writeText(quote);
    toast.success('Citát zkopírován');
    setState((st) => ({ ...st, visible: false }));
  };
  const onCopyAnchor = () => {
    const anchor = state.anchorId ? `#${state.anchorId}` : '';
    void navigator.clipboard.writeText(`${url}${anchor}`);
    toast.success(state.anchorId ? 'Odkaz na sekci zkopírován' : 'Odkaz zkopírován');
    setState((st) => ({ ...st, visible: false }));
  };

  return createPortal(
    <div
      className={s.popup}
      data-quote-popup
      style={{
        left: state.x,
        top: state.y,
        transform: 'translate(-50%, -100%)',
      }}
      role="toolbar"
      aria-label="Akce s vybraným textem"
    >
      <button type="button" onClick={onCopyQuote} className={s.btn}>
        <Copy size={14} aria-hidden /> Kopírovat citát
      </button>
      <button type="button" onClick={onCopyAnchor} className={s.btn}>
        <LinkIcon size={14} aria-hidden />
        {state.anchorId ? 'Anchor link' : 'Kopírovat link'}
      </button>
    </div>,
    document.body,
  );
}

/**
 * Najde `id` nejbližšího předchozího `<h2>` / `<h3>` v DOM stromu — pro
 * anchor link na sekci.
 */
function findAnchorIdFor(range: Range): string | null {
  let node: Node | null = range.startContainer;
  while (node) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      /^H[1-6]$/.test((node as Element).tagName) &&
      (node as Element).id
    ) {
      return (node as Element).id;
    }
    if (node.previousSibling) {
      node = node.previousSibling;
      // descend last children
      while (node && node.lastChild) node = node.lastChild;
    } else {
      node = node.parentNode;
    }
  }
  return null;
}
