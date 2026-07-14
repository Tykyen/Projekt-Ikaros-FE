/**
 * 21.3a — fullscreen editor podzemí (`/svet/:worldSlug/podzemi/:dungeonId`).
 *
 * Rozvržení: horní lišta (název · Uložit · PNG · rozměry · generátor) ·
 * levá nástrojová lišta · plátno (zoom/pan) · spodní legenda. Mobil: nástroje
 * dole, generátor jako fullscreen sheet.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Link, useBlocker, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpenText,
  Download,
  Map as MapIcon,
  Save,
  Settings2,
  Wand2,
} from 'lucide-react';
import { Button, ConfirmDialog, Input, Modal, Spinner } from '@/shared/ui';
import { useUploadImage } from '@/shared/api/useUploadImage';
import { useWorldContext } from '@/features/world/context/WorldContext';
import { useDungeonMap, useDungeonMapMutations } from '../hooks/useDungeonMaps';
import { generateDungeon } from '../engine/generate';
import { generateCity } from '../engine/generateCity';
import { generateWilderness } from '../engine/generateWilderness';
import {
  dungeonToPngBlob,
  renderDungeonToCanvas,
} from '../render/drawDungeon';
import {
  createEditorState,
  editorReducer,
  type EditorState,
} from '../state/editorState';
import { DUNGEON_LIMITS } from '../types';
import { DungeonCanvas } from './DungeonCanvas';
import { ToolPalette } from './ToolPalette';
import { GeneratorPanel, type GenerateRequest } from './GeneratorPanel';
import { NotesPanel } from './NotesPanel';
import { LegendBar } from './LegendBar';
import styles from './DungeonEditorPage.module.css';

const EMPTY_STATE: EditorState = createEditorState({
  id: '',
  worldId: '',
  name: '',
  gridType: 'square',
  gridWidth: 10,
  gridHeight: 10,
  cellSize: 40,
  theme: 'dyson',
  cells: [],
  decorations: [],
});

export default function DungeonEditorPage(): React.ReactElement {
  // 21.3c — bez `worldSlug` v URL jedeme v režimu osobní knihovny
  // (`/ikaros/podzemi/:dungeonId`): jiný zpět-link, bez exportu na TM.
  const { dungeonId, worldSlug } = useParams<{
    dungeonId: string;
    worldSlug?: string;
  }>();
  const isLibrary = !worldSlug;
  const backTo = isLibrary ? '/ikaros/podzemi' : `/svet/${worldSlug}/podzemi`;
  const { isPJ } = useWorldContext();
  const { data: dungeon, isLoading, isError } = useDungeonMap(dungeonId ?? null);
  const { replaceDungeon, exportScene } = useDungeonMapMutations();
  const uploadImage = useUploadImage();

  const [state, dispatch] = useReducer(editorReducer, EMPTY_STATE);
  const loadedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (dungeon && loadedIdRef.current !== dungeon.id) {
      loadedIdRef.current = dungeon.id;
      dispatch({ type: 'init', dungeon });
    }
  }, [dungeon]);

  const [showGenerator, setShowGenerator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [pendingGenerate, setPendingGenerate] =
    useState<GenerateRequest | null>(null);
  const [labelCell, setLabelCell] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [labelText, setLabelText] = useState('');
  const [showResize, setShowResize] = useState(false);
  const [resizeW, setResizeW] = useState(0);
  const [resizeH, setResizeH] = useState(0);

  // ── Ochrana neuložených změn (navigace v aplikaci + zavření okna) ──
  const blocker = useBlocker(state.dirty);
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (state.dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state.dirty]);

  const save = useCallback((): void => {
    if (!dungeonId || replaceDungeon.isPending) return;
    replaceDungeon.mutate(
      {
        id: dungeonId,
        dto: {
          name: state.name,
          gridType: 'square',
          gridWidth: state.gridWidth,
          gridHeight: state.gridHeight,
          cellSize: state.cellSize,
          theme: 'dyson',
          cells: state.cells,
          decorations: state.decorations,
          notes: state.notes,
        },
      },
      {
        onSuccess: () => {
          dispatch({ type: 'markSaved' });
          toast.success('Podzemí uloženo.');
        },
        onError: () => toast.error('Uložení se nepovedlo. Zkus to znovu.'),
      },
    );
  }, [dungeonId, replaceDungeon, state]);

  // ── Klávesové zkratky (Ctrl+Z / Ctrl+Y / Ctrl+S) ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' });
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        dispatch({ type: 'redo' });
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // 21.3b — render 1:1 (px obrazu = cellSize × grid) → upload → nová scéna TM.
  const exportToTacticalMap = async (): Promise<void> => {
    if (!dungeonId || exportScene.isPending || uploadImage.isPending) return;
    try {
      const canvas = renderDungeonToCanvas(
        {
          gridWidth: state.gridWidth,
          gridHeight: state.gridHeight,
          cells: state.cells,
          decorations: state.decorations,
          mapKind: state.mapKind,
        },
        { cellPx: state.cellSize, frame: false },
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('render selhal');
      const file = new File([blob], `${state.name.trim() || 'podzemi'}.png`, {
        type: 'image/png',
      });
      const uploaded = await uploadImage.mutateAsync(file);
      await exportScene.mutateAsync({ id: dungeonId, imageUrl: uploaded.url });
      toast.success(
        'Scéna vytvořena i se zdmi a dveřmi — najdeš ji na taktické mapě v seznamu scén.',
      );
    } catch {
      toast.error('Export na taktickou mapu se nepovedl. Zkus to znovu.');
    }
  };

  const downloadPng = async (): Promise<void> => {
    const blob = await dungeonToPngBlob({
      gridWidth: state.gridWidth,
      gridHeight: state.gridHeight,
      cells: state.cells,
      decorations: state.decorations,
      mapKind: state.mapKind,
      // 21.3f — klíč mapy se tiskne pod legendu.
      notes: state.notes,
    });
    if (!blob) {
      toast.error('Export PNG selhal.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.name.trim() || 'podzemi'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyGenerate = (request: GenerateRequest): void => {
    // 21.3e+g — engine podle druhu mapy (panel posílá odpovídající request).
    const generated =
      request.kind === 'city'
        ? generateCity(request.params)
        : request.kind === 'wilderness'
          ? generateWilderness(request.params)
          : generateDungeon(request.params);
    dispatch({
      type: 'applyGenerated',
      cells: generated.cells,
      decorations: generated.decorations,
      gridWidth: generated.cells[0].length,
      gridHeight: generated.cells.length,
    });
  };

  const onGenerateRequest = (request: GenerateRequest): void => {
    // Přepis rozmalovaného plátna jen po potvrzení (undo ho sice vrátí,
    // ale nechceme „vygumované" překvapení).
    if (state.dirty) setPendingGenerate(request);
    else applyGenerate(request);
  };

  const onCellClick = (x: number, y: number): void => {
    if (state.tool === 'label') {
      const existing = state.decorations.find(
        (d) => d.type === 'label' && d.cellX === x && d.cellY === y,
      );
      setLabelText(existing?.label ?? '');
      setLabelCell({ x, y });
      return;
    }
    dispatch({ type: 'clickCell', x, y });
  };

  if (isLoading) {
    return (
      <div className={styles.stateWrap}>
        <Spinner />
      </div>
    );
  }
  if (isError || !dungeon) {
    return (
      <div className={styles.stateWrap}>
        <p>Podzemí se nepodařilo načíst — buď neexistuje, nebo patří jinému staviteli.</p>
        <Link to={backTo} className={styles.stateLink}>
          Zpět na seznam
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.editor}>
      <header className={styles.topBar}>
        <Link
          to={backTo}
          className={styles.backLink}
          aria-label="Zpět na seznam podzemí"
        >
          <ArrowLeft size={18} />
        </Link>
        <input
          className={styles.nameInput}
          value={state.name}
          maxLength={DUNGEON_LIMITS.maxNameLength}
          placeholder="Název podzemí"
          aria-label="Název podzemí"
          onChange={(e) => dispatch({ type: 'rename', name: e.target.value })}
        />
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.topBtn}
            title="Rozměry mapy"
            aria-label="Rozměry mapy"
            onClick={() => {
              setResizeW(state.gridWidth);
              setResizeH(state.gridHeight);
              setShowResize(true);
            }}
          >
            <Settings2 size={17} />
          </button>
          <button
            type="button"
            className={`${styles.topBtn} ${showGenerator ? styles.topBtnActive : ''}`}
            title="Generátor"
            aria-label="Generátor"
            onClick={() => {
              setShowGenerator((v) => !v);
              setShowNotes(false);
            }}
          >
            <Wand2 size={17} />
          </button>
          <button
            type="button"
            className={`${styles.topBtn} ${showNotes ? styles.topBtnActive : ''}`}
            title="Klíč mapy (popisy k číslům)"
            aria-label="Klíč mapy"
            onClick={() => {
              setShowNotes((v) => !v);
              setShowGenerator(false);
            }}
          >
            <BookOpenText size={17} />
          </button>
          <button
            type="button"
            className={styles.topBtn}
            title="Stáhnout PNG"
            aria-label="Stáhnout PNG"
            onClick={() => void downloadPng()}
          >
            <Download size={17} />
          </button>
          {!isLibrary && isPJ && (
            <button
              type="button"
              className={styles.topBtn}
              title="Na taktickou mapu (nová scéna se zdmi)"
              aria-label="Na taktickou mapu"
              disabled={exportScene.isPending || uploadImage.isPending}
              onClick={() => void exportToTacticalMap()}
            >
              <MapIcon size={17} />
            </button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={save}
            loading={replaceDungeon.isPending}
          >
            <Save size={15} />
            <span className={styles.saveLabel}>
              Uložit{state.dirty ? ' •' : ''}
            </span>
          </Button>
        </div>
      </header>

      <div className={styles.workspace}>
        <ToolPalette
          mapKind={state.mapKind}
          tool={state.tool}
          doorType={state.doorType}
          decorationType={state.decorationType}
          surfaceVariant={state.surfaceVariant}
          canUndo={state.undoStack.length > 0}
          canRedo={state.redoStack.length > 0}
          onSelectTool={(tool) => dispatch({ type: 'setTool', tool })}
          onSelectDoorType={(doorType) =>
            dispatch({ type: 'setDoorType', doorType })
          }
          onSelectDecorationType={(decorationType) =>
            dispatch({ type: 'setDecorationType', decorationType })
          }
          onSelectSurfaceVariant={(surfaceVariant) =>
            dispatch({ type: 'setSurfaceVariant', surfaceVariant })
          }
          onUndo={() => dispatch({ type: 'undo' })}
          onRedo={() => dispatch({ type: 'redo' })}
        />
        <div className={styles.canvasColumn}>
          <DungeonCanvas
            dungeon={{
              gridWidth: state.gridWidth,
              gridHeight: state.gridHeight,
              cells: state.cells,
              decorations: state.decorations,
              mapKind: state.mapKind,
            }}
            tool={state.tool}
            onStrokeStart={() => dispatch({ type: 'beginStroke' })}
            onPaint={(x, y) => dispatch({ type: 'paintCell', x, y })}
            onStrokeEnd={() => dispatch({ type: 'endStroke' })}
            onCellClick={onCellClick}
          />
          <LegendBar mapKind={state.mapKind} />
        </div>
        {showGenerator && (
          <GeneratorPanel
            mapKind={state.mapKind}
            onGenerate={onGenerateRequest}
            onClose={() => setShowGenerator(false)}
          />
        )}
        {showNotes && (
          <NotesPanel
            decorations={state.decorations}
            notes={state.notes}
            onSetNote={(label, title, text) =>
              dispatch({ type: 'setNote', label, title, text })
            }
            onRemoveNote={(label) => dispatch({ type: 'removeNote', label })}
            onClose={() => setShowNotes(false)}
          />
        )}
      </div>

      {/* Potvrzení přepisu plátna generátorem */}
      <ConfirmDialog
        open={pendingGenerate !== null}
        onClose={() => setPendingGenerate(null)}
        title="Přepsat plátno?"
        message="Máš neuložené ruční změny — generátor je přepíše. (Zpět je vrátí.)"
        confirmLabel="Vygenerovat"
        onConfirm={() => {
          if (pendingGenerate) applyGenerate(pendingGenerate);
          setPendingGenerate(null);
        }}
      />

      {/* Potvrzení odchodu s neuloženými změnami */}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Odejít bez uložení?"
        message="Neuložené změny se ztratí."
        confirmLabel="Odejít"
        confirmVariant="danger"
        onConfirm={() => blocker.proceed?.()}
      />

      {/* Popisek buňky */}
      <Modal
        open={labelCell !== null}
        onClose={() => setLabelCell(null)}
        title="Popisek"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLabelCell(null)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (labelCell) {
                  dispatch({
                    type: 'clickCell',
                    x: labelCell.x,
                    y: labelCell.y,
                    labelText,
                  });
                }
                setLabelCell(null);
              }}
            >
              Uložit popisek
            </Button>
          </>
        }
      >
        <Input
          value={labelText}
          maxLength={60}
          placeholder="Např. 12 · Strážnice…"
          onChange={(e) => setLabelText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && labelCell) {
              dispatch({
                type: 'clickCell',
                x: labelCell.x,
                y: labelCell.y,
                labelText,
              });
              setLabelCell(null);
            }
          }}
        />
      </Modal>

      {/* Rozměry mapy */}
      <Modal
        open={showResize}
        onClose={() => setShowResize(false)}
        title="Rozměry mapy"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowResize(false)}
            >
              Zrušit
            </Button>
            <Button
              type="button"
              onClick={() => {
                dispatch({
                  type: 'resize',
                  gridWidth: resizeW,
                  gridHeight: resizeH,
                  cellSize: state.cellSize,
                });
                setShowResize(false);
              }}
            >
              Použít
            </Button>
          </>
        }
      >
        <div className={styles.resizeFields}>
          <label>
            Šířka (buňky, {DUNGEON_LIMITS.minGrid}–{DUNGEON_LIMITS.maxGrid})
            <Input
              type="number"
              min={DUNGEON_LIMITS.minGrid}
              max={DUNGEON_LIMITS.maxGrid}
              value={resizeW}
              onChange={(e) => setResizeW(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Výška (buňky, {DUNGEON_LIMITS.minGrid}–{DUNGEON_LIMITS.maxGrid})
            <Input
              type="number"
              min={DUNGEON_LIMITS.minGrid}
              max={DUNGEON_LIMITS.maxGrid}
              value={resizeH}
              onChange={(e) => setResizeH(Number(e.target.value) || 0)}
            />
          </label>
          <p className={styles.resizeHint}>
            Zmenšení ořízne mapu zprava/zdola. Vejde se to do Zpět.
          </p>
        </div>
      </Modal>
    </div>
  );
}
