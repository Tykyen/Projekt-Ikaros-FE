import type { DicePayload } from '@/features/world/chat/dice/lib/dicePayload';

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

export type DiceRollerKind = 'pc' | 'pj' | 'npc' | 'bestie';
export type DiceRollCategory = 'skill' | 'initiative' | 'custom';

export interface MapDiceRoll {
  id: string;
  /** ISO timestamp. */
  rolledAt: string;
  byUserId: string;
  rollerName: string;
  rollerKind: DiceRollerKind;
  category: DiceRollCategory;
  /** Token, za který se hází (skill/init); chybí u custom. */
  tokenId?: string;
  dicePayload: DicePayload;
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

/**
 * 15.4 — anotace (kresba) na mapě. `points` = map-space px páry
 * `[x0,y0,x1,y1,...]`. `visibility`: `pj` = jen PJ, `all` = všichni.
 */
export interface MapDrawing {
  id: string;
  kind: 'line' | 'arrow' | 'circle' | 'text';
  points: number[];
  color: string;
  text?: string;
  createdByUserId: string;
  visibility: 'pj' | 'all';
}

/**
 * 17.2 — zeď/dveře na scéně. `points` = map-space px páry `[x0,y0,x1,y1,...]`
 * (lomená čára; import z UVTT `line_of_sight` polygonů a `portals`).
 * `blocksSight` čte 17.1 (LoS). Bez 17.1 zeď opticky neblokuje — jen se
 * vykreslí PJ jako editovatelná vrstva („spící data").
 */
export interface MapWall {
  id: string;
  points: number[];
  type: 'wall' | 'door';
  /** Jen `type='door'` — stav dveří (otevřené neblokují výhled). */
  door?: {
    open: boolean;
    locked?: boolean;
  };
  /** Blokuje linii pohledu (17.1). Default true. */
  blocksSight: boolean;
  /** Rezerva — blokace pohybu (dnes neřešíme). */
  blocksMovement?: boolean;
}

/**
 * 17.2 — bodový zdroj světla na scéně (import z UVTT `lights`). Souřadnice a
 * `range` v map-space px. Dynamické vykreslení řeší 17.1; bez něj se jen
 * uloží.
 */
export interface MapLight {
  id: string;
  x: number;
  y: number;
  /** Dosah v map-space px. */
  range: number;
  /** 0..1. */
  intensity: number;
  /** `#rrggbb`. */
  color: string;
  shadows?: boolean;
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
  /**
   * Per-instance poznámky tokenu (bestie). Snapshot z `bestie.notes` při
   * spawnu, dál editovatelné nezávisle na šabloně. Write přes
   * `token.update {notes}`. Šablonové poznámky (`bestie.notes`) zůstávají
   * read-only vedle těchto.
   */
  notes?: string;
  personalDiarySchema?: Record<string, unknown>[];
  customData: Record<string, unknown>;
  /**
   * D-066 — per-token lock (PJ-only). Zamčený token hráč nemůže táhnout,
   * nezávisle na scene.isLocked / playerStates. Vynuceno BE authorizerem.
   */
  isLocked?: boolean;
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
    /**
     * 10.2g — diary subdoc customData (per-system HP klíče). Doplněno BE
     * enrichem při GET scény; `resolveCharacterHp` z toho čte HP bar PC/NPC.
     */
    customData?: Record<string, unknown>;
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
 * 10.2n — per-hráč override skrytí/zámku. Efektivní stav hráče = override ??
 * scéna-default (`isHidden`/`isLocked`). Pole undefined = bez overrides.
 */
export interface ScenePlayerState {
  userId: string;
  isHidden?: boolean;
  isLocked?: boolean;
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
  /** 15.4 — anotace (kresby) na scéně. */
  drawings?: MapDrawing[];
  /** 17.2 — zdi/dveře (import UVTT; „spící data" pro 17.1 LoS). */
  walls?: MapWall[];
  /** 17.2 — zdroje světla (import UVTT; render až 17.1). */
  lights?: MapLight[];
  fogEnabled: boolean;
  revealedHexes: HexCoord[];
  templateId?: string;
  isActive: boolean;
  isHidden: boolean;
  isLocked: boolean;
  /**
   * 10.2n — per-hráč override skrytí/zámku nad per-scéna defaultem
   * (`isHidden`/`isLocked`). Efektivní stav hráče = override ?? default.
   */
  playerStates: ScenePlayerState[];
  activeSoundIds: string[];
  /** BE Date → JSON string. */
  lastModified?: string;
  /** Per-scene atomic counter pro operations log (10.2-prep-1). */
  lastSeqNumber: number;
  /** Combat subdoc (10.2f); `null`/undefined = boj neaktivní. */
  combat?: CombatState | null;
  /** 10.2j — persistovaná historie hodů (cap 50, nejnovější na konci). */
  diceRolls?: MapDiceRoll[];
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
  | {
      type: 'token.update';
      tokenId: string;
      patch: Partial<MapToken>;
      /**
       * D-LAUNCH-GAP — relativní změna HP/injury (damage/heal tlačítka).
       * JEN bestie tokeny; nesmí se kombinovat s ne-prázdným `patch` (BE 400).
       * Server deltu aplikuje ATOMICKY proti aktuální DB hodnotě (clamp
       * 0..maxHp, injury ≥ 0) → dva souběžné zásahy se neztratí. V 201
       * response + WS broadcastu je op NORMALIZOVANÁ: `patch.currentHp` /
       * `patch.injury` nese výslednou ABSOLUTNÍ hodnotu (zdroj pravdy;
       * `applyOperationToScene` čte jen `patch`).
       */
      hpDelta?: number;
      injuryDelta?: number;
    }
  // Effect
  | { type: 'effect.add'; effect: MapEffect }
  | { type: 'effect.remove'; effectId: string }
  | { type: 'effect.update'; effectId: string; patch: Partial<MapEffect> }
  // 15.4 — Drawing (anotace)
  | { type: 'drawing.add'; drawing: MapDrawing }
  | { type: 'drawing.remove'; drawingId: string }
  | { type: 'drawing.clear' }
  // Fog
  | { type: 'fog.set'; enabled: boolean; revealedHexes: HexCoord[] }
  | { type: 'fog.brush'; mode: 'reveal' | 'fog'; hexes: HexCoord[] }
  // Scene
  | { type: 'scene.state'; isHidden?: boolean; isLocked?: boolean }
  | {
      type: 'scene.playerState';
      userId: string;
      isHidden?: boolean | null;
      isLocked?: boolean | null;
    }
  | { type: 'scene.config'; config: HexConfig }
  | { type: 'scene.image'; imageUrl: string }
  | { type: 'scene.name'; name: string }
  | { type: 'scene.folder'; folder: string | null }
  | { type: 'scene.deactivate' }
  // D-DROBNE-UNDO — inverse scene.deactivate (undo aktivuje zpět); mirror BE
  | { type: 'scene.activate' }
  // 10.2c-edit-2 — load template sekvence
  | {
      type: 'scene.fog.replace';
      fogEnabled: boolean;
      revealedHexes: HexCoord[];
    }
  | { type: 'scene.effects.replace'; effects: MapEffect[] }
  // 17.2 — import UVTT: nahrazení zdí/světel scény
  | { type: 'scene.walls.replace'; walls: MapWall[] }
  | { type: 'scene.lights.replace'; lights: MapLight[] }
  | { type: 'scene.npc-templates.replace'; npcTemplates: MapSceneNpc[] }
  | { type: 'scene.tokens.replace-npc'; tokens: MapToken[] }
  // D-DROBNE-UNDO — inverse drawing.clear (bulk replace kreseb); mirror BE
  | { type: 'scene.drawings.replace'; drawings: MapDrawing[] }
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
  // 10.2f — `round` override: lišta sortuje živě dle initiative, FE řídí
  // pořadí tahů → posílá explicitní `tokenId` + `round` (wrap → round+1).
  | { type: 'combat.turn'; tokenId?: string; round?: number }
  | { type: 'combat.end' }
  // 10.2f-2 — přeřazení order ZA boje (zachová round + currentTokenId)
  | { type: 'combat.reorder'; orderTokenIds: string[] }
  | { type: 'combat.effect.add'; tokenId: string; effect: Record<string, unknown> }
  | { type: 'combat.effect.remove'; effectId: string }
  // NPC template
  | { type: 'npcTemplate.add'; template: MapSceneNpc }
  | { type: 'npcTemplate.remove'; templateId: string }
  | { type: 'npcTemplate.update'; templateId: string; patch: Partial<MapSceneNpc> }
  // Dice (10.2j)
  | { type: 'dice.roll'; roll: MapDiceRoll };

/** Cross-scene operace (member.* assignment). Mirror BE `WorldOperationPayload`. */
export type WorldOperation =
  | { type: 'member.assignToScene'; userId: string; sceneId: string }
  | { type: 'member.unassign'; userId: string }
  | { type: 'member.bulkAssignToScene'; userIds: string[]; sceneId: string }
  // D-DROBNE-UNDO — inverse bulkAssignToScene: per-member obnova přiřazení
  // (`sceneId: null` = member byl bez scény → unassign). Mirror BE
  // `MemberBulkRestoreAssignmentsOpDto`. FE ji sám neposílá (vzniká jen jako
  // inverse v BE logu); konzumuje ji `world:operation` listener (invalidate
  // dle prefixu `member.`).
  | {
      type: 'member.bulkRestoreAssignments';
      assignments: { userId: string; sceneId: string | null }[];
    };

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

/** 10.2f-3 — WS `map:spotlight` event (PJ „ukazováček" na token). */
export interface MapSpotlightBroadcast {
  tokenId: string;
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
 * 10.2b — konfigurace gridu scény. Match BE `MapScene.config` schema.
 * 15.2 — `gridType` (hex/square/none); chybí (undefined) = `hex` (BC, legacy
 * scény). `size` má per-typ význam: hex = délka hrany, square = délka strany.
 */
export interface HexConfig {
  /**
   * 15.2 — typ mřížky. `undefined` = `hex` (BC). Render/snap/fog/efekty řeší
   * `getGridAdapter(gridType)` — viz `./grid`.
   */
  gridType?: 'hex' | 'square' | 'none';
  /** Délka hrany hexu / strany čtverce v px (mapa-space, ne screen). Default 40. */
  size: number;
  /** Pixel offset gridu od (0,0) v mapa-space. */
  originX: number;
  originY: number;
  /** Render čar mřížky? Pro `none` se ignoruje (čáry se nekreslí tak jako tak). */
  showGrid: boolean;
  /**
   * 15.3 — měřítko: kolik jednotek (unitLabel) připadá na jednu buňku. Chybí =
   * `1`. Řídí stupnici po okraji mapy (`MapScaleFrame`) i pravítko.
   */
  unitsPerCell?: number;
  /** 15.3 — popisek jednotky měřítka (např. „m"). Chybí = `m`. */
  unitLabel?: string;
  /** 15.3 — zobrazit stupnici po okraji mapy? Chybí = `true`. */
  showScale?: boolean;
  /** 15.4 — smí hráč kreslit anotace na této scéně? Chybí = `false`. */
  allowPlayerDrawing?: boolean;
  /**
   * 17.1 — zdroj mlhy. `manual` (chybí) = ruční štětec (BC). `dynamic` =
   * automatická LoS z pozic PC tokenů + zdí (`scene.walls`). `dynamic`
   * vyžaduje `fogEnabled`.
   */
  visionMode?: 'manual' | 'dynamic';
  /** 17.1 — temná scéna: token vidí jen do dosvitu/světel. Chybí = `false`. */
  darkness?: boolean;
  /** 17.1 — dosvit tokenu v buňkách (jen `darkness`). Chybí = default. */
  visionRange?: number;
  /**
   * 10.2g — per-scéna viditelnost HP barů dle typu tokenu.
   * Chybí (undefined) = `true` (BC + default zapnuto).
   */
  showHpPc?: boolean;
  showHpNpc?: boolean;
  showHpBestie?: boolean;
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
  /** 10.2f — širší glow ring kolem tokenu na tahu (hex; alpha řeší draw). */
  tokenRingActiveTurnGlow: number;
  /** 10.2f-3 — spotlight ring (PJ „ukazováček" z iniciativní lišty), hex. */
  tokenRingSpotlight: number;
  /** 10.2f-3 — glow kolem spotlight ringu (hex; alpha řeší draw). */
  tokenRingSpotlightGlow: number;
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
