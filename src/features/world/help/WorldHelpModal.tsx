import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Modal } from '@/shared/ui';
import s from './WorldHelp.module.css';

/**
 * Modal pro in-situ nápovědu. Patička vždy odkazuje na plnou nápovědu
 * (nová záložka — ať uživatel nepřijde o rozehranou scénu / konverzaci).
 */
export function WorldHelpModal({
  open,
  onClose,
  title,
  size = 'md',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <Link
          to="/ikaros/napoveda?sekce=svet"
          className={s.fullLink}
          target="_blank"
          rel="noreferrer"
        >
          Plná nápověda <ExternalLink size={14} aria-hidden="true" />
        </Link>
      }
    >
      {children}
    </Modal>
  );
}
