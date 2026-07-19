/**
 * 16.2b-2 — detail komunitní bytosti („kniha").
 * Lore (obrázek + text) + pravidlové záložky (systémy ze `statblocks`) +
 * statblok render (reuse `BestieDetail`) + dvouúrovňová diskuse + akce
 * (vlož / upravit lore / návrh statů / schvalování kurátorem). Vzhled
 * motiv-aware; tvarové skiny per motiv v SK-* přes data-atributy.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { systemEntitySchemaRegistry } from '@/features/world/tactical-map/schemas/registry';
import { BestieDetail } from '@/features/world/bestiar/components/BestieDetail';
import { BestieDiscussion } from './components/BestieDiscussion';
import { InsertToBestiaryModal } from './components/InsertToBestiaryModal';
import { BestieEditorModal } from './components/BestieEditorModal';
import { ProposeStatblockModal } from './components/ProposeStatblockModal';
import { systemLabel } from './components/systems';
import { useKomunitniBestie } from './hooks/useKomunitniBestiar';
import { useKomunitniBestiarMutations } from './hooks/useKomunitniBestiarMutations';
import s from './KomunitniBestieDetail.module.css';
import './komunitniBestiarSkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniBestieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bestie, isLoading, isError } = useKomunitniBestie(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approveSb, approveBst, remove } = useKomunitniBestiarMutations();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | 'editLore' | 'insert' | 'propose' | 'editStats'
  >(null);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !bestie)
    return (
      <ErrorState
        size="panel"
        status={404}
        title="Bytost nenalezena"
        action={{ label: 'Zpět na knihovnu', to: '/ikaros/bestiar' }}
      />
    );

  const systemIds = bestie.statblocks ? Object.keys(bestie.statblocks) : [];
  const activeSys =
    activeSystem && systemIds.includes(activeSystem)
      ? activeSystem
      : (systemIds[0] ?? null);
  const activeSb = activeSys ? bestie.statblocks?.[activeSys] : undefined;
  const schema = activeSys
    ? systemEntitySchemaRegistry.get(activeSys, 'bestie')
    : null;

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === bestie.authorId;
  const canEditLore = isAuthor || isCurator;
  // Sjednoceno s 7 katalogy: autor maže svůj návrh (draft), kurátor cokoli.
  const canDelete = isCurator || (isAuthor && bestie.status === 'draft');

  const onDelete = () => {
    if (!window.confirm(`Opravdu smazat bytost „${bestie.name}"?`)) return;
    remove.mutate(bestie.id, {
      onSuccess: () => navigate('/ikaros/bestiar'),
    });
  };

  const desc = (bestie.description ?? '').trim();
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Bestiář', href: '/ikaros/bestiar' },
    { label: bestie.name },
  ];

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.tome} data-bestie-book="">
        <div className={s.top}>
          <Link to="/ikaros/bestiar" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={bestie.status}>
            {bestie.status === 'approved'
              ? '✔ Schválená bytost'
              : '✎ Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            {activeSb ? (
              <Button variant="primary" onClick={() => setModal('insert')}>
                ＋ Vlož do mého bestiáře
              </Button>
            ) : null}
            {canEditLore ? (
              <Button variant="ghost" onClick={() => setModal('editLore')}>
                ✎ Upravit popis
              </Button>
            ) : null}
            {isCurator && bestie.status === 'draft' ? (
              <Button
                variant="ghost"
                loading={approveBst.isPending}
                onClick={() => approveBst.mutate(bestie.id)}
              >
                ✔ Schválit bytost
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
            {/* D-066a — nahlásit bestii (BE enforcement B5 byl ready, chybělo
                FE tlačítko). Jméno autora entita nenese → neutrální label. */}
            <ReportButton
              targetType="bestie"
              targetId={bestie.id}
              targetSnapshot={bestie.name}
              targetAuthorName="Autor bestie"
              targetAuthorId={bestie.authorId}
            />
          </div>
        ) : null}

        <header className={s.beastTitle}>
          {bestie.latin ? <div className={s.latin}>{bestie.latin}</div> : null}
          <h1 className={s.name}>{bestie.name}</h1>
          {bestie.kind ? <div className={s.kind}>{bestie.kind}</div> : null}
        </header>

        <div className={s.spread}>
          <div className={s.illus} data-bestie-portrait="">
            {bestie.imageUrl ? (
              <img src={bestie.imageUrl} alt={bestie.name} />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                {bestie.name.charAt(0).toUpperCase()}
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
              <p className={s.empty}>Bytost zatím nemá popis.</p>
            )}
          </div>
        </div>

        {systemIds.length > 0 ? (
          <>
            <div className={s.rulesHead}>
              <div className={s.rulesLabel}>Pravidla podle herního systému</div>
              <div className={s.tabs} data-ruleset-tabs="" role="tablist">
                {systemIds.map((sy) => {
                  const draft = bestie.statblocks?.[sy]?.status === 'draft';
                  return (
                    <button
                      key={sy}
                      type="button"
                      role="tab"
                      aria-selected={sy === activeSys}
                      className={clsx(s.tab, draft && s.tabDraft)}
                      onClick={() => setActiveSystem(sy)}
                    >
                      {systemLabel(sy)}
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

            {activeSb && schema ? (
              <div className={s.ruleset} data-statblock="">
                {activeSb.status === 'draft' ? (
                  <div className={s.draftWarn}>
                    <span>
                      ⚠️ <b>Návrh statů — neověřeno.</b> Tuhle verzi navrhl hráč a
                      zatím neprošla kurátorem. Můžeš si ji přesto vzít do svého
                      bestiáře.
                    </span>
                    {isCurator && activeSys ? (
                      <Button
                        variant="primary"
                        loading={approveSb.isPending}
                        onClick={() =>
                          approveSb.mutate({
                            id: bestie.id,
                            systemId: activeSys,
                          })
                        }
                      >
                        ✔ Schválit staty
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {isCurator ? (
                  <div className={s.actions}>
                    <Button
                      variant="ghost"
                      onClick={() => setModal('editStats')}
                    >
                      ✎ Upravit staty
                    </Button>
                  </div>
                ) : null}
                <BestieDetail
                  schema={schema}
                  systemStats={activeSb.systemStats}
                  description=""
                  notes=""
                  canSeeNotes={false}
                />

                <BestieDiscussion
                  key={activeSys}
                  bestieId={bestie.id}
                  targetType="statblock"
                  systemId={activeSys ?? undefined}
                  title="Diskuse ke statům"
                  scopeNote={`jen k verzi ${systemLabel(activeSys ?? '')}`}
                  placeholder={`Napiš k verzi ${systemLabel(activeSys ?? '')}…`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className={s.empty}>
            Pro tuto bytost zatím nejsou žádné pravidlové verze statů.
            {isAuth ? (
              <div className={s.emptyAction}>
                <Button variant="primary" onClick={() => setModal('propose')}>
                  ＋ Navrhnout staty
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <BestieDiscussion
          bestieId={bestie.id}
          targetType="beast"
          title="Diskuse o bytosti"
          scopeNote="lore & obecně, napříč systémy"
          placeholder="Napiš o bytosti (lore, použití, nápady)…"
        />
      </div>

      {modal === 'insert' && activeSys ? (
        <InsertToBestiaryModal
          bestie={bestie}
          systemId={activeSys}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'editLore' ? (
        <BestieEditorModal
          mode="editLore"
          bestie={bestie}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'propose' ? (
        <ProposeStatblockModal
          bestie={bestie}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'editStats' && activeSys ? (
        <ProposeStatblockModal
          bestie={bestie}
          editSystemId={activeSys}
          onClose={() => setModal(null)}
        />
      ) : null}
    </article>
  );
}
