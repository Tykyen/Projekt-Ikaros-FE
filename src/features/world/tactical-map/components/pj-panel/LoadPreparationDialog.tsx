import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal, Button } from '@/shared/ui';
import { api, parseApiError } from '@/shared/api/client';
import {
  useCampaignScenarios,
  useCampaignSubjects,
} from '@/features/world/campaign/api';
import { getMeta } from '@/features/world/campaign/scenarioMeta';
import { postMapOperation } from '../../api/mapApi';
import type { MapScene } from '../../types';
import s from './LoadPreparationDialog.module.css';

interface CharRef {
  id: string;
  slug: string;
}

/**
 * 11.2-ext D — „Načíst přípravu": z campaign scénáře jedním krokem vloží jeho
 * předpřipravené bestie a postavy do whitelistu aktivní scény (palety PJ).
 * Bestie = přímý ref (`bestieIds`); postavy = resolve subjekt→`linkedCharacterSlug`
 * a `pageSlugs` (PC/NPC) → `characterId` přes directory postav světa.
 */
export function LoadPreparationDialog({
  worldId,
  scene,
  onClose,
}: {
  worldId: string;
  scene: MapScene;
  onClose: () => void;
}) {
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
      return { bestieIds: [], characterIds: [], skipped: 0 };
    }
    const meta = getMeta(scenario);

    // Bestie — přímý ref, jen ty co ještě nejsou ve whitelistu.
    const bestieIds = meta.bestieIds.filter(
      (id) => !scene.activeBestieIds.includes(id),
    );

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
      if (id && !scene.activeCharacterIds.includes(id)) characterIds.push(id);
      else if (!id) skipped += 1; // slug bez postavy ve světě
    }

    return {
      bestieIds,
      characterIds: [...new Set(characterIds)],
      skipped,
    };
  }, [scenarios, scenarioId, subjects, slugToId, scene]);

  const apply = useMutation({
    mutationFn: async () => {
      for (const bestieId of plan.bestieIds) {
        await postMapOperation(scene.id, {
          type: 'scene.activeBestie.add',
          bestieId,
        });
      }
      for (const characterId of plan.characterIds) {
        await postMapOperation(scene.id, {
          type: 'scene.activeCharacters.add',
          characterId,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        `Vloženo: ${plan.characterIds.length} postav, ${plan.bestieIds.length} bestií` +
          (plan.skipped ? ` (${plan.skipped} bez napojené postavy přeskočeno)` : ''),
      );
      onClose();
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const nothing =
    plan.bestieIds.length === 0 && plan.characterIds.length === 0;

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
            Vložím do scény „{scene.name}":{' '}
            <strong>{plan.characterIds.length}</strong> postav,{' '}
            <strong>{plan.bestieIds.length}</strong> bestií.
            {plan.skipped > 0 && (
              <div className={s.note}>
                {plan.skipped} subjektů nemá napojenou postavu — přeskočí se.
              </div>
            )}
            {nothing && (
              <div className={s.note}>
                Nic nového k vložení (vše už ve scéně, nebo scénář nemá
                připravené entity).
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
            disabled={!scenarioId || nothing || apply.isPending}
          >
            {apply.isPending ? 'Vkládám…' : 'Načíst přípravu'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
