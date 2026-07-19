/**
 * 21.5c — detail komunitního kouzla („karta kouzla").
 * Jádro (obrázek + oznámení) + pravidlové záložky (systémy ze `statblocks`) +
 * statblok render dle šablony + dvouúrovňová diskuse + akce (upravit jádro /
 * návrh statbloku / schvalování kurátorem / smazání / nahlásit).
 * Vzor: KomunitniBestieDetailPage.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SpellDiscussion } from './components/SpellDiscussion';
import { SpellEditorModal } from './components/SpellEditorModal';
import { ProposeSpellStatblockModal } from './components/ProposeSpellStatblockModal';
import { SpellStatblockView } from './components/SpellStatblockView';
import {
  getSpellTemplate,
  spellSchool,
  spellSystemLabel,
} from './systems/spellTemplates';
import { useKouzlo } from './hooks/useKouzla';
import { useKouzlaMutations } from './hooks/useKouzlaMutations';
import s from './KomunitniKouzloDetail.module.css';
import './kouzlaSkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniKouzloDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: spell, isLoading, isError } = useKouzlo(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approveSb, approve, remove } = useKouzlaMutations();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | 'editLore' | 'propose' | 'editStats'
  >(null);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !spell)
    return (
      <ErrorState
        size="panel"
        status={404}
        title="Kouzlo nenalezeno"
        action={{ label: 'Zpět na knihovnu', to: '/ikaros/kouzla' }}
      />
    );

  const systemIds = spell.statblocks ? Object.keys(spell.statblocks) : [];
  const activeSys =
    activeSystem && systemIds.includes(activeSystem)
      ? activeSystem
      : (systemIds[0] ?? null);
  const activeSb = activeSys ? spell.statblocks?.[activeSys] : undefined;

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === spell.authorId;
  const canEditLore = isAuthor || isCurator;
  const canDelete = isCurator || (isAuthor && spell.status === 'draft');

  const desc = (spell.description ?? '').trim();
  const school = activeSb ? spellSchool(activeSb.systemStats) : '';
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Kouzla', href: '/ikaros/kouzla' },
    { label: spell.name },
  ];

  const onDelete = () => {
    if (!window.confirm(`Opravdu smazat kouzlo „${spell.name}"?`)) return;
    remove.mutate(spell.id, {
      onSuccess: () => navigate('/ikaros/kouzla'),
    });
  };

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.tome} data-spell-card="">
        <div className={s.top}>
          <Link to="/ikaros/kouzla" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={spell.status}>
            {spell.status === 'approved'
              ? '✔ Schválené kouzlo'
              : '✎ Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            {canEditLore ? (
              <Button variant="ghost" onClick={() => setModal('editLore')}>
                ✎ Upravit kouzlo
              </Button>
            ) : null}
            {isCurator && spell.status === 'draft' ? (
              <Button
                variant="ghost"
                loading={approve.isPending}
                onClick={() => approve.mutate(spell.id)}
              >
                ✔ Schválit kouzlo
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
            {/* Jméno autora entita nenese → neutrální label (parita bestiář). */}
            <ReportButton
              targetType="spell"
              targetId={spell.id}
              targetSnapshot={spell.name}
              targetAuthorName="Autor kouzla"
              targetAuthorId={spell.authorId}
            />
          </div>
        ) : null}

        <header className={s.beastTitle}>
          {spell.aliases ? <div className={s.latin}>{spell.aliases}</div> : null}
          <h1 className={s.name}>{spell.name}</h1>
          {school ? (
            <div className={s.kind} data-spell-school="">
              {school}
            </div>
          ) : null}
        </header>

        <div className={s.spread}>
          <div className={s.illus} data-spell-portrait="">
            {spell.imageUrl ? (
              <img src={spell.imageUrl} alt={spell.name} />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                ✦
              </span>
            )}
          </div>
          <div className={s.lore}>
            {desc ? (
              <p className={s.loreText}>
                <span className={s.dropcap}>{desc.charAt(0)}</span>
                {desc.slice(1)}
              </p>
            ) : (
              <p className={s.empty}>Kouzlo zatím nemá popis.</p>
            )}
          </div>
        </div>

        {systemIds.length > 0 ? (
          <>
            <div className={s.rulesHead}>
              <div className={s.rulesLabel}>Pravidla podle herního systému</div>
              <div className={s.tabs} data-ruleset-tabs="" role="tablist">
                {systemIds.map((sy) => {
                  const draft = spell.statblocks?.[sy]?.status === 'draft';
                  return (
                    <button
                      key={sy}
                      type="button"
                      role="tab"
                      aria-selected={sy === activeSys}
                      className={clsx(s.tab, draft && s.tabDraft)}
                      onClick={() => setActiveSystem(sy)}
                    >
                      {spellSystemLabel(sy)}
                      {draft ? <span className={s.tabFlag}> · návrh</span> : null}
                    </button>
                  );
                })}
                {isAuth ? (
                  <button
                    type="button"
                    className={s.addSystem}
                    onClick={() => setModal('propose')}
                  >
                    ＋ systém
                  </button>
                ) : null}
              </div>
            </div>

            {activeSb && activeSys ? (
              <div className={s.ruleset} data-statblock="">
                {activeSb.status === 'draft' ? (
                  <div className={s.draftWarn}>
                    <span>
                      ⚠️ <b>Návrh statbloku — neověřeno.</b> Tuhle verzi navrhl
                      hráč a zatím ji kurátor nepřijal jako balancnutou.
                    </span>
                    {isCurator ? (
                      <Button
                        variant="primary"
                        loading={approveSb.isPending}
                        onClick={() =>
                          approveSb.mutate({
                            id: spell.id,
                            systemId: activeSys,
                          })
                        }
                      >
                        ✔ Schválit statblok
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {isCurator ? (
                  <div className={s.actions}>
                    <Button variant="ghost" onClick={() => setModal('editStats')}>
                      ✎ Upravit statblok
                    </Button>
                  </div>
                ) : null}

                <SpellStatblockView
                  template={getSpellTemplate(activeSys)}
                  systemStats={activeSb.systemStats}
                />

                <SpellDiscussion
                  key={activeSys}
                  spellId={spell.id}
                  targetType="statblock"
                  systemId={activeSys}
                  title="Diskuse ke statbloku"
                  scopeNote={`jen k verzi ${spellSystemLabel(activeSys)}`}
                  placeholder={`Napiš k verzi ${spellSystemLabel(activeSys)}…`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className={s.empty}>
            Pro tohle kouzlo zatím není žádná pravidlová verze.
            {isAuth ? (
              <div className={s.emptyAction}>
                <Button variant="primary" onClick={() => setModal('propose')}>
                  ＋ Navrhnout statblok
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <SpellDiscussion
          spellId={spell.id}
          targetType="spell"
          title="Diskuse o kouzle"
          scopeNote="lore & obecně, napříč systémy"
          placeholder="Napiš o kouzle (lore, použití, nápady)…"
        />
      </div>

      {modal === 'editLore' ? (
        <SpellEditorModal
          mode="editLore"
          spell={spell}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'propose' ? (
        <ProposeSpellStatblockModal
          spell={spell}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'editStats' && activeSys ? (
        <ProposeSpellStatblockModal
          spell={spell}
          editSystemId={activeSys}
          onClose={() => setModal(null)}
        />
      ) : null}
    </article>
  );
}
