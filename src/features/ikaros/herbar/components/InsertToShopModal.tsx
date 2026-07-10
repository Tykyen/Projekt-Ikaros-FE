/**
 * 21.5a §6 — vklad rostliny/rostlin z komunitního herbáře do OBCHODU světa.
 * `single` = jedna rostlina (existující single create), `bulk` = všechny
 * zobrazené rostliny (bulk endpoint, dávky ≤200). Cílový svět = jen kde je
 * uživatel PomocnyPJ+ (stejný zdroj jako `InsertToBestiaryModal`: `useMyWorlds`
 * + `membership.role`). Herbář je systémově neutrální → bez filtru systému.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/shared/ui';
import { parseApiError } from '@/shared/api/client';
import { useMyWorlds } from '@/features/world/api/useWorlds';
import { WorldRole } from '@/shared/types';
import { CurrencyAmountInput } from '@/features/world/currencies/shared/CurrencyAmountInput';
import { useWorldCurrencies } from '@/features/world/currencies/api';
import {
  useShopGroups,
  useCreateShopItem,
  useBulkCreateShopItems,
} from '@/features/world/shop/api';
import type { CreateShopItemInput } from '@/features/world/shop/types';
import type { GlobalPlant } from '../types';
import s from './KomunitniHerbarForms.module.css';

/** BE limit jedné bulk dávky. */
const BULK_LIMIT = 200;

interface Props {
  mode: 'single' | 'bulk';
  /** single → 1 rostlina; bulk → aktuálně zobrazené rostliny knihovny. */
  plants: GlobalPlant[];
  onClose: () => void;
}

/** Souhrnný popis rostliny → popis položky obchodu. */
function plantToDescription(p: GlobalPlant): string | undefined {
  const parts: string[] = [];
  if (p.habitat?.trim()) parts.push(`Roste: ${p.habitat.trim()}.`);
  if (p.usage?.trim()) parts.push(`Použití: ${p.usage.trim()}.`);
  if (p.aliases?.trim()) parts.push(`Lidová jména: ${p.aliases.trim()}.`);
  return parts.length ? parts.join(' ') : undefined;
}

function plantToInput(
  p: GlobalPlant,
  price: number,
  currencyCode: string,
  groupId: string,
): CreateShopItemInput {
  const hasImg = !!p.imageUrl;
  return {
    name: p.name,
    description: plantToDescription(p),
    groupId: groupId || undefined,
    price,
    currencyCode: currencyCode || undefined,
    imageUrl: p.imageUrl || undefined,
    imageFocalX: hasImg ? (p.imageFocalX ?? null) : null,
    imageFocalY: hasImg ? (p.imageFocalY ?? null) : null,
    imageZoom: hasImg ? (p.imageZoom ?? null) : null,
    imageFit: hasImg ? (p.imageFit ?? null) : null,
  };
}

export function InsertToShopModal({ mode, plants, onClose }: Props) {
  const navigate = useNavigate();
  const single = mode === 'single';
  const count = plants.length;

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
    single ? (plants[0]?.suggestedPrice ?? 0) : 0,
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
      const plant = plants[0];
      if (!plant) return;
      createM.mutate(plantToInput(plant, price, effectiveCurrency, groupId), {
        onSuccess: () => {
          toast.success(
            `„${plant.name}" vloženo do obchodu ${targetWorld.name}.`,
            { action: { label: 'Otevřít obchod', onClick: goToShop } },
          );
          onClose();
        },
        onError: (err) => toast.error(parseApiError(err)),
      });
      return;
    }

    // bulk — po dávkách ≤ BULK_LIMIT
    const items = plants.map((p) =>
      plantToInput(p, price, effectiveCurrency, groupId),
    );
    try {
      let done = 0;
      for (let i = 0; i < items.length; i += BULK_LIMIT) {
        const created = await bulkM.mutateAsync({
          items: items.slice(i, i + BULK_LIMIT),
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
              ? `Rostlina „${plants[0]?.name}" se vloží jako položka obchodu vybraného světa.`
              : `Vloží se ${count} zobrazených rostlin jako položky obchodu. Ceny pak dolaď přímo v obchodě.`}
          </p>
          {!single && count > BULK_LIMIT ? (
            <p className={s.hint}>
              Rostlin je víc než {BULK_LIMIT} — vloží se po dávkách automaticky.
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
        </>
      )}
    </Modal>
  );
}
