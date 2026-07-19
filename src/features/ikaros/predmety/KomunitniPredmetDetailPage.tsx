/**
 * 21.5e — detail komunitního předmětu („karta předmětu").
 * Jádro (obrázek + druh + oznámení) + pravidlové záložky (statblocky per
 * systém; varianta polí dle druhu jádra) + dvouúrovňová diskuse + akce
 * (vlož do obchodu / upravit / návrh statbloku / schvalování / smazání /
 * nahlásit). Vzor: KomunitniLektvarDetailPage (21.5b); layout CSS reuse.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { Breadcrumbs, Button, ErrorState } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SpellStatblockView } from '../kouzla/components/SpellStatblockView';
import { InsertToShopModal } from '../herbar/components/InsertToShopModal';
import { catalogItemToShopInsert } from './shopInsert';
import { ItemDiscussion } from './components/ItemDiscussion';
import { ItemEditorModal } from './components/ItemEditorModal';
import { ProposeItemStatblockModal } from './components/ProposeItemStatblockModal';
import { getItemTemplate, itemSystemLabel } from './systems/itemTemplates';
import { usePredmet } from './hooks/usePredmety';
import { usePredmetyMutations } from './hooks/usePredmetyMutations';
import s from '../kouzla/KomunitniKouzloDetail.module.css';
import './predmetySkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniPredmetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = usePredmet(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approveSb, approve, remove } = usePredmetyMutations();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | 'editLore' | 'propose' | 'editStats' | 'shop'
  >(null);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !item)
    return (
      <ErrorState
        size="panel"
        status={404}
        title="Předmět nenalezen"
        action={{ label: 'Zpět na knihovnu', to: '/ikaros/predmety' }}
      />
    );

  const systemIds = item.statblocks ? Object.keys(item.statblocks) : [];
  const activeSys =
    activeSystem && systemIds.includes(activeSystem)
      ? activeSystem
      : (systemIds[0] ?? null);
  const activeSb = activeSys ? item.statblocks?.[activeSys] : undefined;

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === item.authorId;
  const canEditLore = isAuthor || isCurator;
  const canDelete = isCurator || (isAuthor && item.status === 'draft');

  const desc = (item.description ?? '').trim();
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Předměty', href: '/ikaros/predmety' },
    { label: item.name },
  ];

  const onDelete = () => {
    if (!window.confirm(`Opravdu smazat předmět „${item.name}"?`)) return;
    remove.mutate(item.id, {
      onSuccess: () => navigate('/ikaros/predmety'),
    });
  };

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.tome} data-item-card="">
        <div className={s.top}>
          <Link to="/ikaros/predmety" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={item.status}>
            {item.status === 'approved'
              ? '✔ Schválený předmět'
              : '✎ Návrh — neověřeno'}
          </span>
        </div>

        {isAuth ? (
          <div className={s.actions}>
            <Button variant="primary" onClick={() => setModal('shop')}>
              ＋ Vlož do obchodu
            </Button>
            {canEditLore ? (
              <Button variant="ghost" onClick={() => setModal('editLore')}>
                ✎ Upravit předmět
              </Button>
            ) : null}
            {isCurator && item.status === 'draft' ? (
              <Button
                variant="ghost"
                loading={approve.isPending}
                onClick={() => approve.mutate(item.id)}
              >
                ✔ Schválit předmět
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
            {/* Jméno autora entita nenese → neutrální label (parity bestiář). */}
            <ReportButton
              targetType="item"
              targetId={item.id}
              targetSnapshot={item.name}
              targetAuthorName="Autor předmětu"
              targetAuthorId={item.authorId}
            />
          </div>
        ) : null}

        <header className={s.beastTitle}>
          {item.aliases ? <div className={s.latin}>{item.aliases}</div> : null}
          <h1 className={s.name}>{item.name}</h1>
          {item.kind ? <div className={s.kind}>{item.kind}</div> : null}
        </header>

        <div className={s.spread}>
          <div className={s.illus} data-item-portrait="">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                ⚔
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
              <p className={s.empty}>Předmět zatím nemá popis.</p>
            )}
          </div>
        </div>

        {systemIds.length > 0 ? (
          <>
            <div className={s.rulesHead}>
              <div className={s.rulesLabel}>
                Mechanika podle herního systému
              </div>
              <div className={s.tabs} data-ruleset-tabs="" role="tablist">
                {systemIds.map((sy) => {
                  const draft = item.statblocks?.[sy]?.status === 'draft';
                  return (
                    <button
                      key={sy}
                      type="button"
                      role="tab"
                      aria-selected={sy === activeSys}
                      className={clsx(s.tab, draft && s.tabDraft)}
                      onClick={() => setActiveSystem(sy)}
                    >
                      {itemSystemLabel(sy)}
                      {draft ? (
                        <span className={s.tabFlag}> · návrh</span>
                      ) : null}
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
                            id: item.id,
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
                    <Button
                      variant="ghost"
                      onClick={() => setModal('editStats')}
                    >
                      ✎ Upravit statblok
                    </Button>
                  </div>
                ) : null}

                <SpellStatblockView
                  template={getItemTemplate(activeSys, item.kind)}
                  systemStats={activeSb.systemStats}
                />

                <ItemDiscussion
                  key={activeSys}
                  itemId={item.id}
                  targetType="statblock"
                  systemId={activeSys}
                  title="Diskuse ke statbloku"
                  scopeNote={`jen k verzi ${itemSystemLabel(activeSys)}`}
                  placeholder={`Napiš k verzi ${itemSystemLabel(activeSys)}…`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className={s.empty}>
            Pro tenhle předmět zatím není žádná pravidlová verze.
            {isAuth ? (
              <div className={s.emptyAction}>
                <Button variant="primary" onClick={() => setModal('propose')}>
                  ＋ Navrhnout statblok
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <ItemDiscussion
          itemId={item.id}
          targetType="item"
          title="Diskuse o předmětu"
          scopeNote="lore & obecně, napříč systémy"
          placeholder="Napiš o předmětu (lore, použití, nápady)…"
        />
      </div>

      {modal === 'editLore' ? (
        <ItemEditorModal
          mode="editLore"
          item={item}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'propose' ? (
        <ProposeItemStatblockModal item={item} onClose={() => setModal(null)} />
      ) : null}
      {modal === 'editStats' && activeSys ? (
        <ProposeItemStatblockModal
          item={item}
          editSystemId={activeSys}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'shop' ? (
        <InsertToShopModal
          mode="single"
          items={[catalogItemToShopInsert(item)]}
          nounMany="předmětů"
          onClose={() => setModal(null)}
        />
      ) : null}
    </article>
  );
}
