import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Spinner, Tabs, ConfirmDialog, type TabItem } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { parseApiError } from '@/shared/api/client';
import { useWorldContext } from '@/features/world/context/WorldContext';
import {
  useCampaignPlayers,
  useCampaignRelationships,
  useCampaignStorylines,
  useCampaignSubjects,
  useCreateRelationship,
  useCreateSubject,
  useDeleteRelationship,
  useDeleteSubject,
  useUpdateRelationship,
  useUpdateSubject,
} from '../api';
import type {
  CampaignRelationship,
  CampaignSubject,
  CreateRelationshipInput,
  CreateSubjectInput,
} from '../types';
import { useSubjectImages } from '../useSubjectImages';
import {
  useMaterializeSubject,
  isMaterializable,
  SUBJECT_TO_PAGE_TYPE,
} from '../useMaterializeSubject';
import { LayerSwitcher } from './LayerSwitcher';
import { DnesTab } from './DnesTab';
import { SubjektyTab } from './SubjektyTab';
import { LinkyTab } from './LinkyTab';
import { PavucinaGraph } from './PavucinaGraph';
import { SubjectForm } from './SubjectForm';
import { RelationshipForm } from './RelationshipForm';
import '../campaign.tokens.css';
import s from './campaign.module.css';

type TabId = 'dnes' | 'subjekty' | 'linky' | 'sit';

/** Otevřená akce nad subjektem/vztahem — modaly žijí zde (nad taby), aby šly
 *  vyvolat z tabu Subjekty i z grafu (Síť). */
interface SubjectFormState {
  open: boolean;
  editing?: CampaignSubject;
}
interface RelFormState {
  open: boolean;
  editing?: CampaignRelationship;
  /** subjectA při tvorbě nového vztahu (z railu i z grafu). */
  fromId?: string;
}

