/**
 * 15.6 — full-viewport obal pro chybové stránky (403/404/500/crash).
 * Centruje `<ErrorState size="hero">` na celé výšce a dává theme pozadí,
 * aby stránka nebyla průhledná na světlém skinu.
 */
import { type ReactNode } from 'react';
import s from './FullPageState.module.css';

export function FullPageState({ children }: { children: ReactNode }): React.ReactElement {
  return <div className={s.shell}>{children}</div>;
}
