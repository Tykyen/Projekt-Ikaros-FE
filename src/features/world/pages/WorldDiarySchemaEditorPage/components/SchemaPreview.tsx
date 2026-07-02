import { DiaryBlockView } from '../../CharacterDetailPage/components/DiaryBlockView';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import { flattenSchemaBlock, dummyValueFor } from '../utils/schemaMappers';
import s from './DiarySchemaEditor.module.css';

interface Props {
  blocks: DiarySchemaBlock[];
}

/**
 * 8.5 — pravý panel editoru. Renderuje dummy preview pomocí stejné komponenty
 * (DiaryBlockView), jakou používá samotná DiaryTab v profilu postavy. Tím má
 * PJ jistotu, že editovaný layout odpovídá tomu, co uvidí hráč.
 *
 * 16.2g F1a — `formula` bloky v náhledu počítáme z „ukázkového" numerického
 * kontextu (nenulové dummy hodnoty číselných bloků), ať PJ vidí, že vzorec
 * dává smysl, ne jen „—".
 */
export function SchemaPreview({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const flat = sorted.map(flattenSchemaBlock);

  const previewCtx: Record<string, number> = {};
  for (const b of flat) {
    if (b.type !== 'stat' && b.type !== 'number' && b.type !== 'bar') continue;
    const v =
      typeof b.maxValue === 'number'
        ? b.maxValue
        : typeof b.minValue === 'number'
          ? b.minValue + 1
          : 1;
    if (b.key) previewCtx[b.key] = v;
    previewCtx[b.id] = v;
  }

  return (
    <div className={`${s.panel} ${s.previewPanel}`}>
      <div className={s.panelHeader}>Náhled</div>
      {flat.length === 0 ? (
        <div className={s.previewEmpty}>Schéma je prázdné.</div>
      ) : (
        <div className={s.preview}>
          {flat.map((flatB, i) => (
            <DiaryBlockView
              key={flatB.id}
              block={flatB}
              value={dummyValueFor(sorted[i])}
              numericContext={previewCtx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
