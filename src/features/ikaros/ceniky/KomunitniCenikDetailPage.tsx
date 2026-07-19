/**
 * 21.5f — detail komunitního ceníku. Hlavička (obrázek/název/popis/štítky)
 * + tabulka položek seskupená po sekcích (miniatura · název+popis · cena
 * „2 zl 5 st" · překlik na Předmět · single vklad) + filtr sekce + bulk vklad
 * (respektuje filtr) + diskuse (jedna úroveň). Akce autor/kurátor mirror herbář.
 */
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { getImageStyle } from '@/shared/lib/imageStyle';
import { useKomunitniCenik } from './hooks/useKomunitniCeniky';
import { useKomunitniCenikyMutations } from './hooks/useKomunitniCenikyMutations';
import { CenikEditorModal } from './components/CenikEditorModal';
import { CenikDiscussion } from './components/CenikDiscussion';
import { InsertToShopModal } from '../herbar/components/InsertToShopModal';
import { cenikItemToShopInsert } from './shopInsert';
import {
  formatPrice,
  sectionsOf,
  type PriceListCurrency,
  type PriceListItem,
} from './types';
import s from './KomunitniCenikDetail.module.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

/** '' = položky bez sekce (v UI „Ostatní" — jen když existují i sekce). */
const NO_SECTION = '';

