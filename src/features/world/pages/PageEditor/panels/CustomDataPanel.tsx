import { Newspaper } from 'lucide-react';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SmartCellInput } from '../components/SmartCellInput';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { usePagesDirectory } from '../../api/usePagesDirectory';
import s from './CustomDataPanel.module.css';

interface Props {
  customData: Record<string, string>;
  onChange: (customData: Record<string, string>) => void;
}

/**
 * 7.2 — Custom data pro typ Noviny. Klíče Stát / Vydavatel / Datum / Číslo vydání
 * / Šéfredaktor — viewer je vyrenderuje jako metadata HUD nad obsahem.
 *
 * Hodnoty jsou rich-text buňky (`SmartCellInput`) — libovolný úsek může být
 * odkaz na stránku světa (přes wikilink) nebo externí URL. Stejný editační
 * model jako u tabulky Atributy & metadata (TablePanel).
 *
 * Pokud chceš víc klíčů, přidej je do `NEWS_KEYS` níže.
 */
const NEWS_KEYS = ['Stát', 'Vydavatel', 'Datum', 'Číslo vydání', 'Šéfredaktor'];

export function CustomDataPanel({ customData, onChange }: Props) {
  const { worldId } = useWorldContext();
  const { data: directory = [] } = usePagesDirectory(worldId);

  function setKey(key: string, html: string) {
    // SmartCellInput emituje `<p></p>` jako prázdný stav — normalizujeme,
    // aby se klíče s vyprázdněnou hodnotou neukazovaly ve viewer HUD.
    const isEmpty =
      html.replace(/<[^>]+>/g, '').trim().length === 0;
    if (isEmpty) {
      const next = { ...customData };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...customData, [key]: html });
    }
  }

  const filledCount = NEWS_KEYS.filter((k) => customData[k]).length;

  return (
    <CollapsiblePanel
      title="Metadata novin"
      icon={<Newspaper size={18} aria-hidden />}
      badge={filledCount > 0 ? `${filledCount}/${NEWS_KEYS.length}` : undefined}
    >
      <p className={s.hint}>
        Viewer typu Noviny zobrazí vyplněné klíče jako metadata HUD nad obsahem.
        U každé hodnoty lze tlačítkem 🔗 připojit odkaz na jinou stránku světa
        nebo externí URL. Prázdné klíče se nezobrazují.
      </p>

      <div className={s.grid}>
        {NEWS_KEYS.map((key) => (
          <div key={key} className={s.field}>
            <span className={s.label}>{key}</span>
            <SmartCellInput
              value={customData[key] ?? ''}
              onChange={(html) => setKey(key, html)}
              directory={directory}
              placeholder={getPlaceholder(key)}
            />
          </div>
        ))}
      </div>
    </CollapsiblePanel>
  );
}

function getPlaceholder(key: string): string {
  switch (key) {
    case 'Stát':
      return 'Aralion';
    case 'Vydavatel':
      return 'Aralionské zprávy';
    case 'Datum':
      return '15. září 1242';
    case 'Číslo vydání':
      return 'č. 42 / Ročník III.';
    case 'Šéfredaktor':
      return 'Magister Kreon';
    default:
      return '';
  }
}
