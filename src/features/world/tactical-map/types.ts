/**
 * 10.2a — typy pro renderer jádro taktické mapy.
 *
 * Plné `MapScene` interface přijde v 10.2c (scene load); zde jen stub
 * pro typování proxy během 10.2a.
 *
 * Spec: docs/arch/phase-10/spec-10.2a.md §4-§5.
 */

/**
 * 10.2c — plný `MapScene` interface (mirror BE
 * `Projekt-ikaros/backend/src/modules/maps/interfaces/map-scene.interface.ts`).
 *
 * `MapSceneStub` zachován jako alias pro 10.2a kód.
 */
export interface ExplosionRing {
  radius: number;
  damage: number;
}

export interface MapEffect {
  id: string;
  /** `'color' | 'barrier' | 'explosion'`. */
  type: string;
  hexes: HexCoord[];
  color?: string;
  rings?: ExplosionRing[];
  /** Pro explosion: `'fire' | 'gas' | 'smoke'`. */
  variant?: string;
  excludedHexes?: HexCoord[];
  barrierDC?: number;
}

export interface MapTokenAbility {
  name: string;
  description: string;
}

/**
 * Žeton (PC nebo NPC) na hexu.
 *
 * `characterData` doplňuje BE při `GET /maps/:id` přes `enrichTokens` (po
 * 9.1 Page+Character sjednocení). Neukládá se do DB, jen read-only payload
 * pro FE render.
 */
export interface MapToken {
  id: string;
  characterId: string;
  characterSlug: string;
  q: number;
  r: number;
  isNpc: boolean;
  templateId?: string;
  instanceName?: string;
  currentHp: number;
  maxHp: number;
  baseHp: number;
  armor: number;
  baseArmor: number;
  injury: number;
  initiative: number;
  initiativeBase: number;
  inCombat: boolean;
  movement: number;
  abilities: MapTokenAbility[];
  personalDiarySchema?: Record<string, unknown>[];
  customData: Record<string, unknown>;
  /**
   * 10.2d-prep-A — per-system staty token instance (schema-driven storage).
   * Klíče = dot-path (`health.current`, `armor`, ...). BE validuje proti
   * `(world.system, 'token')` schema při token.add / token.update.
   *
   * MVP: optional pole (BC s ne-refaktorovaným 8.x kódem). Fixed pole
   * `currentHp/maxHp/.../initiativeBase` zůstávají pro BC; ne-systémově
   * specifické konzumenty mohou číst pořád ně. Renderery (10.2e+) preferují
   * `systemStats` přes engine.
   */
  systemStats?: Record<string, unknown>;
  characterData?: {
    name: string;
    imageUrl?: string;
    diaryData: Record<string, unknown>;
  };
}

/**
 * NPC šablona ve scéně. Spawned instances jsou v `tokens` se `isNpc=true` a
 * `templateId` reference. Edit šablony patří do 10.2d (NPC modaly).
 */
export interface MapSceneNpc {
  id: string;
  /** Pokud spawned z bestie šablony (`Bestie`) — zpětný odkaz na její id. */
  originTemplateId?: string;
  name: string;
  imageUrl?: string;
  notes: string;
  maxHp: number;
  armor: number;
  injury: number;
  movement: number;
  initiativeBase: number;
  abilities: { label: string; value: string }[];
  personalDiarySchema?: Record<string, unknown>[];
  customData: Record<string, unknown>;
}

/**
 * Combat tracker subdoc — plná logika v 10.2f. V 10.2c je `scene.combat`
 * jen load + persist; render combat UI přijde v 10.2f.
 */
export interface CombatState {
  isActive: boolean;
  round: number;
  currentTokenId: string | null;
  order: string[];
  endOfTurnEffects: Array<{
    id: string;
    tokenId: string;
    label: string;
    damageFormula?: string;
    damageType?: string;
    roundsRemaining: number;
    triggeredAt: 'start-of-turn' | 'end-of-turn';
  }>;
  startedAt?: string;
  startedByUserId?: string;
}

/**
 * 10.2c — plný `MapScene` mirror BE schema. Naskoupené z
 * `GET /maps/active?worldId=` (per-user resolve) nebo `GET /maps/:id`.
 */
