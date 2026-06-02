import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { Spinner, ConfirmDialog } from '@/shared/ui';
import { WorldRole } from '@/shared/types';
import { currentUserAtom } from '@/shared/store/authStore';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { parseApiError } from '@/shared/api/client';
import {
  useCampaignPlayers,
  useCampaignScenarios,
  useCampaignStorylines,
  useCampaignSubjects,
  useCreateScenario,
  useDeleteScenario,
  useReorderScenarios,
  useUpdateScenario,
} from '../api';
import {
  buildTree,
  getMeta,
  mergeMeta,
  type ScenarioKind,
  type ScenarioMeta,
  type ScenarioTreeNode as TreeNode,
} from '../scenarioMeta';
import type { CampaignScenario, CreateScenarioInput } from '../types';
import type { ScenarioTemplate } from '../scenarioTemplates';
import { LayerSwitcher } from './LayerSwitcher';
import { ScenarioTree, type DropPosition } from './ScenarioTree';
import { ScenarioEditor } from './ScenarioEditor';
import { ScenarioLinksPanel } from './ScenarioLinksPanel';
import '../campaign.tokens.css';
import './storyboard.tokens.css';
import s from './storyboard.module.css';

/** Sestaví CreateScenarioInput zachovávající first-class pole + merge meta. */
function toInput(
  scenario: CampaignScenario,
  metaPatch: Partial<ScenarioMeta>,
): CreateScenarioInput {
  return {
    title: scenario.title,
    images: scenario.images,
    linkedPageSlug: scenario.linkedPageSlug,
    subjectIds: scenario.subjectIds,
    storylineIds: scenario.storylineIds,
    isShared: scenario.isShared,
    contentData: mergeMeta(scenario, metaPatch),
  };
}

