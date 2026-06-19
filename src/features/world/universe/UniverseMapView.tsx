// 10.1 — orchestrátor Universe mapy. Spojuje graf + panel, drží edit draft,
// real-time sync (s předností draftu v edit módu) a PJ mutace.
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { PrintButton, usePrintMode } from '@/features/world/export/print';
import {
  useUniverse,
  useUpdateUniverse,
  useUpdateNodeVisibility,
} from './api/useUniverse';
import { useUniverseDraft } from './hooks/useUniverseDraft';
import { useUniverseSocket } from './hooks/useUniverseSocket';
import {
  UniverseGraph,
  type UniverseGraphHandle,
} from './components/UniverseGraph';
import { flyToNode } from './components/graphCamera';
import { UniversePanel } from './components/UniversePanel';
import { sanitizeForSave } from './universeSelectors';
import { UniverseSearch } from './components/UniverseSearch';
import { UniverseDetail } from './components/UniverseDetail';
import { NodeEditorForm } from './components/NodeEditorForm';
import { LinkEditorForm } from './components/LinkEditorForm';
import type { UniverseMap, UniverseNode } from './types';
import styles from './UniverseMapView.module.css';
import panel from './components/UniversePanel.module.css';

const NODE_TYPE_LABEL: Record<string, string> = {
  planet: 'Planeta',
  star: 'Hvězda',
  nebula: 'Mlhovina',
  asteroid: 'Asteroid',
  moon: 'Měsíc',
  blackhole: 'Černá díra',
};

const EMPTY_MAP = (worldId: string): UniverseMap => ({
  id: '',
  worldId,
  nodes: [],
  links: [],
});