export interface MapScene {
  id: string;
  worldId: string;
  name: string;
  imageUrl: string;
  folder?: string;
  config: HexConfig;
  tokens: MapToken[];
  npcTemplates: MapSceneNpc[];
  effects: MapEffect[];
  fogEnabled: boolean;
  revealedHexes: HexCoord[];
  templateId?: string;
  isActive: boolean;
  isHidden: boolean;
  isLocked: boolean;
  activeSoundIds: string[];
  /** BE Date → JSON string. */
  lastModified?: string;
  /** Per-scene atomic counter pro operations log (10.2-prep-1). */
  lastSeqNumber: number;
  /** Combat subdoc (10.2f); `null`/undefined = boj neaktivní. */
  combat?: CombatState | null;
  /**
   * 10.2c-edit-7 — per-scéna whitelist Character.id (PC + NPC).
   * Spawn z palety jen z tohoto setu. Default `[]`.
   */
  activeCharacterIds: string[];
  /**
   * 10.2c-edit-7 — per-scéna whitelist Bestie.id. Default `[]`.
   */
  activeBestieIds: string[];
}

/** Zachovaný alias pro 10.2a; nový kód používá přímo `MapScene`. */
export type MapSceneStub = Pick<MapScene, 'id' | 'worldId' | 'name'>;

// ────────────────────────────────────────────────────────────────────────
// 10.2c — Operations API mirror (BE `dto/operations/` discriminated union)
// ────────────────────────────────────────────────────────────────────────

/** Per-scene operace nad `MapScene`. Mirror BE `MapOperationPayload`. */
export type MapOperation =
  // Token
  | { type: 'token.add'; token: MapToken }
  | { type: 'token.move'; tokenId: string; q: number; r: number }
  | { type: 'token.remove'; tokenId: string }
  | { type: 'token.update'; tokenId: string; patch: Partial<MapToken> }
  // Effect
  | { type: 'effect.add'; effect: MapEffect }
  | { type: 'effect.remove'; effectId: string }
  | { type: 'effect.update'; effectId: string; patch: Partial<MapEffect> }
  // Fog
  | { type: 'fog.set'; enabled: boolean; revealedHexes: HexCoord[] }
  | { type: 'fog.brush'; mode: 'reveal' | 'fog'; hexes: HexCoord[] }
  // Scene
  | { type: 'scene.state'; isHidden?: boolean; isLocked?: boolean }
  | { type: 'scene.config'; config: HexConfig }
  | { type: 'scene.image'; imageUrl: string }
  | { type: 'scene.name'; name: string }
  | { type: 'scene.folder'; folder: string | null }
  | { type: 'scene.deactivate' }
  // 10.2c-edit-2 — load template sekvence
  | {
      type: 'scene.fog.replace';
      fogEnabled: boolean;
      revealedHexes: HexCoord[];
    }
  | { type: 'scene.effects.replace'; effects: MapEffect[] }
  | { type: 'scene.npc-templates.replace'; npcTemplates: MapSceneNpc[] }
  | { type: 'scene.tokens.replace-npc'; tokens: MapToken[] }
  | { type: 'scene.sounds.set'; activeSoundIds: string[] }
  // 10.2c-edit-7 — vyčistit + univerzální replace všech tokenů
  | { type: 'scene.tokens.clear' }
  | {
      type: 'scene.tokens.replace';
      tokens: MapToken[];
      combat?: CombatState | null;
    }
  // 10.2c-edit-7 — per-scéna whitelist postav a bestií
  | { type: 'scene.activeCharacters.add'; characterId: string }
  | { type: 'scene.activeCharacters.remove'; characterId: string }
  | { type: 'scene.activeBestie.add'; bestieId: string }
  | { type: 'scene.activeBestie.remove'; bestieId: string }
  // Sound
  | { type: 'sound.playlist'; soundIds: string[] }
  // Combat
  | { type: 'combat.start'; orderTokenIds: string[] }
  | { type: 'combat.turn'; tokenId?: string }
  | { type: 'combat.end' }
  | { type: 'combat.effect.add'; tokenId: string; effect: Record<string, unknown> }
  | { type: 'combat.effect.remove'; effectId: string }
  // NPC template
  | { type: 'npcTemplate.add'; template: MapSceneNpc }
  | { type: 'npcTemplate.remove'; templateId: string }
  | { type: 'npcTemplate.update'; templateId: string; patch: Partial<MapSceneNpc> };

/** Cross-scene operace (member.* assignment). Mirror BE `WorldOperationPayload`. */
export type WorldOperation =
  | { type: 'member.assignToScene'; userId: string; sceneId: string }
  | { type: 'member.unassign'; userId: string }
  | { type: 'member.bulkAssignToScene'; userIds: string[]; sceneId: string };

