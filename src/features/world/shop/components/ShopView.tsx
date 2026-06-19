import { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Spinner, Button, ConfirmDialog } from '@/shared/ui';
import { PrintButton } from '@/features/world/export/print';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useWorldCurrencies } from '@/features/world/currencies/api';
import { useUserPreferredCurrency } from '@/features/world/currencies/shared/useUserPreferredCurrency';
import { CurrencySelect } from '@/features/world/currencies/shared/CurrencySelect';
import { usePersonaDirectory } from '@/features/world/pages/api/usePersonaDirectory';
import { useCharacter } from '@/features/world/pages/api/useCharacter';
import { useShopItems, useShopGroups, useDeleteShopItem } from '../api';
import type { ShopItem, ShopGroup } from '../types';
import { effectivePriceInCurrency } from '../pricing';
import { ShopItemCard } from './ShopItemCard';
import { ShopItemForm } from './ShopItemForm';
import { ShopItemDetail } from './ShopItemDetail';
import { ShopGroupsManager } from './ShopGroupsManager';
import { WalletBadge } from './WalletBadge';
import { PurchaseDialog } from './PurchaseDialog';
import { MyPurchasesPanel } from './MyPurchasesPanel';
import s from './shop.module.css';

type Scope = 'all' | 'mine' | 'shared';
type SortKey = 'name' | 'price-asc' | 'price-desc' | 'recommended';

