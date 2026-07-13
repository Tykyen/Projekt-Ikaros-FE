/**
 * 21.5a §6 — vklad položek z komunitního katalogu do OBCHODU světa.
 * `single` = jedna položka (single create), `bulk` = všechny zobrazené
 * (bulk endpoint, dávky ≤200). Cílový svět = jen kde je uživatel PomocnyPJ+.
 *
 * GENERICKÉ přes `ShopInsertItem` (`../shopInsert.ts`) — používá herbář
 * (`plantToShopInsert`) i lektvary (`potionToShopInsert`); skloňování přes
 * `nounMany`. Žádné další kopie modalu (vzor link_picker).
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { WorldRole } from '@/shared/types';
import { CurrencyAmountInput } from '@/features/world/currencies/shared/CurrencyAmountInput';
import { CurrencySelect } from '@/features/world/currencies/shared/CurrencySelect';
import { useWorldCurrencies } from '@/features/world/currencies/api';
import {
  useShopGroups,
  useCreateShopItem,
  useBulkCreateShopItems,
} from '@/features/world/shop/api';
import type { CreateShopItemInput } from '@/features/world/shop/types';
import type { ShopInsertItem } from '../shopInsert';
import s from './KomunitniHerbarForms.module.css';

/** BE limit jedné bulk dávky. */
const BULK_LIMIT = 200;

interface Props {
  mode: 'single' | 'bulk';
  /** single → 1 položka; bulk → aktuálně zobrazené položky knihovny. */
  items: ShopInsertItem[];
  /** Genitiv plurálu do vět („rostlin", „lektvarů"). */
  nounMany?: string;
  onClose: () => void;
}

/** 21.5f — `{zl,st,md}` → desetinná cena ve „zlatých" (1 zl = 10 st = 100 md). */
function gscToDecimal(p: NonNullable<ShopInsertItem['priceGsc']>): number {
  return Math.round((p.gold + p.silver / 10 + p.copper / 100) * 10000) / 10000;
}

function itemToInput(
  it: ShopInsertItem,
  price: number,
  currencyCode: string,
  groupId: string,
): CreateShopItemInput {
  const hasImg = !!it.imageUrl;
  return {
    name: it.name,
    description: it.description || undefined,
    groupId: groupId || undefined,
    // 21.5f — položka se strukturovanou cenou si ji nese sama (per položka);
    // jinak platí jednotná cena z formuláře.
    price: it.priceGsc ? gscToDecimal(it.priceGsc) : price,
    currencyCode: currencyCode || undefined,
    imageUrl: it.imageUrl || undefined,
    imageFocalX: hasImg ? (it.imageFocalX ?? null) : null,
    imageFocalY: hasImg ? (it.imageFocalY ?? null) : null,
    imageZoom: hasImg ? (it.imageZoom ?? null) : null,
    imageFit: hasImg ? (it.imageFit ?? null) : null,
  };
}

