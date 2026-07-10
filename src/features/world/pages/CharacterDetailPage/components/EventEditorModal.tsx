import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal, Button, FantasyDatePicker } from '@/shared/ui';
import type { CalendarConfig, FantasyDate } from '@/shared/lib/calendarEngine';
import type { CalendarEvent } from '../../api/characters.types';
import s from './EventEditorModal.module.css';

interface Props {
  /** Open state controlled rodičem; `null` = zavřeno, jinak edit/create form state. */
  initial: {
    /** Event id (uuid). Pokud event s tímto id v calendar.events neexistuje, je to create flow. */
    id: string;
    title: string;
    start: FantasyDate;
    end?: FantasyDate;
    allDay?: boolean;
    description?: string;
    symbol?: string;
  };
  config: CalendarConfig;
  /** True pokud event v parentu už existuje → label "Upravit", + Smazat. */
  isExisting: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: () => void;
}

/**
 * 9.2-FIX — Modal editor jedné události (create / edit).
 *
 * Použití: klik na buňku v gridu → otevře s preset start datem.
 * Klik na chip → otevře s vyplněnými existing daty.
 *
 * Barva je per entita (CharacterCalendar.color), tady jen symbol per event.
 */
export function EventEditorModal({
  initial,
  config,
  isExisting,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial.title);
  const [start, setStart] = useState<FantasyDate>(initial.start);
  const [end, setEnd] = useState<FantasyDate | null>(initial.end ?? null);
  const [allDay, setAllDay] = useState(initial.allDay ?? true);
  const [description, setDescription] = useState(initial.description ?? '');
  const [symbol, setSymbol] = useState(initial.symbol ?? '');

  const canSave = title.trim().length > 0;

  function handleSubmit() {
    if (!canSave) return;
    onSave({
      id: initial.id,
      title: title.trim(),
      calendarConfigId: config.slug,
      start,
      end: end ?? undefined,
      allDay,
      description: description.trim() || undefined,
      symbol: symbol.trim() || undefined,
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isExisting ? 'Upravit událost' : 'Nová událost'}
      size="md"
    >
      <div className={s.form}>
        <div className={s.row}>
          <div className={s.field}>
            <label htmlFor="ev-title" className={s.label}>
              Název
            </label>
            {/* eslint-disable jsx-a11y/no-autofocus -- autofocus na první pole je záměr: modal trapuje fokus */}
            <input
              id="ev-title"
              className={s.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Název události"
              autoFocus
            />
            {/* eslint-enable jsx-a11y/no-autofocus */}
          </div>
          <div>
            <label htmlFor="ev-symbol" className={s.label}>
              Symbol
            </label>
            <input
              id="ev-symbol"
              className={`${s.input} ${s.symbolInput}`}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="🗡️"
              maxLength={6}
              title="Volný emoji / symbol pro odlišení typu události"
            />
          </div>
        </div>

        <div>
          {/* Skupinový popisek pro FantasyDatePicker (víc controlů) → span, ne label */}
          <span className={s.label}>Začátek</span>
          <FantasyDatePicker
            config={config}
            value={start}
            onChange={(d) => d && setStart(d)}
            required
            allowHour={!allDay}
            ariaLabel="Začátek události"
          />
        </div>

        <div>
          {/* Skupinový popisek pro FantasyDatePicker (víc controlů) → span, ne label */}
          <span className={s.label}>Konec (volitelně, pro vícedenní)</span>
          <FantasyDatePicker
            config={config}
            value={end}
            onChange={setEnd}
            allowHour={!allDay}
            ariaLabel="Konec události"
          />
        </div>

        <label className={s.allDayLabel}>
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          Celý den (bez hodiny)
        </label>

        <div>
          <label htmlFor="ev-desc" className={s.label}>
            Popis
          </label>
          <textarea
            id="ev-desc"
            className={s.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Volitelný popis události…"
          />
        </div>

        <div className={s.actions}>
          {isExisting && onDelete ? (
            <Button variant="ghost" size="md" onClick={onDelete}>
              <Trash2 size={14} aria-hidden /> Smazat
            </Button>
          ) : (
            <span />
          )}
          <div className={s.actionsRight}>
            <Button variant="ghost" size="md" onClick={onClose}>
              Zrušit
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={!canSave}
            >
              {isExisting ? 'Uložit' : 'Vytvořit'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
