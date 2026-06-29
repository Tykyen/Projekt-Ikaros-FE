/**
 * Preset pro Příběhy Impéria (PI) — osekaný derivát Matrixu.
 *
 * Sci-fi cyan HUD (Chakra Petch). Schopnosti s trojúhelníkovými body +
 * slovními stupni (Nováček→Legenda), Aspekty (Nabitý/Vybitý), Životy 0–5
 * s postihem za zranění a jediné políčko Ochrany. Data s prefixem `pi_*`.
 *
 * Oproti Matrixu ZÁMĚRNĚ chybí: jazyky, únava, přetlaky, runa, magie,
 * iniciativa i hod kostkou na listu.
 */
import type { DiarySystemPreset } from '../types';
import { PiSheet } from '../sheets/pi/PiSheet';

export const piPreset: DiarySystemPreset = {
  id: 'pi',
  name: 'Příběhy Impéria',
  description:
    'Osekaný derivát Matrixu — sci-fi cyan HUD. Schopnosti (trojúhelníkové ' +
    'body + slovní stupně) + Aspekty (Nabitý/Vybitý) + Životy 0–5 s postihem ' +
    'za zranění + jediné políčko Ochrany. Bez jazyků, únavy, přetlaků, runy ' +
    'a magie. Data v customData s prefixem `pi_*`.',
  SystemSheet: PiSheet,
  loadStyles: () => import('../styles/pi.css'),
};
