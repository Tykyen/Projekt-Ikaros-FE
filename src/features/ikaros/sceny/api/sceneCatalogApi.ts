/**
 * 22.5 — API klient veřejného katalogu sdílených scén (přes shared api).
 * BE: MapTemplatesController (`/map-templates/catalog`, `/:id/publish|...`).
 */
import { api } from '@/shared/api/client';

/** Katalogový záznam (whitelist z BE — bez owner-privátních polí). */
export interface SceneCatalogEntry {
  id: string;
  name: string;
  imageUrl: string;
  publicAuthorName: string;
  publishedAt: string | null;
  npcCount: number;
  hasFog: boolean;
  cloneAllowed?: boolean;
}

export interface SceneCatalogResponse {
  items: SceneCatalogEntry[];
  total: number;
}

export type SceneLicenseMode = 'private' | 'read' | 'clone' | 'remix' | 'open';
export type SceneAiOrigin = 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';

/** Vstup publikace šablony scény (zrcadlí BE PublishSceneTemplateDto). */
export interface PublishSceneTemplateInput {
  licenseMode?: SceneLicenseMode;
  attributionRequired?: boolean;
  aiOrigin?: SceneAiOrigin;
  description?: string;
}

export function listSceneCatalog(params?: {
  systemId?: string;
  page?: number;
  limit?: number;
}): Promise<SceneCatalogResponse> {
  const query: Record<string, unknown> = {};
  if (params?.systemId) query.systemId = params.systemId;
  if (params?.page) query.page = params.page;
  if (params?.limit) query.limit = params.limit;
  return api.get<SceneCatalogResponse>('/map-templates/catalog', query);
}

export function getSceneCatalogEntry(id: string): Promise<SceneCatalogEntry> {
  return api.get<SceneCatalogEntry>(`/map-templates/catalog/${id}`);
}

export function publishSceneTemplate(
  id: string,
  input: PublishSceneTemplateInput,
): Promise<unknown> {
  return api.post(`/map-templates/${id}/publish`, input);
}

export function unpublishSceneTemplate(id: string): Promise<unknown> {
  return api.post(`/map-templates/${id}/unpublish`);
}

export function approveSceneTemplate(id: string): Promise<unknown> {
  return api.post(`/map-templates/${id}/approve`);
}

export function rejectSceneTemplate(id: string): Promise<unknown> {
  return api.post(`/map-templates/${id}/reject`);
}
