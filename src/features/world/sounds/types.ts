/**
 * 13.3 — Zvuky (FE typy).
 *
 * Zrcadlí BE `sounds` modul (`backend/src/modules/sounds/schemas/sound.schema.ts`)
 * 1:1 vč. enumů. Zvuk = YouTube odkaz + bohatá metadata; globální (worldId=null)
 * nebo per-svět. Nominační workflow: svět → pending → admin approve/reject.
 */

export type SoundMediaType = 'music' | 'ambient' | 'sfx' | 'signal' | 'voice';

export type SoundPrimaryFunction =
  | 'safe'
  | 'social'
  | 'exploration'
  | 'tension'
  | 'threat'
  | 'combat'
  | 'ritual'
  | 'horror'
  | 'revelation'
  | 'aftermath'
  | 'transition'
  | 'system';

export type SoundEnvironment =
  | 'neutral'
  | 'nature'
  | 'urban'
  | 'interior'
  | 'industrial'
  | 'military'
  | 'sacral'
  | 'arcane'
  | 'digital'
  | 'alien'
  | 'ruin'
  | 'void';

export type SoundEmotionalTone =
  | 'calm'
  | 'wonder'
  | 'melancholy'
  | 'mystery'
  | 'dread'
  | 'fear'
  | 'urgency'
  | 'aggression'
  | 'grief'
  | 'awe'
  | 'faith'
  | 'corruption';

export type SoundOnsetProfile = 'instant' | 'fast' | 'soft' | 'slow';

export type SoundOutroProfile = 'hard' | 'soft' | 'fade' | 'seamless';

export type SoundFactionStyle =
  | 'civilian'
  | 'noble'
  | 'religious'
  | 'military'
  | 'corporate'
  | 'criminal'
  | 'tribal'
  | 'arcane'
  | 'alien';

export type SoundTechLevel =
  | 'preindustrial'
  | 'industrial'
  | 'modern'
  | 'advanced'
  | 'posthuman';

export type SoundMagicLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

export type SoundCombatEnergy = 'none' | 'low' | 'medium' | 'high';

export type SoundStatus = 'active' | 'pending' | 'rejected';

export interface Sound {
  id: string;
  worldId: string | null;
  name: string;
  youtubeUrl: string;
  mediaType: SoundMediaType;
  primaryFunction: SoundPrimaryFunction;
  environment: SoundEnvironment;
  emotionalTone: SoundEmotionalTone;
  intensity: number; // 1–5
  duration: number; // sekundy (0 = neznámá)
  loop: boolean;
  onsetProfile: SoundOnsetProfile;
  outroProfile: SoundOutroProfile;
  factionStyle: SoundFactionStyle;
  techLevel: SoundTechLevel;
  magicLevel: SoundMagicLevel;
  combatEnergy: SoundCombatEnergy;
  tags: string[];
  notes: string;
  status: SoundStatus;
  proposedBy: string | null;
  proposedByWorldId: string | null;
  rejectReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Vstup pro create/update — povinné jen name + youtubeUrl, zbytek má BE default. */
export interface CreateSoundDto {
  name: string;
  youtubeUrl: string;
  mediaType?: SoundMediaType;
  primaryFunction?: SoundPrimaryFunction;
  environment?: SoundEnvironment;
  emotionalTone?: SoundEmotionalTone;
  intensity?: number;
  duration?: number;
  loop?: boolean;
  onsetProfile?: SoundOnsetProfile;
  outroProfile?: SoundOutroProfile;
  factionStyle?: SoundFactionStyle;
  techLevel?: SoundTechLevel;
  magicLevel?: SoundMagicLevel;
  combatEnergy?: SoundCombatEnergy;
  tags?: string[];
  notes?: string;
}

export type UpdateSoundDto = Partial<CreateSoundDto>;