/** Orchestrátor Storyboardu — strom scénářů + editor + provázání + vrstvy. */
export function StoryboardView() {
  const { worldSlug = '' } = useParams<{ worldSlug: string }>();
  const { worldId, userRole, world } = useWorldContext();
  const me = useAtomValue(currentUserAtom);
  const myUserId = me?.id ?? '';
  const viewerRole = userRole ?? WorldRole.Zadatel;
  const isPJ = viewerRole >= WorldRole.PJ;
  const worldSystem = world?.system ?? '';

  const [layer, setLayer] = useState('mine');
  // Poslední otevřený scénář se pamatuje per-svět (přežije odchod/refresh) →
  // po návratu do Storyboardu se znovu otevře.
  const selKey = `ikr-storyboard-sel-${worldId}`;
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(selKey);
    } catch {
      return null;
    }
  });
  const [del, setDel] = useState<TreeNode | null>(null);

  // Persistuj jen platnou volbu (null = např. po přepnutí vrstvy nemažeme
  // poslední výběr, ať se po návratu na „moji vrstvu" zase otevře).
  useEffect(() => {
    if (!selectedId) return;
    try {
      localStorage.setItem(selKey, selectedId);
    } catch {
      /* private mode — pamatování je UI komfort, ignoruj */
    }
  }, [selectedId, selKey]);

  const scenariosQ = useCampaignScenarios(worldId);
  const subjectsQ = useCampaignSubjects(worldId);
  const storiesQ = useCampaignStorylines(worldId);
  const playersQ = useCampaignPlayers(worldId, isPJ);

  const create = useCreateScenario(worldId);
  const update = useUpdateScenario(worldId);
  const remove = useDeleteScenario(worldId);
  const reorder = useReorderScenarios(worldId);

  const ownerId = layer === 'mine' ? myUserId : layer;
  const readOnly = layer !== 'mine';

  const scenarios = useMemo(
    () => (scenariosQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [scenariosQ.data, ownerId],
  );
  const subjects = useMemo(
    () => (subjectsQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [subjectsQ.data, ownerId],
  );
  const storylines = useMemo(
    () => (storiesQ.data ?? []).filter((x) => x.ownerId === ownerId),
    [storiesQ.data, ownerId],
  );

  const tree = useMemo(() => buildTree(scenarios), [scenarios]);
  const byId = useMemo(
    () => new Map(scenarios.map((x) => [x.id, x])),
    [scenarios],
  );
  const selected = selectedId ? (byId.get(selectedId) ?? null) : null;

  function onError(e: unknown) {
    toast.error(parseApiError(e));
  }

  function handleCreate(parentId: string | null, kind: ScenarioKind) {
    const siblings = scenarios.filter((x) => getMeta(x).parentId === parentId);
    const nextOrder = siblings.reduce(
      (max, x) => Math.max(max, getMeta(x).order + 1),
      0,
    );
    const input: CreateScenarioInput = {
      title: kind === 'folder' ? 'Nová složka' : 'Nová scéna',
      contentData: {
        storyTree: {
          parentId,
          order: nextOrder,
          kind,
          status: 'draft',
          mapSceneIds: [],
          pageSlugs: [],
          bestieIds: [],
        } satisfies ScenarioMeta,
      },
    };
    create.mutate(input, {
      onSuccess: (created) => setSelectedId(created.id),
      onError,
    });
  }

  function handleCreateFromTemplate(template: ScenarioTemplate) {
    const nextOrder = scenarios
      .filter((x) => getMeta(x).parentId === null)
      .reduce((max, x) => Math.max(max, getMeta(x).order + 1), 0);
    const tree =
      (template.contentData?.storyTree as Record<string, unknown>) ?? {};
    create.mutate(
      {
        title: template.scenarioTitle || 'Scéna z šablony',
        contentData: { storyTree: { ...tree, parentId: null, order: nextOrder } },
      },
      { onSuccess: (created) => setSelectedId(created.id), onError },
    );
  }

  function handleSave(input: CreateScenarioInput) {
    if (!selected) return;
    update.mutate(
      { id: selected.id, input },
      { onSuccess: () => toast.success('Scéna uložena'), onError },
    );
  }

  function handleMove(
    draggedId: string,
    targetId: string | null,
    pos: DropPosition,
  ) {
    const dragged = byId.get(draggedId);
    if (!dragged) return;
    const newParentId =
      pos === 'inside' ? targetId : (targetId ? getMeta(byId.get(targetId)!).parentId : null);

    const sibs = scenarios
      .filter((x) => x.id !== draggedId && getMeta(x).parentId === newParentId)
      .sort((a, b) => getMeta(a).order - getMeta(b).order);

    let insertAt = sibs.length;
    if (pos !== 'inside' && targetId) {
      const idx = sibs.findIndex((x) => x.id === targetId);
      if (idx >= 0) insertAt = pos === 'before' ? idx : idx + 1;
    }
    sibs.splice(insertAt, 0, dragged);

    const updates = sibs.map((x, i) => ({
      id: x.id,
      input: toInput(x, { parentId: newParentId, order: i }),
    }));
    reorder.mutate(updates, { onError });
  }

  function handleDelete(node: TreeNode) {
    const target = node.scenario;
    const parentMeta = getMeta(target);
    // Osiření: přímé děti povýší na rodiče mazaného uzlu.
    const children = scenarios.filter(
      (x) => getMeta(x).parentId === target.id,
    );
    const reparentChildren = children.map((c) => ({
      id: c.id,
      input: toInput(c, { parentId: parentMeta.parentId }),
    }));

    const finish = () => {
      remove.mutate(target.id, {
        onSuccess: () => {
          toast.success('Scéna smazána');
          if (selectedId === target.id) setSelectedId(null);
          setDel(null);
        },
        onError,
      });
    };

    if (reparentChildren.length > 0) {
      reorder.mutate(reparentChildren, { onSuccess: finish, onError });
    } else {
      finish();
    }
  }

  const loading = scenariosQ.isLoading;

  return (
    <div className={`storyboard-root ${s.root}`}>
      <header className={s.header}>
        <h1 className={s.headerTitle}>🎬 Storyboard</h1>
        {isPJ && (
          <LayerSwitcher
            layer={layer}
            onChange={(l) => {
              setLayer(l);
              setSelectedId(null);
            }}
            players={playersQ.data ?? []}
          />
        )}
        {readOnly && <span className={s.readonlyBadge}>jen pro čtení</span>}
      </header>

      {loading ? (
        <div className={s.center}>
          <Spinner />
        </div>
      ) : (
        <div className={s.layout}>
          <ScenarioTree
            nodes={tree}
            selectedId={selectedId}
            readOnly={readOnly}
            onSelect={setSelectedId}
            onCreate={handleCreate}
            onCreateFromTemplate={handleCreateFromTemplate}
            onDelete={(node) => setDel(node)}
            onMove={handleMove}
          />

          {selected ? (
            <ScenarioEditor
              key={selected.id}
              scenario={selected}
              isPJ={isPJ}
              readOnly={readOnly}
              isSaving={update.isPending}
              onSave={handleSave}
              linksPanel={
                getMeta(selected).kind === 'scene' ? (
                  <ScenarioLinksPanel
                    scenario={selected}
                    worldId={worldId}
                    worldSlug={worldSlug}
                    worldSystem={worldSystem}
                    subjects={subjects}
                    storylines={storylines}
                    readOnly={readOnly}
                  />
                ) : undefined
              }
            />
          ) : (
            <div className={s.editorEmpty}>
              Vyber scénu ve stromu nebo vytvoř novou.
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        title="Smazat scénu"
        message={
          del
            ? `Opravdu smazat „${del.scenario.title}"? Případné podscény se přesunou o úroveň výš.`
            : ''
        }
        confirmLabel="Smazat"
        confirmVariant="danger"
        isPending={remove.isPending || reorder.isPending}
        onConfirm={() => {
          if (del) handleDelete(del);
        }}
      />
    </div>
  );
}
