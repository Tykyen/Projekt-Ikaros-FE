import { Link } from 'react-router-dom';
import type { CustomDiaryBlock } from '../../api/characters.types';
import { evalFormula } from './diaryFormula';
import s from './DiaryTab.module.css';

interface Props {
  block: CustomDiaryBlock;
  value: unknown;
  /** D-DIARY-3 — slovník číselných hodnot pro `formula` eval (key → number). */
  numericContext?: Record<string, number>;
  /** D-DIARY-3 — world slug pro link-out v `relation` bloku. */
  worldSlug?: string;
}

/**
 * 8.5 — extrahováno z `DiaryTab.tsx` do samostatného souboru, aby šlo
 * reuse v `SchemaPreview` editoru šablony deníku (8.5) i v původním
 * `DiaryTabView`.
 */
export function DiaryBlockView({
  block,
  value,
  numericContext,
  worldSlug,
}: Props) {
  const num = Number(value);
  const isBar =
    block.type === 'bar' &&
    typeof block.maxValue === 'number' &&
    !Number.isNaN(num);
  // D-DIARY-3 image typ — preferuj `value` (per-postava override), fallback
  // na `block.imageUrl` (default ze schématu).
  const isImage = block.type === 'image';
  const imageSrc = isImage
    ? (typeof value === 'string' && value ? value : block.imageUrl) || ''
    : '';

  // D-DIARY-3 relation: `value` drží slug cílové postavy. Renderuje link
  // na detail. Display name přidáme až po dořešení (rezolver hook v parent).
  const isRelation = block.type === 'relation';
  const relationSlug = isRelation && typeof value === 'string' ? value : '';

  // D-DIARY-3 formula: `block.expression` (config field) je vyhodnocen
  // proti `numericContext` (kde jsou čísla z bar/stat/number bloků).
  const isFormula = block.type === 'formula';
  const formulaExpr =
    isFormula && typeof block.expression === 'string'
      ? block.expression
      : '';
  const formulaResult = isFormula && formulaExpr && numericContext
    ? evalFormula(formulaExpr, numericContext)
    : null;

  // 8.7a — paralelně k hashed module CSS přidáváme stabilní class names
  // (`diary-block`, `diary-block__label`, …) a `data-block-type`. Tím
  // můžou per-systémové styly (`[data-diary-system="X"] .diary-block { … }`)
  // chytat bez znalosti module hashů a bez sahání do shared CSS.
  return (
    <div
      className={`${s.block} diary-block`}
      data-block-type={block.type}
      style={block.color ? { borderColor: block.color } : undefined}
    >
      <span className={`${s.blockLabel} diary-block__label`}>
        {block.label}
      </span>
      {isImage ? (
        imageSrc ? (
          <img
            src={imageSrc}
            alt={block.label}
            className="diary-block__image"
            style={{
              width: '100%',
              maxHeight: 200,
              objectFit: 'contain',
              borderRadius: 6,
              marginTop: 4,
            }}
          />
        ) : (
          <span className={`${s.blockValue} diary-block__value`}>—</span>
        )
      ) : isRelation ? (
        relationSlug ? (
          <Link
            to={worldSlug ? `/svet/${worldSlug}/${relationSlug}` : '#'}
            className={`${s.blockValue} diary-block__value diary-block__relation`}
            style={{ color: 'var(--accent)', textDecoration: 'underline' }}
          >
            🔗 {relationSlug}
          </Link>
        ) : (
          <span className={`${s.blockValue} diary-block__value`}>—</span>
        )
      ) : isFormula ? (
        <span className={`${s.blockValue} diary-block__value diary-block__formula`}>
          {formulaResult !== null
            ? Math.round(formulaResult * 100) / 100
            : '—'}
        </span>
      ) : isBar ? (
        <>
          <div className={`${s.barTrack} diary-block__bar-track`}>
            <div
              className={`${s.barFill} diary-block__bar-fill`}
              style={{
                width: `${Math.min(100, Math.max(0, (num / (block.maxValue || 1)) * 100))}%`,
                background: block.color ?? undefined,
              }}
            />
          </div>
          <span className={`${s.blockValue} diary-block__value`}>
            {num} / {block.maxValue}
          </span>
        </>
      ) : Array.isArray(value) ? (
        <ul className={`${s.blockList} diary-block__list`}>
          {value.map((v, i) => (
            <li key={i}>{String(v)}</li>
          ))}
        </ul>
      ) : (
        <span className={`${s.blockValue} diary-block__value`}>
          {value === undefined || value === null || value === ''
            ? '—'
            : String(value)}
        </span>
      )}
    </div>
  );
}