export function InsertToShopModal({
  mode,
  items,
  nounMany = 'položek',
  onClose,
}: Props) {
  const navigate = useNavigate();
  const single = mode === 'single';
  const count = items.length;
  // 21.5f — všechny položky nesou strukturovanou cenu (zl/st/md) → cena se
  // přepočte per položka, formulář nabízí jen „měnu pro zlaté".
  const allGsc = count > 0 && items.every((it) => it.priceGsc);

  const { data: myWorlds } = useMyWorlds();
  const worldTargets = useMemo(
    () => (myWorlds ?? []).filter((e) => e.membership.role >= WorldRole.PomocnyPJ),
    [myWorlds],
  );

  // Svět = user výběr, s fallbackem na první dostupný (bez efektu/setState).
  const [worldId, setWorldId] = useState('');
  const effectiveWorldId = worldId || worldTargets[0]?.world.id || '';
  const targetWorld = worldTargets.find(
    (e) => e.world.id === effectiveWorldId,
  )?.world;
  const noWorlds = worldTargets.length === 0;

  const groupsQ = useShopGroups(effectiveWorldId);
  const topGroups = useMemo(
    () => (groupsQ.data ?? []).filter((g) => !g.parentId),
    [groupsQ.data],
  );
  const [groupId, setGroupId] = useState('');

  const currenciesQ = useWorldCurrencies(effectiveWorldId);
  const currencyItems = useMemo(
    () => currenciesQ.data?.items ?? [],
    [currenciesQ.data],
  );

  const [amount, setAmount] = useState<number | ''>(
    single ? (items[0]?.suggestedPrice ?? 0) : 0,
  );
  const [currencyCode, setCurrencyCode] = useState('');
  // Odvozená měna: user výběr (pokud platný v daném světě) jinak báze světa.
  const effectiveCurrency = currencyItems.some((c) => c.code === currencyCode)
    ? currencyCode
    : (currencyItems[0]?.code ?? '');

  const createM = useCreateShopItem(effectiveWorldId);
  const bulkM = useBulkCreateShopItems(effectiveWorldId);
  const pending = createM.isPending || bulkM.isPending;

  const goToShop = () => {
    if (targetWorld) navigate(`/svet/${targetWorld.slug}/obchod`);
  };

  const submit = async () => {
    if (!effectiveWorldId || !targetWorld) return;
    const price = amount === '' ? 0 : amount;

    if (single) {
      const item = items[0];
      if (!item) return;
      createM.mutate(itemToInput(item, price, effectiveCurrency, groupId), {
        onSuccess: () => {
          toast.success(
            `„${item.name}" vloženo do obchodu ${targetWorld.name}.`,
            { action: { label: 'Otevřít obchod', onClick: goToShop } },
          );
          onClose();
        },
        onError: (err) => toast.error(parseApiError(err)),
      });
      return;
    }

    // bulk — po dávkách ≤ BULK_LIMIT
    const inputs = items.map((it) =>
      itemToInput(it, price, effectiveCurrency, groupId),
    );
    try {
      let done = 0;
      for (let i = 0; i < inputs.length; i += BULK_LIMIT) {
        const created = await bulkM.mutateAsync({
          items: inputs.slice(i, i + BULK_LIMIT),
        });
        done += created.length;
      }
      toast.success(`Vloženo ${done} položek do obchodu ${targetWorld.name}.`, {
        action: { label: 'Otevřít obchod', onClick: goToShop },
      });
      onClose();
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Zrušit
      </Button>
      <Button
        variant="primary"
        loading={pending}
        disabled={noWorlds || !effectiveWorldId || count === 0}
        onClick={submit}
      >
        {single ? 'Vložit do obchodu' : `Vložit ${count} položek`}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={single ? 'Vlož do obchodu' : 'Vlož vše do obchodu'}
      size="sm"
      footer={footer}
    >
      {noWorlds ? (
        <p className={s.hint}>
          Nemáš žádný svět, kde bys byl aspoň Pomocný PJ — do obchodu může
          vkládat jen správce světa.
        </p>
      ) : (
        <>
          <p className={s.hint}>
            {single
              ? `„${items[0]?.name}" se vloží jako položka obchodu vybraného světa.`
              : `Vloží se ${count} zobrazených ${nounMany} jako položky obchodu. Ceny pak dolaď přímo v obchodě.`}
          </p>
          {!single && count > BULK_LIMIT ? (
            <p className={s.hint}>
              Položek je víc než {BULK_LIMIT} — vloží se po dávkách automaticky.
            </p>
          ) : null}

          <div className={s.field}>
            <label className={s.label} htmlFor="shop-world">
              Svět
            </label>
            <select
              id="shop-world"
              className={s.select}
              value={effectiveWorldId}
              onChange={(e) => {
                setWorldId(e.target.value);
                // Skupiny i měny jsou per-svět → resetuj výběr při změně světa.
                setGroupId('');
                setCurrencyCode('');
              }}
            >
              {worldTargets.map((e) => (
                <option key={e.world.id} value={e.world.id}>
                  {e.world.name}
                </option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="shop-group">
              Skupina / typ
            </label>
            <select
              id="shop-group"
              className={s.select}
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              disabled={groupsQ.isLoading}
            >
              <option value="">— nezařazeno —</option>
              {topGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {allGsc ? (
            <div className={s.field}>
              <span className={s.label}>Měna pro zlaté</span>
              <CurrencySelect
                value={effectiveCurrency}
                onChange={setCurrencyCode}
                items={currencyItems}
                ariaLabel="Měna pro zlaté"
              />
              <span className={s.hint}>
                Každá položka si nese vlastní cenu — přepočte se ze
                zlatých/stříbrných/měďáků (1 zl = 10 st = 100 md)
                {single && items[0]?.priceGsc
                  ? ` — zde ${gscToDecimal(items[0].priceGsc)}`
                  : ''}{' '}
                ve zvolené měně.
                {currencyItems.length === 0
                  ? ' Svět nemá nastavené měny — cena se uloží bez měny.'
                  : ''}
              </span>
            </div>
          ) : (
            <div className={s.field}>
              {/* CurrencyAmountInput = složený widget → skupinový popisek span */}
              <span className={s.label}>
                {single ? 'Cena' : 'Výchozí cena (pro všechny)'}
              </span>
              <CurrencyAmountInput
                amount={amount}
                currencyCode={effectiveCurrency}
                onAmountChange={setAmount}
                onCurrencyChange={setCurrencyCode}
                items={currencyItems}
              />
              {currencyItems.length === 0 ? (
                <span className={s.hint}>
                  Svět nemá nastavené měny — cena se uloží bez měny.
                </span>
              ) : null}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
