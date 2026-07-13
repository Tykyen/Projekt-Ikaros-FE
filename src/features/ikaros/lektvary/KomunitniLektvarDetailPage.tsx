/**
 * 21.5b — detail komunitního lektvaru („karta lektvaru").
 * Jádro (obrázek + druh + suroviny + oznámení) + pravidlové záložky
 * (statblocky per systém, reuse view kouzel) + dvouúrovňová diskuse + akce
 * (vlož do obchodu / upravit / návrh statbloku / schvalování / smazání /
 * nahlásit). Vzor: KomunitniKouzloDetailPage (21.5c); layout CSS reuse.
 */
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import clsx from 'clsx';
import { Breadcrumbs, Button } from '@/shared/ui';
import { ReportButton } from '@/shared/moderation/ReportButton';
import { currentUserAtom } from '@/shared/store/authStore';
import { UserRole } from '@/shared/types';
import { SpellStatblockView } from '../kouzla/components/SpellStatblockView';
import { InsertToShopModal } from '../herbar/components/InsertToShopModal';
import { potionToShopInsert } from './shopInsert';
import { PotionDiscussion } from './components/PotionDiscussion';
import { PotionEditorModal } from './components/PotionEditorModal';
import { ProposePotionStatblockModal } from './components/ProposePotionStatblockModal';
import { IngredientsCard } from './components/IngredientsCard';
import {
  getPotionTemplate,
  potionSystemLabel,
} from './systems/potionTemplates';
import { useLektvar } from './hooks/useLektvary';
import { useLektvaryMutations } from './hooks/useLektvaryMutations';
import s from '../kouzla/KomunitniKouzloDetail.module.css';
import './lektvarySkins.css';

const CURATOR_ROLES = [
  UserRole.Superadmin,
  UserRole.Admin,
  UserRole.SpravceClanku,
  UserRole.SpravceDiskuzi,
];

export default function KomunitniLektvarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: potion, isLoading, isError } = useLektvar(id ?? null);
  const user = useAtomValue(currentUserAtom);
  const { approveSb, approve, remove } = useLektvaryMutations();
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [modal, setModal] = useState<
    null | 'editLore' | 'propose' | 'editStats' | 'shop'
  >(null);

  if (isLoading) return <p className={s.state}>Načítám…</p>;
  if (isError || !potion)
    return (
      <p className={s.state}>
        Lektvar nenalezen. <Link to="/ikaros/lektvary">Zpět na knihovnu</Link>
      </p>
    );

  const systemIds = potion.statblocks ? Object.keys(potion.statblocks) : [];
  const activeSys =
    activeSystem && systemIds.includes(activeSystem)
      ? activeSystem
      : (systemIds[0] ?? null);
  const activeSb = activeSys ? potion.statblocks?.[activeSys] : undefined;

  const isAuth = Boolean(user);
  const isCurator = !!user && CURATOR_ROLES.includes(user.role);
  const isAuthor = !!user && user.id === potion.authorId;
  const canEditLore = isAuthor || isCurator;
  const canDelete = isCurator || (isAuthor && potion.status === 'draft');

  const desc = (potion.description ?? '').trim();
  const crumbs = [
    { label: 'Domů', href: '/' },
    { label: 'Společná tvorba', href: '/ikaros/tvorba' },
    { label: 'Lektvary', href: '/ikaros/lektvary' },
    { label: potion.name },
  ];

  const onDelete = () => {
    if (!window.confirm(`Opravdu smazat lektvar „${potion.name}"?`)) return;
    remove.mutate(potion.id, {
      onSuccess: () => navigate('/ikaros/lektvary'),
    });
  };

  return (
    <article className={s.page}>
      <Breadcrumbs items={crumbs} />

      <div className={s.tome} data-potion-card="">
        <div className={s.top}>
          <Link to="/ikaros/lektvary" className={s.back}>
            ← Zpět na knihovnu
          </Link>
          <span className={s.stateBadge} data-status={potion.status}>
            {potion.status === 'approved'
              ? '✔ Schválený lektvar'
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
                ✎ Upravit lektvar
              </Button>
            ) : null}
            {isCurator && potion.status === 'draft' ? (
              <Button
                variant="ghost"
                loading={approve.isPending}
                onClick={() => approve.mutate(potion.id)}
              >
                ✔ Schválit lektvar
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
              targetType="potion"
              targetId={potion.id}
              targetSnapshot={potion.name}
              targetAuthorName="Autor lektvaru"
              targetAuthorId={potion.authorId}
            />
          </div>
        ) : null}

        <header className={s.beastTitle}>
          {potion.aliases ? (
            <div className={s.latin}>{potion.aliases}</div>
          ) : null}
          <h1 className={s.name}>{potion.name}</h1>
          {potion.kind ? <div className={s.kind}>{potion.kind}</div> : null}
        </header>

        <div className={s.spread}>
          <div className={s.illus} data-potion-portrait="">
            {potion.imageUrl ? (
              <img src={potion.imageUrl} alt={potion.name} />
            ) : (
              <span className={s.illusFallback} aria-hidden="true">
                ⚗
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
              <p className={s.empty}>Lektvar zatím nemá popis.</p>
            )}
          </div>
        </div>

        <IngredientsCard ingredients={potion.ingredients ?? []} />

        {systemIds.length > 0 ? (
          <>
            <div className={s.rulesHead}>
              <div className={s.rulesLabel}>
                Výroba a účinek podle herního systému
              </div>
              <div className={s.tabs} data-ruleset-tabs="" role="tablist">
                {systemIds.map((sy) => {
                  const draft = potion.statblocks?.[sy]?.status === 'draft';
                  return (
                    <button
                      key={sy}
                      type="button"
                      role="tab"
                      aria-selected={sy === activeSys}
                      className={clsx(s.tab, draft && s.tabDraft)}
                      onClick={() => setActiveSystem(sy)}
                    >
                      {potionSystemLabel(sy)}
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
                            id: potion.id,
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
                  template={getPotionTemplate(activeSys)}
                  systemStats={activeSb.systemStats}
                />

                <PotionDiscussion
                  key={activeSys}
                  potionId={potion.id}
                  targetType="statblock"
                  systemId={activeSys}
                  title="Diskuse ke statbloku"
                  scopeNote={`jen k verzi ${potionSystemLabel(activeSys)}`}
                  placeholder={`Napiš k verzi ${potionSystemLabel(activeSys)}…`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <div className={s.empty}>
            Pro tenhle lektvar zatím není žádná pravidlová verze.
            {isAuth ? (
              <div className={s.emptyAction}>
                <Button variant="primary" onClick={() => setModal('propose')}>
                  ＋ Navrhnout statblok
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <PotionDiscussion
          potionId={potion.id}
          targetType="potion"
          title="Diskuse o lektvaru"
          scopeNote="recept & obecně, napříč systémy"
          placeholder="Napiš o lektvaru (recept, použití, nápady)…"
        />
      </div>

      {modal === 'editLore' ? (
        <PotionEditorModal
          mode="editLore"
          potion={potion}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'propose' ? (
        <ProposePotionStatblockModal
          potion={potion}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'editStats' && activeSys ? (
        <ProposePotionStatblockModal
          potion={potion}
          editSystemId={activeSys}
          onClose={() => setModal(null)}
        />
      ) : null}
      {modal === 'shop' ? (
        <InsertToShopModal
          mode="single"
          items={[potionToShopInsert(potion)]}
          nounMany="lektvarů"
          onClose={() => setModal(null)}
        />
      ) : null}
    </article>
  );
}
