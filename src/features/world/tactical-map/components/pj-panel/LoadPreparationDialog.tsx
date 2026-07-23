import { vypravecEmit } from '@/shared/vypravec/engine/events';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import { api, apiClient, parseApiError } from '@/shared/api/client';
import {
  useCampaignScenarios,
  useCampaignSubjects,
} from '@/features/world/campaign/api';
import { getMeta, mergeMeta } from '@/features/world/campaign/scenarioMeta';
import { campaignKeys } from '@/features/world/campaign/api';
import { postWorldOperation } from '../../api/worldOpsApi';
import { postMapOperation } from '../../api/mapApi';
import { mapSceneQueryKey } from '../../hooks/useMapScene';
import { activeScenesQueryKey } from '../../hooks/useActiveScenes';
import s from './LoadPreparationDialog.module.css';

interface CharRef {
  id: string;
  slug: string;
}

/**
 * 11.2-ext D — „Načíst přípravu": z campaign scénáře jedním krokem **vytvoří
 * novou aktivní scénu** s podkladem mapy ze scénáře (`mapPrep.imageUrl` —
 * základní, ne očíslovaná verze) a vloží do ní předpřipravené bestie a postavy.
 *
 * Bestie = přímý ref (`bestieIds`); postavy = resolve subjekt→`linkedCharacterSlug`
 * a `pageSlugs` (PC/NPC) → `characterId` přes directory postav světa. Po vytvoření
 * scénu aktivuje a přepne na ni PJ (`member.assignToScene` self).
 */
