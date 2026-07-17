import type { ReactNode } from 'react';
import { Spinner, ErrorState } from '@/shared/ui';
import s from './SettingsPanel.module.css';

/**
 * Minimální kontrakt React Query výsledku, který panel potřebuje. Záměrně NE
 * `UseQueryResult` — panel nemá vědět nic o typu dat, jen o stavu načtení.
 */
export interface SettingsPanelQuery {
  isLoading: boolean;
  isError: boolean;
  refetch?: () => unknown;
}

interface Props {
  title: string;
  description?: string;
  /** Akční prvek vpravo nahoře (např. tlačítko Uložit). */
  action?: ReactNode;
  /**
   * Dotaz, ze kterého tab čte nastavení. **Předej ho vždy, když tab renderuje
   * formulář nad načtenými daty** — panel pak sám řeší spinner i chybu.
   *
   * Proč to není na tabech: formuláře si data normalizují přes
   * `normalize(q.data?.x)`, což na chybové cestě vrátí **hardcoded defaulty**.
   * Taby měly `isLoading` guard, ale `isError` ani jeden → při 500 se vykreslil
   * formulář s defaulty, jako by byly uložené, a aktivní „Uložit" je zapsal
   * **přes reálná data v DB** (tichá ztráta nastavení světa). Centralizací sem
   * to nový tab nemá jak zopakovat — stačí předat `query`.
   */
  query?: SettingsPanelQuery;
  children: ReactNode;
}

/**
 * 5.3 — obal sekce uvnitř tabu. Vizuální jazyk `SectionCard` z CreateWorldPage,
 * ale bez číslovaného markeru (taby nemají pořadí jako wizard).
 */
export function SettingsPanel({
  title,
  description,
  action,
  query,
  children,
}: Props) {
  const showAction = action && !query?.isLoading && !query?.isError;

  return (
    <section className={s.panel} data-elev="panel">
      <header className={s.header}>
        <div>
          <h2 className={s.title}>{title}</h2>
          {description && <p className={s.description}>{description}</p>}
        </div>
        {showAction && <div className={s.action}>{action}</div>}
      </header>
      <div className={s.body}>
        {query?.isLoading ? (
          <Spinner center />
        ) : query?.isError ? (
          <ErrorState
            size="panel"
            title="Nastavení se nepodařilo načíst"
            description="Formulář radši neukazujeme — mohl by zobrazit výchozí hodnoty místo těch tvých a uložením je přepsat. Zkus to prosím znovu."
            onRetry={query.refetch ? () => void query.refetch?.() : undefined}
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