export function UniverseMapView() {
  const { worldId, worldSlug, isPJ } = useWorldContext();
  const fgRef = useRef<UniverseGraphHandle | undefined>(undefined);
  const printMode = usePrintMode();

  const { data: serverMap, isLoading } = useUniverse(worldId);
  const draft = useUniverseDraft();
  const updateUniverse = useUpdateUniverse(worldId);
  const updateVisibility = useUpdateNodeVisibility(worldId);

  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { staleFromRemote, clearStale } = useUniverseSocket(worldId, editMode);

  // zobrazená data: edit = draft, jinak server
  const map: UniverseMap =
    editMode && draft.draft
      ? draft.draft
      : (serverMap ?? EMPTY_MAP(worldId));

  const selectedNode = selectedId
    ? map.nodes.find((n) => n.id === selectedId) ?? null
    : null;
  const editingNode = editingId
    ? map.nodes.find((n) => n.id === editingId) ?? null
    : null;

  // vstup do edit módu → snapshot serveru do draftu
  const enterEdit = () => {
    if (serverMap) draft.reset(serverMap);
    setEditMode(true);
    setSelectedId(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    clearStale();
  };

  const save = async () => {
    if (!draft.draft) return;
    try {
      // sanitizace: force-graph mutuje nodes/links (přidá __threeObj + textury,
      // přepíše link.source/target na objekty) → bez očištění 413 Payload Too Large.
      await updateUniverse.mutateAsync(sanitizeForSave(draft.draft));
      toast.success('Mapa uložena.');
      setEditMode(false);
      setEditingId(null);
      clearStale();
    } catch {
      toast.error('Uložení mapy selhalo.');
    }
  };

  const handleNodeClick = (node: UniverseNode) => {
    flyToNode(fgRef.current, node);
    if (editMode) setEditingId(node.id);
    else setSelectedId(node.id);
  };

  const handleNodeRightClick = (node: UniverseNode) => {
    if (!editMode) return;
    if (window.confirm(`Smazat těleso „${node.name}"?`)) {
      draft.removeNode(node.id);
      if (editingId === node.id) setEditingId(null);
    }
  };

  const submitNode = (node: UniverseNode) => {
    if (editingNode) draft.updateNode(node.id, node);
    else draft.addNode(node);
    setEditingId(null);
  };

  const quickToggleVisibility = (node: UniverseNode) => {
    updateVisibility.mutate({
      nodeId: node.id,
      isPublic: !node.isPublic,
      visibleToPlayerIds: node.visibleToPlayerIds,
    });
  };

  return (
    <div className={styles.viewport} data-print-scope>
      <div
        className="print-hide"
        style={{ position: 'absolute', top: 8, right: 8, zIndex: 20 }}
      >
        <PrintButton title="Vytisknout hvězdnou mapu (seznam těles)" />
      </div>

      {/* Tisk: WebGL graf nejde spolehlivě snapshotovat (prázdný drawing
          buffer) → tiskneme čitelný seznam těles místo obrázku grafu. */}
      {printMode && (
        <div className="print-universe-list">
          <h2>Mapa vesmíru</h2>
          {map.nodes.length === 0 ? (
            <p>Žádná viditelná tělesa.</p>
          ) : (
            <ul>
              {map.nodes.map((n) => (
                <li key={n.id}>
                  <strong>{n.name}</strong>
                  {n.type ? ` — ${NODE_TYPE_LABEL[n.type] ?? n.type}` : ''}
                  {n.alliance ? ` (${n.alliance})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!printMode && (
        <>
          <UniverseGraph
            data={map}
            editMode={editMode}
            fgRef={fgRef}
            onNodeClick={handleNodeClick}
            onNodeRightClick={handleNodeRightClick}
            onNodeMoved={draft.moveNode}
          />

      <UniversePanel
        title="Mapa vesmíru"
        headerExtra={
          isPJ &&
          (editMode ? (
            <button
              type="button"
              className={panel.iconBtn}
              onClick={save}
              disabled={updateUniverse.isPending}
              title="Uložit mapu"
            >
              💾
            </button>
          ) : (
            <button
              type="button"
              className={panel.iconBtn}
              onClick={enterEdit}
              title="Editační režim"
            >
              🛠️
            </button>
          ))
        }
      >
        {isLoading && <div className={panel.hint}>Načítám mapu…</div>}

        {!editMode && (
          <>
            <UniverseSearch nodes={map.nodes} onPick={handleNodeClick} />
            <button
              type="button"
              className={panel.btn}
              onClick={() => fgRef.current?.zoomToFit(1000, 150)}
            >
              🔭 Zobrazit vše
            </button>
            {map.nodes.length === 0 && !isLoading && (
              <div className={panel.hint}>
                {isPJ
                  ? 'Mapa je prázdná. Spusť editační režim a přidej tělesa.'
                  : 'Pro tebe zatím nejsou viditelná žádná tělesa.'}
              </div>
            )}
            {selectedNode && (
              <UniverseDetail
                node={selectedNode}
                nodes={map.nodes}
                links={map.links}
                worldSlug={worldSlug}
                isPJ={isPJ}
                onSelectNode={(id) => {
                  setSelectedId(id);
                  const n = map.nodes.find((x) => x.id === id);
                  if (n) flyToNode(fgRef.current, n);
                }}
                onToggleVisibility={isPJ ? quickToggleVisibility : undefined}
                visibilityBusy={updateVisibility.isPending}
              />
            )}
          </>
        )}

        {editMode && (
          <>
            {staleFromRemote && (
              <div className={panel.staleBadge}>
                ⚠️ Mapu mezitím změnil někdo jiný. Uložením přepíšeš jeho
                změny.
              </div>
            )}
            <span className={panel.hint}>
              Klikni na těleso pro úpravu, pravý klik pro smazání. Tělesa lze
              táhnout.
            </span>
            <NodeEditorForm
              key={editingId ?? 'new'}
              worldId={worldId}
              editingNode={editingNode}
              onSubmit={submitNode}
              onCancel={() => setEditingId(null)}
            />
            <LinkEditorForm
              nodes={map.nodes}
              links={map.links}
              onAddLink={draft.addLink}
              onRemoveLink={draft.removeLink}
            />
            <div className={panel.formRow}>
              <button
                type="button"
                className={panel.btn}
                onClick={save}
                disabled={updateUniverse.isPending}
              >
                💾 Uložit mapu
              </button>
              <button
                type="button"
                className={`${panel.btn} ${panel.btnDanger}`}
                onClick={cancelEdit}
              >
                Zrušit
              </button>
            </div>
          </>
        )}
      </UniversePanel>
        </>
      )}
    </div>
  );
}
