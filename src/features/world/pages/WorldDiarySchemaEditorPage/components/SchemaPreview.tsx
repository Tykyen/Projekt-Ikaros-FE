import { DiaryBlockView } from '../../CharacterDetailPage/components/DiaryBlockView';
import type { DiarySchemaBlock } from '../../api/diarySchema.types';
import {
  flattenSchemaBlock,
  dummyValueFor,
} from '../utils/schemaMappers';
import s from './DiarySchemaEditor.module.css';

interface Props {
  blocks: DiarySchemaBlock[];
}

/**
 * 8.5 — pravý panel editoru. Renderuje dummy preview pomocí stejné komponenty
 * (DiaryBlockView), jakou používá samotná DiaryTab v profilu postavy. Tím má
 * PJ jistotu, že editovaný layout odpovídá tomu, co uvidí hráč.
 */
export function SchemaPreview({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className={`${s.panel} ${s.previewPanel}`}>
      <div className={s.panelHeader}>Náhled</div>
      {sorted.length === 0 ? (
        <div className={s.previewEmpty}>Schéma je prázdné.</div>
      ) : (
        <div className={s.preview}>
          {sorted.map((b) => (
            <DiaryBlockView
              key={b.id ?? b.key}
              block={flattenSchemaBlock(b)}
              value={dummyValueFor(b)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