export default function KomunitniCenikDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: cenik, isLoading, isError } = useKomunitniCenik(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approve } = useKomunitniCenikyMutations();
  const [editing, setEditing] = useState(false);
  const [sectionFilter, setSectionFilter] = useState<'all' | string>('all');
  const [shopItems, setShopItems] = useState<PriceListItem[] | null>(null);

  const items = useMemo(() => cenik?.items ?? [], [cenik?.items]);
  const sections = useMemo(() => sectionsOf(items), [items]);
  const hasSections = sections.some((sec) => sec !== NO_SECTION);

  const visible = useMemo(
    () =>
      sectionFilter === 'all'
        ? items
        : items.filter((it) => (it.section?.trim() ?? '') === sectionFilter),
    [items, sectionFilter],
  );

  /** Skupiny pro render: [sekce, položky] v pořadí prvního výskytu. */
  const groups = useMemo(() => {
    const out: { section: string; items: PriceListItem[] }[] = [];
    for (const sec of sectionsOf(visible)) {
      out.push({
        section: sec,
        items: visible.filter((it) => (it.section?.trim() ?? '') === sec),
      });
    }
    return out;
  }, [visible]);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !cenik)
    return (
      <ErrorState
        size="panel"
        status={404}
        title="Ceník nenalezen"
        action={{ label: 'Zpět na knihovnu', to: '/ikaros/ceniky' }}
      />
    );

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === cenik.authorId;
  const canEdit = isAuthor || isCurator;

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Ceníky', href: '/ikaros/ceniky' },
    { label: cenik.name },
  ];

  return (
    <article className={s.page}>
      <Seo
        title={`${cenik.name} — komunitní ceník`}
        description={cenik.description ?? 'Komunitní ceník zboží a služeb.'}
        canonicalPath={`/ikaros/ceniky/${cenik.id}`}
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.card} data-cenik-card="">
        <div className={s.top}>
          <Link to="/ikaros/ceniky" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={cenik.status}>
            {cenik.status === 'approved'
              ? '✔ Schválený ceník'
              : '📝 Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            <Button
              variant="primary"
              disabled={visible.length === 0}
              onClick={() => setShopItems(visible)}
            >
              🛒 Vlož do obchodu ({visible.length})
            </Button>
            {canEdit ? (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                ✎ Upravit
              </Button>
            ) : null}
            {isCurator && cenik.status === 'draft' ? (
              <Button
                variant="primary"
                loading={approve.isPending}
                onClick={() => approve.mutate(cenik.id)}
              >
                ✔ Schválit
              </Button>
            ) : null}
            {/* Nahlašování ceníku (17. plocha 20B). Jméno autora entita
                nenese → neutrální label; ban řeší targetAuthorId. */}
            <ReportButton
              targetType="price_list"
              targetId={cenik.id}
              targetSnapshot={cenik.name}
              targetAuthorName="Autor ceníku"
              targetAuthorId={cenik.authorId}
            />
          </div>
        ) : null}

        <div className={s.spread}>
          <div className={s.illus} data-cenik-portrait="">
            {cenik.imageUrl ? (
              <img
                src={cenik.imageUrl}
                alt={cenik.name}
                style={getImageStyle(
                  cenik.imageFocalX,
                  cenik.imageFocalY,
                  cenik.imageZoom,
                  cenik.imageFit,
                )}
              />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                {cenik.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className={s.info}>
            <h1 className={s.name}>{cenik.name}</h1>
            {cenik.description?.trim() ? (
              <p className={s.desc}>{cenik.description.trim()}</p>
            ) : null}
            {cenik.tags && cenik.tags.length > 0 ? (
              <span className={s.tagList}>
                {cenik.tags.map((t) => (
                  <span key={t} className={s.tag}>
                    {t}
                  </span>
                ))}
              </span>
            ) : null}
            <p className={s.metaLine}>
              {items.length} položek
              {hasSections ? ` · ${sections.length} sekcí` : ''}
              {cenik.currency === 'usd' ? ' · ceny v dolarech ($)' : ''}
              {cenik.currency === 'credits' ? ' · ceny v kreditech' : ''}
            </p>
          </div>
        </div>

        {hasSections ? (
          <div className={s.sectionFilter}>
            <label className={s.sectionFilterLabel} htmlFor="cenik-section">
              Sekce
            </label>
            <select
              id="cenik-section"
              className={s.sectionSelect}
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">Vše</option>
              {sections.map((sec) => (
                <option key={sec || '∅'} value={sec}>
                  {sec === NO_SECTION ? 'Ostatní' : sec}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p className={s.state}>Ceník zatím nemá žádné položky.</p>
        ) : (
          groups.map((g) => (
            <section key={g.section || '∅'}>
              {hasSections ? (
                <h2 className={s.sectionTitle}>
                  {g.section === NO_SECTION ? 'Ostatní' : g.section}
                </h2>
              ) : null}
              <ul className={s.items} data-cenik-items="">
                {g.items.map((it) => (
                  <CenikItemRow
                    key={it.id}
                    item={it}
                    currency={cenik.currency}
                    canInsert={isAuth}
                    onInsert={() => setShopItems([it])}
                  />
                ))}
              </ul>
            </section>
          ))
        )}

        <CenikDiscussion priceListId={cenik.id} />
      </div>

      {editing ? (
        <CenikEditorModal
          mode="edit"
          cenik={cenik}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {shopItems ? (
        <InsertToShopModal
          mode={shopItems.length === 1 ? 'single' : 'bulk'}
          items={shopItems.map(cenikItemToShopInsert)}
          nounMany="položek"
          priceCurrency={cenik.currency ?? 'gsc'}
          onClose={() => setShopItems(null)}
        />
      ) : null}
    </article>
  );
}

function CenikItemRow({
  item,
  currency,
  canInsert,
  onInsert,
}: {
  item: PriceListItem;
  currency?: PriceListCurrency;
  canInsert: boolean;
  onInsert: () => void;
}) {
  return (
    <li className={s.item} data-cenik-item="">
      <span
        className={s.itemThumb}
        title={item.imageCredit ? `Obrázek: ${item.imageCredit}` : undefined}
      >
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
          <span className={s.itemThumbFallback} aria-hidden="true">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className={s.itemMain}>
        <span className={s.itemName}>{item.name}</span>
        {item.description ? (
          <span className={s.itemDesc}>{item.description}</span>
        ) : null}
      </span>
      {item.linkedItemId ? (
        <Link
          to={`/ikaros/predmety/${item.linkedItemId}`}
          className={s.itemLinked}
          title="Staty per systém v katalogu Předmětů"
        >
          ⚔ Staty
        </Link>
      ) : null}
      <span className={s.itemPrice}>
        {formatPrice(
          { gold: item.gold, silver: item.silver, copper: item.copper },
          currency,
        )}
      </span>
      {canInsert ? (
        <button
          type="button"
          className={s.itemShopBtn}
          title="Vlož položku do obchodu"
          onClick={onInsert}
        >
          🛒
        </button>
      ) : null}
    </li>
  );
}