/** Spec 11.3 — orchestrátor stránky Obchod (katalog + správa). */
export function ShopView() {
  const { worldId, worldSlug, userRole } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const myUserId = me?.id ?? '';
  const viewerRole = userRole ?? WorldRole.Zadatel;
  const canManage = viewerRole >= WorldRole.PomocnyPJ;
  const canShare = viewerRole >= WorldRole.PomocnyPJ;

  const itemsQ = useShopItems(worldId);
  const groupsQ = useShopGroups(worldId);
  const currenciesQ = useWorldCurrencies(worldId);
  const currencyItems = useMemo(
    () => currenciesQ.data?.items ?? [],
    [currenciesQ.data],
  );
  const { resolvedCode, setPreferred } = useUserPreferredCurrency(
    worldId,
    currencyItems,
  );
  const deleteM = useDeleteShopItem(worldId);

  // „Nakupuji pro" — staff vybírá cílovou postavu; hráč = jeho postava.
  // Jen PC (postavy hráčů), ne NPC — nakupuje se pro hráče.
  const personaQ = usePersonaDirectory(worldId);
  const personaList = useMemo(
    () => (personaQ.data ?? []).filter((e) => e.type === 'Postava hráče'),
    [personaQ.data],
  );
  const [targetId, setTargetId] = useState('');
  const myEntry = useMemo(
    () => personaList.find((e) => e.ownerUserId === myUserId),
    [personaList, myUserId],
  );
  const effectiveTargetId = canManage
    ? targetId || personaList[0]?.id || ''
    : (myEntry?.id ?? '');
  const targetEntry = useMemo(
    () => personaList.find((e) => e.id === effectiveTargetId) ?? null,
    [personaList, effectiveTargetId],
  );
  // PageDirectoryEntry.id je ID stránky, ne postavy — skutečný characterId
  // dotáhneme z detailu postavy podle slugu (BE nákup chce characterId).
  const targetCharQ = useCharacter(worldId, targetEntry?.slug ?? '');
  const targetCharacterId = targetCharQ.data?.id ?? '';
  const targetCharacter =
    targetEntry && targetCharacterId
      ? {
          id: targetCharacterId,
          slug: targetEntry.slug,
          name: targetEntry.title,
        }
      : null;

  const [buyItem, setBuyItem] = useState<ShopItem | null>(null);
  const [purchasesOpen, setPurchasesOpen] = useState(false);

  const groups = useMemo(() => groupsQ.data ?? [], [groupsQ.data]);
  const groupById = useMemo(() => {
    const m = new Map<string, ShopGroup>();
    for (const g of groups) m.set(g.id, g);
    return m;
  }, [groups]);
  const topGroups = useMemo(() => groups.filter((g) => !g.parentId), [groups]);

  // Filtry
  const [scope, setScope] = useState<Scope>('all');
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  // Modaly
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [formInitial, setFormInitial] = useState<ShopItem | undefined>();
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [detail, setDetail] = useState<ShopItem | null>(null);
  const [toDelete, setToDelete] = useState<ShopItem | null>(null);

  const allItems = useMemo(() => itemsQ.data ?? [], [itemsQ.data]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (scope === 'mine') list = list.filter((it) => it.ownerId === myUserId);
    else if (scope === 'shared') list = list.filter((it) => it.isShared);
    if (groupFilter)
      list = list.filter(
        (it) => it.groupId === groupFilter || it.subgroupId === groupFilter,
      );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((it) => it.name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'cs');
      if (sortKey === 'recommended')
        return Number(b.isRecommended) - Number(a.isRecommended);
      // price — efektivní cena převedená na preferovanou měnu; neznámé na konec
      const pa = effectivePriceInCurrency(
        a,
        resolvedCode,
        currencyItems,
        groupById.get(a.groupId),
        a.subgroupId ? groupById.get(a.subgroupId) : null,
      );
      const pb = effectivePriceInCurrency(
        b,
        resolvedCode,
        currencyItems,
        groupById.get(b.groupId),
        b.subgroupId ? groupById.get(b.subgroupId) : null,
      );
      if (pa === null) return 1;
      if (pb === null) return -1;
      return sortKey === 'price-asc' ? pa - pb : pb - pa;
    });
    return sorted;
  }, [
    allItems,
    scope,
    myUserId,
    groupFilter,
    search,
    sortKey,
    resolvedCode,
    currencyItems,
    groupById,
  ]);

  function openAdd() {
    setFormInitial(undefined);
    setFormMode('add');
  }
  function openEdit(item: ShopItem) {
    setFormInitial(item);
    setFormMode('edit');
  }

  const loading = itemsQ.isLoading || groupsQ.isLoading;

  return (
    <div className={s.root} data-print-scope>
      <header className={s.topbar}>
        <h1 className={s.pageTitle}>🛒 Obchod</h1>

        {canManage && personaList.length > 0 && (
          <label className={`${s.fieldLabel} print-hide`}>
            Nakupuji pro
            <select
              className={s.buyerSelect}
              value={effectiveTargetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              {personaList.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {targetCharacter && (
          <>
            <WalletBadge
              worldId={worldId}
              characterSlug={targetCharacter.slug}
              characterName={targetCharacter.name}
              currencyItems={currencyItems}
            />
            <Button
              variant="ghost"
              className="print-hide"
              onClick={() => setPurchasesOpen(true)}
            >
              🛒 Nákupy
            </Button>
          </>
        )}

        {canManage && (
          <div className={`${s.headerActions} print-hide`}>
            <Button variant="secondary" onClick={() => setGroupsOpen(true)}>
              Spravovat typy
            </Button>
            <Button onClick={openAdd}>+ Položka</Button>
          </div>
        )}
        <PrintButton title="Vytisknout ceník (zobrazené položky)" />
      </header>

      <div className={`${s.filters} print-hide`}>
        <input
          className={s.searchInput}
          placeholder="Hledat…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Hledat v obchodě"
        />
        <label className={s.filterField}>
          Skupina
          <select
            className={s.select}
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <option value="">Vše</option>
            {topGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className={s.filterField}>
          Měna
          <CurrencySelect
            value={resolvedCode}
            onChange={setPreferred}
            items={currencyItems}
          />
        </label>
        <label className={s.filterField}>
          Řazení
          <select
            className={s.select}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="name">Název</option>
            <option value="price-asc">Cena ↑</option>
            <option value="price-desc">Cena ↓</option>
            <option value="recommended">Doporučené</option>
          </select>
        </label>
        {canManage && (
          <label className={s.filterField}>
            Zobrazit
            <select
              className={s.select}
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="all">Vše</option>
              <option value="mine">Jen moje</option>
              <option value="shared">Jen sdílené</option>
            </select>
          </label>
        )}
      </div>

      {loading ? (
        <div className={s.center}>
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <p className={s.empty}>
          {allItems.length === 0
            ? 'Obchod je zatím prázdný.'
            : 'Žádná položka neodpovídá filtru.'}
        </p>
      ) : (
        <div className={s.grid}>
          {filtered.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              group={groupById.get(item.groupId) ?? null}
              subgroup={
                item.subgroupId ? (groupById.get(item.subgroupId) ?? null) : null
              }
              currencyItems={currencyItems}
              preferredCode={resolvedCode}
              worldSlug={worldSlug}
              canManage={canManage}
              onDetail={setDetail}
              onEdit={openEdit}
              onDelete={setToDelete}
              onBuy={targetCharacter ? setBuyItem : undefined}
            />
          ))}
        </div>
      )}

      {formMode && (
        <ShopItemForm
          worldId={worldId}
          mode={formMode}
          initial={formInitial}
          groups={groups}
          allItems={allItems}
          currencyItems={currencyItems}
          canShare={canShare}
          onClose={() => setFormMode(null)}
        />
      )}

      {groupsOpen && (
        <ShopGroupsManager
          worldId={worldId}
          groups={groups}
          canShare={canShare}
          onClose={() => setGroupsOpen(false)}
        />
      )}

      {detail && (
        <ShopItemDetail
          item={detail}
          group={groupById.get(detail.groupId) ?? null}
          subgroup={
            detail.subgroupId ? (groupById.get(detail.subgroupId) ?? null) : null
          }
          allItems={allItems}
          currencyItems={currencyItems}
          preferredCode={resolvedCode}
          worldSlug={worldSlug}
          onClose={() => setDetail(null)}
          onOpenItem={(it) => setDetail(it)}
        />
      )}

      {buyItem && targetCharacter && (
        <PurchaseDialog
          worldId={worldId}
          item={buyItem}
          group={groupById.get(buyItem.groupId) ?? null}
          subgroup={
            buyItem.subgroupId ? (groupById.get(buyItem.subgroupId) ?? null) : null
          }
          character={targetCharacter}
          currencyItems={currencyItems}
          isStaff={canManage}
          onClose={() => setBuyItem(null)}
        />
      )}

      {purchasesOpen && targetCharacter && (
        <MyPurchasesPanel
          worldId={worldId}
          characterId={targetCharacter.id}
          characterSlug={targetCharacter.slug}
          characterName={targetCharacter.name}
          currencyItems={currencyItems}
          isStaff={canManage}
          onClose={() => setPurchasesOpen(false)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Smazat položku"
        message={`Opravdu smazat „${toDelete?.name}"?`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteM.isPending}
        onConfirm={() => {
          if (!toDelete) return;
          deleteM.mutate(toDelete.id, {
            onSuccess: () => setToDelete(null),
          });
        }}
      />
    </div>
  );
}
