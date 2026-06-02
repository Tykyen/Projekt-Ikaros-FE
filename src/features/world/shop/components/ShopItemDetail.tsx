import { Link } from 'react-router-dom';
import { Modal } from '@/shared/ui/Modal/Modal';
import { CurrencyDisplay } from '@/features/world/currencies/shared/CurrencyDisplay';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import type { ShopItem, ShopGroup } from '../types';
import { effectiveDiscount, effectivePrice } from '../pricing';
import s from './shop.module.css';

interface ShopItemDetailProps {
  item: ShopItem;
  group?: ShopGroup | null;
  subgroup?: ShopGroup | null;
  allItems: ShopItem[];
  currencyItems: WorldCurrencyItem[];
  preferredCode: string;
  worldSlug: string;
  onClose: () => void;
  onOpenItem: (item: ShopItem) => void;
}

/** Detail položky — popis, wiki překlik, „často kupováno s". */
export function ShopItemDetail({
  item,
  group,
  subgroup,
  allItems,
  currencyItems,
  preferredCode,
  worldSlug,
  onClose,
  onOpenItem,
}: ShopItemDetailProps) {
  const disc = effectiveDiscount(item, group, subgroup);
  const eff = effectivePrice(item, group, subgroup);
  const groupLabel = [group?.name, subgroup?.name].filter(Boolean).join(' / ');
  const linked = allItems.filter((it) => item.linkedItemIds.includes(it.id));

  return (
    <Modal open onClose={onClose} title={item.name} size="sm">
      <div className={s.form}>
        {groupLabel && <div className={s.cardGroup}>{groupLabel}</div>}

        <div className={s.cardPrice}>
          {disc > 0 && (
            <span className={s.origPrice}>
              <CurrencyDisplay
                amount={item.price}
                currencyCode={item.currencyCode}
                items={currencyItems}
                showTooltip={false}
              />
            </span>
          )}
          <span className={s.effPrice}>
            <CurrencyDisplay
              amount={eff}
              currencyCode={item.currencyCode}
              items={currencyItems}
              convertTo={preferredCode}
            />
          </span>
          {disc > 0 && <span className={s.discBadge}>−{disc} %</span>}
        </div>

        {item.description && <p>{item.description}</p>}

        {item.referenceLink && (
          <Link
            className={s.refLink}
            to={`/svet/${worldSlug}/${item.referenceLink}`}
          >
            📖 Více info na stránce světa
          </Link>
        )}

        {linked.length > 0 && (
          <div>
            <div className={s.cardGroup}>Často kupováno s</div>
            <div className={s.groupTree}>
              {linked.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  className={s.cardTitle}
                  onClick={() => onOpenItem(it)}
                >
                  {it.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
