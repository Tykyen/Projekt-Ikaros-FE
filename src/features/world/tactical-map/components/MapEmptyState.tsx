import medakAvatarWebp96 from '@/assets/vypravec/medak-avatar-96.webp';
import medakAvatarWebp192 from '@/assets/vypravec/medak-avatar-192.webp';
import medakAvatarPng from '@/assets/vypravec/medak-avatar.png';
import { activateMapScene } from '../api/mapApi';
import { vypravecReportEmpty } from '@/shared/vypravec/registry/emptyStates';
import { vypravecEmit } from '@/shared/vypravec/engine/events';
/**
 * 10.2a — empty state pro taktickou mapu.
 *
 * Použito když:
 *   - Hráč není přiřazený k žádné scéně (`MAP_NO_ACTIVE_SCENE`)
 *   - WorldContext zatím nedoručil world (kratká fáze před hydratem)
 *
 * 10.2c hotfix — pro PJ varianta s "Vytvořit první scénu" tlačítkem.
 *
 * 10.2c-edit-1 — pro hráče (ne-PJ) zobrazí navíc karty jeho postav ve světě
 * (`CharacterDirectoryEntry.userId === currentUserId && !isNpc`). PJ panel
 * to nedoplňuje, protože PJ má jiný workflow (orchestrace).
 *
 * FIX-1 — `variant` rozlišuje skutečně prázdný stav ('empty', default) od
 * chybových stavů ('forbidden' = 403 odebrán ze scény/bez oprávnění,
 * 'error' = jiná chyba načtení). Chybové varianty potlačují PJ interaktivní
 * akce (vytvořit scénu, seznam scén, karty postav) — nejsou relevantní,
 * scéna existuje, jen se nepodařilo ji zobrazit.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §3.7,
 *       docs/arch/maps/scene-assignment-ux/purpose.md §1.
 */
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { stateIllustrationSrc } from '@/shared/ui';
import { postWorldOperation } from '../api/worldOpsApi';
import { mapSceneQueryKey } from '../hooks/useMapScene';
import { useActiveScenes, activeScenesQueryKey } from '../hooks/useActiveScenes';
import { useCharacterDirectory } from '@/features/world/pages/api/useCharacterDirectory';
import type { MapScene } from '../types';
import styles from './MapEmptyState.module.css';

interface Props {
  /** Hlavní text. Default dle `variant`. */
  title?: string;
  /** Doplňující text (přepsán pro PJ variantu). */
  subtitle?: string;
  /** Pokud true → render "Vytvořit první scénu" tlačítko (jen `variant="empty"`). */
  isPJ?: boolean;
  worldId?: string;
  currentUserId?: string;
  /**
   * FIX-1 — 'empty' (default) = hráč skutečně není přiřazen ke scéně (PJ
   * dostane interaktivní akce). 'forbidden' = 403 (odebrán ze scény / bez
   * oprávnění). 'error' = jiná chyba načtení (500, síť…). Obě chybové
   * varianty jsou read-only banner bez PJ akcí.
   */
  variant?: "empty" | "forbidden" | "error";
}

interface CreateSceneResponse {
  id: string;
  name: string;
  worldId: string;
}

