import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Inbox } from 'lucide-react';
import { PendingActionType, UserRole } from '@/shared/types';
import { usePendingActions } from '../../../api/usePendingActions';
import { PendingActionCard } from './PendingActionCard';
import { PENDING_ACTION_RENDERERS } from './rendererRegistry';
import s from './ZpracovatTab.module.css';

interface ZpracovatTabProps {
  role: UserRole;
}

/**
 * Spec 1.4 — univerzální action queue. Pro Admin/Superadmin v 1.4 obsahuje
 * `username_request` (přesun z 1.3b). Pro ostatní role placeholder s odkazem
 * na fázi, která naplní jejich queue (1.8 / 2.4 / 3.x).
 */
export function ZpracovatTab({ role }: ZpracovatTabProps) {
  const isAdmin = role === UserRole.Superadmin || role === UserRole.Admin;

  if (!isAdmin) {
    return <RolePlaceholder role={role} />;
  }

  return <AdminZpracovat />;
}

function AdminZpracovat() {
  const qc = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const { data, isLoading, isError } = usePendingActions<{
    id: string;
    [key: string]: unknown;
  }>(PendingActionType.UsernameRequest, 1, 20);

  const renderer = PENDING_ACTION_RENDERERS[PendingActionType.UsernameRequest];

  if (isError) {
    return (
      <div className={s.tab}>
        <div className={s.empty}>
          <p className={s.emptyText}>Načítání selhalo. Zkus stránku obnovit.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={s.tab} aria-busy="true">
        <div className={s.skeleton} />
        <div className={s.skeleton} />
        <div className={s.skeleton} />
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className={s.tab}>
        <div className={s.empty}>
          <span className={s.emptyIcon} aria-hidden="true">
            <Inbox size={48} />
          </span>
          <h2 className={s.emptyTitle}>Nic ke zpracování</h2>
          <p className={s.emptyText}>
            Až přijde nová žádost, ukáže se zde. Tab agreguje všechny pending
            akce napříč moduly.
          </p>
        </div>
      </div>
    );
  }

  if (!renderer) {
    return (
      <div className={s.tab}>
        <div className={s.empty}>
          <p className={s.emptyText}>
            Pro typ `username_request` chybí renderer. (Vývojářská chyba.)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.tab}>
      {items.map((item) => (
        <PendingActionCard
          key={item.id}
          item={item}
          renderer={renderer}
          isResolving={resolvingId === item.id}
          onResolve={() => {
            setResolvingId(item.id);
            // Krátká animace + invalidace cache (mutace už invaliduje, ale
            // pro jistotu zde znovu — kdyby renderer cache nesáhl).
            setTimeout(() => {
              qc.invalidateQueries({ queryKey: ['pending-actions'] });
              setResolvingId(null);
            }, 320);
          }}
        />
      ))}
    </div>
  );
}

function RolePlaceholder({ role }: { role: UserRole }) {
  const text = placeholderTextForRole(role);
  return (
    <div className={s.tab}>
      <div className={s.empty}>
        <span className={s.emptyIcon} aria-hidden="true">
          <Inbox size={48} />
        </span>
        <h2 className={s.emptyTitle}>Brzy</h2>
        <p className={s.emptyText}>{text}</p>
      </div>
    </div>
  );
}

function placeholderTextForRole(role: UserRole): string {
  switch (role) {
    case UserRole.SpravceClanku:
      return 'Pending články ke schválení se objeví zde. Funkce přijde s krokem 3.2.';
    case UserRole.SpravceGalerie:
      return 'Pending obrázky ke schválení se objeví zde. Funkce přijde s krokem 3.3.';
    case UserRole.SpravceDiskuzi:
      return 'Hlášené příspěvky a žádosti o vstup do uzamčených diskuzí se objeví zde. Funkce přijde s krokem 3.4.';
    case UserRole.PJ:
      return 'Žádosti o vstup do tvých světů a žádosti o přátelství se objeví zde. Funkce přijdou s kroky 2.4 a 1.8.';
    default:
      return 'Žádosti o přátelství se objeví zde. Funkce přijde s krokem 1.8.';
  }
}
