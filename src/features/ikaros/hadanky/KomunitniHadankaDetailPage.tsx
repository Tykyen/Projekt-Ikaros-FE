/**
 * 21.5d — detail komunitní hádanky. Zadání velkým písmem (lore styl),
 * odpověď + nápovědy za spoiler klik (`RiddleReveal`, spec R3), původ +
 * poznámka pro PJ, jednoúrovňová diskuse, akce (upravit / schválit / smazat /
 * nahlásit). Layout CSS reuse z kouzel.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { Breadcrumbs, Button } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { RiddleReveal } from './components/RiddleReveal';
import { RiddleDiscussion } from './components/RiddleDiscussion';
import { RiddleEditorModal } from './components/RiddleEditorModal';
import { difficultyLabel, riddleExcerpt } from './types';
import { useHadanka } from './hooks/useHadanky';
import { useHadankyMutations } from './hooks/useHadankyMutations';
import s from '../kouzla/KomunitniKouzloDetail.module.css';
import './hadankySkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniHadankaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: riddle, isLoading, isError } = useHadanka(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approve, remove } = useHadankyMutations();
  const [showEdit, setShowEdit] = useState(false);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !riddle)
    return (
      <p className={s.state}>
        Hádanka nenalezena. <Link to="/ikaros/hadanky">Zpět na knihovnu</Link>
      </p>
    );

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === riddle.authorId;
  const canEdit = isAuthor || isCurator;
  const canDelete = isCurator || (isAuthor && riddle.status === 'draft');

  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Hádanky', href: '/ikaros/hadanky' },
    { label: riddleExcerpt(riddle.question, 40) },
  ];

  const onDelete = () => {
    if (!window.confirm('Opravdu smazat tuhle hádanku?')) return;
    remove.mutate(riddle.id, {
      onSuccess: () => navigate('/ikaros/hadanky'),
    });
  };

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.tome} data-riddle-card="">
        <div className={s.top}>
          <Link to="/ikaros/hadanky" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={riddle.status}>
            {riddle.status === 'approved'
              ? '✔ Schválená hádanka'
              : '✎ Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            {canEdit ? (
              <Button variant="ghost" onClick={() => setShowEdit(true)}>
                ✎ Upravit hádanku
              </Button>
            ) : null}
            {isCurator && riddle.status === 'draft' ? (
              <Button
                variant="ghost"
                loading={approve.isPending}
                onClick={() => approve.mutate(riddle.id)}
              >
                ✔ Schválit hádanku
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                variant="ghost"
                loading={remove.isPending}
                onClick={onDelete}
              >
                🗑 Smazat
              </Button>
            ) : null}
            {/* Jméno autora entita nenese → neutrální label (parity katalogů). */}
            <ReportButton
              targetType="riddle"
              targetId={riddle.id}
              targetSnapshot={riddleExcerpt(riddle.question, 120)}
              targetAuthorName="Autor hádanky"
              targetAuthorId={riddle.authorId}
            />
          </div>
        ) : null}

        <header className={s.beastTitle}>
          <div className={s.latin}>{riddle.origin ?? 'komunitní hádanka'}</div>
          <div className={s.kind}>{difficultyLabel(riddle.difficulty)}</div>
        </header>

        <div className={s.spread}>
          {riddle.imageUrl ? (
            <div className={s.illus} data-riddle-portrait="">
              <img src={riddle.imageUrl} alt="" />
            </div>
          ) : null}
          <div className={s.lore}>
            <p className={s.loreText}>
              <span className={s.dropcap}>{riddle.question.charAt(0)}</span>
              {riddle.question.slice(1)}
            </p>
          </div>
        </div>

        <RiddleReveal answer={riddle.answer} hints={riddle.hints ?? []} />

        {riddle.description?.trim() ? (
          <p className={s.empty}>
            <b>Poznámka pro PJ:</b> {riddle.description}
          </p>
        ) : null}

        <RiddleDiscussion riddleId={riddle.id} />
      </div>

      {showEdit ? (
        <RiddleEditorModal
          mode="edit"
          riddle={riddle}
          onClose={() => setShowEdit(false)}
        />
      ) : null}
    </article>
  );
}
