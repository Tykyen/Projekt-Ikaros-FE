/**
 * 10.2c-edit-7 — generic modal „Přidat z katalogu" pro PJ palety.
 *
 * Použit z PcPalette/NpcCharacterPalette (postavy) a BestiePalette (bestie
 * s vnitřními záložkami MŮJ/SVĚT/SYSTEM — varianta `tabs`).
 *
 * Vstup `items` může být buď plain array (postavy) nebo
 * `{tabs: [...], itemsByTab: {...}}` (bestie). Detect přes `tabs` prop.
 *
 * UI: search input nahoře, scrollable list s podsvícením již-aktivních
 * položek + ✓ indikátor; klik na item → `onPick`. Modal zavře pouze
 * `onClose` (≠ pick), aby PJ mohl přidat víc položek najednou.
 */
import { useMemo, useState } from 'react';
import { PaletteSearchInput } from './PaletteSearchInput';
import styles from './CharacterCatalogModal.module.css';

export interface CatalogItem {
  id: string;
  name: string;
}

interface BaseProps {
  title: string;
  /** ID-set položek, které jsou ve scéně aktivní → render ✓ + disabled. */
  activeIds: Set<string>;
  onPick: (item: CatalogItem) => void;
  onClose: () => void;
  /** Placeholder pro search input. */
  searchPlaceholder?: string;
}

interface FlatProps extends BaseProps {
  items: CatalogItem[];
  tabs?: undefined;
}

interface TabbedProps extends BaseProps {
  tabs: { key: string; label: string }[];
  /** Position-sensitive items per tab key. */
  itemsByTab: Record<string, CatalogItem[]>;
}

type Props = FlatProps | TabbedProps;

export function CharacterCatalogModal(props: Props): React.ReactElement {
  const { title, activeIds, onPick, onClose, searchPlaceholder } = props;
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>(
    'tabs' in props && props.tabs ? props.tabs[0]?.key ?? '' : '',
  );

  const list: CatalogItem[] = useMemo(() => {
    const source =
      'tabs' in props && props.tabs
        ? props.itemsByTab[activeTab] ?? []
        : (props as FlatProps).items;
    const q = search.trim().toLowerCase();
    return q
      ? source.filter((it) => it.name.toLowerCase().includes(q))
      : source;
  }, [props, activeTab, search]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-title"
      >
        <header className={styles.header}>
          <h3 id="catalog-title" className={styles.title}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Zavřít"
            title="Zavřít"
          >
            ×
          </button>
        </header>

        {'tabs' in props && props.tabs && (
          <div className={styles.tabs}>
            {props.tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                <span className={styles.count}>
                  ({props.itemsByTab[t.key]?.length ?? 0})
                </span>
              </button>
            ))}
          </div>
        )}

        <PaletteSearchInput
          value={search}
          onChange={setSearch}
          placeholder={searchPlaceholder ?? 'Hledat…'}
        />

        <div className={styles.list}>
          {list.length === 0 ? (
            <p className={styles.empty}>
              {search.trim()
                ? 'Nic neodpovídá vyhledávání.'
                : 'Katalog je prázdný.'}
            </p>
          ) : (
            list.map((item) => {
              const already = activeIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.item} ${already ? styles.itemActive : ''}`}
                  onClick={() => {
                    if (!already) onPick(item);
                  }}
                  disabled={already}
                  title={
                    already
                      ? `${item.name} už je v aktivních`
                      : `Přidat ${item.name} mezi aktivní`
                  }
                >
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemAction}>
                    {already ? '✓' : '+'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
