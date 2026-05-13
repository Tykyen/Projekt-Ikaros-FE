import { useRef, type ReactNode } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import s from './ConfirmDialog.module.css';

type Variant = 'primary' | 'danger';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: Variant;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
}

/**
 * Sdílený confirm dialog primitiv (spec 1.8 §4 Q1=B).
 *
 * Wrapper nad existující `<Modal>` se dvěma tlačítky (cancel + confirm).
 * Modal sám řeší focus management, ESC zavírání a backdrop close — zde
 * jen poskytujeme uniformní API a vizuální shape.
 *
 * Defaultní focus padá na cancel button (Modal preferuje první focusable,
 * který v body kontejneru není — proto explicit `ref` níže).
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Zrušit',
  confirmVariant = 'primary',
  onConfirm,
  isPending,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnBackdrop={!isPending}
      footer={
        <>
          <Button
            ref={cancelRef}
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="md"
            onClick={() => void onConfirm()}
            loading={isPending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={s.body}>{message}</div>
    </Modal>
  );
}
