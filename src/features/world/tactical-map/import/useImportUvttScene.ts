import { vypravecEmit } from '@/shared/vypravec/engine/events';
/**
 * 17.2 — import UVTT scény.
 *
 * Flow (vzor „load šablony" v `MapLibraryModal`):
 *   1. `parseUvtt` (throw `UvttParseError` na nevalidní soubor)
 *   2. base64 obrázek → `File` → upload na CDN (`useUploadImage`)
 *   3. `POST /maps` — nová scéna (name + imageUrl)
 *   4. op `scene.config` — celý kalibrovaný config (obejde whitelist
 *      `CreateMapDto`, který zná jen size/originX/originY/showGrid)
 *   5. op `scene.walls.replace` / `scene.lights.replace` (jen když neprázdné)
 *   6. aktivace + self-assign PJ na novou scénu
 *
 * Spec: docs/arch/phase-17/spec-17.2.md §4.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { useUploadImage } from '@/shared/api/useUploadImage';
import { postMapOperation, activateMapScene } from '../api/mapApi';
import { postWorldOperation } from '../api/worldOpsApi';
import { mapSceneQueryKey } from '../hooks/useMapScene';
import { activeScenesQueryKey } from '../hooks/useActiveScenes';
import type { HexConfig } from '../types';
import { parseUvtt, base64PngToFile } from './parseUvtt';

/** Odvodí název scény z názvu souboru (bez přípony). */
function sceneNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '').trim();
  return base.length > 0 ? base : 'Importovaná mapa';
}

export function useImportUvttScene(worldId: string, currentUserId: string) {
  const qc = useQueryClient();
  const upload = useUploadImage();

  return useMutation({
    mutationFn: async (file: File): Promise<{ id: string }> => {
      const text = await file.text();
      const parsed = parseUvtt(text); // throw UvttParseError

      const name = sceneNameFromFile(file.name);

      // Obrázek → CDN
      const imgFile = base64PngToFile(parsed.imageBase64, `${name}.png`);
      const uploaded = await upload.mutateAsync(imgFile);

      // Nová scéna (config půjde samostatnou operací — whitelist)
      const scene = await api.post<{ id: string }>('/maps', {
        worldId,
        name,
        imageUrl: uploaded.url,
      });
      vypravecEmit('scene.created', { worldId }); // Vypravěč (tm-vycvik)

      // Kalibrovaný config (celý objekt přes scene.config op)
      await postMapOperation(scene.id, {
        type: 'scene.config',
        config: parsed.config as unknown as HexConfig,
      });

      // Zdi a světla (jen když jsou — no-op operace zbytečné)
      if (parsed.walls.length > 0) {
        await postMapOperation(scene.id, {
          type: 'scene.walls.replace',
          walls: parsed.walls,
        });
      }
      if (parsed.lights.length > 0) {
        await postMapOperation(scene.id, {
          type: 'scene.lights.replace',
          lights: parsed.lights,
        });
      }

      // Aktivovat + přepnout PJ na novou scénu
      await activateMapScene(scene.id, worldId);
      await postWorldOperation(worldId, {
        type: 'member.assignToScene',
        userId: currentUserId,
        sceneId: scene.id,
      });

      return scene;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      void qc.invalidateQueries({ queryKey: activeScenesQueryKey(worldId) });
      void qc.invalidateQueries({ queryKey: ['worlds', worldId, 'members'] });
    },
  });
}
