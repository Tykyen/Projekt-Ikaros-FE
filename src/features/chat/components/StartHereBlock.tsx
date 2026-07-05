import { BookMarked, X } from 'lucide-react';
import type { StartHere } from '../lib/types';
import s from './StartHereBlock.module.css';

export interface StartHereBlockProps {
  /** Sdílený stav místnosti po načtení hry (16.6); `null` = blok se nezobrazí. */
  startHere: StartHere | null;
  onClose: () => void;
}

/** Čas uložení → čitelný český formát (dnes/včera + hodina, jinak datum). */
function formatSavedAt(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '';
  const time = at.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(at, today)) return `dnes ${time}`;
  if (sameDay(at, yest)) return `včera ${time}`;
  return `${at.toLocaleDateString('cs-CZ')} ${time}`;
}

/**
 * Blok „Tady jste skončili" (16.6) — read-only kotva nad živým logem po
 * načtení uložené hry. Zažloutlá stránka deníku: pár posledních zpráv, jasně
 * odlišených od živého dění. Vidí ho všichni přítomní; sám zmizí při rotaci
 * scény (12:00/00:00) nebo po zavření (×).
 */
export function StartHereBlock({ startHere, onClose }: StartHereBlockProps) {
  if (!startHere || startHere.lines.length === 0) return null;

  return (
    <section className={s.block} aria-label="Uložená hra — kde jste skončili">
      <header className={s.head}>
        <span className={s.seal} aria-hidden="true">
          <BookMarked size={14} />
        </span>
        <span className={s.title}>Tady jste skončili</span>
        <span className={s.meta}>
          z uložené hry · {startHere.byUserName} · {formatSavedAt(startHere.at)}
        </span>
        <button
          type="button"
          className={s.close}
          onClick={onClose}
          aria-label="Skrýt uloženou hru"
        >
          <X size={16} />
        </button>
      </header>

      <div className={s.body}>
        {startHere.lines.map((line, i) => (
          <div className={s.line} key={`${line.createdAt}-${i}`}>
            <span className={s.time}>
              {new Date(line.createdAt).toLocaleTimeString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span
              className={s.who}
              style={line.color ? { color: line.color } : undefined}
            >
              {line.senderName}
            </span>
            <span className={s.msg}>{line.content}</span>
          </div>
        ))}
      </div>

      <div className={s.resume}>pokračujete</div>
    </section>
  );
}