export function LoadPreparationDialog({
  worldId,
  currentUserId,
  onClose,
}: {
  worldId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: scenarios = [] } = useCampaignScenarios(worldId);
  const { data: subjects = [] } = useCampaignSubjects(worldId);
  const pcQuery = useQuery({
    queryKey: ['worlds', worldId, 'characters', 'players'],
    queryFn: () =>
      api.get<CharRef[]>(`/worlds/${worldId}/characters/players`),
    enabled: !!worldId,
  });
  const npcQuery = useQuery({
    queryKey: ['worlds', worldId, 'characters', 'all'],
    queryFn: () => api.get<CharRef[]>(`/worlds/${worldId}/characters`),
    enabled: !!worldId,
  });

  const [scenarioId, setScenarioId] = useState('');

  const slugToId = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of [...(pcQuery.data ?? []), ...(npcQuery.data ?? [])]) {
      m.set(c.slug, c.id);
    }
    return m;
  }, [pcQuery.data, npcQuery.data]);

  const plan = useMemo(() => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) {
      return {
        title: '',
        mapImageUrl: undefined as string | undefined,
        bestieIds: [],
        characterIds: [],
        skipped: 0,
      };
    }
    const meta = getMeta(scenario);

    // Bestie — přímý ref (nová scéna je prázdná, bereme vše).
    const bestieIds = [...new Set(meta.bestieIds)];

    // Postavy — z napojených subjektů + PC/NPC stránek → characterId přes slug.
    const slugs = new Set<string>();
    let skipped = 0;
    for (const subId of scenario.subjectIds) {
      const subj = subjects.find((s) => s.id === subId);
      const slug = subj?.linkedCharacterSlug;
      if (slug) slugs.add(slug);
      else if (subj) skipped += 1; // subjekt bez napojené postavy
    }
    for (const slug of meta.pageSlugs) slugs.add(slug);

    const characterIds: string[] = [];
    for (const slug of slugs) {
      const id = slugToId.get(slug);
      if (id) characterIds.push(id);
      else skipped += 1; // slug bez postavy ve světě
    }

    return {
      title: scenario.title,
      // Základní podklad mapy (ne očíslovaná `numberedImageUrl`).
      mapImageUrl: meta.mapPrep?.imageUrl,
      bestieIds,
      characterIds: [...new Set(characterIds)],
      skipped,
    };
  }, [scenarios, scenarioId, subjects, slugToId]);

  const apply = useMutation({
    mutationFn: async () => {
      // 1) Vytvoř novou scénu (název = scénář, default hex config).
      const created = await api.post<{ id: string }>('/maps', {
        worldId,
        name: plan.title || 'Nová scéna',
        config: { size: 40, originX: 0, originY: 0, showGrid: true },
      });
      vypravecEmit('scene.created', { worldId }); // Vypravěč (tm-vycvik)

      // 2) Podklad mapy ze scénáře (základní imageUrl, pokud je).
      if (plan.mapImageUrl) {
        await postMapOperation(created.id, {
          type: 'scene.image',
          imageUrl: plan.mapImageUrl,
        });
      }

      // 3) Vlož připravené bestie + postavy do whitelistu nové scény.
      for (const bestieId of plan.bestieIds) {
        await postMapOperation(created.id, {
          type: 'scene.activeBestie.add',
          bestieId,
        });
      }
      for (const characterId of plan.characterIds) {
        await postMapOperation(created.id, {
          type: 'scene.activeCharacters.add',
          characterId,
        });
      }

      // 4) Aktivuj scénu a přepni na ni PJ.
      await apiClient.post(`/maps/${created.id}/active`, undefined, {
        params: { worldId },
      });
      await postWorldOperation(worldId, {
        type: 'member.assignToScene',
        userId: currentUserId,
        sceneId: created.id,
      });

      // 5) Provázání scénář→scéna (D-076): doplň `mapSceneIds` o novou scénu.
      // Read-merge-write contentData (BE dělá $set celého contentData).
      const scenario = scenarios.find((sc) => sc.id === scenarioId);
      if (scenario) {
        const meta = getMeta(scenario);
        await api.put(`/campaign/scenarios/${scenario.id}?worldId=${worldId}`, {
          title: scenario.title,
          images: scenario.images,
          linkedPageSlug: scenario.linkedPageSlug,
          subjectIds: scenario.subjectIds,
          storylineIds: scenario.storylineIds,
          isShared: scenario.isShared,
          contentData: mergeMeta(scenario, {
            mapSceneIds: [...meta.mapSceneIds, created.id],
          }),
        });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: activeScenesQueryKey(worldId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['worlds', worldId, 'members'],
      });
      void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
      // Promítni doplněné `mapSceneIds` do campaign scénářů.
      void queryClient.invalidateQueries({
        queryKey: campaignKeys.scenarios(worldId),
      });
      toast.success(
        `Scéna „${plan.title}" vytvořena: ${plan.characterIds.length} postav, ` +
          `${plan.bestieIds.length} bestií` +
          (plan.mapImageUrl ? ' + podklad mapy' : '') +
          (plan.skipped ? ` (${plan.skipped} bez napojené postavy přeskočeno)` : ''),
      );
      onClose();
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  return (
    <Modal open onClose={onClose} title="Načíst přípravu ze scénáře">
      <div className={s.body}>
        <label className={s.field}>
          <span>Scénář</span>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
          >
            <option value="">— vyber scénář —</option>
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </label>

        {scenarioId && (
          <div>
            Vytvořím scénu „{plan.title}"
            {plan.mapImageUrl ? ' s podkladem mapy' : ' (bez podkladu)'}:{' '}
            <strong>{plan.characterIds.length}</strong> postav,{' '}
            <strong>{plan.bestieIds.length}</strong> bestií.
            {plan.skipped > 0 && (
              <div className={s.note}>
                {plan.skipped} subjektů nemá napojenou postavu — přeskočí se.
              </div>
            )}
          </div>
        )}

        <div className={s.actions}>
          <Button variant="secondary" onClick={onClose}>
            Zrušit
          </Button>
          <Button
            onClick={() => apply.mutate()}
            disabled={!scenarioId || apply.isPending}
          >
            {apply.isPending ? 'Vytvářím scénu…' : 'Vytvořit scénu'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
