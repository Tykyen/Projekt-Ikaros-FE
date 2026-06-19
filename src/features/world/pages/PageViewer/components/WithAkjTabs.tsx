import { useState, type ReactNode } from 'react';
import { FileText, Lock, Unlock } from 'lucide-react';
import { Tabs, type TabItem } from '@/shared/ui';
import { usePrintMode } from '@/features/world/export/print';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { OstatniLayout } from '../layouts/OstatniLayout';
import { AkjLockedPanel } from './AkjLockedPanel';
import { resolveAkjTabPage, sortedAkjTabs } from '../lib/resolveAkjTab';
import type { Page } from '../../api/pages.types';

interface Props {
  page: Page;
  /** Render základní stránky (konkrétní layout dle typu). */
  children: ReactNode;
}

const BASE_ID = '__base';

/**
 * Univerzální obal pro „flat" layouty (Ostatní/Galerie/Noviny/…) bez vlastní
 * lišty. Když stránka má AKJ chráněné záložky (BE už je odfiltroval na ty
 * dostupné), přidá lištu `[Obsah | AKJ…]`. AKJ záložka se renderuje přes
 * `OstatniLayout` s efektivní stránkou (merge override ?? základ).
 *
 * Layouty s vlastní lištou (Lokace/Postava/NPC) tento obal NEpoužívají —
 * AKJ záložky si vsazují přímo vedle Kalendáře.
 */
export function WithAkjTabs({ page, children }: Props) {
  const { worldId } = useWorldContext();
  const akjTabs = sortedAkjTabs(page);
  const [activeId, setActiveId] = useState(BASE_ID);
  const printMode = usePrintMode();

  if (akjTabs.length === 0) return <>{children}</>;

  // Tisk: místo lišty vykreslíme Obsah + všechny ODEMČENÉ záložky pod sebe
  // (zamčené hráč nevidí → vynecháme). Jinak by se vytiskla jen aktivní záložka.
  if (printMode) {
    return (
      <>
        {children}
        {akjTabs
          .filter((t) => !t.locked)
          .map((t) => (
            <OstatniLayout key={t.id} page={resolveAkjTabPage(page, t)} />
          ))}
      </>
    );
  }

  const items: TabItem[] = [
    { id: BASE_ID, label: 'Obsah', icon: <FileText size={16} /> },
    ...akjTabs.map((t) => ({
      id: t.id,
      label: t.name,
      // locked = bez přístupu → zavřený zámek; jinak odemčený (spec-akj-locked-tabs-visible)
      icon: t.locked ? <Lock size={16} /> : <Unlock size={16} />,
    })),
  ];

  const activeTab = akjTabs.find((t) => t.id === activeId);

  return (
    <Tabs
      items={items}
      activeId={activeId}
      onChange={setActiveId}
      orientation="horizontal"
    >
      {activeId === BASE_ID && children}
      {activeTab &&
        (activeTab.locked ? (
          <AkjLockedPanel
            worldId={worldId}
            accessRequirements={activeTab.access}
            isWoodWide={page.isWoodWide}
          />
        ) : (
          <OstatniLayout page={resolveAkjTabPage(page, activeTab)} />
        ))}
    </Tabs>
  );
}
