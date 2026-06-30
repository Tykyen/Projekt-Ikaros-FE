/**
 * Výbava + Finance v herním embedu (taktická mapa + chat rail).
 *
 * Proč: na mapě/chatu hráč vidí jen deník (combat panel / list), ale za běhu
 * hry potřebuje i Výbavu (co nese) a Finance (zůstatek, vklad/výběr) — ty
 * normálně žijí jako taby na plné stránce postavy. Tahle lišta dá k oběma
 * rychlý přístup přes modal, který mountuje EXISTUJÍCÍ `InventoryTab` /
 * `FinanceTab` (samy si tahají data podle slugu i ukládají). Funguje pro PC
 * i NPC napříč všemi systémy (bestie nemají postavu → lišta se u nich
 * nezobrazuje, volající ji tam nemountuje).
 *
 * Skin: obsah modalu obalíme `[data-diary-system][data-diary-skin]`, aby lišta
 * i chrome modalu braly skin deníku přes embed tokeny. (Plné per-skin
 * sladění vnitřku Výbavy/Financí je následný krok.)
 */
import { useState } from 'react';
import { Backpack, Coins } from 'lucide-react';
import { Modal, Spinner } from '@/shared/ui';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePage } from '../../../api/usePage';
import { getDiaryPreset } from '../../diary-systems/registry';
import { useDiarySkin } from '../../diary-systems/skins/useDiarySkin';
import { InventoryTab } from '../InventoryTab';
import { FinanceTab } from '../FinanceTab';
import { SubdocErrorState } from '../SubdocErrorState';
import s from './EmbedSubdocsBar.module.css';

type SubdocTab = 'inventory' | 'finance';

interface BarProps {
  worldId: string;
  /** Slug postavy (PC/NPC) — vlastní Page s výbavou + účty. */
  slug: string;
  /** Smí upravovat (vlastník / PJ). */
  canEdit: boolean;
}

/** Lišta tlačítek 🎒 Výbava / 💰 Finance + modal. Mountovat uvnitř DiarySkinScope. */
export function EmbedSubdocsBar({ worldId, slug, canEdit }: BarProps) {
  const [open, setOpen] = useState<SubdocTab | null>(null);
  if (!slug) return null;

  return (
    <div className={s.bar}>
      <button
        type="button"
        className={s.barBtn}
        onClick={() => setOpen('inventory')}
        title="Výbava postavy"
      >
        <Backpack size={15} aria-hidden /> Výbava
      </button>
      <button
        type="button"
        className={s.barBtn}
        onClick={() => setOpen('finance')}
        title="Finance postavy"
      >
        <Coins size={15} aria-hidden /> Finance
      </button>
      {open && (
        <EmbedSubdocsModal
          worldId={worldId}
          slug={slug}
          canEdit={canEdit}
          initialTab={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}

interface ModalProps extends BarProps {
  initialTab: SubdocTab;
  onClose: () => void;
}

function EmbedSubdocsModal({ worldId, slug, canEdit, initialTab, onClose }: ModalProps) {
  const [tab, setTab] = useState<SubdocTab>(initialTab);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const { world } = useWorldContext();
  const diarySystem = getDiaryPreset(world?.system).id;
  const { skin } = useDiarySkin(worldId);
  const pageQ = usePage(worldId, slug);

  return (
    <Modal open onClose={onClose} size="xl" ariaLabel="Výbava a finance postavy">
      <div className={s.scope} data-diary-system={diarySystem} data-diary-skin={skin}>
        <div className={s.tabs}>
          <button
            type="button"
            className={`${s.tab} ${tab === 'inventory' ? s.tabOn : ''}`}
            onClick={() => {
              setTab('inventory');
              setMode('view');
            }}
          >
            <Backpack size={15} aria-hidden /> Výbava
          </button>
          <button
            type="button"
            className={`${s.tab} ${tab === 'finance' ? s.tabOn : ''}`}
            onClick={() => {
              setTab('finance');
              setMode('view');
            }}
          >
            <Coins size={15} aria-hidden /> Finance
          </button>
          <div className={s.tabSpacer} />
          {canEdit && (
            <button
              type="button"
              className={s.editToggle}
              onClick={() => setMode((m) => (m === 'edit' ? 'view' : 'edit'))}
            >
              {mode === 'edit' ? 'Hotovo' : 'Upravit'}
            </button>
          )}
        </div>

        <div className={s.content}>
          {pageQ.isLoading ? (
            <Spinner center />
          ) : pageQ.isError || !pageQ.data ? (
            <SubdocErrorState
              error={pageQ.error}
              resourceLabel={tab === 'inventory' ? 'výbavu' : 'finance'}
              onRetry={() => pageQ.refetch()}
            />
          ) : tab === 'inventory' ? (
            <InventoryTab
              page={pageQ.data}
              mode={mode}
              canEdit={canEdit}
              onExitEdit={() => setMode('view')}
              onDirtyChange={() => {}}
            />
          ) : (
            <FinanceTab
              page={pageQ.data}
              mode={mode}
              onExitEdit={() => setMode('view')}
              onDirtyChange={() => {}}
              onBackToProfil={onClose}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
