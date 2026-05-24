import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Globe2, ArrowLeft, Edit3, Lock } from 'lucide-react';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { WorldRole } from '@/shared/types';
import { usePageMeta, type ShieldedRequirement } from '../../api/usePageMeta';
import s from './AccessDenied.module.css';

interface Props {
  slug: string;
}

function describeShielded(req: ShieldedRequirement): string {
  if (req.type === 'AKJ') {
    return `AKJ úroveň ${req.level ?? '?'}`;
  }
  if (req.type === 'AKJType') {
    const lvl = req.level !== undefined ? ` (úroveň ${req.level})` : '';
    return `${req.akjLabel ?? req.akjKey ?? 'AKJ klíč'}${lvl}`;
  }
  if (req.type === 'Role') {
    return `Role: ${req.roleLabel ?? 'vyšší úroveň'}`;
  }
  return 'Neznámý požadavek';
}

/**
 * 7.1c + D-062a — 403 screen. Pokud BE vrátí 403, viewer ukáže tento screen místo
 * obsahu. Na pozadí volá `usePageMeta` (lehký endpoint) — vrací `isWoodWide`
 * (existence v lore) a `shieldedBy[]` (konkrétní AKJ/Role překážky).
 *
 * Pokud user je PomocnyPJ+, nabídneme i shortcut do editoru.
 */
export function AccessDenied({ slug }: Props) {
  const navigate = useNavigate();
  const { worldSlug, worldId, userRole } = useWorldContext();
  const { data: meta } = usePageMeta(worldId, slug);
  const canEdit = (userRole ?? -1) >= WorldRole.PomocnyPJ;
  const hasShielded =
    meta?.shieldedBy !== undefined && meta.shieldedBy.length > 0;

  return (
    <div className={s.wrap} role="alert">
      <div className={s.icon}>
        <ShieldAlert size={48} aria-hidden />
      </div>
      <h1 className={s.title}>
        {hasShielded ? 'Stránka je zašifrovaná' : 'Přístup zamítnut'}
      </h1>
      <p className={s.text}>
        {hasShielded
          ? 'Tato stránka existuje, ale nemáš dostatečný přístup k jejímu obsahu.'
          : 'Nemáš dostatečná oprávnění pro tuto stránku. Tvůj přístupový klíč (AKJ) nebo role nedosahuje požadované úrovně.'}
      </p>

      {hasShielded && (
        <div className={s.shieldedCard}>
          <p className={s.shieldedTitle}>K odemčení potřebuješ</p>
          <ul className={s.shieldedList}>
            {meta!.shieldedBy!.map((req, i) => (
              <li key={i} className={s.shieldedItem}>
                <Lock size={16} aria-hidden />
                <span>{describeShielded(req)}</span>
              </li>
            ))}
          </ul>
          <p className={s.shieldedHint}>
            Promluv s PJ světa o získání úrovně nebo přiřazení role.
          </p>
        </div>
      )}

      {meta?.isWoodWide && (
        <div className={s.woodWide}>
          <Globe2 size={16} aria-hidden />
          <span>
            Tento záznam je součástí celosvětového lore (Wood-Wide). Existuje,
            ale je utajen před tvojí úrovní.
          </span>
        </div>
      )}

      <div className={s.actions}>
        <button
          type="button"
          className={s.btnSecondary}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} aria-hidden /> Zpět
        </button>
        <Link to={`/svet/${worldSlug}/stranky`} className={s.btnSecondary}>
          Seznam stránek
        </Link>
        {canEdit && (
          <Link
            to={`/svet/${worldSlug}/edit/${slug}`}
            className={s.btnPrimary}
            title="PJ shortcut — otevřít v editoru"
          >
            <Edit3 size={14} aria-hidden /> Otevřít v editoru
          </Link>
        )}
      </div>
    </div>
  );
}
