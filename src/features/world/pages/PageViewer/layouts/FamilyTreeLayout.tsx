import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { EmptyState } from '@/shared/ui';
import { AkjBanner } from '../components/AkjBanner';
import { FamilyTreeCanvas } from './familyTree/FamilyTreeCanvas';
import type { Page } from '../../api/pages.types';

interface Props {
  page: Page;
}

/**
 * 17.7 — náhled typu Rodokmen (vizuální strom rodiny). Read-only plátno
 * (pan/zoom), klik na osobu s odkazem → přeskok na její stránku. Vzhled dědí
 * z motivu světa přes --theme-* (family-tree.module.css).
 */
export function FamilyTreeLayout({ page }: Props) {
  const navigate = useNavigate();
  const { worldSlug } = useWorldContext();
  const tree = page.familyTree ?? { people: [], unions: [] };

  if (tree.people.length === 0) {
    return (
      <>
        <AkjBanner accessRequirements={page.accessRequirements} />
        <EmptyState
          size="panel"
          title="Rodokmen je zatím prázdný"
          description="V úpravách stránky přidej první osobu a propoj rodinu."
        />
      </>
    );
  }

  return (
    <>
      <AkjBanner accessRequirements={page.accessRequirements} />
      <FamilyTreeCanvas
        people={tree.people}
        unions={tree.unions}
        mode="view"
        onNodeClick={(id) => {
          const p = tree.people.find((x) => x.id === id);
          if (p?.pageSlug) navigate(`/svet/${worldSlug}/${p.pageSlug}`);
        }}
      />
    </>
  );
}
