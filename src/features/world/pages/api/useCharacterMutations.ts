import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import {
  charactersQueryKey,
  type Character,
  type CharacterDiary,
  type CharacterCalendar,
  type CharacterFinance,
  type CharacterInventory,
  type CharacterNotes,
  type ConvertCharacterInput,
  type InfoBlock,
  type SchemaBlock,
  type CustomDiaryBlock,
  type CalendarEvent,
  type FinanceEntry,
} from './characters.types';

/** Klíč seznamu členů světa — sdílený s `useUpdateMember` (5.3c). */
const membersQueryKey = (worldId: string) =>
  ['worlds', worldId, 'members'] as const;

/** Subdokumenty postavy — convert mění viditelnost financí/výbavy. */
const SUBDOC_KINDS = [
  'diary',
  'calendar',
  'finance',
  'inventory',
  'notes',
] as const;
import type { AccessRequirement, PageSection } from './pages.types';

/**
 * 8.1 — Zápisové hooky detailu postavy. Vzor `useUpdatePage`: `useMutation`
 * + invalidace/`setQueryData` nad `charactersQueryKey`. Po úspěchu se čerstvá
 * data ze serveru zapíšou rovnou do cache příslušného `detail`/`subdoc` klíče.
 */

// ── Vstupní typy (zrcadlí BE DTO; všechna pole volitelná = částečný PATCH) ──

export interface UpdateCharacterInput {
  name?: string;
  imageUrl?: string;
  publicBio?: string;
  publicInfoBlocks?: InfoBlock[];
  /** BE dělá shallow-merge kořenových klíčů (`characters.service.ts`). */
  diaryData?: Record<string, unknown>;
  extraBlocks?: SchemaBlock[];
  accessRequirements?: AccessRequirement[];
  /**
   * D-073 (2026-05-23) — optimistic concurrency token (ISO string).
   * Pošli `character.updatedAt` z předchozího GET. Při 409 `CHARACTER_CONFLICT`
   * znamená, že jiný PomocnyPJ+ postavu mezitím upravil — vyzvat k reloadu.
   */
  expectedUpdatedAt?: string;
}

export interface UpdateDiaryInput {
  sections?: PageSection[];
  /**
   * **Deprecated** (2026-05-24, D-040-followup) — plně nahrazuje `customData`
   * v DB. Při switch systemu mezi presetuy nadobro smaže ne-FE-držené keys
   * (data loss). Zachováno pro BC; **nový kód musí používat `customDataPatch`**.
   */
  customData?: Record<string, unknown>;
  /**
   * 2026-05-24 — delta merge customData. Pošli jen změněné keys; BE provede
   * per-key `$set: { 'customData.<key>': value }`. `null` value = `$unset`.
   * Ostatní keys (např. z jiných system presetů po switchi) zůstanou nedotčené.
   */
  customDataPatch?: Record<string, unknown>;
  personalDiarySchema?: CustomDiaryBlock[];
}

export interface UpdateFinanceInput {
  entries?: FinanceEntry[];
  accountType?: string;
  accessLocation?: string;
  currency?: string;
  /** 8.1-FIR — RichText „Rozepsané" Matrix-style. */
  notes?: string;
}

export interface UpdateInventoryInput {
  sections?: PageSection[];
  /** 8.1-FIR — RichText „Rozepsané" Matrix-style. */
  notes?: string;
}

export interface UpdateNotesInput {
  content?: string;
}

/** `PUT` nahrazuje celý subdoc → `events` posíláme vždy kompletní. */
export interface UpdateCalendarInput {
  events: CalendarEvent[];
  color?: string;
  displaySettings?: CharacterCalendar['displaySettings'];
}

// ── Postava ────────────────────────────────────────────────────────

export function useUpdateCharacter(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCharacterInput) =>
      api.patch<Character>(`/worlds/${worldId}/characters/${slug}`, input),
    onSuccess: (character) => {
      qc.setQueryData(charactersQueryKey.detail(worldId, slug), character);
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.directory(worldId),
      });
      // C-20 — primární grid postav je servírovaný z Page projekce (persona).
      void qc.invalidateQueries({ queryKey: ['pages', worldId, 'directory'] });
    },
  });
}

