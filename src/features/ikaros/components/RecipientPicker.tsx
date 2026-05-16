import { useEffect, useRef, useState } from 'react';
import {
  useUserLookup,
  type UserLookupItem,
} from '@/features/ikaros/api/useUserLookup';
import s from './RecipientPicker.module.css';

interface Props {
  value: UserLookupItem | null;
  onChange: (v: UserLookupItem | null) => void;
  /** Vlastní ID — odfiltruje se z výsledků (nelze psát sám sobě). */
  excludeId?: string;
}

/** 3.5 — autocomplete výběr příjemce zprávy nad `GET /users/lookup`. */
export function RecipientPicker({ value, onChange, excludeId }: Props) {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 300);
    return () => clearTimeout(t);
  }, [text]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const { data: results = [], isFetching } = useUserLookup(debounced);

  if (value) {
    return (
      <div className={s.selected}>
        <span>{value.username}</span>
        <button
          type="button"
          className={s.clearBtn}
          onClick={() => onChange(null)}
          aria-label="Změnit příjemce"
        >
          ×
        </button>
      </div>
    );
  }

  const filtered = results.filter((u) => u.id !== excludeId);
  const showDropdown = open && debounced.trim().length >= 2;

  return (
    <div className={s.box} ref={boxRef}>
      <input
        className={s.input}
        type="text"
        placeholder="Hledat uživatele (min. 2 znaky)…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <ul className={s.dropdown}>
          {isFetching && <li className={s.hint}>Hledám…</li>}
          {!isFetching && filtered.length === 0 && (
            <li className={s.hint}>Nikdo nenalezen</li>
          )}
          {filtered.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className={s.option}
                onClick={() => {
                  onChange(u);
                  setOpen(false);
                  setText('');
                }}
              >
                {u.username}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