/** Response z `POST /maps/:id/operations`. */
export interface ApplyMapOperationResponse {
  recordId: string;
  seqNumber: number;
  appliedAt: string;
  op: MapOperation;
  inverse: MapOperation | null;
}

/** Response z `POST /worlds/:worldId/operations`. */
export interface ApplyWorldOperationResponse {
  recordId: string;
  seqNumber: number;
  appliedAt: string;
  op: WorldOperation;
  inverse: WorldOperation | null;
  cascadeMapOpIds: string[];
}

/** Per-scene log entry vrácený `GET /maps/:id/operations`. */
export interface MapOperationLogEntry {
  seqNumber: number;
  op: MapOperation;
  byUserId: string;
  appliedAt: string;
}

/** Response z `GET /maps/:id/operations?since=N`. */
export interface MapOperationsListResponse {
  sceneId: string;
  lastSeqNumber: number;
  operations: MapOperationLogEntry[];
}

/** WS `map:operation` event payload (po DB commit). */
export interface MapOperationBroadcast {
  sceneId: string;
  seqNumber: number;
  op: MapOperation;
  byUserId: string;
  appliedAt: string;
}

/** WS `map:reassigned` private event (cross-scene přesun current usera). */
export interface MapReassignedBroadcast {
  newSceneId: string | null;
}

/** WS `world:operation` event (PJ orchestrator). */
export interface WorldOperationBroadcast {
  worldId: string;
  seqNumber: number;
  op: WorldOperation;
  byUserId: string;
  appliedAt: string;
  cascadeMapOpIds: string[];
}

/**
 * 10.2b — konfigurace hex gridu. Match BE `MapScene.config` schema.
 */
export interface HexConfig {
  /** Délka hrany hexu v px (mapa-space, ne screen). Default 40. */
  size: number;
  /** Pixel offset gridu od (0,0) v mapa-space. */
  originX: number;
  originY: number;
  /** Render grid? Pokud false, `HexGrid` neRenderuje vůbec nic. */
  showGrid: boolean;
}

/**
 * 10.2b — axiální souřadnice hexu. Sousedi mají q/r delta z `AXIAL_DIRECTIONS`.
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * 10.2b — bod v 2D rovině (px v mapa-space).
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Načtené barvy z CSS proměnných `--map-*` (prep-4) parsované do tvarů,
 * které PixiJS přímo konzumuje.
 *
 * Konvence: pro `Application.background` a `Graphics.fill` hex je nutný
 * `number` (0xrrggbb). Pro `Graphics.stroke` je string rgba/named OK.
 */
export interface MapThemeColors {
  /** PixiJS `<Application background={...}>` — hex number (0xrrggbb). */
  canvasBg: number;
  /** Hex grid stroke (Graphics line color), rgba string. */
  gridStroke: string;
  /** Grid stroke width (px). */
  gridStrokeWidth: number;
  /** Border kolem default tokenu (hex). */
  tokenRingDefault: number;
  /** Border kolem selected tokenu (hex). */
  tokenRingSelected: number;
  /** Glow kolem tokenu na řadě v combat (hex). */
  tokenRingActiveTurn: number;
  /** HP bar pozadí (rgba string). */
  tokenHpBarBg: string;
  /** Mlha pro PJ — semi-transparent (rgba string). */
  fogPjFill: string;
  /** Mlha pro hráče — opaque (rgba string). */
  fogPlayerFill: string;
  /** Default barevný efekt fill (rgba string). */
  effectColorDefault: string;
  /** Bariéra fill (rgba string). */
  effectBarrierFill: string;
  /** Bariéra glow (rgba string). */
  effectBarrierGlow: string;
  /** Oheň základní barva (hex). */
  effectFireBase: number;
  /** Plyn základní barva (hex). */
  effectGasBase: number;
  /** Kouř základní barva (hex). */
  effectSmokeBase: number;
  /** Ping animace barva (rgba string nebo --primary var). */
  pingColor: string;
  /** Toolbar chrome pozadí. */
  toolbarBg: string;
  /** Toolbar text. */
  toolbarText: string;
}

/**
 * Pan + zoom stav viewportu. Persistovaný v localStorage `ikaros.map.*`
 * s 250ms debounce.
 */
export interface ViewportState {
  /** Aktuální zoom, clamp [0.2, 3]. */
  zoom: number;
  /** X offset root containeru v PixiJS canvas (screen-space px). */
  offsetX: number;
  /** Y offset root containeru. */
  offsetY: number;
}
