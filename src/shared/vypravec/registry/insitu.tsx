/**
 * MVP-B (07 §5.1) — bohaté in-situ taháky („?" v chatu a na taktické mapě)
 * zabalené jako topiky Vypravěče. Obsah ZŮSTÁVÁ ve feature komponentách
 * (jediný zdroj pravdy; „?" modal běží dál jako alias) — tady jsou jen
 * adaptéry publika + lazy loadery, ať se tahák stáhne až při otevření.
 */
import { createElement } from 'react';
import type { HelpTopic, VypravecAudience } from './types';

/** Kontrakt „?" (13.6) zná jen pj/hrac — správci vidí PJ verzi taháku. */
export function naHelpAudience(a: VypravecAudience): 'pj' | 'hrac' {
  return a === 'pj' || a === 'pomocnyPJ' || a === 'admin' ? 'pj' : 'hrac';
}

/**
 * Orchestrace scén je isPjStrict — Pomocný PJ scény NEřídí (funkce 14).
 * Admin s elevací má plnou moc PJ, proto true.
 */
export function naCanManageScenes(a: VypravecAudience): boolean {
  return a === 'pj' || a === 'admin';
}

export const INSITU_TOPIKY: readonly HelpTopic[] = [
  {
    id: 'insitu.chat',
    title: 'Tahák: chat od A do Z',
    tags: ['chat', 'tahak', 'zpravy', 'sepot', 'kostky', 'emoty', 'moderace'],
    routes: ['/svet/:worldSlug/chat', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Stejný tahák, jaký najdeš pod „?" přímo v chatu — zprávy, hody, šepoty, deník i správa kanálů.',
      ],
    },
    bodyComponent: () =>
      import('@/features/world/help/content/ChatHelp').then((m) => ({
        default: ({ audience }: { audience: VypravecAudience }) =>
          createElement(m.ChatHelp, { audience: naHelpAudience(audience) }),
      })),
    akce: [
      {
        label: 'Celá kapitola v nápovědě',
        to: '/ikaros/napoveda?sekce=svet&topik=komunikace-zvuk',
      },
    ],
    source: { kapitola: '13' },
    verifiedAt: '2026-07-23',
    status: 'funkcni',
  },
  {
    id: 'insitu.tm',
    title: 'Tahák: taktická mapa',
    tags: ['takticka mapa', 'tahak', 'token', 'pohyb', 'iniciativa', 'ping'],
    routes: ['/svet/:worldSlug/takticka-mapa', '/svet/:worldSlug'],
    body: {
      odstavce: [
        'Stejný tahák, jaký najdeš pod „?" přímo na mapě — pohyb, tokeny, iniciativa a PJ nástroje.',
      ],
    },
    bodyComponent: () =>
      import('@/features/world/help/content/TacticalMapHelp').then((m) => ({
        default: ({ audience }: { audience: VypravecAudience }) =>
          createElement(m.TacticalMapHelp, {
            audience: naHelpAudience(audience),
          }),
      })),
    akce: [
      {
        label: 'Celá kapitola v nápovědě',
        to: '/ikaros/napoveda?sekce=svet&topik=takticka-mapa',
      },
    ],
    source: { kapitola: '14' },
    verifiedAt: '2026-07-23',
    status: 'funkcni',
  },
  {
    id: 'insitu.orchestrace',
    title: 'Tahák: orchestrace scén',
    tags: ['orchestrace', 'sceny', 'prirazeni', 'aktivace', 'takticka mapa'],
    routes: ['/svet/:worldSlug/takticka-mapa'],
    audience: ['pj', 'pomocnyPJ', 'admin'],
    body: {
      odstavce: [
        'Scény, aktivace a přiřazení hráčů — stejný průvodce jako „?" v panelu orchestrace.',
      ],
    },
    bodyComponent: () =>
      import(
        '@/features/world/tactical-map/components/pj-panel/OrchestraceHelp'
      ).then((m) => ({
        default: ({ audience }: { audience: VypravecAudience }) =>
          createElement(m.OrchestraceHelp, {
            canManageScenes: naCanManageScenes(audience),
          }),
      })),
    minAudienceNote:
      'Scény řídí plný PJ — Pomocný PJ tu vidí, jak to funguje, ale nepřepíná je.',
    source: { kapitola: '14' },
    verifiedAt: '2026-07-23',
    status: 'funkcni',
  },
  {
    id: 'insitu.efekty',
    title: 'Tahák: efekty a kreslení na mapě',
    tags: ['efekty', 'kresleni', 'bariera', 'oblast', 'vybuch', 'guma'],
    routes: ['/svet/:worldSlug/takticka-mapa'],
    body: {
      odstavce: [
        'Barevná pole, bariéry a oblasti — stejný průvodce jako „?" u nástrojů kreslení.',
      ],
    },
    bodyComponent: () =>
      import(
        '@/features/world/tactical-map/components/effects/EfektyKresleniHelp'
      ).then((m) => ({
        default: ({ audience }: { audience: VypravecAudience }) =>
          createElement(m.EfektyKresleniHelp, {
            audience: naHelpAudience(audience),
          }),
      })),
    source: { kapitola: '14' },
    verifiedAt: '2026-07-23',
    status: 'funkcni',
  },
];