/** Orchestrátor Pavučiny — vrstvy, taby, sdílený výběr + tvorba subjektu/vztahu. */
export function CampaignView() {
  const navigate = useNavigate();
  const { worldId, worldSlug, userRole } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const myUserId = me?.id ?? '';
  const viewerRole = userRole ?? WorldRole.Zadatel;
  const isPJ = viewerRole >= WorldRole.PJ;

  // 11.2 — příchod ze Storyboardu „Zobrazit v síti": ?storyline=<id> předfiltruje
  // graf a otevře tab Síť.
  const [searchParams] = useSearchParams();
  const initialStoryline = searchParams.get('storyline');

  const [layer, setLayer] = useState('mine');
  const [tab, setTab] = useState<TabId>(initialStoryline ? 'sit' : 'dnes');
  const [selSubjectId, setSelSubjectId] = useState<string | null>(null);
  const [selRelId, setSelRelId] = useState<string | null>(null);
  const [graphStoryline, setGraphStoryline] = useState<string | null>(
    initialStoryline,
  );

  const subjectsQ = useCampaignSubjects(worldId);
  const relsQ = useCampaignRelationships(worldId);
  const storiesQ = useCampaignStorylines(worldId);
  const playersQ = useCampaignPlayers(worldId, isPJ);
  const imageFor = useSubjectImages(worldId);

  const ownerId = layer === 'mine' ? myUserId : layer;
  const readOnly = layer !== 'mine';

  const subjects = useMemo(
    () => (subjectsQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [subjectsQ.data, ownerId],
  );
  const relationships = useMemo(
    () => (relsQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [relsQ.data, ownerId],
  );
  const storylines = useMemo(
    () => (storiesQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [storiesQ.data, ownerId],
  );

  // ── Mutace + stav modálů (sdíleno tabem Subjekty i grafem) ──────────────────
  const createSubject = useCreateSubject(worldId);
  const updateSubject = useUpdateSubject(worldId);
  const deleteSubject = useDeleteSubject(worldId);
  const createRel = useCreateRelationship(worldId);
  const updateRel = useUpdateRelationship(worldId);
  const deleteRel = useDeleteRelationship(worldId);

  const [subjectForm, setSubjectForm] = useState<SubjectFormState>({
    open: false,
  });
  const [relForm, setRelForm] = useState<RelFormState>({ open: false });
  const [delSubject, setDelSubject] = useState<CampaignSubject | null>(null);
  const [delRel, setDelRel] = useState<CampaignRelationship | null>(null);

  function onError(e: unknown) {
    toast.error(parseApiError(e));
  }

  function submitSubject(input: CreateSubjectInput, alsoMaterialize?: boolean) {
    const editing = subjectForm.editing;
    if (editing) {
      updateSubject.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success('Subjekt upraven');
            setSubjectForm({ open: false });
          },
          onError,
        },
      );
    } else {
      createSubject.mutate(input, {
        onSuccess: (created) => {
          toast.success('Subjekt vytvořen');
          setSubjectForm({ open: false });
          setSelSubjectId(created.id);
          // B1b — rovnou založit i reálnou stránku a napojit (role gate níže).
          if (alsoMaterialize) handleMaterialize(created);
        },
        onError,
      });
    }
  }

  function submitRel(input: CreateRelationshipInput) {
    const editing = relForm.editing;
    if (editing) {
      updateRel.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success('Vztah upraven');
            setRelForm({ open: false });
          },
          onError,
        },
      );
    } else {
      createRel.mutate(input, {
        onSuccess: (created) => {
          toast.success('Vztah vytvořen');
          setRelForm({ open: false });
          setSelRelId(created.id);
        },
        onError,
      });
    }
  }

  function copySubject(subject: CampaignSubject) {
    createSubject.mutate(
      {
        name: `${subject.name} (kopie)`,
        type: subject.type,
        status: subject.status,
        tags: subject.tags,
        linkedPageSlug: subject.linkedPageSlug,
        linkedCharacterSlug: subject.linkedCharacterSlug,
        notes: subject.notes,
      },
      {
        onSuccess: () => {
          toast.success('Zkopírováno do tvé vrstvy');
          setLayer('mine');
        },
        onError,
      },
    );
  }

  // ── Materializace subjektu → reálná stránka (B1) ────────────────────────────
  const { materialize, isPending: materializePending } = useMaterializeSubject(
    worldId,
    worldSlug,
  );

  /** Smí viewer pro daný typ subjektu založit reálnou stránku? (role-aware). */
  function canMaterializeType(type: CampaignSubject['type']): boolean {
    const pageType = SUBJECT_TO_PAGE_TYPE[type];
    if (!pageType) return false;
    if (viewerRole >= WorldRole.PomocnyPJ) return true;
    // Hráč: PC založit nesmí (BE 403); ostatní typy → návrh (pending).
    return pageType !== 'Postava hráče';
  }

  /** Label akce materializace pro daný subjekt, nebo null (skryté). Role-aware. */
  function getMaterializeLabel(subject: CampaignSubject): string | null {
    if (readOnly || !isMaterializable(subject)) return null;
    if (!canMaterializeType(subject.type)) return null;
    return viewerRole >= WorldRole.PomocnyPJ
      ? 'Založit reálnou stránku'
      : 'Navrhnout stránku ke schválení';
  }

  function handleMaterialize(subject: CampaignSubject) {
    materialize(subject)
      .then((page) => {
        toast.success(
          page.pageStatus === 'pending'
            ? 'Návrh stránky odeslán PJ ke schválení'
            : 'Reálná stránka vytvořena a napojena',
        );
      })
      .catch(onError);
  }

  // subjectA pro formulář vztahu (edit → z entity, jinak fromId z railu/grafu).
  const relSubjectAId = relForm.editing?.subjectAId ?? relForm.fromId ?? null;

  function gotoSubject(id: string) {
    setTab('subjekty');
    setSelSubjectId(id);
    setSelRelId(null);
  }
  function gotoRelationship(rel: CampaignRelationship) {
    setTab('subjekty');
    setSelSubjectId(rel.subjectAId);
    setSelRelId(rel.id);
  }

  /** „Vyvolat" — přeskok na reálnou stránku napojenou na subjekt (page/postava). */
  function invokeSubject(id: string) {
    const subj = subjects.find((x) => x.id === id);
    const slug = subj?.linkedPageSlug || subj?.linkedCharacterSlug;
    if (slug) navigate(`/svet/${worldSlug}/${slug}`);
  }

  const tabs: TabItem[] = [
    { id: 'dnes', label: '◉ Dnes' },
    { id: 'subjekty', label: 'Subjekty' },
    { id: 'linky', label: 'Linky' },
    { id: 'sit', label: 'Síť' },
  ];

  const loading = subjectsQ.isLoading || relsQ.isLoading;

  return (
    <div className={`campaign-root ${s.root}`}>
      <header className={s.topbar}>
        <h1 className={s.pageTitle}>🕸 Pavučina</h1>
        {isPJ && (
          <LayerSwitcher
            layer={layer}
            onChange={(l) => {
              setLayer(l);
              setSelSubjectId(null);
              setSelRelId(null);
            }}
            players={playersQ.data ?? []}
          />
        )}
        {readOnly && <span className={s.readonlyBadge}>jen pro čtení</span>}
      </header>

      <Tabs
        items={tabs}
        activeId={tab}
        onChange={(id) => setTab(id as TabId)}
        orientation="horizontal"
      >
        {loading ? (
          <div className={s.center}>
            <Spinner />
          </div>
        ) : tab === 'dnes' ? (
          <DnesTab
            subjects={subjects}
            relationships={relationships}
            storylines={storylines}
            onGoSubject={gotoSubject}
            onGoRelationship={gotoRelationship}
          />
        ) : tab === 'subjekty' ? (
          <SubjektyTab
            subjects={subjects}
            relationships={relationships}
            readOnly={readOnly}
            isPJ={isPJ}
            selSubjectId={selSubjectId}
            setSelSubjectId={setSelSubjectId}
            selRelId={selRelId}
            setSelRelId={setSelRelId}
            imageFor={imageFor}
            onAddSubject={() => setSubjectForm({ open: true })}
            onEditSubject={(subj) => setSubjectForm({ open: true, editing: subj })}
            onDeleteSubject={setDelSubject}
            onCopySubject={copySubject}
            onAddRelationship={(fromId) => setRelForm({ open: true, fromId })}
            onEditRelationship={(rel) => setRelForm({ open: true, editing: rel })}
            onDeleteRelationship={setDelRel}
            getMaterializeLabel={getMaterializeLabel}
            onMaterialize={handleMaterialize}
            materializePending={materializePending}
          />
        ) : tab === 'linky' ? (
          <LinkyTab
            worldId={worldId}
            storylines={storylines}
            subjects={subjects}
            readOnly={readOnly}
            isPJ={isPJ}
            onGoSubject={gotoSubject}
            onShowInGraph={(id) => {
              setGraphStoryline(id);
              setTab('sit');
            }}
          />
        ) : (
          <PavucinaGraph
            subjects={subjects}
            relationships={relationships}
            storylines={storylines}
            storylineFilter={graphStoryline}
            onStorylineFilter={setGraphStoryline}
            imageFor={imageFor}
            readOnly={readOnly}
            onOpenSubject={gotoSubject}
            onInvokeSubject={invokeSubject}
            onNewSubject={() => setSubjectForm({ open: true })}
            onEditSubject={(id) => {
              const subj = subjects.find((x) => x.id === id);
              if (subj) setSubjectForm({ open: true, editing: subj });
            }}
            onDeleteSubject={(id) => {
              const subj = subjects.find((x) => x.id === id);
              if (subj) setDelSubject(subj);
            }}
            onNewRelationship={(fromId) => setRelForm({ open: true, fromId })}
          />
        )}
      </Tabs>

      {/* Sdílené modaly — dostupné z tabu Subjekty i z grafu. */}
      <SubjectForm
        key={`subj-${subjectForm.open ? subjectForm.editing?.id ?? 'new' : 'closed'}`}
        open={subjectForm.open}
        worldId={worldId}
        initial={subjectForm.editing}
        isPending={createSubject.isPending || updateSubject.isPending}
        canMaterialize={canMaterializeType}
        onClose={() => setSubjectForm({ open: false })}
        onSubmit={submitSubject}
      />
      {relSubjectAId && (
        <RelationshipForm
          key={`rel-${relForm.open ? relForm.editing?.id ?? relForm.fromId ?? 'new' : 'closed'}`}
          open={relForm.open}
          subjects={subjects}
          subjectAId={relSubjectAId}
          initial={relForm.editing}
          isPJ={isPJ}
          isPending={createRel.isPending || updateRel.isPending}
          onClose={() => setRelForm({ open: false })}
          onSubmit={submitRel}
        />
      )}

      <ConfirmDialog
        open={!!delSubject}
        onClose={() => setDelSubject(null)}
        title="Smazat subjekt"
        message={`Opravdu smazat „${delSubject?.name}" a všechny jeho vztahy?`}
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteSubject.isPending}
        onConfirm={() => {
          if (!delSubject) return;
          deleteSubject.mutate(delSubject.id, {
            onSuccess: () => {
              toast.success('Subjekt smazán');
              if (selSubjectId === delSubject.id) setSelSubjectId(null);
              setSelRelId(null);
              setDelSubject(null);
            },
            onError,
          });
        }}
      />
      <ConfirmDialog
        open={!!delRel}
        onClose={() => setDelRel(null)}
        title="Smazat vztah"
        message="Opravdu smazat tento vztah?"
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={deleteRel.isPending}
        onConfirm={() => {
          if (!delRel) return;
          deleteRel.mutate(delRel.id, {
            onSuccess: () => {
              toast.success('Vztah smazán');
              if (selRelId === delRel.id) setSelRelId(null);
              setDelRel(null);
            },
            onError,
          });
        }}
      />
    </div>
  );
}
