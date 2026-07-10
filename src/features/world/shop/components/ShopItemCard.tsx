import { Link } from 'react-router-dom';
import { CurrencyDisplay } from '@/features/world/currencies/shared/CurrencyDisplay';
import type { WorldCurrencyItem } from '@/features/world/currencies/types';
import { getImageStyle } from '@/shared/lib/imageStyle';
import type { ShopItem, ShopGroup } from '../types';
import { effectiveDiscount, effectivePrice } from '../pricing';
import s from './shop.module.css';

interface ShopItemCardProps {
  item: ShopItem;
  group?: ShopGroup | null;
  subgroup?: ShopGroup | null;
  currencyItems: WorldCurrencyItem[];
  preferredCode: string;
  worldSlug: string;
  canManage: boolean;
  onDetail: (item: ShopItem) => void;
  onEdit?: (item: ShopItem) => void;
  onDelete?: (item: ShopItem) => void;
  /** Předáno až v N2 — bez něj se tlačítko Koupit nezobrazí (katalog 11.3b). */
  onBuy?: (item: ShopItem) => void;
}

/** Karta zboží — název, cena (v preferované měně), sleva, wiki překlik. */
export function ShopItemCard({
  item,
  group,
  subgroup,
  currencyItems,
  preferredCode,
  worldSlug,
  canManage,
  onDetail,
  onEdit,
  onDelete,
  onBuy,
}: ShopItemCardProps) {
  const disc = effectiveDiscount(item, group, subgroup);
  const eff = effectivePrice(item, group, subgroup);
  const groupLabel = [group?.name, subgroup?.name].filter(Boolean).join(' / ');

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardHeadMain}>
          <span className={s.thumb} aria-hidden="true">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                loading="lazy"
                style={getImageStyle(
                  item.imageFocalX,
                  item.imageFocalY,
                  item.imageZoom,
                  item.imageFit,
                )}
              />
            ) : (
              <span className={s.thumbFallback}>
                {item.name.charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          <button
            type="button"
            className={s.cardTitle}
            onClick={() => onDetail(item)}
          >
            {item.isRecommended && (
              <span className={s.reco} title="Doporučeno">
                ⭐
              </span>
            )}
            {item.name}
          </button>
        </div>
        {canManage && (
          <span className={`${s.cardActions} print-hide`}>
            <button
              type="button"
              className={s.iconBtn}
              title="Upravit"
              aria-label="Upravit položku"
              onClick={() => onEdit?.(item)}
            >
              ✎
            </button>
            <button
              type="button"
              className={`${s.iconBtn} ${s.iconBtnDanger}`}
              title="Smazat"
              aria-label="Smazat položku"
              onClick={() => onDelete?.(item)}
            >
              ✕
            </button>
          </span>
        )}
      </div>

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

      {item.description && <p className={s.cardDesc}>{item.description}</p>}

      <div className={s.cardFoot}>
        {item.referenceLink && (
          <Link
            className={s.refLink}
            to={`/svet/${worldSlug}/${item.referenceLink}`}
          >
            📖 Info
          </Link>
        )}
        {onBuy && (
          <button
            type="button"
            className={`${s.buyBtn} print-hide`}
            onClick={() => onBuy(item)}
          >
            🛒 Koupit
          </button>
        )}
      </div>
    </div>
  );
}
