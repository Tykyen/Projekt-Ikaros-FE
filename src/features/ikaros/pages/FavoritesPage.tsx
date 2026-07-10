import { useSearchParams, Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Bookmark } from 'lucide-react';
import { currentUserAtom } from '@/shared/store/authStore';
import { Spinner, EmptyState } from '@/shared/ui';
import {
  useMyFavoriteDiscussions,
  useTogglePinDiscussion,
} from '../api/useDiscussions';
import {
  useMyFavoriteArticles,
  useTogglePinArticle,
} from '../api/useArticles';
import {
  useMyFavoriteGallery,
  useTogglePinGallery,
} from '../api/useGallery';
import { PinToggle } from '../components/PinToggle';
import { cloudinaryThumb } from '@/shared/lib/cloudinary';
import s from './FavoritesPage.module.css';

/**
 * 3.7 — stránka „Moje oblíbené". Tři taby (Diskuze / Články / Obrázky),
 * aktivní tab v URL `?typ=`. Karty s přepínačem připnutí do sidebaru (max 5).
 */

type Typ = 'diskuze' | 'clanky' | 'obrazky';

const TABS: { key: Typ; label: string }[] = [
  { key: 'diskuze', label: 'Diskuze' },
  { key: 'clanky', label: 'Články' },
  { key: 'obrazky', label: 'Obrázky' },
];

const MAX_PINNED = 5;

function parseTyp(raw: string | null): Typ {
  return raw === 'clanky' || raw === 'obrazky' ? raw : 'diskuze';
}

/** Vytáhne BE hlášku z chyby (409 PIN_LIMIT / NOT_FAVORITE), jinak fallback. */
function pinError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (
      err as { response?: { data?: { error?: { message?: string } } } }
    ).response?.data;
    if (data?.error?.message) return data.error.message;
  }
  return 'Připnutí se nezdařilo';
}

export default function FavoritesPage() {
  const [params, setParams] = useSearchParams();
  const typ = parseTyp(params.get('typ'));

  function changeTyp(next: Typ) {
    const out = new URLSearchParams(params);
    if (next === 'diskuze') out.delete('typ');
    else out.set('typ', next);
    setParams(out, { replace: true });
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <h1 className={s.title}>Moje oblíbené</h1>
        <p className={s.subtitle}>
          Tvoje záložky napříč diskuzemi, články a galerií. Připnuté položky
          (špendlík) se zobrazují v pravém panelu — max {MAX_PINNED} na typ.
        </p>
      </header>

      <div className={s.tabs} role="tablist" aria-label="Typ oblíbeného obsahu">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={typ === t.key}
            className={clsx(s.tab, typ === t.key && s.tabActive)}
            onClick={() => changeTyp(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {typ === 'diskuze' && <DiscussionsTab />}
      {typ === 'clanky' && <ArticlesTab />}
      {typ === 'obrazky' && <GalleryTab />}
    </div>
  );
}

// ─── Společná karta ────────────────────────────────────────────────────────

interface FavoriteCardProps {
  to: string;
  title: string;
  subtitle?: string;
  thumbUrl?: string;
  isPinned: boolean;
  pinDisabled: boolean;
  pinPending: boolean;
  onTogglePin: () => void;
}

function FavoriteCard({
  to,
  title,
  subtitle,
  thumbUrl,
  isPinned,
  pinDisabled,
  pinPending,
  onTogglePin,
}: FavoriteCardProps) {
  return (
    <li className={s.card}>
      <Link to={to} className={s.cardLink}>
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className={s.cardThumb}
            loading="lazy"
          />
        ) : (
          <span className={s.cardGlyph} aria-hidden>
            <Bookmark size={18} />
          </span>
        )}
        <span className={s.cardBody}>
          <span className={s.cardTitle}>{title}</span>
          {subtitle && <span className={s.cardSub}>{subtitle}</span>}
        </span>
      </Link>
      <div className={s.cardPin}>
        <PinToggle
          isPinned={isPinned}
          disabled={pinDisabled}
          pending={pinPending}
          onToggle={onTogglePin}
        />
      </div>
    </li>
  );
}

function EmptyTab() {
  return (
    <EmptyState
      size="panel"
      illustration="generic-empty"
      title="V oblíbených zatím nic nemáš."
      description="Co si oblíbíš (srdíčko / záložka), najdeš pohromadě tady."
    />
  );
}

// ─── Tab: Diskuze ──────────────────────────────────────────────────────────

function DiscussionsTab() {
  const user = useAtomValue(currentUserAtom);
  const { data: items, isLoading } = useMyFavoriteDiscussions();
  const togglePin = useTogglePinDiscussion();
  const pinned = user?.pinnedDiscussionIds ?? [];

  if (isLoading) return <Spinner center />;
  if (!items || items.length === 0) return <EmptyTab />;

  return (
    <ul className={s.grid}>
      {items.map((d) => {
        const isPinned = pinned.includes(d.id);
        return (
          <FavoriteCard
            key={d.id}
            to={`/ikaros/diskuze/${d.id}`}
            title={d.title}
            subtitle={d.creatorName}
            isPinned={isPinned}
            pinDisabled={pinned.length >= MAX_PINNED && !isPinned}
            pinPending={togglePin.isPending}
            onTogglePin={() =>
              togglePin.mutate(d.id, {
                onError: (e) => toast.error(pinError(e)),
              })
            }
          />
        );
      })}
    </ul>
  );
}

// ─── Tab: Články ───────────────────────────────────────────────────────────

function ArticlesTab() {
  const user = useAtomValue(currentUserAtom);
  const { data: items, isLoading } = useMyFavoriteArticles();
  const togglePin = useTogglePinArticle();
  const pinned = user?.pinnedArticleIds ?? [];

  if (isLoading) return <Spinner center />;
  if (!items || items.length === 0) return <EmptyTab />;

  return (
    <ul className={s.grid}>
      {items.map((a) => {
        const isPinned = pinned.includes(a.id);
        return (
          <FavoriteCard
            key={a.id}
            to={`/ikaros/clanky/${a.id}`}
            title={a.title}
            subtitle={a.authorName}
            isPinned={isPinned}
            pinDisabled={pinned.length >= MAX_PINNED && !isPinned}
            pinPending={togglePin.isPending}
            onTogglePin={() =>
              togglePin.mutate(a.id, {
                onError: (e) => toast.error(pinError(e)),
              })
            }
          />
        );
      })}
    </ul>
  );
}

// ─── Tab: Obrázky ──────────────────────────────────────────────────────────

function GalleryTab() {
  const user = useAtomValue(currentUserAtom);
  const { data: items, isLoading } = useMyFavoriteGallery();
  const togglePin = useTogglePinGallery();
  const pinned = user?.pinnedGalleryIds ?? [];

  if (isLoading) return <Spinner center />;
  if (!items || items.length === 0) return <EmptyTab />;

  return (
    <ul className={s.grid}>
      {items.map((g) => {
        const isPinned = pinned.includes(g.id);
        return (
          <FavoriteCard
            key={g.id}
            to={`/ikaros/galerie/${g.id}`}
            title={g.title}
            subtitle={g.authorName}
            thumbUrl={cloudinaryThumb(g.imageUrl, 160)}
            isPinned={isPinned}
            pinDisabled={pinned.length >= MAX_PINNED && !isPinned}
            pinPending={togglePin.isPending}
            onTogglePin={() =>
              togglePin.mutate(g.id, {
                onError: (e) => toast.error(pinError(e)),
              })
            }
          />
        );
      })}
    </ul>
  );
}
