/**
 * 13.3 — České labely + pořadí pro zvukové enumy.
 *
 * Jediný zdroj pravdy pro selecty (form, filtry) i badge na kartě. Klíče
 * zrcadlí BE enum hodnoty; pořadí v polích = pořadí v UI.
 */
import type {
  SoundMediaType,
  SoundPrimaryFunction,
  SoundEnvironment,
  SoundEmotionalTone,
  SoundOnsetProfile,
  SoundOutroProfile,
  SoundFactionStyle,
  SoundTechLevel,
  SoundMagicLevel,
  SoundCombatEnergy,
} from '../types';

export const MEDIA_TYPE_LABELS: Record<SoundMediaType, string> = {
  music: 'Hudba',
  ambient: 'Ambient',
  sfx: 'Zvukový efekt',
  signal: 'Signál',
  voice: 'Hlas',
};

export const PRIMARY_FUNCTION_LABELS: Record<SoundPrimaryFunction, string> = {
  safe: 'Klid',
  social: 'Společenské',
  exploration: 'Průzkum',
  tension: 'Napětí',
  threat: 'Hrozba',
  combat: 'Boj',
  ritual: 'Rituál',
  horror: 'Horor',
  revelation: 'Odhalení',
  aftermath: 'Dozvuk',
  transition: 'Přechod',
  system: 'Systém',
};

export const ENVIRONMENT_LABELS: Record<SoundEnvironment, string> = {
  neutral: 'Neutrální',
  nature: 'Příroda',
  urban: 'Město',
  interior: 'Interiér',
  industrial: 'Průmysl',
  military: 'Vojenské',
  sacral: 'Sakrální',
  arcane: 'Arkánní',
  digital: 'Digitální',
  alien: 'Mimozemské',
  ruin: 'Ruiny',
  void: 'Prázdnota',
};

export const EMOTIONAL_TONE_LABELS: Record<SoundEmotionalTone, string> = {
  calm: 'Klid',
  wonder: 'Úžas',
  melancholy: 'Melancholie',
  mystery: 'Tajemství',
  dread: 'Děs',
  fear: 'Strach',
  urgency: 'Naléhavost',
  aggression: 'Agrese',
  grief: 'Žal',
  awe: 'Bázeň',
  faith: 'Víra',
  corruption: 'Zkaženost',
};

export const ONSET_PROFILE_LABELS: Record<SoundOnsetProfile, string> = {
  instant: 'Okamžitý',
  fast: 'Rychlý',
  soft: 'Měkký',
  slow: 'Pomalý',
};

export const OUTRO_PROFILE_LABELS: Record<SoundOutroProfile, string> = {
  hard: 'Tvrdé',
  soft: 'Měkké',
  fade: 'Doznění',
  seamless: 'Plynulé',
};

export const FACTION_STYLE_LABELS: Record<SoundFactionStyle, string> = {
  civilian: 'Civilní',
  noble: 'Šlechta',
  religious: 'Náboženské',
  military: 'Vojenské',
  corporate: 'Korporátní',
  criminal: 'Zločinecké',
  tribal: 'Kmenové',
  arcane: 'Arkánní',
  alien: 'Mimozemské',
};

export const TECH_LEVEL_LABELS: Record<SoundTechLevel, string> = {
  preindustrial: 'Předprůmyslové',
  industrial: 'Průmyslové',
  modern: 'Moderní',
  advanced: 'Pokročilé',
  posthuman: 'Posthumánní',
};

export const MAGIC_LEVEL_LABELS: Record<SoundMagicLevel, string> = {
  none: 'Žádná',
  low: 'Nízká',
  medium: 'Střední',
  high: 'Vysoká',
  extreme: 'Extrémní',
};

export const COMBAT_ENERGY_LABELS: Record<SoundCombatEnergy, string> = {
  none: 'Žádná',
  low: 'Nízká',
  medium: 'Střední',
  high: 'Vysoká',
};

/** Barevný proužek karty dle druhu zvuku (sjednocené s `--sound-accent` rodinou). */
export const MEDIA_TYPE_COLORS: Record<SoundMediaType, string> = {
  music: '#22d3ee', // cyan — zvuková identita
  ambient: '#7c6bff', // fialová — brand
  sfx: '#f59e0b', // jantar
  signal: '#ec4899', // růžová
  voice: '#34d399', // zelená
};

/** Helper: pole [value, label] pro <select>, v UI pořadí. */
export function toOptions<T extends string>(
  labels: Record<T, string>,
): Array<{ value: T; label: string }> {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));
}
