import { WorldRole } from '@/shared/types';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldCurrencies } from '@/features/world/currencies/api';
import {
  ConverterSection,
  CurrenciesListSection,
} from '@/features/world/currencies/components';
import s from './CurrencyPage.module.css';

/**
 * Krok 11.4 — stránka `/svet/:worldSlug/prevodnik-men`.
 *
 * IA = stack: Převodník (každý člen) + Měny ve světě (PJ+ vidí kebab,
 * PomocnyPJ vidí edit/set-as-base, hráč jen čte).
 *
 * Role gate (FE UI hiding — BE je autoritativní per spec §4.8b):
 *   - canEdit       = PomocnyPJ+ → kebab „Upravit" + „Nastavit jako základ"
 *   - canAddOrDelete = PJ+ → tlačítko „+ Přidat" + kebab „Smazat"
 *   - Globální Admin/Superadmin bypass řeší BE.
 */
export default function CurrencyPage() {
  const { worldId, userRole, loading: worldLoading } = useWorldContext();
  const viewerRole = userRole ?? WorldRole.Zadatel;
  const { data, isLoading } = useWorldCurrencies(worldId);
  const items = data?.items ?? [];

  const canEdit = viewerRole >= WorldRole.PomocnyPJ;
  const canAddOrDelete = viewerRole >= WorldRole.PJ;

  if (worldLoading || isLoading) {
    return (
      <div className={s.page}>
        <header className={s.header}>
          <h1 className={s.title}>Převodník měn</h1>
        </header>
        <div className={s.skeleton} aria-busy="true" aria-label="Načítám měny…" />
      </div>
    );
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Převodník měn</h1>
        <p className={s.subtitle}>
          Spočítej hodnotu mezi měnami světa.{' '}
          {canEdit && 'Měny můžeš upravovat níže.'}
        </p>
      </header>
      <div className={s.content}>
        <ConverterSection worldId={worldId} items={items} />
        <CurrenciesListSection
          worldId={worldId}
          items={items}
          canEdit={canEdit}
          canAddOrDelete={canAddOrDelete}
        />
      </div>
    </div>
  );
}
