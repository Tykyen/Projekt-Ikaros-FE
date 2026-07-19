/**
 * 21.2a — detail jmenné sady: hlavička (kategorie/popis/vlastnosti/počty)
 * + ukázky seznamů + akce (upravit autor/kurátor · schválit kurátor ·
 * smazat · nahlásit). Vzor detailů rodiny Společné tvorby.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { Seo } from '@/shared/seo';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { useNameSet } from './hooks/useNameSets';
import { useNameSetsMutations } from './hooks/useNameSetsMutations';
import { NameSetEditorModal } from './components/NameSetEditorModal';
import { NAME_SET_CATEGORY_LABELS } from './types';
import s from './Generatory.module.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

const SAMPLE = 15;

export default function NameSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: set, isLoading, isError } = useNameSet(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approve, remove } = useNameSetsMutations();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !set)
    return (
      <ErrorState
        size="panel"
        status={404}
        title="Sada nenalezena"
        action={{ label: 'Zpět na generátory', to: '/ikaros/generatory' }}
      />
    );

  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === set.authorId;
  const canEdit = isAuthor || isCurator;
  const canDelete = (isAuthor && set.status === 'draft') || isCurator;

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Generátory', href: '/ikaros/generatory' },
    { label: set.name },
  ];

  const cols: { title: string; items: string[]; total: number }[] = [
    { title: 'Mužská jména', items: set.maleNames.slice(0, SAMPLE), total: set.maleNames.length },
    { title: 'Ženská jména', items: set.femaleNames.slice(0, SAMPLE), total: set.femaleNames.length },
    { title: 'Příjmení', items: set.surnames.slice(0, SAMPLE), total: set.surnames.length },
  ];
  if (set.epithets.length > 0)
    cols.push({
      title: 'Přízviska',
      items: set.epithets.slice(0, SAMPLE),
      total: set.epithets.length,
    });

  return (
    <article className={s.page}>
      <Seo
        title={`${set.name} — jmenná sada`}
        description={set.description ?? 'Komunitní jmenná sada pro generátory.'}
        canonicalPath={`/ikaros/generatory/sady/${set.id}`}
      />
      <Breadcrumbs items={crumbs} />

      <div className={s.panel} data-nameset-detail="">
        <div className={s.topNav}>
          <Link to="/ikaros/generatory" className={s.backLink}>
            ← Zpět na generátory
          </Link>{' '}
          <span className={s.stateBadge} data-status={set.status}>
            {set.status === 'approved' ? '✔ Schválená sada' : '📝 Návrh'}
          </span>
        </div>

        <h1 className={s.title}>{set.name}</h1>
        <p className={s.seedNote}>
          {NAME_SET_CATEGORY_LABELS[set.category]}
          {set.description ? ` · ${set.description}` : ''}
          {set.surnameNote ? ` · Příjmení: ${set.surnameNote}` : ''}
          {set.femaleSurnameRule === 'cs' ? ' · přechylování -ová' : ''}
          {set.frequencySorted ? ' · řazeno dle četnosti' : ''}
          {set.demography
            ? ` · demografie: dožití ×${set.demography.lifespanMult ?? 1}${
                set.demography.fertilityFrom !== undefined
                  ? `, plodnost ${set.demography.fertilityFrom}–${set.demography.fertilityTo}`
                  : ''
              }`
            : ''}
        </p>

        {user ? (
          <div className={s.actions}>
            {canEdit ? (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                ✎ Upravit
              </Button>
            ) : null}
            {isCurator && set.status === 'draft' ? (
              <Button
                variant="primary"
                loading={approve.isPending}
                onClick={() => approve.mutate(set.id)}
              >
                ✔ Schválit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                loading={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Smazat sadu „${set.name}"?`)) {
                    remove.mutate(set.id, {
                      onSuccess: () => navigate('/ikaros/generatory'),
                    });
                  }
                }}
              >
                🗑 Smazat
              </Button>
            ) : null}
            <ReportButton
              targetType="name_set"
              targetId={set.id}
              targetSnapshot={set.name}
              targetAuthorName="Autor sady"
              targetAuthorId={set.authorId}
            />
          </div>
        ) : null}

        <div className={s.sampleGrid}>
          {cols.map((col) => (
            <div key={col.title} className={s.sampleCol}>
              <div className={s.sampleColTitle}>
                {col.title} ({col.total})
              </div>
              <ul>
                {col.items.map((n) => (
                  <li key={n}>{n}</li>
                ))}
                {col.total > SAMPLE ? <li>… (+{col.total - SAMPLE})</li> : null}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {editing ? (
        <NameSetEditorModal
          mode="edit"
          set={set}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </article>
  );
}