/** 8.2 — Mazání postavy (`DELETE .../characters/:slug`). BE kaskádně uklidí
 *  subdokumenty a vyčistí `characterPath` členů. */
export function useDeleteCharacter(worldId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      api.delete<void>(`/worlds/${worldId}/characters/${slug}`),
    onSuccess: (_data, slug) => {
      qc.removeQueries({
        queryKey: charactersQueryKey.detail(worldId, slug),
      });
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.directory(worldId),
      });
      void qc.invalidateQueries({ queryKey: membersQueryKey(worldId) });
      // C-20 — persona grid (Page projekce).
      void qc.invalidateQueries({ queryKey: ['pages', worldId, 'directory'] });
    },
  });
}

/** 8.2 — Convert PC ↔ NPC (`PATCH .../convert`). Mění viditelnost financí
 *  a výbavy → invaliduje subdokumenty i directory/členy. */
export function useConvertCharacter(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConvertCharacterInput) =>
      api.patch<Character>(
        `/worlds/${worldId}/characters/${slug}/convert`,
        input,
      ),
    onSuccess: (character) => {
      qc.setQueryData(charactersQueryKey.detail(worldId, slug), character);
      SUBDOC_KINDS.forEach((kind) => {
        void qc.invalidateQueries({
          queryKey: charactersQueryKey.subdoc(worldId, slug, kind),
        });
      });
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.directory(worldId),
      });
      void qc.invalidateQueries({ queryKey: membersQueryKey(worldId) });
      // C-20 — persona grid (Page projekce).
      void qc.invalidateQueries({ queryKey: ['pages', worldId, 'directory'] });
      // D-05-3 — convert může měnit viditelnost účtů (PC↔NPC).
      void qc.invalidateQueries({
        queryKey: charactersQueryKey.accountsByCharacter(worldId, slug),
      });
    },
  });
}

// ── Subdokumenty ───────────────────────────────────────────────────

export function useUpdateCharacterDiary(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDiaryInput) =>
      api.patch<CharacterDiary>(
        `/worlds/${worldId}/characters/${slug}/diary`,
        input,
      ),
    onSuccess: (diary) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'diary'),
        diary,
      );
    },
  });
}

export function useUpdateCharacterCalendar(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCalendarInput) =>
      api.put<CharacterCalendar>(
        `/worlds/${worldId}/characters/${slug}/calendar`,
        input,
      ),
    onSuccess: (calendar) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'calendar'),
        calendar,
      );
      // C-22 — agregátní kalendář (PJ view) je samostatný namespace.
      void qc.invalidateQueries({ queryKey: ['calendars-aggregate', worldId] });
    },
  });
}

export function useUpdateCharacterFinance(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateFinanceInput) =>
      api.patch<CharacterFinance>(
        `/worlds/${worldId}/characters/${slug}/finance`,
        input,
      ),
    onSuccess: (finance) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'finance'),
        finance,
      );
    },
  });
}

/** `POST .../finance/add-monthly` — sečte `entries`, založí transakci. */
export function useFinanceAddMonthly(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<CharacterFinance>(
        `/worlds/${worldId}/characters/${slug}/finance/add-monthly`,
      ),
    onSuccess: (finance) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'finance'),
        finance,
      );
    },
  });
}

/** `POST .../finance/undo` — vrátí poslední transakci. */
export function useFinanceUndo(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<CharacterFinance>(
        `/worlds/${worldId}/characters/${slug}/finance/undo`,
      ),
    onSuccess: (finance) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'finance'),
        finance,
      );
    },
  });
}

export function useUpdateCharacterInventory(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInventoryInput) =>
      api.patch<CharacterInventory>(
        `/worlds/${worldId}/characters/${slug}/inventory`,
        input,
      ),
    onSuccess: (inventory) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'inventory'),
        inventory,
      );
    },
  });
}

export function useUpdateCharacterNotes(worldId: string, slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotesInput) =>
      api.patch<CharacterNotes>(
        `/worlds/${worldId}/characters/${slug}/notes`,
        input,
      ),
    onSuccess: (notes) => {
      qc.setQueryData(
        charactersQueryKey.subdoc(worldId, slug, 'notes'),
        notes,
      );
    },
  });
}
