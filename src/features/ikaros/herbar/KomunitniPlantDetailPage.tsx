/**
 * 21.5a — detail komunitní rostliny („karta bylinkáře").
 * Iluminace (obrázek) + název/aliases + tabulka Roste · Použití · Vzácnost +
 * popis. Akce autor/kurátor (upravit) + kurátor (schválit draft). Bez diskuse
 * (BE ji zatím nemá). Vzhled motiv-aware; tvarové skiny per motiv později.
 */
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button } from '@/shared/ui';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { useKomunitniPlant } from './hooks/useKomunitniHerbar';
import { useKomunitniHerbarMutations } from './hooks/useKomunitniHerbarMutations';
import { PlantEditorModal } from './components/PlantEditorModal';
import { InsertToShopModal } from './components/InsertToShopModal';
import { rarityLabel } from './types';
import s from './KomunitniPlantDetail.module.css';
import './herbarSkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniPlantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: plant, isLoading, isError } = useKomunitniPlant(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approve } = useKomunitniHerbarMutations();
  const [editing, setEditing] = useState(false);
  const [insertingToShop, setInsertingToShop] = useState(false);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !plant)
    return (
      <p className={s.state}>
        Rostlina nenalezena. <Link to="/ikaros/herbar">Zpět na knihovnu</Link>
      </p>
    );

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === plant.authorId;
  const canEdit = isAuthor || isCurator;

  const desc = (plant.description ?? '').trim();
  const rows: { label: string; value: string }[] = [];
  if (plant.habitat?.trim())
    rows.push({ label: 'Roste', value: plant.habitat.trim() });
  if (plant.usage?.trim())
    rows.push({ label: 'Použití', value: plant.usage.trim() });

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Herbář', href: '/ikaros/herbar' },
    { label: plant.name },
  ];

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.card} data-plant-card="">
        <div className={s.top}>
          <Link to="/ikaros/herbar" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={plant.status}>
            {plant.status === 'approved'
              ? '✔ Schválená rostlina'
              : '🌱 Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            <Button variant="primary" onClick={() => setInsertingToShop(true)}>
              ＋ Vlož do obchodu
            </Button>
            {canEdit ? (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                ✎ Upravit
              </Button>
            ) : null}
            {isCurator && plant.status === 'draft' ? (
              <Button
                variant="primary"
                loading={approve.isPending}
                onClick={() => approve.mutate(plant.id)}
              >
                ✔ Schválit
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className={s.spread}>
          <div className={s.illus} data-plant-portrait="">
            {plant.imageUrl ? (
              <img src={plant.imageUrl} alt={plant.name} />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                {plant.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className={s.info}>
            <header className={s.plantTitle}>
              <h1 className={s.name}>{plant.name}</h1>
              {plant.aliases ? (
                <div className={s.aliases}>{plant.aliases}</div>
              ) : null}
            </header>

            <dl className={s.table}>
              {rows.map((r) => (
                <div key={r.label} className={s.tableRow}>
                  <dt className={s.tableKey}>{r.label}</dt>
                  <dd className={s.tableVal}>{r.value}</dd>
                </div>
              ))}
              {plant.rarity ? (
                <div className={s.tableRow}>
                  <dt className={s.tableKey}>Vzácnost</dt>
                  <dd className={s.tableVal}>
                    <span className={s.rarityChip} data-rarity={plant.rarity}>
                      {rarityLabel(plant.rarity)}
                    </span>
                    {plant.rarityNote?.trim() ? (
                      <span className={s.rarityNote}>
                        {plant.rarityNote.trim()}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {typeof plant.suggestedPrice === 'number' ? (
                <div className={s.tableRow}>
                  <dt className={s.tableKey}>Navrhovaná cena</dt>
                  <dd className={s.tableVal}>{plant.suggestedPrice}</dd>
                </div>
              ) : null}
              {plant.tags && plant.tags.length > 0 ? (
                <div className={s.tableRow}>
                  <dt className={s.tableKey}>Štítky</dt>
                  <dd className={s.tableVal}>
                    <span className={s.tagList}>
                      {plant.tags.map((t) => (
                        <span key={t} className={s.tag}>
                          {t}
                        </span>
                      ))}
                    </span>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>

        {desc ? (
          <div className={s.desc}>
            <div className={s.descLabel}>Popis</div>
            <p className={s.descText}>{desc}</p>
          </div>
        ) : null}
      </div>

      {editing ? (
        <PlantEditorModal
          mode="edit"
          plant={plant}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {insertingToShop ? (
        <InsertToShopModal
          mode="single"
          plants={[plant]}
          onClose={() => setInsertingToShop(false)}
        />
      ) : null}
    </article>
  );
}
