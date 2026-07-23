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
  topik,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Deep-link na akordeon plné nápovědy (?topik=…, MVP-B 07 §5.2). */
  topik?: string;
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
          to={`/ikaros/napoveda?sekce=svet${topik ? `&topik=${topik}` : ''}`}
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