export function MapEmptyState({
  title,
  subtitle,
  isPJ = false,
  worldId,
  currentUserId,
  variant = 'empty',
}: Props = {}): React.ReactElement {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const isEmptyVariant = variant === 'empty';

  // Vypravěč (moment 3a): hráč bez scény — vysvětlit, že mapa není rozbitá.
  useEffect(() => {
    if (isEmptyVariant && !isPJ) vypravecReportEmpty('tm-hrac-bez-sceny');
  }, [isEmptyVariant, isPJ]);

  // 10.2c-edit-1 — pro hráče načti postavy ve světě, filtruj na své PC.
  // Skip pro PJ (jiný workflow), pro chybové varianty i pokud chybí worldId/userId.
  const showCharacters = isEmptyVariant && !isPJ && !!worldId && !!currentUserId;
  const { data: directory } = useCharacterDirectory(showCharacters ? worldId! : '');
  const myCharacters = (directory ?? []).filter(
    (c) => !c.isNpc && c.userId === currentUserId,
  );

  // 10.2c-edit-9g — pro PJ: pokud existují aktivní scény, ukáž klikatelný
  // list („Připojit se ke scéně"). Klik = assignToScene self → useMapScene
  // refetch → scena se loadne. Vyřešuje issue „mapa se po refreshi nenačte"
  // (PJ má scény ale není ke žádné přiřazen). Jen `variant="empty"` — u
  // chybových variant scéna existuje, jen se nepodařilo ji zobrazit.
  const { scenes: activeScenes } = useActiveScenes(
    isEmptyVariant && isPJ && worldId ? worldId : '',
    isEmptyVariant && !!isPJ,
  );
  const assignMutation = useMutation({
    mutationFn: async (sceneId: string): Promise<void> => {
      if (!worldId || !currentUserId) return;
      await postWorldOperation(worldId, {
        type: 'member.assignToScene',
        userId: currentUserId,
        sceneId,
      });
    },
    onSuccess: () => {
      if (worldId) {
        void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
        void queryClient.invalidateQueries({
          queryKey: ['worlds', worldId, 'members'],
        });
        // C-25 — PJ orchestrator list aktivních scén (REST fallback k WS).
        void queryClient.invalidateQueries({
          queryKey: activeScenesQueryKey(worldId),
        });
      }
    },
  });

  const mutation = useMutation({
    mutationFn: async (): Promise<MapScene> => {
      // 1) Vytvořit scénu s defaults (BE service force-uje isActive:false)
      const scene = await api.post<CreateSceneResponse>('/maps', {
        worldId,
        name: 'Nová scéna',
        config: { size: 40, originX: 0, originY: 0, showGrid: true },
      });
      vypravecEmit('scene.created', { worldId }); // Vypravěč (tm-vycvik)
      // 2) Aktivovat scénu (POST /maps/:id/active s worldId v query) —
      // bez tohoto by `useActiveScenes` (PJ panel) ukazovala prázdný seznam
      // a `useMapScene` by stále vracelo 404 (membership.currentSceneId
      // sice nastavený krokem 3, ale UX nekonzistence: scene visible v
      // mapě, ale PJ panel říká "Žádná aktivní scéna").
      if (worldId) await activateMapScene(scene.id, worldId);
      // 3) Auto-assign self (přes Operations API z 10.2-prep-1)
      if (worldId && currentUserId) {
        await postWorldOperation(worldId, {
          type: 'member.assignToScene',
          userId: currentUserId,
          sceneId: scene.id,
        });
      }
      return scene as MapScene;
    },
    onSuccess: () => {
      // Refetch scene query → useMapScene se znovu nahraje s novou scénou
      if (worldId) {
        void queryClient.invalidateQueries({ queryKey: mapSceneQueryKey(worldId) });
        void queryClient.invalidateQueries({
          queryKey: ['worlds', worldId, 'members'],
        });
        // C-25 — PJ orchestrator list aktivních scén (REST fallback k WS).
        void queryClient.invalidateQueries({
          queryKey: activeScenesQueryKey(worldId),
        });
      }
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Neznámá chyba';
      setError(msg);
    },
  });

  const hasActiveScenes = isEmptyVariant && isPJ && activeScenes.length > 0;
  const effectiveTitle =
    title ??
    (variant === 'forbidden'
      ? 'Nemáš přístup ke scéně'
      : variant === 'error'
        ? 'Nepodařilo se načíst scénu'
        : hasActiveScenes
          ? 'Nejsi přiřazen ke scéně'
          : isPJ
            ? 'Žádná scéna v tomto světě'
            : 'Žádná aktivní scéna');
  const effectiveSubtitle =
    subtitle ??
    (variant === 'forbidden'
      ? 'Byl jsi odebrán ze scény, nebo k ní nemáš oprávnění. Kontaktuj PJ.'
      : variant === 'error'
        ? 'Zkus stránku obnovit. Pokud problém přetrvává, kontaktuj PJ.'
        : hasActiveScenes
          ? 'Vyber existující scénu níže, nebo si vytvoř novou.'
          : isPJ
            ? 'Založ první scénu a začni s hrou. Můžeš ji kdykoli později přejmenovat a doplnit pozadí.'
            : 'Vyčkej, až tě PJ přiřadí ke scéně.');

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {/* Měďákův vstup i bez scény — jinak je krok 1 výcviku bez průvodce. */}
      <button
        type="button"
        className={styles.medakBtn}
        onClick={() => window.dispatchEvent(new Event('vypravec:otevrit'))}
        aria-label="Vypravěč — Měďákova nápověda k mapě"
        title="Vypravěč — Měďákova nápověda k mapě"
      >
        <picture>
          <source
            type="image/webp"
            srcSet={`${medakAvatarWebp96} 1x, ${medakAvatarWebp192} 2x`}
          />
          <img src={medakAvatarPng} alt="" className={styles.medakImg} />
        </picture>
      </button>
      <img
        src={stateIllustrationSrc('worlds')}
        alt=""
        aria-hidden="true"
        className={styles.illustration}
        draggable={false}
      />
      <p className={styles.title}>{effectiveTitle}</p>
      <p className={styles.subtitle}>{effectiveSubtitle}</p>
      {isEmptyVariant && isPJ && worldId && currentUserId && (
        <>
          {/* 10.2c-edit-9g — pokud existují aktivní scény, klikatelný list
              pro rychlé self-assign. Vyřešuje „mapa se nenačte po refreshi". */}
          {hasActiveScenes && (
            <ul className={styles.scenesList}>
              {activeScenes.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={styles.sceneItem}
                    onClick={() => assignMutation.mutate(s.id)}
                    disabled={assignMutation.isPending}
                    title={`Přiřadit se ke scéně „${s.name}"`}
                  >
                    <span className={styles.sceneItemArrow}>→</span>
                    <span className={styles.sceneItemName}>{s.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.cta}
            onClick={() => {
              setError(null);
              mutation.mutate();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? 'Vytvářím…'
              : hasActiveScenes
                ? '+ Vytvořit novou scénu'
                : '+ Vytvořit první scénu'}
          </button>
          {error && (
            <p className={styles.error} role="alert">
              Chyba: {error}
            </p>
          )}
        </>
      )}
      {/* 10.2c-edit-1 — hráč vidí karty svých postav ve světě (read-only,
          jen vizuální připomínka). Edit přes /moje-postava — link níže. */}
      {showCharacters && myCharacters.length > 0 && (
        <div className={styles.charactersSection}>
          <h2 className={styles.charactersHeading}>Tvé postavy v tomto světě</h2>
          <ul className={styles.charactersList}>
            {myCharacters.map((c) => (
              <li key={c.id} className={styles.characterCard}>
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt=""
                    className={styles.characterPortrait}
                  />
                ) : (
                  <div
                    className={styles.characterPortraitFallback}
                    aria-hidden="true"
                  >
                    👤
                  </div>
                )}
                <span className={styles.characterName}>{c.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
